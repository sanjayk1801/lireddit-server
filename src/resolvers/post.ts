import { Post } from "../entities/Post";
import { Context } from "../types/Context";
import { Resolver, Query, Ctx, Arg, Mutation } from "type-graphql";

@Resolver(Post)
export class PostResolver {
    @Query(() => [Post])
    posts(@Ctx() {em}: Context): Promise<Post[]>{
        return em.find(Post, {});
    }

    @Query(() => Post, {nullable: true})
    post(
        @Arg('id') id: number,
        @Ctx() {em}: Context
    ): Promise<Post | null>{
        return em.findOne(Post, {id});
    }

    @Mutation(() => Post)
    async createPost(
        @Arg('title') title: String,
        @Ctx() {em}: Context
    ): Promise<Post>{

        const post = em.create(Post, {title});
        await em.persistAndFlush(post);
        return post;
    }

    @Mutation(() => Post, {nullable: true})
    async updatePost(
        @Arg('id') id: number,
        @Arg('title') title: string,
        @Ctx() {em}: Context
    ): Promise<Post | null>{
        const post = await em.findOne(Post, { id });
        if (!post) {
            return null;
        } 
        if(typeof post !== 'undefined'){
            post.title = title;
        }
        await em.persistAndFlush(post);
        return post;
    }

    @Mutation(() => Boolean)
    async deletePost(
        @Arg('id') id: number,
        @Ctx() {em}: Context
    ): Promise<boolean>{
        await em.nativeDelete(Post, { id });
        return true;
    }
}

