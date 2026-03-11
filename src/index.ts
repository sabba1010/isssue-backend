import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import { dbConnect } from "./db/connect";
import router from "./routes";
import path from "path";
import { ApiError } from "./utils/try-catch";
import { UserType } from "./db/schema/user.schema";
import http from "http";
import cors from "cors";
import { SocketInitialze } from "./socket";

declare module "express" {
  interface Request {
    user?: UserType;
  }
}

const app = express();
const server = http.createServer(app);
SocketInitialze(server);
const PORT = process.env.PORT || 5000;
console.log("Allowed Origins:", process.env.FRONTEND_URL);

// Middleware
app.set("trust proxy", true);
app.use((req, res, next) => {
  const blockedIPs = process.env.BLOCKED_IPS?.split(",");
  const userAgent = req.get("User-Agent") || "";
  const origin = req.get("Origin") || req.get("Referer");
  const allowedOrigins = process.env.FRONTEND_URL?.split(",");
  if (/curl/i.test(userAgent)) {
    res.status(400).json({ message: "Something wen wrong" });
    return;
  }
  if (blockedIPs?.some((ip) => ip === req.ip)) {
    res.status(200).json({ message: "Something went wrong" });
    return;
  }
/*
  if (
    !origin &&
    !allowedOrigins?.length &&
    !allowedOrigins?.some((o) => origin?.startsWith(o))
  ) {
    res.status(200).json({ message: "Something went wrong" });
    return;
  }
*/
  return next();
});
app.use(cors({ origin: process.env.FRONTEND_URL?.split(",") }));
app.use(express.json());

app.use("/", router);

app.use("/public", express.static(path.join(__dirname, "../uploads")));

app.use((err: ApiError, _req: Request, res: Response, next: NextFunction) => {
  res.json({ error: err.message, status: err?.status || 500 });
  next();
});
// Routes
app.get("/", (req: Request, res: Response) => {
  res.send("Hello, TypeScript with Express!");
});

// Start Server
server.listen(PORT, () => {
  dbConnect();
  // eslint-disable-next-line no-console
  console.log(`Server is running on http://localhost:${PORT}`);
});
