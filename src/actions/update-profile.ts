"use server";

import { db } from "@/lib/db";
import { getUserByEmail } from "@/data/user";
import { revalidatePath } from "next/cache";

export const updateUserImage = async (email: string, imageUrl: string) => {
  try {
    // Verify user exists
    const existingUser = await getUserByEmail(email);
    if (!existingUser) {
      return { error: "User not found" };
    }

    // Update user image in database
    const updatedUser = await db.user.update({
      where: { email: email },
      data: { image: imageUrl },
    });

    // Revalidate any paths that might show user data
    revalidatePath('/profile');

    return { 
      success: "Profile image updated successfully",
      user: updatedUser // Return updated user data
    };
  } catch (error) {
    console.error("Error updating user image:", error);
    return { error: "Failed to update profile image" };
  }
};