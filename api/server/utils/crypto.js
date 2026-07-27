const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const KEY_LENGTH = 32;
const SALT = 'librechat-integration-tokens';

function getEncryptionKey() {
  const key = process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY;
  if (!key || key.length < 8) {
    throw new Error('INTEGRATION_TOKEN_ENCRYPTION_KEY must be set (min 8 chars)');
  }
  if (key.length === 64 && /^[0-9a-f]+$/i.test(key)) {
    return Buffer.from(key, 'hex');
  }
  return crypto.scryptSync(key, SALT, KEY_LENGTH);
}

function encrypt(text) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${encrypted}:${authTag}`;
}

function decrypt(encoded) {
  const key = getEncryptionKey();
  const parts = encoded.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format');
  }
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const authTag = Buffer.from(parts[2], 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = { encrypt, decrypt };
