"use client";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAllUsersWithWallets, blockWallet } from "@/actions/admin";
import { toast } from "sonner";
import { Loader2, Shield, Users, Wallet, Ban, UserCheck } from "lucide-react";

interface UserWithWallet {
  id: string;
  name: string | null;
  email: string;
  isAdmin: boolean;
  isBlocked: boolean;
  createdAt: Date;
  wallet: {
    id: string;
    balance: number;
    isBlocked: boolean;
  } | null;
}

const Admin = () => {
  const { user } = useCurrentUser();
  const router = useRouter();
  const [users, setUsers] = useState<UserWithWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [blockingWallet, setBlockingWallet] = useState<string | null>(null);

  useEffect(() => {
    // If user is still loading, don't redirect yet
    if (user === undefined) return;

    if (user === null) {
      router.push("/auth/login");
      return;
    }

    if (user && !user.isAdmin) {
      router.push("/trade");
      return;
    }

    if (user && user.isAdmin) {
      fetchUsers();
    }
  }, [user, router]);

  const fetchUsers = async () => {
    try {
      const usersData = await getAllUsersWithWallets();
      setUsers(usersData);
    } catch (error) {
      toast.error("Failed to fetch users");
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockWallet = async (walletId: string, userId: string) => {
    setBlockingWallet(walletId);
    try {
      await blockWallet(walletId);

      // Update the local state
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId && user.wallet
            ? {
                ...user,
                wallet: { ...user.wallet, isBlocked: !user.wallet.isBlocked },
              }
            : user
        )
      );

      toast.success("Wallet status updated successfully");
    } catch (error) {
      toast.error("Failed to update wallet status");
      console.error("Error blocking wallet:", error);
    } finally {
      setBlockingWallet(null);
    }
  };

  // Show loading state
  if (loading || user === undefined) {
    return (
      <div className="flex flex-col items-center py-10 gap-8 sm:px-0 px-4">
        <Card className="w-full max-w-4xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Admin Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="h-20 bg-zinc-700 rounded"></div>
                <div className="h-20 bg-zinc-700 rounded"></div>
                <div className="h-20 bg-zinc-700 rounded"></div>
              </div>
              <div className="h-64 bg-zinc-700 rounded"></div>
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
            <CardTitle>Admin Access</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="py-8">
              <div className="text-6xl mb-4">🔐</div>
              <h3 className="text-lg font-semibold mb-2">
                Authentication Required
              </h3>
              <p className="text-muted-foreground">
                Please log in to access the admin dashboard
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

  if (!user.isAdmin) {
    return (
      <div className="flex flex-col items-center py-10 gap-8 sm:px-0 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="py-8">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold mb-2">
                Admin Access Required
              </h3>
              <p className="text-muted-foreground">
                You don&lsquo;t have permission to access this page
              </p>
              <Button className="mt-4" onClick={() => router.push("/trade")}>
                Go to Trading
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-10 gap-8 sm:px-0 px-4">
      {/* Header */}
      <Card className="w-full max-w-6xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Admin Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Manage users and monitor wallet activities
          </p>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wallet className="h-5 w-5" />
              Active Wallets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {users.filter((u) => u.wallet && !u.wallet.isBlocked).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Ban className="h-5 w-5" />
              Blocked Wallets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {users.filter((u) => u.wallet && u.wallet.isBlocked).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="w-full max-w-6xl">
        <CardHeader>
          <CardTitle>Users & Wallets Management</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8">
              <UserCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
              <p className="text-muted-foreground">
                No users are registered in the system yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Wallet Balance</TableHead>
                    <TableHead>Wallet Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Wallet Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.name || "N/A"}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.isAdmin ? "default" : "secondary"}>
                          {user.isAdmin ? "Admin" : "User"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">
                        {user.wallet ? `₹${user.wallet.balance}` : "No Wallet"}
                      </TableCell>
                      <TableCell>
                        {user.wallet && (
                          <Badge
                            variant={
                              user.wallet.isBlocked ? "destructive" : "default"
                            }
                          >
                            {user.wallet.isBlocked ? "Blocked" : "Active"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {user.wallet && !user.isAdmin && (
                          <Button
                            variant={
                              user.wallet.isBlocked ? "default" : "destructive"
                            }
                            size="sm"
                            onClick={() =>
                              handleBlockWallet(user.wallet!.id, user.id)
                            }
                            disabled={blockingWallet === user.wallet.id}
                          >
                            {blockingWallet === user.wallet.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Ban className="h-4 w-4 mr-1" />
                                {user.wallet.isBlocked ? "Unblock" : "Block"}
                              </>
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;
