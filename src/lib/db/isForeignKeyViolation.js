import { Prisma as PrismaRuntime } from '../../generated/prisma/client';

/**
 * A row another row points to was deleted, or the other way around.
 * @param {unknown} err
 */
export const isForeignKeyViolation = (err) =>
	err instanceof PrismaRuntime.PrismaClientKnownRequestError && err.code === 'P2003';
