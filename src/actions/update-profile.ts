"use server";

import { db } from "@/lib/db";
import { getUserByEmail } from "@/data/user";

export const updateUserImage = async (email: string, imageUrl: string) => {
  try {
    // Verify user exists
    const existingUser = await getUserByEmail(email);
    if (!existingUser) {
      return { error: "User not found" };
    }

    // Update user image in database
    await db.user.update({
      where: { email: email },
      data: { image: imageUrl },
    });

    return { success: "Profile image updated successfully" };
  } catch (error) {
    console.error("Error updating user image:", error);
    return { error: "Failed to update profile image" };
  }
};
