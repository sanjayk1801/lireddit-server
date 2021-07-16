import { MyContext } from "../types";
import { Resolver, Ctx, Arg, Mutation, Field, ObjectType, InputType } from "type-graphql";
import { User } from "../entities/User";
import argon2 from "argon2";

@InputType()
class UserInput{
    
    @Field()
    username: string;
    
    @Field()
    password: string;
}

@ObjectType()
class FieldError{
    
    @Field()
    field: string;
    
    @Field()
    message: string
}

@ObjectType()
class UserResponse{
    @Field(() => [FieldError], {nullable: true})
    errors?: FieldError[];

    @Field(() => User, {nullable: true})
    user?: User;
}

@Resolver(User)
export class UserResolver {
    @Mutation(() => User)
    async register(
        @Arg("options") options: UserInput,
        @Ctx() {em}: MyContext
    ): Promise<UserResponse> { 
        const hashedPassword = await argon2.hash(options.password);
        const user = em.create(User, {username: options.username, password: hashedPassword});
        try {
            em.persistAndFlush(user);
        } catch (err) {
            if(err.code == '23505'){
                return {
                    errors: [{
                        field: 'username', 
                        message: 'username already exist'}
                    ]
                }
            }
        }
        return { user }   
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg("options") options: UserInput,
        @Ctx() {em}: MyContext
    ): Promise<UserResponse>{
        const user = await em.findOne(User, {username: options.username})
        if (!user){
            return {
                errors: [{
                    field: 'username', 
                    message: 'username doesnot exist'}
                ]
            }
        }
        const isPasswordValid = argon2.verify(user.password, options.password)
        if(!isPasswordValid){
            return {
                errors: [{
                    field: 'password', 
                    message: 'incorrect password'}
                ]
            }
        }
        return { user }  
    }
}
