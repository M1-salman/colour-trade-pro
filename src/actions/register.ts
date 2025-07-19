// Actions must be use server
"use server";
import { z } from "zod";
import { RegisterSchema } from "@/schemas/auth";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getUserByEmail } from "@/data/user";

export const register = async (values: z.infer<typeof RegisterSchema>) => {
  // Validate fields
  const validatedFields = RegisterSchema.safeParse(values);

  // If fields are not valid
  if (!validatedFields.success) {
    return { error: "Invalid fields 😞" };
  }

  const { name, email, password } = validatedFields.data;
  const hashedPassword = await bcrypt.hash(password, 10);

  const existingUser = await getUserByEmail(email);

  // display text if email is taken
  if (existingUser) {
    return { error: "Email already taken 😞" };
  }

  try {
    await db.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });

      await tx.wallet.create({
        data: {
          userId: createdUser.id,
          balance: 0,
        },
      });
    });
    // If fields are valid
    return { success: "User created successfully!" };
  } catch {
    return { error: "Failed to register user. Please try again." };
  }
};
