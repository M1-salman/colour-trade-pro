import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string | undefined ;
      isAdmin: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    isAdmin: boolean | null;
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