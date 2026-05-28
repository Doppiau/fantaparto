import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";

export { PrismaClientKnownRequestError };

export function isPrismaError(
  err: unknown,
  code: string
): err is PrismaClientKnownRequestError {
  return err instanceof PrismaClientKnownRequestError && err.code === code;
}
