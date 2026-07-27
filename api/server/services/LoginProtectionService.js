const mongoose = require('mongoose');
const { logger } = require('@librechat/data-schemas');
const { ViolationTypes } = require('librechat-data-provider');
const { getLogStores } = require('~/cache');

/* ── Configuration (env overridable) ─────────────────────────────────── */

const MAX_FAILED_ATTEMPTS = parseInt(process.env.LOGIN_MAX_ATTEMPTS) || 5;
const LOCKOUT_DURATION_MS = parseInt(process.env.LOGIN_LOCKOUT_DURATION_MS) || 15 * 60 * 1000; // 15 min
const ATTEMPT_WINDOW_MS = parseInt(process.env.LOGIN_ATTEMPT_WINDOW_MS) || 60 * 60 * 1000; // 1 hour
const PROGRESSIVE_DELAY_BASE_MS = parseInt(process.env.LOGIN_PROGRESSIVE_DELAY_MS) || 1000; // 1 sec base

/* ── Dynamically extend User schema ──────────────────────────────────── */

try {
  const User = mongoose.model('User');
  if (!User.schema.paths.loginLockedUntil) {
    User.schema.add({
      loginLockedUntil: { type: Date, default: null },
      loginAttempts: { type: Number, default: 0 },
      lastFailedLoginAt: { type: Date, default: null },
    });
  }
} catch (e) {
  logger.warn('[LoginProtectionService] User model not ready yet — fields will be missing until model is loaded');
}

/* ── Redis-backed attempt store ──────────────────────────────────────── */

function getAttemptStore() {
  return getLogStores(ViolationTypes.LOGINS);
}

/* ── Progressive delay calculation ───────────────────────────────────── */

function computeDelayMs(attemptCount) {
  if (attemptCount <= 0) { return 0; }
  return Math.min(PROGRESSIVE_DELAY_BASE_MS * Math.pow(2, attemptCount - 1), 30000);
}

/* ── Core API ────────────────────────────────────────────────────────── */

/**
 * Record a failed login attempt.
 * Returns { locked: boolean, delayMs: number, attemptCount: number }
 */
async function recordFailedAttempt(email, ip, context = {}) {
  try {
    const now = Date.now();
    const store = getAttemptStore();
    const emailKey = `login_attempts:${email.toLowerCase()}`;
    const ipKey = `login_attempts_ip:${ip}`;

    /* Atomic increment + TTL-extend via a lightweight approach: store a sorted count */
    let record = await store.get(emailKey);
    if (!record || (record && record.resetAt < now)) {
      record = { count: 0, resetAt: now + ATTEMPT_WINDOW_MS, firstAttemptAt: now };
    }
    record.count += 1;
    record.lastAttemptAt = now;
    await store.set(emailKey, record, Math.ceil(ATTEMPT_WINDOW_MS / 1000));

    /* Progressive delay — proportional to consecutive failures */
    const delayMs = computeDelayMs(record.count);

    /* Lockout check */
    let locked = false;
    if (record.count >= MAX_FAILED_ATTEMPTS) {
      const lockUntil = new Date(now + LOCKOUT_DURATION_MS);
      const User = mongoose.model('User');
      await User.updateOne(
        { email: email.toLowerCase() },
        { $set: { loginLockedUntil: lockUntil, loginAttempts: record.count, lastFailedLoginAt: new Date(now) } },
      );
      locked = true;

      /* Audit log: lockout */
      await writeAuditEntry({
        action: 'auth.login.lockout',
        outcome: 'failure',
        severity: 'warning',
        email,
        ip,
        context,
        metadata: { attemptCount: record.count, lockDurationMs: LOCKOUT_DURATION_MS },
      });

      /* Also record IP-based violation through existing ban system */
      const violationStore = getLogStores(ViolationTypes.BAN);
      const banDuration = parseInt(process.env.BAN_DURATION) || 7200000;
      await violationStore.set(ip, { expiresAt: Date.now() + banDuration, reason: 'auto:login_lockout' }, Math.ceil(banDuration / 1000));
    }

    /* Audit log: failed attempt (only sample after threshold to avoid excess writes) */
    if (record.count <= MAX_FAILED_ATTEMPTS + 3) {
      await writeAuditEntry({
        action: 'auth.login.failure',
        outcome: 'failure',
        severity: record.count >= MAX_FAILED_ATTEMPTS ? 'warning' : 'info',
        email,
        ip,
        context,
        metadata: { attemptCount: record.count },
      });
    }

    return { locked, delayMs, attemptCount: record.count };
  } catch (err) {
    logger.error('[LoginProtectionService] recordFailedAttempt', err);
    return { locked: false, delayMs: 0, attemptCount: 0 };
  }
}

/**
 * Record a successful login — resets counters and clears lockout.
 */
async function recordSuccessfulLogin(userId, email, ip, context = {}) {
  try {
    const store = getAttemptStore();
    const emailKey = `login_attempts:${email.toLowerCase()}`;
    await store.delete(emailKey);

    const User = mongoose.model('User');
    await User.updateOne(
      { _id: userId },
      { $set: { loginLockedUntil: null, loginAttempts: 0, lastFailedLoginAt: null } },
    );

    await writeAuditEntry({
      action: 'auth.login.success',
      outcome: 'success',
      severity: 'info',
      email,
      ip,
      context,
    });
  } catch (err) {
    logger.error('[LoginProtectionService] recordSuccessfulLogin', err);
  }
}

/**
 * Check if an account is currently locked.
 * Returns { locked: true, lockUntil: Date } or { locked: false }.
 */
async function checkLockout(email) {
  try {
    if (!email) { return { locked: false }; }
    const User = mongoose.model('User');
    const user = await User.findOne({ email: email.toLowerCase() }).select('loginLockedUntil loginAttempts').lean();
    if (!user) { return { locked: false }; }
    if (user.loginLockedUntil && new Date(user.loginLockedUntil) > new Date()) {
      return { locked: true, lockUntil: user.loginLockedUntil };
    }
    return { locked: false };
  } catch (err) {
    logger.error('[LoginProtectionService] checkLockout', err);
    return { locked: false };
  }
}

/**
 * Compute required delay before responding to a login attempt.
 */
async function getRequiredDelay(email) {
  try {
    const store = getAttemptStore();
    const emailKey = `login_attempts:${email.toLowerCase()}`;
    const record = await store.get(emailKey);
    if (!record || !record.count) { return 0; }
    return computeDelayMs(record.count);
  } catch (err) {
    return 0;
  }
}

/**
 * Admin unlock — clears lockout on a user account.
 */
async function unlockAccount(userId, adminUserId, ip, context = {}) {
  try {
    const User = mongoose.model('User');
    const user = await User.findById(userId).select('email loginLockedUntil').lean();
    if (!user) { throw new Error('User not found'); }

    await User.updateOne(
      { _id: userId },
      { $set: { loginLockedUntil: null, loginAttempts: 0, lastFailedLoginAt: null } },
    );

    const store = getAttemptStore();
    if (user.email) {
      await store.delete(`login_attempts:${user.email.toLowerCase()}`);
    }

    await writeAuditEntry({
      action: 'auth.login.unlock',
      outcome: 'success',
      severity: 'info',
      email: user.email,
      ip,
      context,
      metadata: { unlockedBy: adminUserId },
    });

    return true;
  } catch (err) {
    logger.error('[LoginProtectionService] unlockAccount', err);
    throw err;
  }
}

/**
 * List locked user accounts.
 */
async function getLockedUsers() {
  try {
    const User = mongoose.model('User');
    const now = new Date();
    const users = await User.find({ loginLockedUntil: { $gt: now } })
      .select('name email loginLockedUntil loginAttempts lastFailedLoginAt')
      .sort({ loginLockedUntil: -1 })
      .lean();
    return users;
  } catch (err) {
    logger.error('[LoginProtectionService] getLockedUsers', err);
    return [];
  }
}

/* ── Audit log helper ────────────────────────────────────────────────── */

async function writeAuditEntry({ action, outcome, severity, email, ip, context, metadata }) {
  try {
    const AuditLog = mongoose.models.AuditLog;
    if (!AuditLog) { return; }

    const actor = {
      type: 'user',
      name: email || 'unknown',
      id: metadata?.unlockedBy || undefined,
    };
    const target = {
      type: 'user',
      name: email || 'unknown',
      id: metadata?.targetUserId || undefined,
    };
    const ctx = {
      ip: ip || undefined,
      ...(context.requestId ? { requestId: context.requestId } : {}),
      ...(context.userAgent ? { userAgent: context.userAgent } : {}),
    };

    /* Use the last entry's hash to chain, or compute locally */
    const lastEntry = await AuditLog.findOne({ chainKey: 'platform' }).sort({ seq: -1 }).select('seq hash').lean();
    const prevSeq = lastEntry?.seq ?? 0;
    const prevHash = lastEntry?.hash ?? '0000000000000000000000000000000000000000000000000000000000000000';
    const seq = prevSeq + 1;
    const createdAt = new Date();
    const hash = require('crypto').createHash('sha256').update(JSON.stringify({
      v: 1, action, outcome, severity, actor, target,
      metadata: metadata ?? null, context: ctx, seq, prevHash, createdAt: createdAt.toISOString(),
    })).digest('hex');

    await AuditLog.create({
      schemaVersion: 1,
      category: action.split('.')[0],
      action,
      outcome,
      severity,
      actor,
      target,
      metadata: metadata ?? undefined,
      context: Object.keys(ctx).length > 0 ? ctx : undefined,
      chainKey: 'platform',
      seq,
      prevHash,
      hash,
      createdAt,
    }).catch((writeErr) => {
      logger.warn('[LoginProtectionService] Audit log write failed (non-blocking):', writeErr.message);
    });
  } catch (err) {
    logger.warn('[LoginProtectionService] writeAuditEntry error (non-blocking):', err.message);
  }
}

module.exports = {
  recordFailedAttempt,
  recordSuccessfulLogin,
  checkLockout,
  getRequiredDelay,
  unlockAccount,
  getLockedUsers,
};
