"use client";

import { useEffect, useState, useTransition } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  getBankAccount,
  createBankAccount,
  deleteBankAccount,
} from "@/actions/bank-account";
import { BankAccountSchema } from "@/schemas/user";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ApiResponse {
  error?: string;
  success?: string;
}

const BankAccount = () => {
  const { user } = useCurrentUser();
  const [account, setAccount] = useState<z.infer<
    typeof BankAccountSchema
  > | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const form = useForm<z.infer<typeof BankAccountSchema>>({
    resolver: zodResolver(BankAccountSchema),
    defaultValues: {
      accountHolder: "",
      accountNumber: "",
      bankName: "",
      ifscCode: "",
    },
  });

  const fetchAccount = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    const res = await getBankAccount(user.id);
    setAccount(res);
    setIsLoading(false);
  };

  useEffect(() => {
    if (user?.id) fetchAccount();
    // eslint-disable-next-line
  }, [user?.id]);

  const onSubmit = (values: z.infer<typeof BankAccountSchema>) => {
    if (!user?.id) {
      toast.error("User not authenticated");
      return;
    }

    startTransition(async () => {
      try {
        const res = await createBankAccount(user.id ?? "", values);

        if (res && typeof res === "object") {
          const response = res as ApiResponse;
          if (response.error) {
            toast.error(response.error);
          } else {
            toast.success(response.success || "Account added successfully!");
            setDialogOpen(false);
            form.reset();
            await fetchAccount(); // Refresh account data
          }
        } else {
          toast.error("Failed to add account");
        }
      } catch (error) {
        toast.error("An unexpected error occurred");
      }
    });
  };

  const handleDelete = () => {
    if (!user?.id) {
      toast.error("User not authenticated");
      return;
    }

    // Add confirmation dialog for destructive action
    if (!confirm("Are you sure you want to delete this bank account?")) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await deleteBankAccount(user.id ?? "");

        if (res && typeof res === "object") {
          const response = res as ApiResponse;
          if (response.error) {
            toast.error(response.error);
          } else {
            toast.success(response.success || "Account deleted successfully!");
            setAccount(null);
          }
        } else {
          toast.error("Failed to delete account");
        }
      } catch (error) {
        toast.error("An unexpected error occurred");
      }
    });
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center py-10 gap-8">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold mb-4">Bank Account</h2>
          <div className="bg-zinc-900 rounded-lg p-6 shadow animate-pulse">
            <div className="h-4 bg-zinc-700 rounded mb-3"></div>
            <div className="h-4 bg-zinc-700 rounded mb-3"></div>
            <div className="h-4 bg-zinc-700 rounded mb-3"></div>
            <div className="h-4 bg-zinc-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show message if user is not authenticated
  if (!user) {
    return (
      <div className="flex flex-col items-center py-10 gap-8">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold mb-4">Bank Account</h2>
          <div className="bg-zinc-900 rounded-lg p-6 shadow text-center">
            <p className="text-zinc-400">
              Please log in to manage your bank account
            </p>
            <Button className="mt-4" onClick={() => router.push("/auth/login")}>
              Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-10 gap-8">
      <div className="w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Bank Account</h2>
        {account ? (
          <div className="bg-zinc-900 rounded-lg p-6 shadow flex flex-col gap-3">
            <div>
              <span className="font-semibold">Account Holder:</span>{" "}
              {account.accountHolder}
            </div>
            <div>
              <span className="font-semibold">Account Number:</span>{" "}
              {account.accountNumber}
            </div>
            <div>
              <span className="font-semibold">Bank Name:</span>{" "}
              {account.bankName}
            </div>
            <div>
              <span className="font-semibold">IFSC Code:</span>{" "}
              {account.ifscCode}
            </div>
            <Button
              onClick={handleDelete}
              disabled={isPending}
              variant="destructive"
              className="mt-4"
            >
              {isPending ? "Deleting..." : "Delete Account"}
            </Button>
          </div>
        ) : (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add Bank Account</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Add Bank Account</DialogTitle>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="accountHolder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Holder</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="John Doe"
                            {...field}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="1234567890"
                            {...field}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="HDFC"
                            {...field}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ifscCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IFSC Code</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="HDFC0001234"
                            {...field}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={isPending}>
                      {isPending ? "Adding..." : "Add Account"}
                    </Button>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default BankAccount;
