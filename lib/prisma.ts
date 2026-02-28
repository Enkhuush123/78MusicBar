import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;

const globalForPrisma = globalThis as unknown as {
  prismaAdapter?: PrismaPg;
  prismaClient?: PrismaClient;
};

const adapter =
  globalForPrisma.prismaAdapter ?? new PrismaPg({ connectionString });
const prisma = globalForPrisma.prismaClient ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaAdapter = adapter;
  globalForPrisma.prismaClient = prisma;
}

export { prisma };
