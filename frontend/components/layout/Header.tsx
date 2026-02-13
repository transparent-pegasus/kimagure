"use client";

import { onAuthStateChanged } from "firebase/auth";
import { Menu, Rabbit } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { auth, logout } from "@/lib/api";

export function Header() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);

      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const [open, setOpen] = useState(false);

  if (loading) return null;
  if (!user) return null;

  return (
    <header className="sticky top-0 z-40 bg-amber-400 border-b border-amber-500/20 h-14 flex items-center justify-between px-4 shrink-0 shadow-sm">
      <div className="flex items-center gap-2">
        <Rabbit className="h-7 w-7 text-stone-800" />
        <div className="flex flex-col">
          <div className="font-bold text-sm leading-tight font-rounded text-stone-800">
            きまぐれごはん
          </div>
          <div className="text-[8px] font-bold text-stone-700 opacity-80 leading-tight">
            計画しないがいちばん続く
          </div>
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="-mr-2 text-stone-800 hover:bg-black/5">
            <Menu className="h-5 w-5" />
            <span className="sr-only">メニューを開く</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>メニュー</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col space-y-2 mt-8">
            <Link
              href="/privacy-policy"
              className="flex items-center h-10 px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground rounded-md"
              onClick={() => setOpen(false)}
            >
              プライバシーポリシー
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start px-4 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={async () => {
                await logout();
                window.location.reload();
              }}
            >
              ログアウト
            </Button>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
