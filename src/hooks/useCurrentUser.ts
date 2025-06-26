import { useSession } from "next-auth/react";

export const useCurrentUser = () => {
  const { data: session, status, update } = useSession();
  
  return {
    user: session?.user,
    status,
    update, // This is key - now you can refresh the session
    isLoading: status === "loading",
    isAuthenticated: !!session?.user
  };
};