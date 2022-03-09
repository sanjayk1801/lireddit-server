import { Field, ObjectType } from "type-graphql";
import { Post } from "../../entities/Post";
import { FieldError } from "./FieldError";

@ObjectType()
export class PostsResponse {
	@Field(() => [FieldError], { nullable: true })
	errors?: FieldError[];

	@Field(() => [Post], { nullable: true })
	posts?: Post[];

	@Field(() => Number, { nullable: true })
	totalCount?: Number;
}
