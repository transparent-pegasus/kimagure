"use client";

import { Menu, Rabbit } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-amber-400 border-b border-amber-500/20 h-14 flex items-center justify-between px-4 shrink-0 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="bg-white/40 p-1 rounded-lg">
          <Rabbit className="h-6 w-6 text-stone-800" />
        </div>
        <div className="flex flex-col">
          <div className="font-bold text-sm leading-tight font-rounded text-stone-800">
            きまぐれごはん
          </div>
          <div className="text-[8px] font-bold text-stone-700 opacity-80 leading-tight">
            計画しないがいちばん続く
          </div>
        </div>
      </div>

      <Sheet>
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
            >
              プライバシーポリシー
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start px-4 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => {
                // Logout logic here
                console.log("Logout clicked");
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
