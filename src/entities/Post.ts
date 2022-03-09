import { Field, ObjectType } from "type-graphql";
import {
	Entity,
	CreateDateColumn,
	Column,
	UpdateDateColumn,
	PrimaryGeneratedColumn,
	BaseEntity,
	ManyToOne,
	ManyToMany,
	JoinTable,
} from "typeorm";
import { Topic } from "./Topic";
import { User } from "./User";

@ObjectType()
@Entity()
export class Post extends BaseEntity {
	@Field()
	@PrimaryGeneratedColumn()
	id!: number;

	@Field()
	@CreateDateColumn()
	createdAt: Date;

	@Field()
	@UpdateDateColumn()
	updatedAt: Date;

	@Field()
	@Column({ nullable: true })
	title!: string;

	@Field()
	@Column({ nullable: true })
	body: string;

	@Field()
	@Column({ default: 0 })
	likes: number	

	@Field()
	@ManyToOne(() => User, (user) => user.posts, { nullable: false })
	user: User;

	@Field(() => [Topic])
	@ManyToMany(() => Topic)
	@JoinTable()
	topic: Topic[];
}
