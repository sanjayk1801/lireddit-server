import { Field, InputType } from "type-graphql";



@InputType()
export class UserRegisterInput {

    @Field()
    username: string;

    @Field()
    email: string;

    @Field()
    password: string;
}
