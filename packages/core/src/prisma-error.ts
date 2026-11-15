import { Prisma } from "../generated/prisma/client";

export function isPrismaError(error: unknown, code: string): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

/** Unique constraint violated — usually means "already exists", i.e. a duplicate. */
export function isUniqueViolation(error: unknown): boolean {
  return isPrismaError(error, "P2002");
}