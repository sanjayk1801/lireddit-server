import { Field, InputType } from "type-graphql";

@InputType()
export class UserLoginInput {

    @Field()
    usernameOrEmail: string;

    @Field()
    password: string;
}
