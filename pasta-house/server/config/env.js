const dotenv = require("dotenv");

dotenv.config();

const parseOrigins = (value) => {
  if (!value) return [];
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  CUSTOMER_JWT_SECRET: process.env.CUSTOMER_JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  CUSTOMER_JWT_EXPIRES_IN: process.env.CUSTOMER_JWT_EXPIRES_IN || "30d",
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
  PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY,
  PAYSTACK_WEBHOOK_SECRET: process.env.PAYSTACK_WEBHOOK_SECRET,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN,
  CLIENT_ORIGINS: parseOrigins(process.env.CLIENT_ORIGIN),
  ADMIN_USERNAME: process.env.ADMIN_USERNAME,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD
};

env.nodeEnv = env.NODE_ENV;
env.port = env.PORT;
env.mongoUri = env.MONGODB_URI;
env.jwtSecret = env.JWT_SECRET;
env.customerJwtSecret = env.CUSTOMER_JWT_SECRET;
env.jwtExpiresIn = env.JWT_EXPIRES_IN;
env.customerJwtExpiresIn = env.CUSTOMER_JWT_EXPIRES_IN;
env.clientOrigins = env.CLIENT_ORIGINS;
env.paystackSecretKey = env.PAYSTACK_SECRET_KEY;
env.paystackPublicKey = env.PAYSTACK_PUBLIC_KEY;
env.paystackWebhookSecret = env.PAYSTACK_WEBHOOK_SECRET;

module.exports = env;
