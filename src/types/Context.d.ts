import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { Request, Response } from "express";
import { Redis } from "ioredis";

export type Context  = {
    req: Request;
    res: Response;
    redis: Redis;
}
