"use client";

import { useEffect, useState, useTransition } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { createDeposit, getWalletAndDeposits } from "@/actions/wallet";
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
import { WalletDepositSchema } from "@/schemas/user";
import { useRouter } from "next/navigation";

interface Transaction {
  id: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  createdAt: string;
}
interface ApiResponse {
  error?: string;
  success?: string;
  balance?: number;
  transactions?: Transaction[];
}

const Wallet = () => {
  const { user } = useCurrentUser();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof WalletDepositSchema>>({
    resolver: zodResolver(WalletDepositSchema),
    defaultValues: { amount: 0 },
  });

  const fetchWallet = async () => {
    if (!user?.id) {
      toast.error("User not authenticated");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await getWalletAndDeposits(user.id);

      if (res && typeof res === "object") {
        const response = res as ApiResponse;
        if (response.error) {
          toast.error(response.error);
        } else {
          setBalance(response.balance ?? 0);
          setTransactions(response.transactions ?? []);
        }
      } else {
        toast.error("Failed to fetch wallet data");
      }
    } catch (error) {
      console.error("Failed to fetch wallet data:", error);
      toast.error("An unexpected error occurred while fetching wallet data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchWallet();
    // eslint-disable-next-line
  }, [user?.id]);

  const onSubmit = (values: z.infer<typeof WalletDepositSchema>) => {
    if (!user?.id) {
      toast.error("User not authenticated");
      return;
    }

    startTransition(async () => {
      try {
        const res = await createDeposit(user.id ?? "", values.amount);

        if (res && typeof res === "object") {
          const response = res as ApiResponse;
          if (response.error) {
            toast.error(response.error);
          } else {
            toast.success(response.success || "Deposit successful!");
            form.reset({ amount: 0 });
            setDialogOpen(false);
            await fetchWallet(); // Refresh wallet data
          }
        } else {
          toast.error("Failed to process deposit");
        }
      } catch (error) {
        console.error("Error creating deposit:", error);
        toast.error("An unexpected error occurred while processing deposit");
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
      case "failed":
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
            <CardTitle>Deposit History</CardTitle>
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
            <CardTitle>Wallet</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="py-8">
              <div className="text-6xl mb-4">💳</div>
              <h3 className="text-lg font-semibold mb-2">
                Authentication Required
              </h3>
              <p className="text-muted-foreground">
                Please log in to access your wallet and manage deposits
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
              <Button>Deposit</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Deposit Money</DialogTitle>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-3"
              >
                <Input
                  type="number"
                  min={1}
                  max={10000}
                  {...form.register("amount", { valueAsNumber: true })}
                  placeholder="Enter amount (max 10,000)"
                  disabled={isPending}
                  required
                />
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={
                      isPending ||
                      form.watch("amount") <= 0 ||
                      form.watch("amount") > 10000
                    }
                  >
                    {isPending ? "Depositing..." : "Deposit"}
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
        </CardContent>
      </Card>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Deposit History</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-muted-foreground text-center py-4">
              No deposit history yet.
            </div>
          ) : (
            <ul className="divide-y space-y-2">
              {transactions.map((tx) => (
                <li key={tx.id} className="py-3 flex flex-col gap-1">
                  <div className="flex justify-between items-start">
                    <span className="font-medium">₹{tx.amount}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                        tx.status.toLowerCase()
                      )}`}
                    >
                      {getStatusText(tx.status)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(tx.createdAt).toLocaleString()}
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

export default Wallet;
