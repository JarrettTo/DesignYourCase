"use client";
import React from "react";
import { usePathname } from "next/navigation";
import LandingNavbar from "@/components/landing-navbar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname && pathname.includes("/phone-case-editor")) {
    return <>{children}</>;
  }
  return (
    <>
      <LandingNavbar />
      <div className="pt-20">{children}</div>
    </>
  );
} 