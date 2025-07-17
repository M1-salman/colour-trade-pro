"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { TransactionType, TransactionStatus } from "@prisma/client";

export const createDeposit = async (userId: string, amount: number) => {
  if (amount <= 0 || amount > 10000) {
    return { error: "Amount must be between 0 and 10,000 rupees." };
  }
  try {
    // Get user's wallet
    let wallet = await db.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      const newWallet = await db.wallet.create({
        data: {
          userId,
          balance: 0,
        },
      });

      wallet = newWallet;
    }

    if (wallet.isBlocked) {
      return { error: "Wallet is blocked. Cannot deposit." };
    }
    
    // Create transaction (pending)
    // Use a Prisma transaction to ensure atomicity
    const result = await db.$transaction(async (prisma) => {
      // 1. Create the transaction (pending)
      const transaction = await prisma.transaction.create({
        data: {
          userId,
          walletId: wallet.id,
          type: TransactionType.DEPOSIT,
          amount,
          status: TransactionStatus.PENDING,
          description: `Deposit of ₹${amount}`,
        },
      });

      // 2. Update wallet balance
      const updatedWallet = await prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      });

      // 3. Mark transaction as completed
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: TransactionStatus.COMPLETED },
      });
    });
    revalidatePath("/wallet");
    return { success: `₹${amount} deposited successfully!` };
  } catch (error) {
    console.error("Deposit error:", error);
    return { error: "Failed to deposit money. Please try again." };
  }
};

export const getWalletAndDeposits = async (userId: string) => {
  try {
    const wallet = await db.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      return { error: "Wallet not found." };
    }
    const transactions = await db.transaction.findMany({
      where: {
        userId,
        type: TransactionType.DEPOSIT,
      },
      orderBy: { createdAt: "desc" },
    });
    return {
      balance: wallet.balance,
      transactions,
    };
  } catch (error) {
    console.error("Fetch wallet/deposits error:", error);
    return { error: "Failed to fetch wallet data." };
  }
};
