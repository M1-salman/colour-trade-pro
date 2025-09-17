// Actions must be use server
"use server";

import { z } from "zod";
import { AuthError } from "next-auth";

import { signIn } from "@/auth";
import { LoginSchema } from "@/schemas/auth";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { getUserByEmail } from "@/data/user";
import { db } from "@/lib/db";

export const login = async (values: z.infer<typeof LoginSchema>) => {
  // Check if database is connected
  try {
      await db.$queryRaw`SELECT 1`;
    } catch (err) {
      return {
        error: "Database is paused, contact: salmanmasood917@gmail.com",
      };
    }

  // Validate fields
  const validatedFields = LoginSchema.safeParse(values);

  // If fields are not valid
  if (!validatedFields.success) {
    return { error: "Invalid fields 😞" };
  }

  const { email, password } = validatedFields.data;
  const exisitingUser = await getUserByEmail(email);

  if (!exisitingUser) {
    return { error: "Email does not exist" };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: DEFAULT_LOGIN_REDIRECT,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials!" };
        default:
          return { error: "Something went wrong!" };
      }
    }

    throw error;
  }
};
