import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { isAdminLoggedIn, adminLogout, getUser, userLogout } from "@/lib/api";

type AuthCtx = {
  user: any | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => void;
  refreshRole: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshRole = () => {
    setIsAdmin(isAdminLoggedIn());
    setUser(getUser());
  };

  useEffect(() => {
    refreshRole();
    setLoading(false);
  }, []);

  return (
    <Ctx.Provider
      value={{
        user,
        isAdmin,
        loading,
        signOut: () => {
          adminLogout();
          userLogout();
          setIsAdmin(false);
          setUser(null);
        },
        refreshRole,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be inside AuthProvider");
  return c;
};
