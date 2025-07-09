"use client";
import { Button } from "@/components/ui/button";
import { ArrowRight, Palette, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

const HeroSection = () => {
  const [showAuthButtons, setShowAuthButtons] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();

  const handleNavigation = async (path: string) => {
    try {
      setIsNavigating(true);
      await router.push(path);
    } catch (error) {
      console.error("Navigation error:", error);
    } finally {
      setIsNavigating(false);
    }
  };

  const handleStartTrading = () => {
    setShowAuthButtons(true);
  };

  const handleLogin = () => {
    handleNavigation("/auth/login");
  };

  const handleRegister = () => {
    handleNavigation("/auth/register");
  };

  return (
    <section className="relative px-6 py-20 text-center overflow-hidden min-h-screen flex items-center">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-violet-900/20 via-blue-900/20 to-cyan-900/20 backdrop-blur-3xl"></div>

      <div className="relative max-w-6xl mx-auto">
        {/* Brand badge */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4 bg-slate-800/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-slate-700">
            <Palette className="w-6 h-6 text-violet-400" />
            <span className="text-sm font-medium text-slate-200">
              Colour Trade Pro
            </span>
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
        </div>

        {/* Main heading */}
        <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent animate-fade-in">
          India's Most Engaging Platform
          <br />
          <span className="relative">
            Assets
            <div className="absolute -inset-1 bg-gradient-to-r from-violet-600/20 to-cyan-600/20 blur-lg"></div>
          </span>
        </h1>

        {/* Description */}
        <p className="text-md text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
          Welcome to Colour Trade Pro, one of India's fastest-growing platforms
          for colour trading with real cash prizes. Where you can quickly earn
          with colour trading, Register to get ₹100 bonus.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          {!showAuthButtons ? (
            <Button
              size="lg"
              className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleStartTrading}
              disabled={isNavigating}
              aria-label="Start trading on Colour Trade Pro"
            >
              Start Trading
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-6 py-3 border-slate-600 text-slate-200 hover:bg-slate-800/60 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleLogin}
                disabled={isNavigating}
                aria-label="Login to your account"
              >
                {isNavigating ? "Loading..." : "Login"}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="rounded-full px-6 py-3 bg-slate-700 text-white hover:bg-slate-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleRegister}
                disabled={isNavigating}
                aria-label="Create a new account"
              >
                {isNavigating ? "Loading..." : "Register"}
              </Button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex justify-center items-center space-x-8 text-sm text-slate-400">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>10,847 Active Traders</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span>₹2.4M+ Trade Today</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
