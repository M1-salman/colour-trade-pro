import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import CredentialsProvider from "next-auth/providers/credentials";
import { LoginSchema } from "./schemas/auth";
import { getUserByEmail } from "./data/user";
import bcrypt from "bcryptjs";

export const {
  handlers: { GET, POST },
  signIn,
  signOut,
  auth,
} = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        const validateFields = LoginSchema.safeParse(credentials);

        if (validateFields.success) {
          const { email, password } = validateFields.data;

          const user = await getUserByEmail(email);
          if (!user || !user.password) return null;

          const passwordMatch = await bcrypt.compare(password, user.password);

          if (passwordMatch) return user;
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Add isAdmin to token when user signs in
      if (user && "isAdmin" in user) {
        token.isAdmin = user.isAdmin;
      }

      // Handle session updates
      if (trigger === "update" && session?.image) {
        token.picture = session?.image;
      }

      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          image: token.picture ?? null,
          id: typeof token.sub === "string" ? token.sub : "",
          isAdmin: typeof token.isAdmin === "boolean" ? token.isAdmin : false, // Add isAdmin to session with fallback
        },
      };
    },
  },
  pages: {
    signIn: "/auth/login",
  },
});
