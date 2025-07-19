"use client";
import { useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import Sidebar from "@/components/Sidebar";

const Header = () => {
  const { user, isAuthenticated } = useCurrentUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <>
      <header className="w-full h-16 px-4 flex items-center justify-end">
        {isAuthenticated && user && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            {user.image ? (
              <img
                src={user.image}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <User className="w-8 h-8" />
            )}
          </Button>
        )}
      </header>

      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} user={user} />
    </>
  );
};

export default Header;