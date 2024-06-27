
'use client'

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

type AuthSessionProviderProps = {
  children: ReactNode;
  session: any;
};

const AuthSessionProvider = ({ children }: { children: React.ReactNode }) => {
  return <SessionProvider>{children}</SessionProvider>;
};

export default AuthSessionProvider;

