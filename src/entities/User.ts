import { Field, ObjectType } from "type-graphql";
import { Entity, CreateDateColumn, Column, UpdateDateColumn, PrimaryGeneratedColumn, BaseEntity } from "typeorm"

@ObjectType()
@Entity()
export class User extends BaseEntity{
    @Field()
    @PrimaryGeneratedColumn()
    id!: number;

    @Field()
    @Column({unique: true})
    username!: string;

    @Column()
    password!: string;

    
    @Field()
    @Column({unique: true})
    email!: string;

    @Field()
    @CreateDateColumn()
    createdAt: Date;

    @Field()
    @UpdateDateColumn()
    updatedAt: Date;
}