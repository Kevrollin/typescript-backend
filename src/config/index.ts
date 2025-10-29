import dotenv from 'dotenv';
import { Config, StellarNetwork } from '../types';

dotenv.config();

const config: Config = {
  // Application
  app: {
    name: process.env.APP_NAME || 'FundHub',
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '8000', 10),
    debug: process.env.DEBUG === 'true',
  },

  // Database
  database: {
    url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/fundhub',
    logging: process.env.DB_LOGGING === 'true',
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
      acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000', 10),
      idle: parseInt(process.env.DB_POOL_IDLE || '10000', 10),
    },
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379/0',
  },

  // Security
  security: {
    secretKey: process.env.SECRET_KEY || 'your-secret-key-change-in-production',
    jwtExpiration: parseInt(process.env.JWT_EXPIRATION || '1800', 10), // 30 minutes
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
  },

  // CORS
  cors: {
    origins: process.env.CORS_ORIGINS 
      ? process.env.CORS_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://localhost:8080', 'https://innovax-ui.vercel.app'],
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
    max: parseInt(process.env.RATE_LIMIT_MAX || '60', 10),
    message: 'Too many requests from this IP, please try again later.',
  },

  // Stellar
  stellar: {
    network: (process.env.STELLAR_NETWORK as StellarNetwork) || StellarNetwork.TESTNET,
    horizonUrl: process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org',
    networkPassphrase: process.env.NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015',
    friendbotUrl: process.env.FRIENDBOT_URL || 'https://friendbot.stellar.org',
    platformWalletPublic: process.env.PLATFORM_WALLET_PUBLIC || '',
    platformWalletSecret: process.env.PLATFORM_WALLET_SECRET || '',
  },

  // Payment Providers
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },

  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
};

export default config;
