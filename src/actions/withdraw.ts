"use server";

import { db } from "@/lib/db";
import { WithdrawalSchema } from "@/schemas/user";
import { TransactionStatus, WithdrawalStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export const getWalletAndWithdrawals = async (userId: string) => {
  try {
    // Get wallet balance
    const wallet = await db.wallet.findUnique({
      where: { userId },
    });

    // Get withdrawal history
    const withdrawals = await db.withdrawal.findMany({
      where: { userId },
      include: {
        bankAccount: {
          select: {
            bankName: true,
            accountNumber: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20, // Limit to recent 20 withdrawals
    });

    return {
      balance: wallet?.balance || 0,
      withdrawals: withdrawals.map((withdrawal) => ({
        id: withdrawal.id,
        amount: withdrawal.amount,
        status: withdrawal.status.toLowerCase(),
        createdAt: withdrawal.createdAt.toISOString(),
        bankName: withdrawal.bankAccount.bankName,
        accountNumber: withdrawal.bankAccount.accountNumber,
      })),
    };
  } catch (error) {
    console.error("Error fetching wallet and withdrawals:", error);
    return { error: "Failed to fetch wallet data" };
  }
};

export const getUserBankAccount = async (userId: string) => {
  try {
    const bankAccount = await db.bankAccount.findUnique({
      where: { userId },
      select: {
        id: true,
        bankName: true,
        accountNumber: true,
        accountHolder: true,
        isActive: true,
      },
    });

    return { bankAccount };
  } catch (error) {
    console.error("Error fetching bank account:", error);
    return { error: "Failed to fetch bank account" };
  }
};

export const createWithdrawal = async (userId: string, amount: number) => {
  const validatedFields = WithdrawalSchema.safeParse({
    amount,
  });

  if (!validatedFields.success) {
    return { error: "Invalid withdrawal data" };
  }

  try {
    // Check if user has sufficient balance
    const wallet = await db.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      return { error: "Wallet not found" };
    }

    if (wallet.isBlocked) {
      return { error: "Wallet is blocked. Cannot withdraw." };
    }

    if (wallet.balance < amount) {
      return { error: "Insufficient balance" };
    }

    if (amount < 1) {
      return { error: "Minimum withdrawal amount is ₹1" };
    }

    // Get user's bank account (only one allowed)
    const bankAccount = await db.bankAccount.findUnique({
      where: { userId },
    });

    if (!bankAccount || !bankAccount.isActive) {
      return {
        error: "No active bank account found. Please add a bank account first.",
      };
    }

    // Create withdrawal request and update wallet balance in a transaction
    await db.$transaction(async (tx) => {
      // 1. Create withdrawal record
      const withdrawal = await tx.withdrawal.create({
        data: {
          userId,
          bankAccountId: bankAccount.id,
          amount,
          status: "PENDING",
        },
      });

      // 2. Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId,
          walletId: wallet.id,
          type: "WITHDRAWAL",
          amount: -amount, // Negative for withdrawal
          description: `Withdrawal to ${bankAccount.bankName}`,
          status: "PENDING",
        },
      });

      // 3. Deduct amount from wallet
      await tx.wallet.update({
        where: { userId },
        data: {
          balance: {
            decrement: amount,
          },
        },
      });

      // 4. Mark transaction as completed
      await tx.transaction.update({
        where: { id: transaction.id },
        data: { status: TransactionStatus.COMPLETED },
      });

      // 5. Mark withdrawal as completed
      await tx.withdrawal.update({
        where: { id: withdrawal.id },
        data: { status: WithdrawalStatus.COMPLETED },
      });
    });

    revalidatePath("/withdraw");
    return { success: "Withdrawal request submitted successfully!" };
  } catch (error) {
    console.error("Error creating withdrawal:", error);
    return { error: "Failed to process withdrawal request" };
  }
};
