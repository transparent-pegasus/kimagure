"use client";

import * as React from "react";

import { auth } from "@/lib/api";

export function Providers({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    const currentAuth = auth;

    if (!currentAuth) return;

    // Auto-login removed to support explicit login screen
    // const unsubscribe = onAuthStateChanged(currentAuth, (u) => {
    //   if (!u) {
    //     signInAnonymously(currentAuth).catch((error) => {
    //       console.error("Anonymous auth failed", error);
    //     });
    //   }
    // });

    // return () => unsubscribe();
  }, []);

  return <>{children}</>;
}
