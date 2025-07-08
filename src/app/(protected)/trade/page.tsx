"use client";

import { useEffect, useState, useTransition } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Timer, Coins, TrendingUp, TrendingDown } from "lucide-react";
import { getWallet, placeTrade, processRoundResults } from "@/actions/trade";
import { getServerTime } from "@/actions/server-time";

interface GameState {
  phase: "betting" | "waiting";
  timeLeft: number;
}

interface Bet {
  color: string;
  number: number;
  amount: number;
}

interface ApiResponse {
  error?: string;
  success?: string;
  balance?: number;
  trade?: any;
}

interface RoundResult {
  color: string;
  number: number;
}

const Trade = () => {
  const { user, update } = useCurrentUser();

  const [gameState, setGameState] = useState<GameState>({
    phase: "betting",
    timeLeft: 60,
  });
  const [userBet, setUserBet] = useState<Bet | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState<number>(0);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<{
    won: boolean;
    amount: number;
    result: RoundResult;
  } | null>(null);

  useEffect(() => {
    update();
  }, []);

  const fetchWallet = async () => {
    if (!user?.id) {
      toast.error("User not authenticated");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await getWallet(user.id);

      if (res && typeof res === "object") {
        const response = res as ApiResponse;
        if (response.error) {
          toast.error(response.error);
        } else {
          setWalletBalance(response.balance ?? 0);
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

  const handleRoundEnd = async () => {
    if (!user?.id) return;

    try {
      // Process round results
      const result = await processRoundResults();

      if (result.success && result.result && result.trades) {
        // Find current user's trade result
        const userTradeResult = result.trades.find(
          (trade: any) => trade.userId === user.id
        );

        if (userTradeResult) {
          setLastResult({
            won: userTradeResult.isWinner,
            amount: userTradeResult.isWinner
              ? userTradeResult.winAmount
              : userTradeResult.betAmount, // Use betAmount from trade result
            result: {
              color: result.result.color.toLowerCase(),
              number: result.result.number,
            },
          });

          // Update wallet balance
          setWalletBalance(userTradeResult.newBalance);

          // Show result dialog
          setShowResult(true);
        }
      }
      setUserBet(null);
    } catch (error) {
      toast.error("Failed to process round results");
    }
  };

  useEffect(() => {
    if (user?.id) fetchWallet();
  }, [user?.id]);

  useEffect(() => {
    const syncTimer = async () => {
      try {
        const serverTime = await getServerTime();
        const cycle = 60000; // 60 seconds
        const timePassed = serverTime % cycle;
        const timeLeft = Math.floor((cycle - timePassed) / 1000);

        setGameState((prev) => ({
          ...prev,
          timeLeft,
          phase: timeLeft <= 5 ? "waiting" : "betting",
        }));

        startCountdown(timeLeft);
      } catch (err) {
        console.error("Failed to fetch server time:", err);
      }
    };

    const startCountdown = (initialTimeLeft: number) => {
      const interval = setInterval(() => {
        setGameState((prev) => {
          const newTimeLeft = prev.timeLeft <= 1 ? 60 : prev.timeLeft - 1;

          // Don't change phase if it's already "waiting" (user placed bet or timer <= 5)
          // Only change to "betting" if timer resets to 60 and no active bet
          let newPhase = prev.phase;

          if (newTimeLeft === 60) {
            // Timer reset - check if user has active bet
            newPhase = "betting"; // This will be overridden by userBet check below
          } else if (newTimeLeft <= 5) {
            newPhase = "waiting";
          }
          // If phase is already "waiting" and timer > 5, keep it as "waiting"

          // Trigger round end processing when timer reaches 0
          if (prev.timeLeft === 1) {
            setTimeout(() => handleRoundEnd(), 100);
          }

          return {
            timeLeft: newTimeLeft,
            phase: newPhase,
          };
        });
      }, 1000);

      return () => clearInterval(interval);
    };

    syncTimer();
  }, [user?.id]);

  // Add a separate useEffect to handle phase changes when userBet changes
  useEffect(() => {
    if (userBet) {
      setGameState((prev) => ({
        ...prev,
        phase: "waiting",
      }));
    }
  }, [userBet]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimerColor = () => {
    if (gameState.timeLeft <= 5) return "text-red-500";
    if (gameState.timeLeft <= 15) return "text-yellow-500";
    return "text-green-500";
  };

  const getPhaseText = () => {
    switch (gameState.phase) {
      case "betting":
        return "Place Your Bets";
      case "waiting":
        return "Betting closed!, Wait for the result.";
      default:
        return "";
    }
  };

  const colors = [
    { name: "red", class: "bg-red-500 hover:bg-red-600" },
    { name: "violet", class: "bg-purple-500 hover:bg-purple-600" },
    { name: "green", class: "bg-green-500 hover:bg-green-600" },
  ];

  const numbers = Array.from({ length: 10 }, (_, i) => i);

  const canPlaceBet = () => {
    return (
      gameState.phase === "betting" &&
      gameState.timeLeft > 5 &&
      selectedColor &&
      selectedNumber !== null &&
      betAmount > 0 &&
      betAmount <= walletBalance &&
      !userBet
    );
  };

  const handlePlaceBet = () => {
    if (!canPlaceBet() || !user?.id) return;

    startTransition(async () => {
      try {
        const result = await placeTrade(
          user.id ?? "",
          selectedColor,
          selectedNumber!,
          betAmount
        );

        if (result.error) {
          toast.error(result.error);
        } else if (result.success) {
          setUserBet({
            color: selectedColor,
            number: selectedNumber!,
            amount: betAmount,
          });

          // Update wallet balance
          setWalletBalance((prev) => prev - betAmount);
          setGameState((prev) => ({
            ...prev,
            phase: "waiting",
          }));

          // Reset selections
          setSelectedColor("");
          setSelectedNumber(null);
          setBetAmount(0);

          toast.success(result.success);
        }
      } catch (error) {
        console.error("Failed to place bet:", error);
        toast.error("Failed to place bet");
      }
    });
  };

  const handleResultClose = () => {
    setShowResult(false);
    setLastResult(null);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 gap-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Timer className="w-6 h-6" />
              </div>
              <div className="animate-pulse">
                <div className="h-16 bg-zinc-700 rounded mb-4"></div>
                <div className="h-6 bg-zinc-700 rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="animate-pulse">
              <div className="h-8 bg-zinc-700 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 gap-6">
      {/* Timer Section */}
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Timer className="w-6 h-6" />
            </div>
            <div className={`text-6xl font-bold ${getTimerColor()}`}>
              {formatTime(gameState.timeLeft)}
            </div>
            <div className="text-lg font-medium mt-2">{getPhaseText()}</div>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Balance */}
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2">
            <Coins className="w-5 h-5" />
            <span className="text-lg font-medium">
              Wallet: ₹{walletBalance}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Current Bet Display */}
      {userBet && (
        <Card className="w-full max-w-md border-blue-500">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-sm font-medium mb-2">Your Bet</div>
              <div className="flex items-center justify-center gap-4">
                <div
                  className={`w-8 h-8 rounded-full ${
                    colors.find((c) => c.name === userBet.color)?.class
                  }`}
                ></div>
                <div className="text-2xl font-bold">{userBet.number}</div>
                <div className="text-lg font-medium">₹{userBet.amount}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Betting Interface */}
      {gameState.phase === "betting" && gameState.timeLeft > 5 && !userBet && (
        <div className="w-full max-w-md space-y-4">
          {/* Color Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Choose Color</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center gap-4">
                {colors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    className={`w-32 h-16 rounded transition-all ${
                      color.class
                    } ${
                      selectedColor === color.name ? "ring-4 ring-white" : ""
                    }`}
                  >
                    <span className="text-white font-medium capitalize">
                      {color.name}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Number Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Choose Number</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2 place-items-center">
                {numbers.map((num) => (
                  <button
                    key={num}
                    onClick={() => setSelectedNumber(num)}
                    className={`w-12 h-12 rounded-full border-2 transition-all ${
                      selectedNumber === num
                        ? "bg-blue-500 border-blue-500 text-white"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Bet Amount */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Bet Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  type="number"
                  min={1}
                  max={walletBalance}
                  value={betAmount}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  placeholder="Enter bet amount"
                  disabled={isPending}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBetAmount(100)}
                    disabled={walletBalance < 100}
                  >
                    ₹100
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBetAmount(500)}
                    disabled={walletBalance < 500}
                  >
                    ₹500
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBetAmount(1000)}
                    disabled={walletBalance < 1000}
                  >
                    ₹1000
                  </Button>
                </div>
                <Button
                  onClick={handlePlaceBet}
                  disabled={!canPlaceBet() || isPending}
                  className="w-full"
                >
                  {isPending ? "Placing Bet..." : "Place Bet"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Result Popup */}
      <Dialog open={showResult} onOpenChange={handleResultClose}>
        <DialogContent>
          <DialogTitle className="text-center">
            {lastResult?.won
              ? "Congratulations! 🎉"
              : "Better Luck Next Time! 😔"}
          </DialogTitle>
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-4">
              <div
                className={`w-12 h-12 rounded-full ${
                  colors.find((c) => c.name === lastResult?.result.color)?.class
                }`}
              ></div>
              <div className="text-3xl font-bold">
                {lastResult?.result.number}
              </div>
            </div>
            <div className="text-lg font-medium capitalize">
              Result: {lastResult?.result.color} - {lastResult?.result.number}
            </div>
            <div
              className={`text-2xl font-bold flex items-center justify-center gap-2 ${
                lastResult?.won ? "text-green-500" : "text-red-500"
              }`}
            >
              {lastResult?.won ? (
                <TrendingUp className="w-6 h-6" />
              ) : (
                <TrendingDown className="w-6 h-6" />
              )}
              {lastResult?.won ? "+" : "-"}₹{lastResult?.amount}
            </div>
            <div className="text-sm text-gray-600">
              New Balance: ₹{walletBalance}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button className="w-full" onClick={handleResultClose}>
                Continue Trading
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Trade;
