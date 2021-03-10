import { permissions } from './permissions'
import { APP_SECRET, getUserId } from './utils'
import { compare, hash } from 'bcryptjs'
import { sign } from 'jsonwebtoken'
import { applyMiddleware } from 'graphql-middleware'


import {
  intArg,
  makeSchema,
  nonNull,
  objectType,
  stringArg,
  inputObjectType,
  arg,
  asNexusMethod,
  enumType,
} from 'nexus'
import { GraphQLDateTime } from 'graphql-iso-date'
import { Context } from './context'

export const DateTime = asNexusMethod(GraphQLDateTime, 'date')

const Query = objectType({
  name: 'Query',
  definition(t) {
    t.nonNull.list.nonNull.field('allUsers', {
      type: 'User',
      resolve: (_parent, _args, context: Context) => {
        return context.prisma.user.findMany()
      },
    })

    t.nullable.field('me', {
      type: 'User',
      resolve: (parent, args, context: Context) => {
        const userId = getUserId(context)
        return context.prisma.user.findUnique({
          where: {
            id: Number(userId),
          },
        })
      },
    })

    t.nullable.field('postById', {
      type: 'Post',
      args: {
        id: intArg(),
      },
      resolve: (_parent, args, context: Context) => {
        return context.prisma.post.findUnique({
          where: { id: args.id || undefined },
        })
      },
    })


    t.nonNull.list.nonNull.field('tweets', {
      type: 'Tweet',
      resolve: (_parent, __, context: Context) => {
        return context.prisma.tweet.findMany()
      },
    })


    t.nullable.field('tweet', {
      type: 'Tweet',
      args: {
        id: intArg(),
      },
      resolve: (_parent, args, context: Context) => {
        return context.prisma.tweet.findUnique({
          where: { id: args.id || undefined },
        })
      },
    })

    


    t.nonNull.list.nonNull.field('feed', {
      type: 'Post',
      args: {
        searchString: stringArg(),
        skip: intArg(),
        take: intArg(),
        orderBy: arg({
          type: 'PostOrderByUpdatedAtInput',
        }),
      },
      resolve: (_parent, args, context: Context) => {
        const or = args.searchString
          ? {
              OR: [
                { title: { contains: args.searchString } },
                { content: { contains: args.searchString } },
              ],
            }
          : {}

        return context.prisma.post.findMany({
          where: {
            published: true,
            ...or,
          },
          take: args.take || undefined,
          skip: args.skip || undefined,
          orderBy: args.orderBy || undefined,
        })
      },
    })

    t.list.field('draftsByUser', {
      type: 'Post',
      args: {
        userUniqueInput: nonNull(
          arg({
            type: 'UserUniqueInput',
          }),
        ),
      },
      resolve: (_parent, args, context: Context) => {
        return context.prisma.user
          .findUnique({
            where: {
              id: args.userUniqueInput.id || undefined,
              email: args.userUniqueInput.email || undefined,
            },
          })
          .posts({
            where: {
              published: false,
            },
          })
      },
    })
  },
})

const Mutation = objectType({
  name: 'Mutation',
  definition(t) {
    t.field('signup', {
      type: 'AuthPayload',
      args: {
        name: stringArg(),
        email: nonNull(stringArg()),
        password: nonNull(stringArg()),
      },
      resolve: async (_parent, args, context: Context) => {
        const hashedPassword = await hash(args.password, 10)
        const user = await context.prisma.user.create({
          data: {
            name: args.name,
            email: args.email,
            password: hashedPassword,
          },
        })
        return {
          token: sign({ userId: user.id }, APP_SECRET),
          user,
        }
      },
    })

    t.field('login', {
      type: 'AuthPayload',
      args: {
        email: nonNull(stringArg()),
        password: nonNull(stringArg()),
      },
      resolve: async (_parent, { email, password }, context: Context) => {
        const user = await context.prisma.user.findUnique({
          where: {
            email,
          },
        })
        if (!user) {
          throw new Error(`No user found for email: ${email}`)
        }
        const passwordValid = await compare(password, user.password)
        if (!passwordValid) {
          throw new Error('Invalid password')
        }
        return {
          token: sign({ userId: user.id }, APP_SECRET),
          user,
        }
      },
    })

    t.field('createProfile',{
      type: "Profile",
      args: {
        bio: nonNull(stringArg()),
        location: nonNull(stringArg()),
        avatar: nonNull(stringArg()),
        website: nonNull(stringArg()),
      },
      resolve: (_, args, context: Context) => {
        const userId = getUserId(context)
        console.log(userId,args.bio)
        return context.prisma.profile.create({
          data: {
           ...args,
           User: { connect: { id: Number(userId) } }
          },
        })
      }
    })

    t.field('updateProfile',{
      type: "Profile",
      args: {
        id: intArg(),
        bio: nonNull(stringArg()),
        location: nonNull(stringArg()),
        avatar: nonNull(stringArg()),
        website: nonNull(stringArg()),
      },
      resolve: (_, {id,...args}, context: Context) => {
        const userId = getUserId(context)
        console.log(userId,args.bio)
        return context.prisma.profile.update({
          data: {
           ...args,
           User: { connect: { id: Number(userId) } }
          },
          where :{
            id:Number(id)
          }
        })
      }
    })


    

    t.field('createTweet',{
      type: "Tweet",
      args: {
        content: nonNull(stringArg())
      },
      resolve: (_, { content }, context: Context) => {
        const userId = getUserId(context)
        console.log(userId,content)
        return context.prisma.tweet.create({
          data: {
           content,
           author: { connect: { id: Number(userId) } }
          },
        })
      }
    })


    t.field('likeTweet',{
      type: "LikedTweet",
      args: {
        id: nonNull(intArg())
      },
      resolve: (_, args, context: Context) => {
        const userId = getUserId(context)
        console.log(userId,args)
        return context.prisma.likedTweet.create({
          data: {
           user: { connect: { id: Number(userId) } },
           tweet: {connect :{id: Number(args.id)} }
          },
        })
      }
    })

    t.field("deleteLike", {
			type: "LikedTweet",
			args: {
				id: nonNull(intArg())
			},
			resolve: (parent, { id }, ctx) => {
				const userId = getUserId(ctx)
				if (!userId) throw new Error("Could not authenticate user.")
				return ctx.prisma.likedTweet.delete({
					where: { id: id }
				})
			}
		})

    t.field("follow", {
			type: "following",
			args: {
				name: nonNull(stringArg()),
				followId: nonNull(intArg()),
				avatar: nonNull(stringArg()),
			},
			resolve: (parent,  { name, followId, avatar }, ctx) => {
				const userId = getUserId(ctx)
				if (!userId) throw new Error("Could not authenticate user.")
				return ctx.prisma.following.create({
			   data:{
          name,
           followId,
            avatar ,
            user:{connect:{id:Number(userId)}}
         }
				})
			}
		})

    t.field("deleteFollow", {
			type: "following",
			args: {
				id: nonNull(intArg()),
			},
			resolve: (parent,  { id }, ctx) => {
				const userId = getUserId(ctx)
				if (!userId) throw new Error("Could not authenticate user.")
				return ctx.prisma.following.delete({
          where: { id: id }
				})
			}
		})

    t.field("createComment", {
			type: "Comment",
			args: {
				content: nonNull(stringArg()),
        tweetId: nonNull(intArg()),
			},
			resolve: (parent,  { content , tweetId }, ctx) => {
				const userId = getUserId(ctx)
				if (!userId) throw new Error("Could not authenticate user.")
				return ctx.prisma.comment.create({
          data:{
            content,
            user:{connect:{id: Number(userId)}},
            Tweet: {connect:{id: Number(tweetId) }} 
          }
				})
			}
		})

    t.field("createReply", {
			type: "Comment",
			args: {
				content: nonNull(stringArg()),
        tweetId: nonNull(intArg()),
        commentId: nonNull(intArg()),
			},
			resolve: (parent,  { content , tweetId , commentId }, ctx) => {
				const userId = getUserId(ctx)
				if (!userId) throw new Error("Could not authenticate user.")
				return ctx.prisma.comment.create({
          data:{
            content,
            user:{connect:{id: Number(userId)}},
            Tweet: {connect:{id: Number(tweetId) }} ,
            Comment: {connect:{id: Number(commentId)}}
          }
				})
			}
		})


    t.field('createDraft', {
      type: 'Post',
      args: {
        data: nonNull(
          arg({
            type: 'PostCreateInput',
          }),
        ),
      },
      resolve: (_, args, context: Context) => {
        const userId = getUserId(context)
        return context.prisma.post.create({
          data: {
            title: args.data.title,
            content: args.data.content,
            authorId: userId,
          },
        })
      },
    })

    t.field('togglePublishPost', {
      type: 'Post',
      args: {
        id: nonNull(intArg()),
      },
      resolve: async (_, args, context: Context) => {
        try {
          const post = await context.prisma.post.findUnique({
            where: { id: args.id || undefined },
            select: {
              published: true,
            },
          })
          return context.prisma.post.update({
            where: { id: args.id || undefined },
            data: { published: !post?.published },
          })
        } catch (e) {
          throw new Error(
            `Post with ID ${args.id} does not exist in the database.`,
          )
        }
      },
    })

    t.field('incrementPostViewCount', {
      type: 'Post',
      args: {
        id: nonNull(intArg()),
      },
      resolve: (_, args, context: Context) => {
        return context.prisma.post.update({
          where: { id: args.id || undefined },
          data: {
            viewCount: {
              increment: 1,
            },
          },
        })
      },
    })

    t.field('deletePost', {
      type: 'Post',
      args: {
        id: nonNull(intArg()),
      },
      resolve: (_, args, context: Context) => {
        return context.prisma.post.delete({
          where: { id: args.id },
        })
      },
    })
  },
})

const User = objectType({
  name: 'User',
  definition(t) {
    t.nonNull.int('id')
    t.string('name')
    t.nonNull.string('email')
    t.nonNull.list.nonNull.field('posts', {
      type: 'Post',
      resolve: (parent, _, context: Context) => {
        return context.prisma.user
          .findUnique({
            where: { id: parent.id || undefined },
          })
          .posts()
      },
    })
  },
})

const Profile = objectType({
  name: 'Profile',
  definition(t){
    t.nonNull.int('id')
    t.nonNull.field('createdAt', { type: 'DateTime' })
    t.nonNull.string('bio')
    t.nonNull.string('website')
    t.nonNull.string('location')
    t.nonNull.string('avatar')
    t.field('user', {
      type: 'User',
      resolve: (parent, _, context: Context) => {
        return context.prisma.user
          .findUnique({
            where: { id: getUserId(context) || undefined },
          })
         
      },
    })
  }
})


const Tweet = objectType({
  name: 'Tweet',
  definition(t){
    t.nonNull.int('id')
    t.nonNull.field('createdAt', { type: 'DateTime' })
    t.nonNull.string('content')
    t.nonNull.field('likes',{type: LikedTweet})
    t.field('author', {
      type: 'User',
      resolve: (parent, _, context: Context) => {
        return context.prisma.user
          .findUnique({
            where: { id: getUserId(context) || undefined },
          })
        
      },
    })
  }
})



const Comment = objectType({
  name: 'Comment',
  definition(t){
    t.nonNull.int('id')
    t.nonNull.field('createdAt', { type: 'DateTime' })
    t.nonNull.string('content')
    t.field('user', {
      type: 'User',
      resolve: (parent, _, context: Context) => {
        return context.prisma.user
          .findUnique({
            where: { id: getUserId(context) || undefined },
          })
      },
    })
    
  }
})


const Following = objectType({
  name: 'following',
  definition(t){
    t.nonNull.int('id')
    t.nonNull.int('followId')
    t.nonNull.string('name')
    t.nonNull.string('avatar')
    t.field('user', {
      type: 'User',
      resolve: (parent, _, context: Context) => {
        return context.prisma.user
          .findUnique({
            where: { id: getUserId(context) || undefined },
          }) 
      },
    })
  }
})


const LikedTweet = objectType({
  name: 'LikedTweet',
  definition(t){
    t.nonNull.int('id')
    t.nonNull.field('likedAt', { type: 'DateTime' })
  //  t.nonNull.int('tweetId')
    t.field('user', {
      type: 'User',
      resolve: (parent, _, context: Context) => {
        return context.prisma.user
          .findUnique({
            where: { id: getUserId(context) || undefined },
          }) 
      },
    })
    t.field('tweet', {
      type: 'Tweet',
      resolve: (parent, _, context: Context) => {
        console.log(parent);
        return context.prisma.tweet
          .findUnique({
            where: { id: parent.id || undefined },
          }) 
      },
    })
  }
})


const Post = objectType({
  name: 'Post',
  definition(t) {
    t.nonNull.int('id')
    t.nonNull.field('createdAt', { type: 'DateTime' })
    t.nonNull.field('updatedAt', { type: 'DateTime' })
    t.nonNull.string('title')
    t.string('content')
    t.nonNull.boolean('published')
    t.nonNull.int('viewCount')
    t.field('author', {
      type: 'User',
      resolve: (parent, _, context: Context) => {
        return context.prisma.post
          .findUnique({
            where: { id: parent.id || undefined },
          })
          .author()
      },
    })
  },
})

const SortOrder = enumType({
  name: 'SortOrder',
  members: ['asc', 'desc'],
})

const PostOrderByUpdatedAtInput = inputObjectType({
  name: 'PostOrderByUpdatedAtInput',
  definition(t) {
    t.nonNull.field('updatedAt', { type: 'SortOrder' })
  },
})

const UserUniqueInput = inputObjectType({
  name: 'UserUniqueInput',
  definition(t) {
    t.int('id')
    t.string('email')
  },
})

const PostCreateInput = inputObjectType({
  name: 'PostCreateInput',
  definition(t) {
    t.nonNull.string('title')
    t.string('content')
  },
})

const UserCreateInput = inputObjectType({
  name: 'UserCreateInput',
  definition(t) {
    t.nonNull.string('email')
    t.string('name')
    t.list.nonNull.field('posts', { type: 'PostCreateInput' })
  },
})

const ProfileCreateInput = inputObjectType({
  name: 'ProfileCreateInput',
  definition(t){
    t.string('bio')
    t.string('website')
    t.string('avatar')
    t.string('location')
  }
})

const AuthPayload = objectType({
  name: 'AuthPayload',
  definition(t) {
    t.string('token')
    t.field('user', { type: 'User' })
  },
})

const schemaWithoutPermissions = makeSchema({
  types: [
    Query,
    Mutation,
    Post,
    User,
    AuthPayload,
    UserUniqueInput,
    UserCreateInput,
    PostCreateInput,
    SortOrder,
    PostOrderByUpdatedAtInput,
    DateTime,
    Profile,
    Tweet,
    LikedTweet,
    Following,
    Comment
  ],
  outputs: {
    schema: __dirname + '/../schema.graphql',
    typegen: __dirname + '/generated/nexus.ts',
  },
  contextType: {
    module: require.resolve('./context'),
    export: 'Context',
  },
  sourceTypes: {
    modules: [
      {
        module: '@prisma/client',
        alias: 'prisma',
      },
    ],
  },
})

export const schema = applyMiddleware(schemaWithoutPermissions, permissions)
