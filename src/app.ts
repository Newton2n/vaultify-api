import cookieParser from "cookie-parser";
import express, { Application } from "express";
import cors from "cors";
import authRoute from "./modules/auth/auth.route";
import vaultEntryRoute from "./modules/vault-entry/vault.entry.route";
import globalError from "./middleware/global-error";
import { userRoutes } from "./modules/user/user.route";
import rateLimiter from "./middleware/rate-limiter";
import notFound from "./middleware/not-found";

const app: Application = express();

// vercel proxy trust
app.set("trust proxy", 1);

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(rateLimiter);

app.use("/api/v1/auth", authRoute);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/vault", vaultEntryRoute);


app.use(globalError);
app.use(notFound);

export default app;
