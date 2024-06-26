
'use client'

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

type AuthSessionProviderProps = {
  children: ReactNode;
  session: any;
};

const AuthSessionProvider = ({ children, session }: AuthSessionProviderProps) => {
  return <SessionProvider session={session}>{children}</SessionProvider>;
};

export default AuthSessionProvider;

