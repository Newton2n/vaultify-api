import cookieParser from "cookie-parser";
import express, { Application } from "express";
import cors from "cors";
import authRoute from "./modules/auth/auth.route";
import vaultEntryRoute from "./modules/vault-entry/vault.entry.route";
import globalError from "./middleware/global-error";
import { userRoutes } from "./modules/user/user.route";

const app: Application = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/v1/auth", authRoute);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/vault", vaultEntryRoute);


app.use(globalError);

export default app;
