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
              className="group overflow-hidden border-2 border-stone-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer rounded-2xl"
            >
              <div className="bg-stone-50 group-hover:bg-amber-50 px-4 py-2 border-b border-stone-100 flex items-center justify-between transition-colors">
                <span className="text-sm font-black text-stone-700 flex items-center gap-2">
                  {item.date}
                </span>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                  {item.output?.totalCalorie} kcal
                </span>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-bold text-stone-600 line-clamp-2 text-sm leading-relaxed">
                    {item.output?.meals
                      ?.map(
                        (m: any) =>
                          `${m.label}: ${m.dishes?.map((d: any) => d.name).join("・") || "なし"}`,
                      )
                      .join(" / ") || "詳細なし"}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-stone-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all"
                >
                  <ChevronRight size={20} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
