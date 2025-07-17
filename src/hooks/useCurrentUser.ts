import { useSession } from "next-auth/react";

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  isAdmin: boolean;
}

export const useCurrentUser = () => {
  const { data: session, status, update } = useSession();

  return {
    user: session?.user as User,
    status,
    update, // This is key - now you can refresh the session
    isLoading: status === "loading",
    isAuthenticated: !!session?.user,
  };
};
