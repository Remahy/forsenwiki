import prisma from "$lib/prisma";

/**
 * @param {string} title
 */
export async function readYPostUpdatesByTitle(title) {
  return prisma.yPost.findUnique({
    where: {
      title,
    },
    include: {
      outRelations: {
        select: {
          isSystem: true,
          toPost: {
            select: {
              postUpdates: {
                select: {
                  id: true
                },
                take: 1
              }
            }
          },
          toPostId: true
        }
      },
      postUpdates: {
        select: {
          content: true
        }
      }
    }
  })
}

/** @param {string} title */
export async function readYPostByTitle(title) {
  return prisma.yPost.findUnique({
    where: {
      title,
    },
    select: {
      id: true,
    }
  });
}