const { logger } = require('@librechat/data-schemas');

const REDIS_CHANNEL_PREFIX = 'knowledge:job:';
const HEARTBEAT_INTERVAL = 30000;

const connections = new Map();

let publisher = null;
let subscriber = null;
let isListening = false;

function getRedisClient() {
  if (!publisher) {
    try {
      publisher = require('@librechat/api').ioredisClient;
    } catch (e) {
      logger.warn('[SSEService] @librechat/api not available');
    }
  }
  return publisher;
}

function subscribeToJob(jobId, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  res.write(`data: ${JSON.stringify({ type: 'connected', jobId })}\n\n`);

  if (!connections.has(jobId)) {
    connections.set(jobId, new Set());
  }
  connections.get(jobId).add(res);

  const heartbeat = setInterval(() => {
    try { res.write(`:heartbeat\n\n`); } catch (e) { clearInterval(heartbeat); }
  }, HEARTBEAT_INTERVAL);

  res.on('close', () => {
    clearInterval(heartbeat);
    const set = connections.get(jobId);
    if (set) {
      set.delete(res);
      if (set.size === 0) {
        connections.delete(jobId);
      }
    }
  });
}

async function sendToJob(jobId, data) {
  const client = getRedisClient();
  if (client) {
    try {
      await client.publish(`${REDIS_CHANNEL_PREFIX}${jobId}:progress`, JSON.stringify(data));
    } catch (e) {
      logger.warn('[SSEService] Redis publish failed:', e.message);
    }
  }

  const set = connections.get(jobId);
  if (set) {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    for (const res of set) {
      try { res.write(payload); } catch (e) { set.delete(res); }
    }
  }
}

async function broadcastToUser(userId, data) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  const client = getRedisClient();
  if (client) {
    try {
      await client.publish(`${REDIS_CHANNEL_PREFIX}user:${userId}`, JSON.stringify(data));
    } catch (e) {
      logger.warn('[SSEService] Redis broadcast publish failed:', e.message);
    }
  }
}

function startListening() {
  if (isListening) { return; }
  const client = getRedisClient();
  if (!client) {
    logger.warn('[SSEService] Cannot start listening: Redis not available');
    return;
  }

  try {
    subscriber = client.duplicate();
    subscriber.on('message', (channel, message) => {
      const match = channel.match(/^knowledge:job:(.+):progress$/);
      if (!match) { return; }
      const jobId = match[1];
      let data;
      try { data = JSON.parse(message); } catch (e) { return; }

      const set = connections.get(jobId);
      if (set) {
        const payload = `data: ${JSON.stringify(data)}\n\n`;
        for (const res of set) {
          try { res.write(payload); } catch (e) { set.delete(res); }
        }
      }
    });

    subscriber.psubscribe('knowledge:job:*');
    isListening = true;
    logger.info('[SSEService] Redis subscriber listening on knowledge:job:*');
  } catch (e) {
    logger.error('[SSEService] Failed to start Redis subscriber:', e.message);
  }
}

function stopListening() {
  if (subscriber) {
    subscriber.punsubscribe();
    subscriber.disconnect();
    subscriber = null;
  }
  isListening = false;
}

async function shutdown() {
  stopListening();
  for (const [jobId, set] of connections) {
    for (const res of set) {
      try { res.end(); } catch (e) { /* ignore */ }
    }
  }
  connections.clear();
}

module.exports = {
  subscribeToJob,
  sendToJob,
  startListening,
  stopListening,
  shutdown,
};
