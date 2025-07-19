"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getAllUsersWithWallets() {
  try {
    const session = await auth();
    
    if (!session || !session.user || !session.user.isAdmin ) {
      throw new Error("Unauthorized: Admin access required");
    }

    const users = await db.user.findMany({
      include: {
        wallet: {
          select: {
            id: true,
            balance: true,
            isBlocked: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return users;
  } catch {
    throw new Error("Failed to fetch users");
  }
}

export async function blockWallet(walletId: string) {
  try {
    const session = await auth();
    
    if (!session || !session.user || !session.user.isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    // First, get the current wallet status
    const currentWallet = await db.wallet.findUnique({
      where: { id: walletId },
      select: { isBlocked: true },
    });

    if (!currentWallet) {
      throw new Error("Wallet not found");
    }

    // Toggle the isBlocked status
    const updatedWallet = await db.wallet.update({
      where: { id: walletId },
      data: { isBlocked: !currentWallet.isBlocked },
    });

    revalidatePath("/admin");
    return updatedWallet;
  } catch (error) {
    console.error("Error blocking/unblocking wallet:", error);
    throw new Error("Failed to update wallet status");
  }
}