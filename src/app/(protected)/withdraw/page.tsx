"use client";

import { useEffect, useState, useTransition } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  createWithdrawal,
  getWalletAndWithdrawals,
  getUserBankAccount,
} from "@/actions/withdraw";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { WithdrawalSchema } from "@/schemas/user";
import { useRouter } from "next/navigation";

interface WithdrawalTransaction {
  id: string;
  amount: number;
  status: "pending" | "processing" | "completed" | "rejected" | "cancelled";
  createdAt: string;
  bankName: string;
  accountNumber: string;
}

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  isActive: boolean;
}

interface ApiResponse {
  error?: string;
  success?: string;
  balance?: number;
  withdrawals?: WithdrawalTransaction[];
  bankAccount?: BankAccount;
}

const Withdraw = () => {
  const { user } = useCurrentUser();
  const [balance, setBalance] = useState<number>(0);
  const [withdrawals, setWithdrawals] = useState<WithdrawalTransaction[]>([]);
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof WithdrawalSchema>>({
    resolver: zodResolver(WithdrawalSchema),
    defaultValues: {
      amount: 0,
    },
  });

  const fetchWalletData = async () => {
    if (!user?.id) {
      toast.error("User not authenticated");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const [walletRes, bankRes] = await Promise.all([
        getWalletAndWithdrawals(user.id),
        getUserBankAccount(user.id),
      ]);

      if (walletRes && typeof walletRes === "object") {
        const response = walletRes as ApiResponse;
        if (response.error) {
          toast.error(response.error);
        } else {
          setBalance(response.balance ?? 0);
          setWithdrawals(response.withdrawals ?? []);
        }
      }

      if (bankRes && typeof bankRes === "object") {
        const response = bankRes as ApiResponse;
        if (response.error) {
          toast.error(response.error);
        } else {
          setBankAccount(response.bankAccount ?? null);
        }
      }
    } catch (error) {
      console.error("Failed to fetch wallet data:", error);
      toast.error("An unexpected error occurred while fetching data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchWalletData();
    // eslint-disable-next-line
  }, [user?.id]);

  const onSubmit = (values: z.infer<typeof WithdrawalSchema>) => {
    if (!user?.id) {
      toast.error("User not authenticated");
      return;
    }

    if (values.amount > balance) {
      toast.error("Insufficient balance");
      return;
    }

    startTransition(async () => {
      try {
        const res = await createWithdrawal(user.id ?? "", values.amount);

        if (res && typeof res === "object") {
          const response = res as ApiResponse;
          if (response.error) {
            toast.error(response.error);
          } else {
            toast.success(response.success || "Withdrawal request submitted!");
            form.reset({ amount: 0 });
            setDialogOpen(false);
            await fetchWalletData(); // Refresh data
          }
        } else {
          toast.error("Failed to process withdrawal");
        }
      } catch (error) {
        console.error("Error creating withdrawal:", error);
        toast.error("An unexpected error occurred while processing withdrawal");
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "pending":
        return "text-yellow-600";
      case "processing":
        return "text-blue-600";
      case "rejected":
      case "cancelled":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center py-10 gap-8 sm:px-0 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Wallet Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse">
              <div className="h-12 bg-zinc-700 rounded mb-4"></div>
              <div className="h-10 bg-zinc-700 rounded"></div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Withdrawal History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-3">
              <div className="h-16 bg-zinc-700 rounded"></div>
              <div className="h-16 bg-zinc-700 rounded"></div>
              <div className="h-16 bg-zinc-700 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center py-10 gap-8 sm:px-0 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Withdraw</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="py-8">
              <div className="text-6xl mb-4">💳</div>
              <h3 className="text-lg font-semibold mb-2">
                Authentication Required
              </h3>
              <p className="text-muted-foreground">
                Please log in to access your wallet and withdraw money
              </p>
              <Button
                className="mt-4"
                onClick={() => router.push("/auth/login")}
              >
                Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-10 gap-8 sm:px-0 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Wallet Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold mb-4">₹{balance}</div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                disabled={balance < 1 || !bankAccount || !bankAccount.isActive}
                className="w-full"
              >
                {!bankAccount
                  ? "Add Bank Account First"
                  : !bankAccount.isActive
                  ? "Bank Account Inactive"
                  : balance < 1
                  ? "Insufficient Balance"
                  : "Withdraw"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Withdraw Money</DialogTitle>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-4"
              >
                <div className="text-sm text-muted-foreground">
                  Available Balance: ₹{balance}
                </div>

                {bankAccount && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-sm font-medium">Withdraw to:</div>
                    <div className="text-sm text-muted-foreground">
                      {bankAccount.bankName} - ****
                      {bankAccount.accountNumber.slice(-4)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {bankAccount.accountHolder}
                    </div>
                  </div>
                )}

                <Input
                  type="number"
                  min={1}
                  max={balance}
                  {...form.register("amount", { valueAsNumber: true })}
                  placeholder={`Enter amount (min ₹1, max ₹${balance})`}
                  disabled={isPending}
                  required
                />

                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={
                      isPending ||
                      form.watch("amount") <= 0 ||
                      form.watch("amount") > balance
                    }
                  >
                    {isPending ? "Processing..." : "Withdraw"}
                  </Button>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {!bankAccount && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                No bank account found.{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto text-yellow-800 dark:text-yellow-200"
                  onClick={() => router.push("/bank-account")}
                >
                  Add one now
                </Button>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Withdrawal History</CardTitle>
        </CardHeader>
        <CardContent>
          {withdrawals.length === 0 ? (
            <div className="text-muted-foreground text-center py-4">
              No withdrawal history yet.
            </div>
          ) : (
            <ul className="divide-y space-y-2">
              {withdrawals.map((withdrawal) => (
                <li key={withdrawal.id} className="py-3 flex flex-col gap-1">
                  <div className="flex justify-between items-start">
                    <span className="font-medium">₹{withdrawal.amount}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                        withdrawal.status
                      )}`}
                    >
                      {getStatusText(withdrawal.status)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {withdrawal.bankName} - ****
                    {withdrawal.accountNumber.slice(-4)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(withdrawal.createdAt).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Withdraw;
