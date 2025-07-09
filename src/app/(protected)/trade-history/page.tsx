"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getUserTrades } from "@/actions/trade";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Trade {
  id: string;
  color: "RED" | "VIOLET" | "GREEN";
  number: number;
  amount: number;
  result: "WIN" | "LOSS" | "PENDING" | "CANCELLED";
  createdAt: string;
}

interface ApiResponse {
  error?: string;
  success?: string;
  trades?: Trade[];
}

const TradeHistory = () => {
  const { user } = useCurrentUser();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTrades: 0,
    totalWins: 0,
    totalLosses: 0,
    totalWinAmount: 0,
    totalLossAmount: 0,
  });
  const router = useRouter();

  const fetchTrades = async () => {
    if (!user?.id) {
      toast.error("User not authenticated");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await getUserTrades(user.id);

      if (res && typeof res === "object") {
        const response = res as ApiResponse;
        if (response.error) {
          toast.error(response.error);
        } else {
          const tradesData = response.trades ?? [];
          setTrades(tradesData);

          // Calculate statistics
          const totalTrades = tradesData.length;
          const wins = tradesData.filter((trade) => trade.result === "WIN");
          const losses = tradesData.filter((trade) => trade.result === "LOSS");
          const totalWinAmount = wins.reduce(
            (sum, trade) => sum + trade.amount,
            0
          );
          const totalLossAmount = losses.reduce(
            (sum, trade) => sum + trade.amount,
            0
          );

          setStats({
            totalTrades,
            totalWins: wins.length,
            totalLosses: losses.length,
            totalWinAmount,
            totalLossAmount,
          });
        }
      } else {
        toast.error("Failed to fetch trade history");
      }
    } catch (error) {
      toast.error("An unexpected error occurred while fetching trade history");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchTrades();
    // eslint-disable-next-line
  }, [user?.id]);

  const getColorDisplay = (color: string) => {
    switch (color) {
      case "RED":
        return { bg: "bg-red-500", text: "Red" };
      case "VIOLET":
        return { bg: "bg-purple-500", text: "Violet" };
      case "GREEN":
        return { bg: "bg-green-500", text: "Green" };
      default:
        return { bg: "bg-gray-500", text: color };
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case "WIN":
        return "text-green-600 bg-green-600/10";
      case "LOSS":
        return "text-red-600 bg-red-600/10";
      case "PENDING":
        return "text-yellow-600 bg-yellow-600/10";
      case "CANCELLED":
        return "text-gray-600 bg-gray-600/10";
      default:
        return "text-gray-600 bg-gray-600/10";
    }
  };

  const getResultText = (result: string) => {
    return result.charAt(0).toUpperCase() + result.slice(1);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center py-10 gap-8">
        {/* Statistics Cards Loading */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Total Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse">
                <div className="h-8 bg-zinc-700 rounded mb-2"></div>
                <div className="h-4 bg-zinc-700 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse">
                <div className="h-8 bg-zinc-700 rounded mb-2"></div>
                <div className="h-4 bg-zinc-700 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Net P&L</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse">
                <div className="h-8 bg-zinc-700 rounded mb-2"></div>
                <div className="h-4 bg-zinc-700 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trade History Loading */}
        <Card className="w-full max-w-4xl">
          <CardHeader>
            <CardTitle>Trade History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="border border-zinc-800 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-zinc-700 rounded-full"></div>
                      <div className="h-5 bg-zinc-700 rounded w-20"></div>
                      <div className="h-5 bg-zinc-700 rounded w-16"></div>
                    </div>
                    <div className="h-6 bg-zinc-700 rounded w-16"></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-zinc-700 rounded w-32"></div>
                    <div className="h-5 bg-zinc-700 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center py-10 gap-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Trade History</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="py-8">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg font-semibold mb-2">
                Authentication Required
              </h3>
              <p className="text-muted-foreground">
                Please log in to view your trade history
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

  const winRate =
    stats.totalTrades > 0 ? (stats.totalWins / stats.totalTrades) * 100 : 0;
  const netPL = stats.totalWinAmount - stats.totalLossAmount;

  return (
    <div className="flex flex-col items-center py-10 gap-8 sm:px-0 px-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTrades}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalWins} wins, {stats.totalLosses} losses
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{winRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Success rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Net P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                netPL >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {netPL >= 0 ? "+" : ""}₹{netPL}
            </div>
            <p className="text-xs text-muted-foreground">Total profit/loss</p>
          </CardContent>
        </Card>
      </div>

      {/* Trade History */}
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Trade History</CardTitle>
        </CardHeader>
        <CardContent>
          {trades.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold mb-2">No trades yet</h3>
              <p className="text-muted-foreground mb-4">
                Start trading to see your history here
              </p>
              <Button onClick={() => router.push("/trade")}>
                Start Trading
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {trades.map((trade) => {
                const colorInfo = getColorDisplay(trade.color);
                return (
                  <div
                    key={trade.id}
                    className="border border-zinc-800 rounded-lg p-4 hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full ${colorInfo.bg}`}
                          title={colorInfo.text}
                        ></div>
                        <span className="font-medium">{colorInfo.text}</span>
                        <span className="text-sm text-muted-foreground">
                          Number: {trade.number}
                        </span>
                      </div>
                      <Badge className={getResultColor(trade.result)}>
                        {getResultText(trade.result)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        {new Date(trade.createdAt).toLocaleString()}
                      </div>
                      <div className="text-lg font-semibold">
                        ₹{trade.amount}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TradeHistory;
