import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";

@ObjectType()
@Entity()
export class User {
    @Field()
    @PrimaryKey()
    id!: number;

    @Field()
    @Property({type: 'text', unique: true})
    username!: string;

    @Property({type: 'text'})
    password!: string;

    @Field()
    @Property({type: 'date'})
    createdAt: Date = new Date();

    @Field()
    @Property({ type: 'date', onUpdate: () => new Date() })
    updatedAt: Date = new Date();
}