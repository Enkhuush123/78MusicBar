import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import type pg from "pg";

const connectionString = `${process.env.DATABASE_URL}`;
const poolMax = Number(process.env.PRISMA_POOL_MAX ?? 1);
const poolConfig: pg.PoolConfig = {
  connectionString,
  max: Number.isFinite(poolMax) && poolMax > 0 ? poolMax : 1,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 10_000,
};

const globalForPrisma = globalThis as unknown as {
  prismaAdapter?: PrismaPg;
  prismaClient?: PrismaClient;
};

const adapter =
  globalForPrisma.prismaAdapter ?? new PrismaPg(poolConfig);
const prisma = globalForPrisma.prismaClient ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaAdapter = adapter;
  globalForPrisma.prismaClient = prisma;
}

export { prisma };
