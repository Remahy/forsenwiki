import prisma from "$lib/prisma";

/**
 * @param {string} postId
 */
export async function readArticleUpdatesByPostId (postId) {
  return prisma.yPost.findFirst({
    where: {
      id: postId
    },
    include: {
      outRelations: {
        select: {
          isSystem: true,
          toPost: {
            select: {
              postUpdates: {
                select: {
                  title: true,
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

/** @param {string} postId */
export async function readLatestArticleUpdateByPostId (postId) {
	return prisma.yPost.findFirst({
    where: {
      id: postId
    },
    include: {
      outRelations: {
        select: {
          toPost: {
            select: {
              postUpdates: {
                select: {
                  title: true
                },
                take: 1
              }
            }
          },
          toPostId: true,
          isSystem: true
        }
      },
      postUpdates: {
        select: {
          title: true,
          id: true,
          createdTimestamp: true
        },
        orderBy: {
          createdTimestamp: 'desc'
        },
        take: 1
      }
    }
  })
}
