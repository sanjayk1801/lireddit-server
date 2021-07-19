import { Context } from "../types/Context";
import { Resolver, Ctx, Arg, Mutation, Field, ObjectType, InputType, Query } from "type-graphql";
import { User } from "../entities/User";
import argon2 from "argon2";
import { resolve } from "path/posix";
import { COOKIE_NAME } from "src/constants";

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

    @Query(() => User, {nullable: true})
    async me(
        @Ctx() {em, req}: Context){
        // console.log("me": req.session)
        const userId = req.session.userId;
        console.log(userId);
        // not logged in
        if (!userId){
            return null
        }
        // getting current user details
        const user = await em.findOne(User, {id: userId})
        return user
    }
    
    @Mutation(() => UserResponse)
    async register(
        @Arg("options") options: UserInput,
        @Ctx() {em, req}: Context
    ): Promise<UserResponse> { 
        const hashedPassword = await argon2.hash(options.password);
        const user = em.create(User, {username: options.username, password: hashedPassword});
        try {
            await em.persistAndFlush(user);
        } catch (err) {
            if(err.code === '23505'){
                return {
                    errors: [{
                        field: 'username', 
                        message: 'username already exist'}
                    ]
                }
            }
        }
        req.session.userId = user.id;
        return { user }   
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg("options") options: UserInput,
        @Ctx() {em, req} : Context
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
        const isPasswordValid = await argon2.verify(user.password, options.password)
        if(!isPasswordValid){
            return {
                errors: [{
                    field: 'password', 
                    message: 'incorrect password'}
                ]
            }
        }

        req.session.userId = user.id;
        console.log(req.session);
        
        return { user }  
    }

    @Mutation(() => Boolean)
    async logout(
         @Ctx() {req, res} : Context
    ): Promise<Boolean>{
        res.clearCookie(COOKIE_NAME);
        return new Promise(resolve => req.session.destroy(err => {
            if(err) {
                resolve(false)
                return
            }
            resolve(true)
        }) ) 
    }


}
