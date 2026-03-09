import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import type pg from "pg";

const connectionString = `${process.env.DATABASE_URL ?? ""}`
  .replace(/\r?\n/g, "")
  .trim();
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const poolMax = Number(process.env.PRISMA_POOL_MAX ?? 5);
const poolConfig: pg.PoolConfig = {
  connectionString,
  max: Number.isFinite(poolMax) && poolMax > 0 ? poolMax : 5,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 30_000,
};

const globalForPrisma = globalThis as unknown as {
  prismaAdapter?: PrismaPg;
  prismaClient?: PrismaClient;
};

const adapter =
  globalForPrisma.prismaAdapter ?? new PrismaPg(poolConfig);
const existingClient = globalForPrisma.prismaClient;
const staleClient =
  !!existingClient &&
  (!("collectionCategory" in
    (existingClient as unknown as Record<string, unknown>)) ||
    !("collectionItem" in
    (existingClient as unknown as Record<string, unknown>)) ||
    !("openDeckReservation" in
      (existingClient as unknown as Record<string, unknown>)) ||
    !("openDeckDay" in
      (existingClient as unknown as Record<string, unknown>)));

if (staleClient) {
  void existingClient.$disconnect().catch(() => undefined);
}

const prisma =
  !existingClient || staleClient
    ? new PrismaClient({ adapter })
    : existingClient;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaAdapter = adapter;
  globalForPrisma.prismaClient = prisma;
}

export { prisma };
