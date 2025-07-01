"use server";

import { db } from "@/lib/db";
import { BankAccountSchema } from "@/schemas/user";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export const getBankAccount = async (userId: string) => {
  try {
    const account = await db.bankAccount.findUnique({ where: { userId } });
    if (!account) return null;
    return account;
  } catch (error) {
    return null;
  }
};

export const createBankAccount = async (
  userId: string,
  values: z.infer<typeof BankAccountSchema>
) => {
  const validatedFields = BankAccountSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: "Invalid fields 😞" };
  }

  const { accountHolder, accountNumber, bankName, ifscCode } =
    validatedFields.data;

  try {
    // Only allow one account per user
    const existing = await db.bankAccount.findUnique({ where: { userId } });
    if (existing) {
      return { error: "You already have a bank account!" };
    }
    await db.bankAccount.create({
      data: {
        userId,
        accountHolder,
        accountNumber,
        bankName,
        ifscCode,
      },
    });
    revalidatePath("/bank-account");
    return { success: "Bank account added successfully!" };
  } catch (error) {
    return { error: "Failed to add bank account!" };
  }
};

export const deleteBankAccount = async (userId: string) => {
  try {
    await db.bankAccount.delete({ where: { userId } });
    revalidatePath("/bank-account");
    return { success: "Bank account deleted successfully!" };
  } catch (error) {
    return { error: "Failed to delete bank account!" };
  }
};
