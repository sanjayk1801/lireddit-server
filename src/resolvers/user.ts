import { Context } from "../types/Context";
import { Resolver, Ctx, Arg, Mutation, Query } from "type-graphql";
import { User } from "../entities/User";
import argon2 from "argon2";
import { COOKIE_NAME, FORGOT_PASSWORD_PREFIX } from "../constants";
import { validateUsernameAndEmail } from "../utils/validateUsernameAndEmail";
import {v4} from 'uuid';
import { sendEmail } from "../utils/sendEmail";
import { UserLoginInput } from "../types/graphql/UserLoginInput";
import { UserResponse } from "../types/graphql/UserResponse";
import { UserRegisterInput } from "../types/graphql/UserRegisterInput";


@Resolver(User)
export class UserResolver {

    @Query(() => User, {nullable: true})
    async me(
        @Ctx() {em, req}: Context){
        const userId = req.session.userId;
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
        @Arg("options") options: UserRegisterInput,
        @Ctx() {em, req}: Context
    ): Promise<UserResponse> { 
        const hashedPassword = await argon2.hash(options.password);
        const errors = validateUsernameAndEmail(options.username, options.email);
        if(errors){
            return { errors }            
        }
        
        const user = em.create(User, {username: options.username, email:options.email, password: hashedPassword});
        try {
            await em.persistAndFlush(user);
        } catch (err) {
            console.log(err);
            if(err.code === '23505' && err.detail.includes("username")){
                return {
                    errors: [{
                        field: 'username', 
                        message: 'username already exist'}
                    ]
                }
            }
            if(err.code === '23505' && err.detail.includes("email")){
                return {
                    errors: [{
                        field: 'email', 
                        message: 'email already exist'}
                    ]
                }
            }
        }
        req.session.userId = user.id;
        return { user }   
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg("options") options: UserLoginInput,
        @Ctx() {em, req} : Context
    ): Promise<UserResponse>{
        // find by username or email
        const user = await em.findOne(User, 
            options.usernameOrEmail.includes("@")? 
            {email: options.usernameOrEmail}:
            {username: options.usernameOrEmail});
        if (!user){
            return {
                errors: [{
                    field: 'usernameOrEmail', 
                    message: 'provided username or email doesnot exist'}
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


    @Mutation(() => Boolean)
    async forgotPassword(
        @Arg("email") email: string ,
        @Ctx() {redis, em} : Context
    ): Promise<Boolean>{
        const token = v4();  
        const user = await em.findOne(User, {email})
        if (!user){
            return true;
        }
        const email_text = `<a href="http://localhost:3000/chnage-password/${token}">reset password</a>`
        sendEmail(user.email, "reset your password", email_text)
        await redis.set(FORGOT_PASSWORD_PREFIX + token, user.id)
        return true   
    }


    @Mutation(() => UserResponse)
    async changePassword(
        @Arg("newPassword") newPassword: string ,
        @Arg("token") token: string ,
        @Ctx() {redis, em, req} : Context
    ): Promise<UserResponse>{
        const userId = await redis.get(FORGOT_PASSWORD_PREFIX+token)
        if (!userId){
            return { errors: [{field: "token", message: "invalid or expired token" }]};
        }
        const user = await em.findOne(User, {id:parseInt(userId)});
        if (!user){
            return {errors: [{ field: "token", message: "user doesn't exist in the DB" }]}
        }
        user.password =  await argon2.hash(newPassword);
        em.persistAndFlush(user);
        req.session.userId = user.id;
        return { user } 
          
    }
}
