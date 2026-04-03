import {
  convexAuth,
  createAccount,
  retrieveAccount,
} from "@convex-dev/auth/server";
import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import { Scrypt } from "lucia";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    ConvexCredentials({
      id: "credentials",
      authorize: async (credentials, ctx) => {
        const username = credentials.username as string | undefined;
        const password = credentials.password as string | undefined;
        const flow = credentials.flow as string | undefined;

        if (!username || !password) {
          throw new Error("Username and password are required");
        }
        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters");
        }

        if (flow === "signUp") {
          const { user } = await createAccount(ctx, {
            provider: "credentials",
            account: { id: username, secret: password },
            profile: { name: username },
          });
          return { userId: user._id };
        }

        // signIn
        const { user } = await retrieveAccount(ctx, {
          provider: "credentials",
          account: { id: username, secret: password },
        });
        return { userId: user._id };
      },
      crypto: {
        async hashSecret(password: string) {
          return await new Scrypt().hash(password);
        },
        async verifySecret(password: string, hash: string) {
          return await new Scrypt().verify(hash, password);
        },
      },
    }),
  ],
});
