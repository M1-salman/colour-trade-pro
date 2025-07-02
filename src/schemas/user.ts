import { z } from "zod";

export const BankAccountSchema = z.object({
  accountHolder: z
    .string()
    .min(2, { message: "Account holder name is required" })
    .max(50, { message: "Account holder name is too long" }),
  accountNumber: z
    .string()
    .min(8, { message: "Account number must be at least 8 digits" })
    .max(20, { message: "Account number is too long" })
    .regex(/^\d+$/, { message: "Account number must be numeric" }),
  bankName: z
    .string()
    .min(2, { message: "Bank name is required" })
    .max(50, { message: "Bank name is too long" }),
  ifscCode: z
    .string()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/i, { message: "Invalid IFSC code format" }),
});

export const WalletDepositSchema = z.object({
  amount: z
    .number({ invalid_type_error: "Amount is required" })
    .min(1, { message: "Minimum deposit is ₹1" })
    .max(10000, { message: "Maximum deposit is ₹10,000" }),
});

export const WithdrawalSchema = z.object({
  amount: z
    .number()
    .min(1, "Minimum withdrawal amount is ₹1")
    .max(100000, "Maximum withdrawal amount is ₹1,00,000"),
});
