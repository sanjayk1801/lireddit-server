import "reflect-metadata";
import { COOKIE_NAME, __prod__ } from "./constants";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import { Context } from "./types/Context";
import cors from "cors";
import { createConnection } from "typeorm";
import { User } from "./entities/User";
import { Post } from "./entities/Post";

const main = async () => {
  await createConnection({
    type: "postgres",
    database: "myredditdb",
    username: 'admin',
    password: '1801',
    logging: true,
    synchronize: true,
    entities: [ User, Post]
  });

  const RedisStore = connectRedis(session);
  const redis = new Redis();

  const app = express();
//http://localhost:3000
  app.use(
    cors({
      origin:[ "http://localhost:3000", "https://studio.apollographql.com"],
      credentials: true,
    })
  );

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redis,
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
        sameSite: "lax",
        secure: false,
      },
      
      saveUninitialized: false,
      secret: "ksfkkj131nkk1214133124k1kk1221",
      resave: false,
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }): Context => ({ req, res , redis}),
  });
  await apolloServer.start();
  apolloServer.applyMiddleware({ app , cors: false});

  app.listen(4000, () => {
    console.log("app started at port 4000");
  });
};

main().catch((err) => {
  console.error(err);
});
