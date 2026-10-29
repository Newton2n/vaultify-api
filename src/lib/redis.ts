import { Redis } from "@upstash/redis";

import config from "../config";

export const redis = new Redis({
	url: config.upstash_redis_rest_url as string,
	token: config.upstash_redis_rest_token as string,
});