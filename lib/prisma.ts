import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  // Prisma 7 require karta hai ki aap datasource URL yahan pass karein 
  // agar aapne schema.prisma se usey hata diya hai.
  return new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
  });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;