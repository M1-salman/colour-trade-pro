import NextAuth from "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isAdmin: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    isAdmin: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    isAdmin?: boolean;
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    isAdmin: boolean;
  }
}