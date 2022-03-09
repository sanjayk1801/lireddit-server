import { Topic } from "../entities/Topic";
import { Query, Resolver } from "type-graphql";

@Resolver(Topic)
export class TopicResolver {
	@Query(() => [Topic])
	async getTopics(): Promise<Topic[]> {
		return await Topic.find();
	}
}
