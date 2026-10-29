import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  database_url: process.env.DATABASE_URL,
  port: process.env.PORT || 5000,
  app_url : process.env.APP_URL,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS!,
  jwt_access_secret: process.env.JWT_ACCESS_SECRET!,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET!,
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN!,
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN!,
  upstash_redis_rest_url: process.env.UPSTASH_REDIS_REST_URL!,
  upstash_redis_rest_token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  smtp_user: process.env.SMTP_USER!,
  smtp_email_sender: process.env.SMTP_EMAIL_SENDER!,
  smtp_password: process.env.SMTP_PASSWORD!,
  
};