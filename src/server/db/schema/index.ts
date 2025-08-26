import * as appSchema from "~/server/db/schema/app-schema";
import * as authSchema from "~/server/db/schema/auth-schema";

export default {
  ...appSchema,
  ...authSchema,
};
