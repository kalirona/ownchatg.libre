const helmet = require('helmet');

const isProduction = process.env.NODE_ENV === 'production';

const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'", 'https://*.googletagmanager.com'],
  styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  imgSrc: [
    "'self'",
    'data:',
    'blob:',
    'https://*.google-analytics.com',
    'https://*.googletagmanager.com',
  ],
  connectSrc: [
    "'self'",
    'https://*.googletagmanager.com',
    'https://*.google-analytics.com',
    'https://api.openai.com',
    'https://*.anthropic.com',
  ],
  fontSrc: ["'self'", 'https://fonts.gstatic.com'],
  frameSrc: ["'self'"],
  frameAncestors: ["'self'"],
  objectSrc: ["'none'"],
  mediaSrc: ["'self'", 'blob:', 'data:'],
  workerSrc: ["'self'", 'blob:'],
  manifestSrc: ["'self'"],
  formAction: ["'self'"],
  baseUri: ["'self'"],
  upgradeInsecureRequests: [],
};

module.exports = function securityHeaders(req, res, next) {
  if (isProduction) {
    /* HSTS — 1 year, include subdomains, preload */
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload',
    );

    /* Referrer-Policy */
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    /* Permissions-Policy — restrict sensitive browser features */
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()',
    );

    /* Prevent MIME-type sniffing */
    res.setHeader('X-Content-Type-Options', 'nosniff');

    helmet({
      contentSecurityPolicy: { directives: cspDirectives },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })(req, res, next);
  } else {
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })(req, res, next);
  }
};
