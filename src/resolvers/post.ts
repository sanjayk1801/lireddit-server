import { Post } from "../entities/Post";
import {
	Resolver,
	Query,
	Arg,
	Mutation,
	Authorized,
	Ctx,
	FieldResolver,
	Root,
} from "type-graphql";
import { Context } from "../types/Context";
import { User } from "../entities/User";

@Resolver(Post)
export class PostResolver {
	@FieldResolver(() => String)
	bodySnippet(@Root() post: Post) {
		return post.body.slice(0, 50);
	}

	@Query(() => [Post])
	async posts(): Promise<Post[]> {
		const post = await Post.find({ relations: ["user"] });
		return post;
	}

	@Query(() => Post, { nullable: true })
	post(@Arg("id") id: number): Promise<Post | undefined> {
		return Post.findOne(id);
	}

	@Authorized()
	@Mutation(() => Post)
	async createPost(
		@Ctx() { req }: Context,
		@Arg("title") title: string,
		@Arg("body") body: string
	): Promise<Post> {
		const user = await User.findOne(req.session.userId);
		const post = Post.create({ title: title, body: body });
		if (user !== undefined) {
			post.user = user;
		}
		await post.save();
		return post;
	}

	@Authorized()
	@Mutation(() => Post, { nullable: true })
	async updatePost(
		@Arg("id") id: number,
		@Arg("title") title: string,
		@Arg("body") body: string
	): Promise<Post | null> {
		const post = await Post.findOne(id);
		if (!post) {
			return null;
		}
		if (typeof post !== "undefined") {
			post.title = title;
			post.body = body;
		}

		await post.save();
		return post;
	}

	@Authorized()
	@Mutation(() => Boolean)
	async deletePost(@Arg("id") id: number): Promise<boolean> {
		await Post.delete(id);
		return true;
	}
}

