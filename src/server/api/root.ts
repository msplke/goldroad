import { creatorRouter } from "~/server/api/routers/creator";
import { paystackRouter } from "~/server/api/routers/paystack";
import { planRouter } from "~/server/api/routers/plan";
import { publicationRouter } from "~/server/api/routers/publication";
import { subscriberRouter } from "~/server/api/routers/subscriber";
import { userRouter } from "~/server/api/routers/user";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  creator: creatorRouter,
  paystack: paystackRouter,
  plan: planRouter,
  publication: publicationRouter,
  user: userRouter,
  subscriber: subscriberRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
