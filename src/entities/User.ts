import { Field, ObjectType } from "type-graphql";
import {
	Entity,
	CreateDateColumn,
	Column,
	UpdateDateColumn,
	PrimaryGeneratedColumn,
	BaseEntity,
	OneToMany,
	ManyToMany,
	JoinTable,
} from "typeorm";
import { Post } from "./Post";
import { Topic } from "./Topic";

@ObjectType()
@Entity()
export class User extends BaseEntity {
	@Field()
	@PrimaryGeneratedColumn()
	id!: number;

	@Field()
	@Column({ unique: true })
	username!: string;

	@Column()
	password!: string;

	@Field()
	@Column({ unique: true })
	email!: string;

	@Field()
	@CreateDateColumn()
	createdAt: Date;

	@Field()
	@UpdateDateColumn()
	updatedAt: Date;

	@Field(() => [Post])
	@OneToMany(() => Post, (post) => post.user)
	posts: Post[];

	@Field(() => [Post])
	@ManyToMany(() => Post, { cascade: true })
	@JoinTable()
	bookmarked_posts: Post[];

	@Field(() => [Post])
	@ManyToMany(() => Post, { cascade: true })
	@JoinTable()
	liked_posts: Post[];

	@Field(() => [User])
	@ManyToMany(() => User)
	@JoinTable()
	following: User[];

	@Field(() => [Topic])
	@ManyToMany(() => Topic)
	@JoinTable()
	topics: Topic[];
}
