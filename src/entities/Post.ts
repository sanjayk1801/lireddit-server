import { Field, ObjectType } from "type-graphql";
import { Entity, CreateDateColumn, Column, UpdateDateColumn, PrimaryGeneratedColumn, BaseEntity } from "typeorm"

@ObjectType()
@Entity()
export class Post extends BaseEntity{
    @Field()
    @PrimaryGeneratedColumn()
    id!: number;

    @Field()
    @CreateDateColumn()
    createdAt: Date;

    @Field()
    @UpdateDateColumn()
    updatedAt: Date ;

    @Field()
    @Column({nullable: true})
    title!: string;
}