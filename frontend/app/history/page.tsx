"use client";

import { Calendar, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Components
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getHistory, type HistoryItem } from "@/lib/api";

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // Wait a brief moment for auth to initialize if needed
        // In a real app, use an AuthContext to wait for 'user' state
        await new Promise((resolve) => setTimeout(resolve, 500));
        const data = await getHistory();

        setHistory(data);
      } catch (e) {
        console.error("Failed to fetch history", e);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold text-stone-800 flex items-center gap-2">
          <Calendar className="text-amber-500" />
          献立の履歴
        </h1>
        <p className="text-stone-500 text-sm font-bold mt-1 opacity-80">
          過去30日分の記録を表示しています
        </p>
      </header>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
        </div>
      ) : history.length === 0 ? (
        <Card className="p-8 text-center text-stone-500 font-bold border-2 border-dashed border-stone-200 bg-stone-50/50">
          <p>履歴はまだありません</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <Card
              key={item.id}
              onClick={() => router.push(`/?historyId=${item.id}`)}
              className="p-4 border-l-4 border-l-amber-400 flex items-center justify-between hover:bg-stone-50 transition-colors cursor-pointer"
            >
              <div className="flex-1">
                <div className="text-xs font-black text-stone-400 mb-1">{item.date}</div>
                <div className="font-bold text-stone-800 line-clamp-2 text-sm leading-snug">
                  {item.output?.meals
                    ?.map(
                      (m: any) =>
                        `${m.label}: ${m.dishes?.map((d: any) => d.name).join("・") || "なし"}`,
                    )
                    .join(" / ") || "詳細なし"}
                </div>
                <div className="text-xs text-stone-500 mt-1 font-medium">
                  {item.output?.totalCalorie}kcal
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-stone-400">
                <ChevronRight size={20} />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
