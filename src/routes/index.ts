import { Router } from "express";
import userRouter from "./user.route";
import imageRouter from "./images.route";
import videoRouter from "./video.route";
import audioRouter from "./audio.routes";
import gifRouter from "./gif.routes";
import { chatRouter } from "./chat.routes";
import adminRouter from "./admin.route";
import uploadRouter from "./upload.route";


const routes = [
  {
    route: userRouter,
    path: "/users",
  },
  {
    route: imageRouter,
    path: "/images",
  },
  {
    route: videoRouter,
    path: "/videos",
  },
  {
    route: audioRouter,
    path: "/music",
  },
  {
    route: gifRouter,
    path: "/gif",
  },
  {
    route: chatRouter,
    path: "/chat",
  },
  {
    route: adminRouter,
    path: "/admin",
  },
  {
    route: uploadRouter,
    path: "/upload",
  },
];

const router = Router();

routes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
