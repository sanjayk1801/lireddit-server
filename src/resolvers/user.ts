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
        @Ctx() {req}: Context){
        const userId = req.session.userId;
        // not logged in
        if (!userId){
            return null
        }
        // getting current user details
        const user = await User.findOne(userId)
        return user
    }
    
    @Mutation(() => UserResponse)
    async register(
        @Arg("options") options: UserRegisterInput,
        @Ctx() {req}: Context
    ): Promise<UserResponse> { 
        const hashedPassword = await argon2.hash(options.password);
        const errors = validateUsernameAndEmail(options.username, options.email);
        if(errors){
            return { errors }            
        }
        
        const user =  User.create({
            username: options.username, 
            email:options.email, 
            password: hashedPassword
        });
        try {
            await user.save();
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
        @Ctx() {req} : Context
    ): Promise<UserResponse>{
        // find by username or email
        const user = await User.findOne(
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
        
        return new Promise((resolve) => {
            req.session.destroy(err => {
                if(err){
                    resolve(false);
                    return;
                }
                resolve(true)
            })
        })
        
    }


    @Mutation(() => Boolean)
    async forgotPassword(
        @Arg("email") email: string ,
        @Ctx() {redis} : Context
    ): Promise<Boolean>{
        const token = v4();  
        const user = await User.findOne({email})
        if (!user){
            return false;
        }
        const email_text = `<a href="http://localhost:3000/change-password/${token}">reset password</a>`
        await sendEmail(user.email, "reset your password", email_text)
        await redis.set(FORGOT_PASSWORD_PREFIX + token, user.id, 'ex', 1000 * 60 * 60 * 24)
        return true   
    }


    @Mutation(() => UserResponse)
    async changePassword(
        @Arg("newPassword") newPassword: string ,
        @Arg("token") token: string ,
        @Ctx() {redis, req} : Context
    ): Promise<UserResponse>{
        const userId = await redis.get(FORGOT_PASSWORD_PREFIX+token)
        if (!userId){
            return { errors: [{field: "token", message: "invalid or expired token" }]};
        }
        const user = await User.findOne(userId);
        if (!user){
            return {errors: [{ field: "token", message: "user doesn't exist in the DB" }]}
        }
        user.password =  await argon2.hash(newPassword);
        user.save();
        req.session.userId = user.id;
        
        redis.del(FORGOT_PASSWORD_PREFIX+token);

        return { user } 
          
    }
}
