"use client";

import {
  X,
  User,
  ChartCandlestick,
  History,
  Wallet,
  CreditCard,
  Building2,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

const Sidebar = ({ isOpen, onClose, user }: SidebarProps) => {
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
    onClose();
  };

  const handleSignOut = () => {
    signOut();
    onClose();
  };

  const menuItems = [
    { icon: ChartCandlestick, label: "Trade", href: "/trade" },
    { icon: History, label: "Trade History", href: "/trade-history" },
    { icon: Wallet, label: "Wallet", href: "/wallet" },
    { icon: CreditCard, label: "Withdraw", href: "/withdraw" },
    { icon: Building2, label: "Bank Account", href: "/bank-account" },
  ];

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-80 md:w-96 bg-background shadow-lg transform transition-transform duration-300 ease-in-out z-[10000] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* User Profile */}
        {user && (
          <div className="flex  justify-between p-4 border-b border-border">
            <div
              className="flex items-center space-x-3 cursor-pointer hover:bg-accent rounded-lg p-2 transition-colors"
              onClick={() => handleNavigation("/profile")}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                {user?.image ? (
                  <img
                    src={user.image}
                    alt={user.name || "User"}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-muted-foreground hover:text-primary transition-colors">
                  {user?.email || "user@example.com"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-accent"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.label}>
                <button
                  onClick={() => handleNavigation(item.href)}
                  className="flex items-center space-x-3 px-3 py-2 text-sm text-foreground rounded-md hover:bg-accent transition-colors w-full text-left"
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>

          {/* Sign Out */}
          {user && (
            <div className="mt-6 pt-4 border-t border-border">
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-3 px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-950 transition-colors w-full text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
