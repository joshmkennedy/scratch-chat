/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as http from "../http.js";
import type * as inviteCodes from "../inviteCodes.js";
import type * as linkPreviews from "../linkPreviews.js";
import type * as messages from "../messages.js";
import type * as node_notifications from "../node_notifications.js";
import type * as notifications from "../notifications.js";
import type * as presence from "../presence.js";
import type * as reactions from "../reactions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  http: typeof http;
  inviteCodes: typeof inviteCodes;
  linkPreviews: typeof linkPreviews;
  messages: typeof messages;
  node_notifications: typeof node_notifications;
  notifications: typeof notifications;
  presence: typeof presence;
  reactions: typeof reactions;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
