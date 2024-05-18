import prisma from "$lib/prisma";
import { Y_POST_TYPES } from "$lib/constants/yPostTypes";

/**
 * @param {{ title: {raw: string, sanitized: string}, data: { content: string }, ids: string[] }} arg1
 * @param {{ name: string, id: string }} user
 */
export const createArticle = async ({ title, data, ids }, user) => {
	const outRelations = ids.map((id) => ({ isSystem: false, toPostId: id }))

  const { post, postUpdate } = await prisma.$transaction(async (tx) => {
    // Create yPost
    const post = await tx.yPost.create({
      data: {
        rawTitle: title.raw,
        title: title.sanitized,
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
        rawTitle: true,
        createdTimestamp: true
      },
      // @ts-ignore
      _metadata: {
        user,
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
								id: user.id
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
