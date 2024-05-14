import prisma from "$lib/prisma";
import { Y_POST_TYPES } from "$lib/constants/yPostTypes";

/** @param {{ userId: string, title: string, data: { content: string }, ids: string[] }} obj */
export const createArticle = async ({ userId, title, data, ids }) => {
	const outRelations = ids.map((id) => ({ isSystem: false, toPostId: id }))

  const { post, postUpdate } = await prisma.$transaction(async (tx) => {

    // Create yPost
    const post = await tx.yPost.create({
      data: {
        title,
        outRelations: {
          createMany: {
            data: [
              {
                isSystem: true,
                toPostId: Y_POST_TYPES.ARTICLE
              },
              ...outRelations
            ],
            skipDuplicates: true
          }
        }
      },
      select: {
        id: true,
        title: true,
      }
    })

		const postUpdate = await tx.yPostUpdate.create({
			data: {
				...data,
				post: {
					connect: {
						id: post.id
					}
				},
				metadata: {
					create: {
						user: {
							connect: {
								id: userId
							}
						}
					}
				}
			}
		});

    return { post, postUpdate }
  })

  return {
    ...post,
    postUpdate: {
      id: postUpdate.id,
    }
  }
};
