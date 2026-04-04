import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3001),

  DATABASE_URL: Joi.string().required(),

  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),

  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  BCRYPT_SALT_ROUNDS: Joi.number().min(10).max(14).default(12),

  ML_SERVICE_URL: Joi.string().uri().default('http://localhost:8000'),
  ML_SERVICE_TIMEOUT_MS: Joi.number().default(5000),

  OPENWEATHER_API_KEY: Joi.string().allow('').default(''),
  OPENWEATHER_BASE_URL: Joi.string().uri().default('https://api.openweathermap.org/data/2.5'),

  RAZORPAY_KEY_ID: Joi.string().allow('').default(''),
  RAZORPAY_KEY_SECRET: Joi.string().allow('').default(''),

  CORS_ORIGINS: Joi.string().default('http://localhost:3000'),
});
