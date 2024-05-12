import prisma from "$lib/prisma";
import { Y_POST_TYPES } from "$lib/constants/yPostTypes";

/** @param {{ userId: string, data: { content: string, title: string }, ids: string[] }} obj */
export const createArticle = async ({ userId, data, ids }) => {
	const outRelations = ids.map((id) => ({ isSystem: false, toPostId: id }))

  const { id, postUpdate } = await prisma.$transaction(async (tx) => {

    // Create yPost
    const { id } = await tx.yPost.create({
      data: {
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
      }
    })

		const postUpdate = await tx.yPostUpdate.create({
			data: {
				...data,
				post: {
					connect: {
						id
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

    return { id, postUpdate }
  })

  return {
    id,
    postUpdate: {
      id: postUpdate.id,
      title: postUpdate.title
    }
  }
};
