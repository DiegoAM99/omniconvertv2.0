import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

// Test connection
prisma.$connect()
  .then(() => logger.info('✅ Database connected'))
  .catch((error: Error) => {
    logger.error('❌ Database connection failed:', error);
    process.exit(1);
  });

export { prisma };
