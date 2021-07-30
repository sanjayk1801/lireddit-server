import { Post } from "../entities/Post";
import { Resolver, Query, Arg, Mutation } from "type-graphql";

@Resolver(Post)
export class PostResolver {
    @Query(() => [Post])
    posts(): Promise<Post[]>{
        return Post.find();
    }

    @Query(() => Post, {nullable: true})
    post(
        @Arg('id') id: number,
    ): Promise<Post | undefined>{
        return Post.findOne(id);
    }

    @Mutation(() => Post)
    async createPost(
        @Arg('title') title: string
    ): Promise<Post>{
        const post =  Post.create({title: title})
        await post.save()
        return post;
    }

    @Mutation(() => Post, {nullable: true})
    async updatePost(
        @Arg('id') id: number,
        @Arg('title') title: string
    ): Promise<Post | null>{
        const post = await Post.findOne(id);
        if (!post) {
            return null;
        } 
        if(typeof post !== 'undefined'){
            post.title = title;
        }
        await post.save();
        return post;
    }

    @Mutation(() => Boolean)
    async deletePost(
        @Arg('id') id: number
    ): Promise<boolean>{
        await Post.delete(id);
        return true;
    }
}

