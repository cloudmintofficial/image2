import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

// Force delete the old cached instance so Next.js loads the new schema (touched for DoctorSignature update)
console.log("RELOADING PRISMA CLIENT CACHE FOR DOCTOR SIGNATURE...");
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = undefined;
}

export const prisma = globalForPrisma.prisma || new PrismaClient({});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
