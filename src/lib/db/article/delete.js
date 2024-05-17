/**
 * @param {Prisma.PrismaClient | Prisma.Prisma.TransactionClient} prisma
 * @param {string} fromPostId
 */
export async function postYRelationDeleteByFromPostId (prisma, fromPostId) {
  return prisma.yPostRelation.deleteMany({
    where: {
      fromPostId
    }
  })
}
