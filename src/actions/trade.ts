"use server";

import { db } from "@/lib/db";

export const getWallet = async (userId: string) => {
  try {
    const wallet = await db.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      return { error: "Wallet not found." };
    }
    return {
      balance: wallet.balance,
    };
  } catch (error) {
    console.error("Fetch wallet/deposits error:", error);
    return { error: "Failed to fetch wallet data." };
  }
};
