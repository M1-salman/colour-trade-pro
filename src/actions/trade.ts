"use server";

import { db } from "@/lib/db";
import {
  TradeColor,
  TradeResult,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

export const getWallet = async (userId: string) => {
  try {
    const wallet = await db.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      return { error: "Wallet not found." };
    }
    return {
      balance: wallet.balance,
    };
  } catch {
    return { error: "Failed to fetch wallet data." };
  }
};

// Place a trade bet
export const placeTrade = async (
  userId: string,
  color: string,
  number: number,
  amount: number
) => {
  try {
    // Validate input
    if (!["red", "violet", "green"].includes(color)) {
      return { error: "Invalid color selection." };
    }

    if (number < 0 || number > 9) {
      return { error: "Invalid number selection." };
    }

    if (amount <= 0) {
      return { error: "Invalid bet amount." };
    }

    // Check if user exists and has a wallet
    const userWithWallet = await db.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!userWithWallet || !userWithWallet.wallet) {
      return { error: "User or wallet not found." };
    }

    // Check if user has sufficient balance
    if (userWithWallet.wallet.balance < amount) {
      return { error: "Insufficient balance." };
    }

    // Check if user already has an unresolved trade
    const currentTime = new Date();
    const roundStartTime = new Date(
      Math.floor(currentTime.getTime() / 60000) * 60000
    );

    const existingTrade = await db.trade.findFirst({
      where: {
        userId,
        createdAt: {
          gte: roundStartTime,
        },
        result: TradeResult.PENDING, // Only check for unresolved trades
      },
    });

    if (existingTrade) {
      return { error: "You already have a bet for this round." };
    }

    // Start transaction
    await db.$transaction(async (tx) => {
      // Deduct amount from wallet
      await tx.wallet.update({
        where: { userId },
        data: { balance: { decrement: amount } },
      });

      // Create trade record
      const trade = await tx.trade.create({
        data: {
          userId,
          color: color.toUpperCase() as TradeColor,
          number,
          amount,
          result: TradeResult.PENDING, // Temporary, will be updated when round ends
        },
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId,
          walletId: userWithWallet.wallet!.id,
          type: TransactionType.LOSS, // Temporary, will be updated based on result
          amount: -amount,
          description: `Bet placed: ${color} ${number}`,
          status: TransactionStatus.PENDING,
        },
      });

      return trade;
    });

    return { success: "Bet placed successfully!" };
  } catch  {
    return { error: "Failed to place bet. Please try again." };
  }
};

// Generate result based on house edge logic
const generateResult = (trades: any[]) => {
  // Calculate total bets for each color and number
  const colorBets = { RED: 0, VIOLET: 0, GREEN: 0 };
  const numberBets: { [key: number]: number } = {};
  let totalBetAmount = 0;

  // Initialize number bets
  for (let i = 0; i <= 9; i++) {
    numberBets[i] = 0;
  }

  // Calculate bet distributions
  trades.forEach((trade) => {
    colorBets[trade.color as keyof typeof colorBets] += trade.amount;
    numberBets[trade.number] += trade.amount;
    totalBetAmount += trade.amount;
  });

  // Find the option with least bets (house edge logic)
  const leastBetColor = Object.entries(colorBets).reduce((a, b) =>
    a[1] < b[1] ? a : b
  )[0] as TradeColor;

  const leastBetNumber = Object.entries(numberBets).reduce((a, b) =>
    a[1] < b[1] ? a : b
  )[0];

  // 70% chance to pick least bet option (house edge)
  // 30% chance for random result
  const shouldUseHouseEdge = Math.random() < 0.7;

  let resultColor: TradeColor;
  let resultNumber: number;

  if (shouldUseHouseEdge && totalBetAmount > 0) {
    // Use house edge logic
    resultColor = leastBetColor;
    resultNumber = parseInt(leastBetNumber);
  } else {
    // Random result
    const colors: TradeColor[] = ["RED", "VIOLET", "GREEN"];
    resultColor = colors[Math.floor(Math.random() * colors.length)];
    resultNumber = Math.floor(Math.random() * 10);
  }

  return { color: resultColor, number: resultNumber };
};

// Process round results
export const processRoundResults = async () => {
  try {
    const currentTime = new Date();
    const roundStartTime = new Date(
      Math.floor(currentTime.getTime() / 60000) * 60000
    );
    const roundEndTime = new Date(roundStartTime.getTime() + 60000);

    // Get all pending trades for current round
    const pendingTrades = await db.trade.findMany({
      where: {
        createdAt: {
          gte: roundStartTime,
          lt: roundEndTime,
        },
        result: TradeResult.PENDING, // These are pending trades
      },
      include: {
        user: {
          include: {
            wallet: true,
          },
        },
      },
    });

    if (pendingTrades.length === 0) {
      return { success: "No trades to process." };
    }

    // Generate result
    const result = generateResult(pendingTrades);

    // Process each trade
    const results = await db.$transaction(async (tx) => {
      const processedTrades = [];

      for (const trade of pendingTrades) {
        const isWinner =
          trade.color === result.color && trade.number === result.number;

        let winAmount = 0;
        let newBalance = trade.user.wallet!.balance;

        if (isWinner) {
          // Calculate win amount
          if (trade.color === result.color && trade.number === result.number) {
            // Only color matches - 2x multiplier
            winAmount = trade.amount * 2;
          }

          // Update wallet balance
          newBalance += winAmount;
          await tx.wallet.update({
            where: { userId: trade.userId },
            data: { balance: newBalance },
          });

          // Update trade result
          await tx.trade.update({
            where: { id: trade.id },
            data: { result: TradeResult.WIN },
          });

          // Update the original bet transaction
          await tx.transaction.updateMany({
            where: {
              userId: trade.userId,
              description: `Bet placed: ${trade.color.toLowerCase()} ${
                trade.number
              }`,
              status: TransactionStatus.PENDING,
            },
            data: {
              type: TransactionType.WIN,
              amount: winAmount,
              description: `Win: ${result.color} ${result.number}`,
              status: TransactionStatus.COMPLETED,
            },
          });
        } else {
          // Update trade result as loss
          await tx.trade.update({
            where: { id: trade.id },
            data: { result: TradeResult.LOSS },
          });

          // Update the original bet transaction
          await tx.transaction.updateMany({
            where: {
              userId: trade.userId,
              description: `Bet placed: ${trade.color.toLowerCase()} ${
                trade.number
              }`,
              status: TransactionStatus.PENDING,
            },
            data: {
              status: TransactionStatus.COMPLETED,
            },
          });
        }

        processedTrades.push({
          userId: trade.userId,
          isWinner,
          winAmount,
          betAmount: trade.amount,
          newBalance,
        });
      }

      return processedTrades;
    });

    return {
      success: "Round processed successfully!",
      result,
      trades: results,
    };
  } catch {
    return { error: "Failed to process round results." };
  }
};

export async function getUserTrades(userId: string) {
  try {
    if (!userId) {
      return { error: "User ID is required" };
    }

    // Fetch user trades from database
    const trades = await db.trade.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: "desc", // Most recent first
      },
      select: {
        id: true,
        color: true,
        number: true,
        amount: true,
        result: true,
        createdAt: true,
      },
    });

    // Transform the data to match the expected format
    const formattedTrades = trades.map((trade) => ({
      id: trade.id,
      color: trade.color as "RED" | "VIOLET" | "GREEN",
      number: trade.number,
      amount: trade.amount,
      result: trade.result as "WIN" | "LOSS" | "PENDING" | "CANCELLED",
      createdAt: trade.createdAt.toISOString(),
    }));

    revalidatePath("/trade-history");

    return {
      success: "Trade history fetched successfully",
      trades: formattedTrades,
    };
  } catch (error) {
    console.error("Error fetching trade history:", error);
    return {
      error: "Failed to fetch trade history. Please try again.",
    };
  }
}
