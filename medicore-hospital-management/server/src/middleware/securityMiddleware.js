const cors = require('cors');
const rateLimit = require('express-rate-limit');

const numberFromEnv = (name, fallback) => {
  const value = Number.parseInt(process.env[name], 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const rateLimitHandler = (req, res) =>
  res.status(429).json({ success: false, message: 'Too many requests. Please try again later.' });

const loginLimiter = rateLimit({
  windowMs: numberFromEnv('RATE_LIMIT_LOGIN_WINDOW_MS', 15 * 60 * 1000),
  limit: numberFromEnv('RATE_LIMIT_LOGIN_MAX', 10),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: rateLimitHandler,
});

const registerLimiter = rateLimit({
  windowMs: numberFromEnv('RATE_LIMIT_REGISTER_WINDOW_MS', 60 * 60 * 1000),
  limit: numberFromEnv('RATE_LIMIT_REGISTER_MAX', 5),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: rateLimitHandler,
});

const mutationLimiter = rateLimit({
  windowMs: numberFromEnv('RATE_LIMIT_MUTATION_WINDOW_MS', 15 * 60 * 1000),
  limit: numberFromEnv('RATE_LIMIT_MUTATION_MAX', 120),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: (req) => !['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) || req.path === '/api/health',
  handler: rateLimitHandler,
});

const allowedOrigins = () => String(process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  credentials: false,
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const configured = allowedOrigins();
    const developmentOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
    if (configured.includes(origin) || (process.env.NODE_ENV !== 'production' && developmentOrigin)) {
      return callback(null, true);
    }
    const error = new Error('Origin is not allowed by CORS');
    error.status = 403;
    return callback(error);
  },
};

module.exports = { corsOptions, loginLimiter, registerLimiter, mutationLimiter };
