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
import { PostsResponse } from "../types/graphql/PostsResponse";
import { Topic } from "../entities/Topic";
import _ from "lodash";

@Resolver(Post)
export class PostResolver {
	@FieldResolver(() => String)
	bodySnippet(@Root() post: Post) {
		return post.body.slice(0, 300);
	}

	@Query(() => PostsResponse)
	async paginatedPosts(
		@Arg("size") size: number = 10,
		@Arg("pageIndex") pageIndex: number = 0
	): Promise<PostsResponse> {
		const [posts, totalCount] = await Post.findAndCount({
			relations: ["user", "topic"],
			order: { createdAt: "DESC" },
			take: size,
			skip: pageIndex * size,
		});
		return { posts, totalCount };
	}

	@Query(() => Post, { nullable: true })
	post(@Arg("id") id: number): Promise<Post | undefined> {
		return Post.findOne(id, { relations: ["user", "topic"] });
	}

	@Authorized()
	@Mutation(() => Post)
	async createPost(
		@Ctx() { req }: Context,
		@Arg("title") title: string,
		@Arg("body") body: string,
		@Arg("topic_ids", () => [Number]) topic_ids: number[]
	): Promise<Post> {
		const user = await User.findOne(req.session.userId);
		const topics = await Topic.findByIds(topic_ids);
		const post = Post.create({ title: title, body: body });
		post.topic = topics;
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
		@Arg("body") body: string,
		@Arg("topic_ids", () => [Number]) topic_ids: number[]
	): Promise<Post | null> {
		const post = await Post.findOne(id);
		if (!post) {
			return null;
		}
		if (typeof post !== "undefined") {
			const topics = await Topic.findByIds(topic_ids);
			post.title = title;
			post.body = body;
			post.topic = topics;
		}

		await post.save();
		return post;
	}

	@Authorized()
	@Mutation(() => Boolean)
	async toggleLikePost(
		@Ctx() { req }: Context,
		@Arg("id") id: number
	): Promise<boolean> {
		const post = await Post.findOne(id);
		if (!post) return false;

		const user = await User.findOne(req.session.userId, {
			relations: ["liked_posts"],
		});
		if (!user) return false;
		if (!_.find(user.liked_posts, { id })) {
			user.liked_posts.push(post);
			post.likes += 1;
		} else {
			_.remove(user.liked_posts, { id });
			post.likes -= 1;
		}
		await user.save();
		await post.save();

		return true;
	}

	@Authorized()
	@Mutation(() => Boolean)
	async toggleBookmarkPost(
		@Ctx() { req }: Context,
		@Arg("id") id: number
	): Promise<boolean> {
		const post = await Post.findOne(id);
		if (!post) return false;

		const user = await User.findOne(req.session.userId, {
			relations: ["bookmarked_posts"],
		});
		if (!user) return false;
		if (!_.find(user.bookmarked_posts, { id })) {
			user.bookmarked_posts.push(post);
		} else {
			_.remove(user.bookmarked_posts, { id });
		}
		await user.save();

		return true;
	}

	@Authorized()
	@Mutation(() => Boolean)
	async deletePost(@Arg("id") id: number): Promise<boolean> {
		await Post.delete(id);
		return true;
	}
}
