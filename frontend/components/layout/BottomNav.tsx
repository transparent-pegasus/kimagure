"use client";

import { History, Utensils } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasHistoryId = searchParams.has("historyId");

  const items = [
    {
      href: "/",
      icon: Utensils,
      label: "提案",
    },
    {
      href: "/history",
      icon: History,
      label: "履歴",
    },
  ];

  return (
    <nav className="absolute bottom-0 left-0 right-0 z-40 bg-background border-t h-16 pb-[env(safe-area-inset-bottom)] flex items-center justify-around shrink-0">
      {items.map((item) => {
        const isHome = item.href === "/";

        const isActive = isHome
          ? pathname === "/" && !hasHistoryId
          : pathname.startsWith("/history") || (pathname === "/" && hasHistoryId);

        // If already on home page (active), clicking "Suggestion" should reset the view
        const href = isHome && isActive ? "/?reset=true" : item.href;

        return (
          <Link
            key={item.href}
            href={href}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full space-y-1 text-xs font-medium transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-primary/70",
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
