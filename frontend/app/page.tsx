"use client";

import {
  ArrowLeft,
  Bird,
  Check,
  Coffee,
  Dog,
  Drumstick,
  Moon,
  PawPrint,
  Plus,
  Soup,
  Squirrel,
  Sun,
  Trash2,
  Utensils,
  Youtube,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getHistory,
  getUserProfile,
  type MenuInput,
  type MenuOutput,
  saveHistory,
  suggestMenu,
  updateUserProfile,
} from "@/lib/api";
import { cn } from "@/lib/utils";

// Types
type MealType = "log" | "target";

interface Meal {
  id: string;
  label: string;
  type: MealType;
  value: string;
  icon: React.ReactNode;
  color: string;
  isRemovable?: boolean;
}

interface NGIngredient {
  id: string;
  label: string;
  hasLimit: boolean;
  limitValue?: string;
  unit?: string;
  isNg?: boolean;
}

// Calorie Guidelines (Physical Activity Level II - Normal)
const CALORIE_GUIDELINES = [
  { ageMax: 2, female: 900, male: 950 },
  { ageMax: 5, female: 1250, male: 1300 },
  { ageMax: 7, female: 1450, male: 1550 },
  { ageMax: 9, female: 1700, male: 1850 },
  { ageMax: 11, female: 2100, male: 2250 },
  { ageMax: 14, female: 2400, male: 2600 },
  { ageMax: 17, female: 2300, male: 2800 },
  { ageMax: 29, female: 2000, male: 2650 },
  { ageMax: 49, female: 2050, male: 2700 },
  { ageMax: 64, female: 1950, male: 2600 },
  { ageMax: 74, female: 1850, male: 2400 },
  { ageMax: 999, female: 1650, male: 2100 },
];

const getCalorieGuideline = (birthYear: string, gender: "male" | "female" | "none") => {
  if (!birthYear || gender === "none") return null;

  const year = parseInt(birthYear, 10);

  if (Number.isNaN(year)) return null;

  const currentYear = new Date().getFullYear();
  const age = currentYear - year;

  if (age < 0) return null;

  const guideline = CALORIE_GUIDELINES.find((g) => age <= g.ageMax);

  return guideline ? (gender === "male" ? guideline.male : guideline.female) : null;
};

const getPlaceholder = (label: string) => {
  switch (label) {
    case "朝":
      return "おにぎりとお味噌汁";
    case "昼":
      return "牛丼と野菜サラダ";
    case "夜":
      return "カレーライスとサラダ";
    case "間食":
      return "ヨーグルト";
    default:
      return "食べたものを入力...";
  }
};

export default function Home() {
  const router = useRouter();
  const [currentScreen, setCurrentScreen] = useState<"input" | "result" | "loading">("loading");
  const [suggestion, setSuggestion] = useState<MenuOutput | null>(null);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("献立を読み込んでいます...");

  // Initial Data
  const [meals, setMeals] = useState<Meal[]>([
    {
      color: "bg-orange-100",
      icon: <Coffee size={16} />,
      id: "breakfast",
      label: "朝",
      type: "log",
      value: "",
    },
    {
      color: "bg-yellow-100",
      icon: <Sun size={16} />,
      id: "lunch",
      label: "昼",
      type: "log",
      value: "",
    },
    {
      color: "bg-indigo-100",
      icon: <Moon size={16} />,
      id: "dinner",
      label: "夜",
      type: "log",
      value: "",
    },
  ]);

  const [effort, setEffort] = useState<
    "manual" | "use_ready_made" | "ready_made_only" | "eating_out"
  >("ready_made_only");
  const [balance, setBalance] = useState<"daily" | "weekly" | "none">("daily");
  const [volume, setVolume] = useState<"ichiju_sansai" | "ippin" | "okazu" | "snack">(
    "ichiju_sansai",
  );

  const [ngIngredients, setNgIngredients] = useState<NGIngredient[]>([
    { hasLimit: false, id: "sugar-total", isNg: false, label: "糖質", unit: "g以下" },
    { hasLimit: false, id: "sugar", isNg: false, label: "砂糖", unit: "g以下" },
    { hasLimit: false, id: "oil", isNg: false, label: "油", unit: "g以下" },
    { hasLimit: false, id: "salt", isNg: false, label: "食塩相当量", unit: "g以下" },
  ]);

  const [birthYear, setBirthYear] = useState<string>("");
  const [gender, setGender] = useState<"male" | "female" | "none">("none");
  const [calorieLimit, setCalorieLimit] = useState<string>("");

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await getUserProfile();

        if (profile) {
          if (profile.birthYear) setBirthYear(profile.birthYear);
          if (profile.gender) setGender(profile.gender);
          if (profile.calorieLimit) setCalorieLimit(profile.calorieLimit);

          if (profile.ngIngredients) setNgIngredients(profile.ngIngredients);
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };

    fetchProfile();
  }, []);

  // Check for historyId in URL
  // Check for URL params
  useEffect(() => {
    const initialize = async () => {
      const params = new URLSearchParams(window.location.search);
      const historyId = params.get("historyId");
      const reset = params.get("reset");

      if (reset) {
        setCurrentScreen("input");
        setSuggestion(null);
        setCurrentHistoryId(null);
        window.history.replaceState({}, "", "/");
        // eslint-disable-next-line padding-line-between-statements
        return;
      }

      if (historyId) {
        try {
          const history = await getHistory();
          const targetItem = history.find((h) => h.id === historyId);

          if (targetItem) {
            setSuggestion(targetItem.output);
            setCurrentScreen("result");
            setCurrentHistoryId(historyId);
            // URLからhistoryIdを削除しない（BottomNavの判定に必要）
          } else {
            setCurrentScreen("input");
          }
        } catch (error) {
          console.error("Failed to load history:", error);
          setCurrentScreen("input");
        }
      } else {
        setCurrentScreen("input");
      }
    };

    initialize();
  }, []);

  // Derived state
  const calorieGuideline = getCalorieGuideline(birthYear, gender);

  // Update profile when changed
  const handleProfileChange = async (
    newYear: string,
    newGender: "male" | "female" | "none",
    newCalorie: string,
  ) => {
    setBirthYear(newYear);
    setGender(newGender);
    setCalorieLimit(newCalorie);
    try {
      await updateUserProfile({
        birthYear: newYear,
        calorieLimit: newCalorie,
        gender: newGender,
      });
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  // Logic: Add Meal
  const addMeal = (index: number) => {
    let newLabel = "間食";
    const newIcon = <Coffee size={16} />;

    // 「夜」の下に追加する場合のみ挙動を変える
    if (index >= 0) {
      const prevLabel = meals[index].label;

      if (prevLabel === "夜") {
        // 既に夜食があるかどうかチェック
        const hasNightSnack = meals.some((m) => m.label === "夜食");

        if (hasNightSnack) {
          newLabel = "間食";
        } else {
          newLabel = "夜食";
        }
      } else if (prevLabel === "早朝" || prevLabel === "朝" || prevLabel === "昼") {
        newLabel = "間食";
      }
    } else {
      // 先頭に追加する場合
      newLabel = "早朝";
    }

    const newMeal: Meal = {
      color: "bg-stone-100",
      icon: newIcon,
      id: Date.now().toString(),
      isRemovable: true,
      label: newLabel,
      type: "log",
      value: "",
    };

    const newMeals = [...meals];

    newMeals.splice(index + 1, 0, newMeal);
    setMeals(newMeals);
  };

  // Logic: Remove Meal
  const removeMeal = (index: number) => {
    const newMeals = [...meals];

    newMeals.splice(index, 1);
    setMeals(newMeals);
  };

  // Logic: Update Meal
  const updateMeal = (index: number, key: keyof Meal, value: any) => {
    const newMeals = [...meals];

    (newMeals[index] as any)[key] = value;

    if (key === "type" && value === "target") {
      newMeals.forEach((m, i) => {
        if (i !== index) m.type = "log";
      });
    }
    setMeals(newMeals);
  };

  // Logic: NG Ingredients
  const addNgIngredient = () => {
    setNgIngredients([
      ...ngIngredients,
      { hasLimit: false, id: Date.now().toString(), isNg: false, label: "", unit: "g以下" },
    ]);

    // 追加した要素の高さ分だけスムーズにスクロール (main要素がスクロールコンテナ)
    requestAnimationFrame(() => {
      const mainElement = document.querySelector("main");

      if (!mainElement) return;

      const targetScroll = 60;
      const duration = 400;
      const startTime = performance.now();
      const startScroll = mainElement.scrollTop;

      const easeOutQuad = (t: number) => t * (2 - t);

      const animateScroll = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = easeOutQuad(progress);

        mainElement.scrollTop = startScroll + targetScroll * easeProgress;

        if (progress < 1) {
          requestAnimationFrame(animateScroll);
        }
      };

      requestAnimationFrame(animateScroll);
    });
  };

  const removeNgIngredient = (index: number) => {
    const newIngs = [...ngIngredients];

    newIngs.splice(index, 1);
    setNgIngredients(newIngs);
  };

  const updateNgIngredient = (index: number, key: keyof NGIngredient, value: any) => {
    const newIngs = [...ngIngredients];

    (newIngs[index] as any)[key] = value;
    setNgIngredients(newIngs);
  };

  // Logic: Suggest Menu
  const handleSuggest = async () => {
    setLoadingMessage("献立を考えています...");
    setCurrentScreen("loading");

    try {
      // Build API input
      const input: MenuInput = {
        mealPlans: meals.map((m) => ({
          content: m.value,
          label: m.label,
          type: m.type,
        })),
        preferences: {
          balanceAdjustment: balance,
          calorieLimit: calorieLimit ? Number(calorieLimit) : undefined,
          dishCategory: "",
          effort,
          ingredients: "",
          ngIngredients: ngIngredients.reduce((acc: any, curr) => {
            if (curr.isNg || curr.hasLimit) {
              acc[curr.id] = { enabled: true, max: curr.isNg ? 0 : Number(curr.limitValue) };
            }

            return acc;
          }, {}),
          volume,
        },
      };

      // Save preferences to Firestore
      // Extended profile object to include all preferences
      // Note: We need to serialize ngIngredients to a storable format if needed,
      // but passing the array is fine for storage and retrieval logic in page.tsx
      updateUserProfile({
        birthYear,
        calorieLimit,
        gender,
        ngIngredients, // Store raw array for UI restoration
      }).catch((err) => console.error("Auto-save profile failed", err));

      // Mock API call for now or use real one if cloud functions emulator running
      const result = await suggestMenu(input, new Date().toISOString().split("T")[0]);

      setSuggestion(result);

      // Simulate API delay and mock response for demo purposes (until backend ready)
      // await new Promise((resolve) => setTimeout(resolve, 2000));

      // Navigate to result
      setCurrentScreen("result");
    } catch (error) {
      console.error("Failed to suggest menu:", error);
      setCurrentScreen("input");
      alert("献立の作成に失敗しました。もう一度お試しください。");
    }
  };

  // Logic: Save to History
  const handleSave = async () => {
    if (!suggestion) return;

    setLoadingMessage("献立を保存しています...");
    setCurrentScreen("loading");

    try {
      const result = await saveHistory({
        date: suggestion.date,
        input: {
          mealPlans: meals.map((m) => ({
            content: m.value,
            label: m.label,
            type: m.type,
          })),
        },
        output: suggestion,
      });

      if (!result.success) {
        throw new Error("Save returned unsuccessful");
      }

      alert("献立を保存しました！");
      setCurrentScreen("input");
      setSuggestion(null);
    } catch (error) {
      console.error("Failed to save history:", error);
      setCurrentScreen("result");
      alert("保存に失敗しました。もう一度お試しください。");
    }
  };

  if (currentScreen === "loading") {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="font-bold text-lg text-primary">{loadingMessage}</p>
      </div>
    );
  }

  if (currentScreen === "result") {
    // API レスポンスから結果を表示
    const resultMeals = suggestion?.meals || [];
    const totalCalorie = suggestion?.totalCalorie || 0;
    const reason = suggestion?.reason || "献立の提案理由がここに表示されます";
    const nutrients = suggestion?.totalNutrients || [];

    // 栄養素の値を取得するヘルパー関数
    const getNutrientValue = (name: string) => {
      const nutrient = nutrients.find((n: any) => n.name === name || n.name.includes(name));

      return nutrient?.amount || 0;
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <header className="bg-primary text-primary-foreground p-6 rounded-3xl shadow-sm mb-6 relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-foreground hover:bg-white/20 z-10"
            onClick={() => {
              if (currentHistoryId) {
                router.push("/history");
              } else {
                setCurrentScreen("input");
                setSuggestion(null);
                setCurrentHistoryId(null);
              }
            }}
          >
            <ArrowLeft size={24} style={{ pointerEvents: "none" }} />
          </Button>
          <h1 className="text-2xl font-extrabold text-center tracking-wider drop-shadow-md">
            今日の{meals.find((m) => m.type === "target")?.label || "献立"}
          </h1>
          <div className="text-center font-bold opacity-90 text-sm mt-1">
            {suggestion?.date || new Date().toLocaleDateString("ja-JP")}
          </div>
        </header>

        <div className="space-y-6">
          {/* Reason */}
          <Card className="relative p-5 border-4 border-stone-800 shadow-md overflow-visible">
            <div className="absolute -top-3 -left-2 bg-amber-400 text-stone-800 text-xs font-black px-3 py-1 rounded-full border-2 border-stone-800 rotate-[-5deg]">
              POINT!
            </div>
            <p className="font-bold text-stone-700 leading-relaxed text-sm">{reason}</p>
          </Card>

          {/* Timeline */}
          <div className="space-y-4">
            <h3 className="font-black text-stone-600 text-sm ml-2">今日の食事リスト</h3>

            {resultMeals.map((meal: any, mealIndex: number) => (
              <React.Fragment key={`${meal.label}-${mealIndex}`}>
                {meal.type === "log" ? (
                  <LoggedMealCard
                    label={meal.label}
                    menu={meal.dishes?.map((d: any) => d.name).join("、") || "未入力"}
                    cal={meal.subTotalCalorie || 0}
                    icon={<Utensils size={16} />}
                  />
                ) : (
                  <div className="bg-card rounded-[2rem] border-4 border-primary overflow-hidden shadow-lg">
                    <div className="bg-primary/20 p-3 border-b-4 border-primary/30 flex justify-between items-center">
                      <h2 className="font-black text-lg text-amber-700 flex items-center gap-2">
                        <Utensils size={16} />
                        {meal.label}
                      </h2>
                      <span className="font-bold text-muted-foreground text-sm">
                        {meal.subTotalCalorie || 0} kcal
                      </span>
                    </div>

                    <div className="p-4 space-y-4">
                      {meal.dishes?.map((dish: any, dishIndex: number) => (
                        <DishItem
                          key={`${dish.name}-${dishIndex}`}
                          name={dish.name}
                          tags={dish.ingredients?.slice(0, 3) || []}
                          cal={String(dish.calorie || 0)}
                          showLink={!!dish.recipeUrl}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Total */}
          <div className="bg-rose-50 rounded-2xl p-4 text-stone-700 border-4 border-rose-300">
            <div className="flex justify-between items-end mb-3">
              <span className="font-bold text-sm text-stone-600">1日の合計</span>
              <div className="flex items-baseline gap-2">
                <div
                  className={cn(
                    "text-2xl font-black",
                    (calorieLimit || calorieGuideline) &&
                      totalCalorie > Number(calorieLimit || calorieGuideline)
                      ? "text-red-500"
                      : "text-rose-500",
                  )}
                >
                  {totalCalorie} <span className="text-sm text-stone-500">kcal</span>
                </div>
                {(calorieLimit || calorieGuideline) && (
                  <div className="text-sm font-bold text-stone-400">
                    / {calorieLimit || calorieGuideline} kcal
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <NutrientBar
                label="タンパク質"
                value={getNutrientValue("タンパク質")}
                color="bg-red-400"
              />
              <NutrientBar label="脂質" value={getNutrientValue("脂質")} color="bg-yellow-400" />
              <NutrientBar
                label="炭水化物"
                value={getNutrientValue("炭水化物")}
                color="bg-blue-400"
              />
            </div>
          </div>

          {/* Action Buttons */}
          {!currentHistoryId && (
            <div className="pt-4 w-full">
              <Button
                className="w-full h-auto py-3 bg-amber-500 hover:bg-amber-600 border-b-4 border-amber-700 text-white rounded-2xl font-black shadow active:border-b-0 active:translate-y-1 transition-all"
                onClick={handleSave}
              >
                保存する
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Meal Plan */}
      <Section title="今日の食事プラン" icon={<Utensils size={20} />}>
        <Card className="p-3 border-2">
          <p className="text-sm font-bold text-muted-foreground text-left mb-4">
            今日食べたもの・食べる予定のものを入力するか、
            <br />
            「提案」を選んでね
          </p>

          <InsertButton onClick={() => addMeal(-1)} />

          {meals.map((meal, index) => (
            <React.Fragment key={meal.id}>
              <MealInputRow meal={meal} index={index} onUpdate={updateMeal} onDelete={removeMeal} />
              <InsertButton onClick={() => addMeal(index)} />
            </React.Fragment>
          ))}
        </Card>
      </Section>

      {/* 2. Preferences */}
      <Section title="リクエスト" icon={<Squirrel size={20} />}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>使いたい材料</Label>
            <Input
              type="text"
              placeholder="例: 玉ねぎ。豚肉。豆腐"
              className="font-bold placeholder:text-muted-foreground/50"
            />
          </div>
          <div className="space-y-2">
            <Label>食べたいメニュー・ジャンル</Label>
            <Input
              type="text"
              placeholder="例: 和定食。ハンバーグセット"
              className="font-bold placeholder:text-muted-foreground/50"
            />
          </div>
        </div>
      </Section>

      {/* 3. Volume */}
      <Section title="ボリューム・構成" icon={<Bird size={20} />}>
        <div className="grid grid-cols-2 gap-3">
          <SelectButton
            active={volume === "ichiju_sansai"}
            onClick={() => setVolume("ichiju_sansai")}
            icon={<Utensils size={24} />}
          >
            一汁三菜
            <br />
            <span className="text-xs font-normal">しっかり定食</span>
          </SelectButton>
          <SelectButton
            active={volume === "ippin"}
            onClick={() => setVolume("ippin")}
            icon={<Soup size={24} />}
          >
            一品料理
            <br />
            <span className="text-xs font-normal">丼・麺など</span>
          </SelectButton>
          <SelectButton
            active={volume === "okazu"}
            onClick={() => setVolume("okazu")}
            icon={<Drumstick size={24} />}
          >
            おかずのみ
            <br />
            <span className="text-xs font-normal">主食なし</span>
          </SelectButton>
          <SelectButton
            active={volume === "snack"}
            onClick={() => setVolume("snack")}
            icon={<Coffee size={24} />}
          >
            軽食
            <br />
            <span className="text-xs font-normal">サラダ・スープなど</span>
          </SelectButton>
        </div>
      </Section>

      {/* 4. Settings */}
      <Section title="条件設定" icon={<Dog size={20} />}>
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">調理の手間</Label>
            <div className="flex bg-muted rounded-xl p-1">
              <TabButton active={effort === "manual"} onClick={() => setEffort("manual")}>
                手作り
              </TabButton>
              <TabButton
                active={effort === "use_ready_made"}
                onClick={() => setEffort("use_ready_made")}
              >
                一部既製品
              </TabButton>
              <TabButton
                active={effort === "ready_made_only"}
                onClick={() => setEffort("ready_made_only")}
              >
                スーパー・
                <wbr />
                コンビニ
              </TabButton>
              <TabButton active={effort === "eating_out"} onClick={() => setEffort("eating_out")}>
                外食
              </TabButton>
            </div>
          </div>
          <div>
            <Label className="mb-2 block">栄養バランス調整</Label>
            <div className="flex bg-muted rounded-xl p-1">
              <TabButton active={balance === "daily"} onClick={() => setBalance("daily")}>
                日単位
              </TabButton>
              <TabButton active={balance === "weekly"} onClick={() => setBalance("weekly")}>
                週単位
              </TabButton>
              <TabButton active={balance === "none"} onClick={() => setBalance("none")}>
                無視
              </TabButton>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">生年 (西暦)</Label>
              <Input
                type="number"
                placeholder="1990"
                value={birthYear}
                onChange={(e) => handleProfileChange(e.target.value, gender, calorieLimit)}
                className="font-bold text-left"
              />
            </div>
            <div>
              <Label className="mb-2 block">性別</Label>
              <div className="flex bg-muted rounded-xl p-1">
                <TabButton
                  active={gender === "male"}
                  onClick={() => handleProfileChange(birthYear, "male", calorieLimit)}
                >
                  男
                </TabButton>
                <TabButton
                  active={gender === "female"}
                  onClick={() => handleProfileChange(birthYear, "female", calorieLimit)}
                >
                  女
                </TabButton>
                <TabButton
                  active={gender === "none"}
                  onClick={() => handleProfileChange(birthYear, "none", calorieLimit)}
                >
                  指定
                  <wbr />
                  なし
                </TabButton>
              </div>
            </div>
          </div>
          <div>
            <Label className="mb-2 block">
              1日の最大カロリー (kcal)
              {calorieGuideline && (
                <span className="ml-2 text-xs text-muted-foreground font-normal">
                  (目安: {calorieGuideline} kcal)
                </span>
              )}
            </Label>
            <Input
              type="number"
              placeholder={calorieGuideline ? String(calorieGuideline) : "2000"}
              value={calorieLimit}
              onChange={(e) => handleProfileChange(birthYear, gender, e.target.value)}
              className="font-bold text-left"
            />
          </div>
        </div>
      </Section>

      {/* 5. NG Ingredients */}
      <Section title="食材・栄養制限" icon={<PawPrint size={20} />}>
        <div className="space-y-3">
          {ngIngredients.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                "flex flex-wrap items-center justify-between p-3 rounded-xl border-2 transition-all gap-2 relative group",
                item.hasLimit
                  ? "bg-card border-primary"
                  : "bg-muted/30 border-transparent hover:bg-muted/50",
              )}
            >
              <div className="flex items-center gap-3 flex-1">
                <button
                  onClick={() => updateNgIngredient(index, "hasLimit", !item.hasLimit)}
                  className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                    item.hasLimit
                      ? "bg-neutral-900 border-neutral-900"
                      : "bg-muted border-muted-foreground",
                  )}
                >
                  {item.hasLimit && <Check size={14} className="text-white" strokeWidth={4} />}
                </button>
                <Input
                  value={item.label}
                  onChange={(e) => updateNgIngredient(index, "label", e.target.value)}
                  className={cn(
                    "font-bold h-8 border-none bg-transparent focus-visible:ring-0 px-0 shadow-none",
                    item.hasLimit ? "text-foreground" : "text-muted-foreground",
                    "placeholder:text-muted-foreground/30",
                  )}
                  placeholder="食材・栄養"
                />
              </div>

              <div className="flex items-center gap-3">
                {/* NG Button */}
                <button
                  onClick={() => {
                    updateNgIngredient(index, "isNg", true);
                    updateNgIngredient(index, "hasLimit", true);
                  }}
                  className={cn(
                    "px-2 py-1 h-8 rounded-md text-xs font-bold border transition-colors shrink-0",
                    item.isNg
                      ? "bg-destructive text-destructive-foreground border-destructive"
                      : "bg-background text-muted-foreground border-border hover:bg-muted",
                  )}
                >
                  NG
                </button>

                {/* Limit Input */}
                <div
                  className={cn(
                    "flex items-center gap-1 pl-2 pr-1 h-8 rounded-md border transition-colors",
                    !item.isNg && item.hasLimit
                      ? "bg-primary/10 border-primary"
                      : "bg-muted/30 border-border",
                    item.isNg && "opacity-50",
                  )}
                >
                  <Input
                    type="number"
                    value={!item.isNg && item.hasLimit ? item.limitValue || "" : ""}
                    onChange={(e) => {
                      updateNgIngredient(index, "hasLimit", true);
                      updateNgIngredient(index, "isNg", false);
                      updateNgIngredient(index, "limitValue", e.target.value);
                    }}
                    placeholder="0"
                    disabled={item.isNg}
                    className={cn(
                      "font-bold text-center w-12 h-6 px-1 py-0 border-none bg-transparent text-lg focus-visible:ring-0 shadow-none",
                      !item.isNg && item.hasLimit ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <span className="text-xs font-bold text-muted-foreground shrink-0">
                    {item.unit || "g以下"}
                  </span>
                </div>

                {/* No Limit Button */}
                <button
                  onClick={() => {
                    updateNgIngredient(index, "hasLimit", false);
                    updateNgIngredient(index, "isNg", false);
                  }}
                  className={cn(
                    "px-2 py-1 h-8 rounded-md text-xs font-bold border transition-colors shrink-0 whitespace-nowrap",
                    !item.hasLimit && !item.isNg
                      ? "bg-stone-500 text-white border-stone-500"
                      : "bg-background text-muted-foreground border-border hover:bg-muted",
                  )}
                >
                  制限なし
                </button>
              </div>

              {/* 削除ボタン: デフォルト項目は削除不可 */}
              {!["sugar-total", "sugar", "oil", "salt"].includes(item.id) && (
                <button
                  onClick={() => removeNgIngredient(index)}
                  className="opacity-0 group-hover:opacity-100 absolute -right-2 -top-2 bg-background text-muted-foreground p-1.5 rounded-full border shadow-sm transition-all hover:text-destructive hover:border-destructive"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
          <Button
            variant="ghost"
            className="w-full border-2 border-dashed border-muted-foreground/30 text-muted-foreground hover:bg-muted/30 hover:text-stone-600 hover:border-stone-400 h-12 rounded-xl text-base font-bold transition-all"
            onClick={addNgIngredient}
          >
            <Plus size={18} className="mr-2" /> 制限項目を追加
          </Button>
          <div className="h-8" /> {/* Spacer for scrolling */}
        </div>
      </Section>

      {/* FAB */}
      <div className="sticky bottom-3 left-0 right-0">
        <Button
          onClick={handleSuggest}
          className="w-full py-6 rounded-2xl font-extrabold text-xl shadow-lg flex items-center justify-center gap-2"
        >
          献立を決める！
        </Button>
      </div>
    </div>
  );
}

// --- Components ---

const InsertButton = ({ onClick }: { onClick: () => void }) => (
  <div className="group relative h-7 w-full flex items-center justify-center cursor-pointer">
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="h-0.5 w-full bg-border rounded-full"></div>
    </div>
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        onClick={onClick}
        className="h-6 w-6 rounded-full border-dashed border-2 hover:border-primary hover:text-primary transition-all shadow-sm"
      >
        <Plus size={12} strokeWidth={4} />
      </Button>
    </div>
  </div>
);

const MealInputRow = ({
  index,
  meal,
  onDelete,
  onUpdate,
}: {
  meal: Meal;
  index: number;
  onUpdate: any;
  onDelete: any;
}) => {
  const isTarget = meal.type === "target";

  return (
    <div className="relative group/row my-2">
      <div
        className={cn(
          "flex items-center gap-2 p-2 rounded-xl border transition-all duration-300",
          isTarget
            ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/20 scale-[1.02]"
            : "border-border bg-card",
        )}
      >
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-stone-600 shrink-0",
            meal.color,
          )}
        >
          {meal.icon}
        </div>
        <div className="font-bold text-muted-foreground min-w-[3rem] text-sm shrink-0">
          {meal.label}
        </div>

        <div className="flex-1 min-w-0">
          <Input
            type="text"
            value={meal.value}
            onChange={(e) => onUpdate(index, "value", e.target.value)}
            placeholder={isTarget ? "決まっているメニュー (例: 白米)" : getPlaceholder(meal.label)}
            className={cn(
              "h-auto py-1 px-2 border-transparent bg-transparent focus-visible:ring-0 focus-visible:bg-muted/50 font-bold text-lg",
              isTarget
                ? "placeholder:text-primary/70 text-primary"
                : "placeholder:text-muted-foreground/30",
            )}
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-bold text-primary">提案する</span>
          <Button
            variant={isTarget ? "default" : "outline"}
            size="icon"
            onClick={() => onUpdate(index, "type", isTarget ? "log" : "target")}
            title={isTarget ? "手入力モードにする" : "これを提案してもらう"}
            className={cn(
              "w-8 h-8 rounded-lg transition-all",
              isTarget
                ? ""
                : "text-muted-foreground border-border hover:border-primary hover:text-primary opacity-30 hover:opacity-100",
            )}
          >
            <Check size={16} />
          </Button>
        </div>
      </div>

      {meal.isRemovable && (
        <button
          onClick={() => onDelete(index)}
          className="absolute -right-2 -top-2 bg-background text-muted-foreground p-1.5 rounded-full border shadow-sm z-10 transition-colors hover:text-destructive hover:border-destructive active:scale-90"
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
};

const LoggedMealCard = ({ cal, icon, label, menu }: any) => (
  <div className="flex items-center gap-3 opacity-70">
    <div className="w-10 flex flex-col items-center gap-1">
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
        {icon}
      </div>
    </div>
    <div className="flex-1 bg-card rounded-xl p-3 border flex justify-between items-center">
      <div>
        <span className="text-xs font-bold text-muted-foreground block">{label}</span>
        <span className="font-bold">{menu}</span>
      </div>
      <span className="font-bold text-muted-foreground text-sm">{cal} kcal</span>
    </div>
  </div>
);

const Section = ({ children, icon, title }: any) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 text-foreground">
      <div className="bg-primary/10 p-1.5 rounded-lg text-primary border border-primary/20">
        {icon}
      </div>
      <h2 className="font-extrabold text-lg">{title}</h2>
    </div>
    <div className="pl-1">{children}</div>
  </div>
);

const SelectButton = ({ active, children, icon, onClick }: any) => (
  <Button
    variant={active ? "default" : "outline"}
    onClick={onClick}
    className={cn(
      "h-auto py-3 px-2 rounded-2xl block font-bold transition-all shadow-sm whitespace-normal relative overflow-hidden",
      active ? "shadow-md transform scale-[1.02]" : "text-muted-foreground hover:text-foreground",
    )}
  >
    <div className="flex items-center justify-center gap-2 relative z-10 w-full">
      {icon && <div className="text-current opacity-80">{icon}</div>}
      <div className="text-center leading-tight">{children}</div>
    </div>
  </Button>
);

const TabButton = ({ active, children, onClick }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "flex-1 py-1.5 rounded-lg font-bold text-sm transition-all",
      active
        ? "bg-[#414141] text-white shadow-sm" // Darkened active state
        : "text-muted-foreground hover:bg-background/50",
    )}
  >
    {children}
  </button>
);

const DishItem = ({ cal, name, showLink, tags }: any) => (
  <div className="flex flex-col gap-2 border-b last:border-0 last:pb-0 pb-3">
    <div className="flex items-start justify-between">
      <div>
        <h4 className="font-bold mb-1">{name}</h4>
        <div className="flex gap-1">
          {tags.map((tag: string) => (
            <span
              key={tag}
              className="text-[10px] bg-muted text-muted-foreground px-2 py-1 rounded-md font-bold"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="text-right">
        <span className="text-sm font-black text-muted-foreground">{cal}</span>
        <span className="text-[10px] font-bold text-muted-foreground/50 block">kcal</span>
      </div>
    </div>

    {showLink && (
      <Button
        variant="ghost"
        size="sm"
        className="h-auto py-1 px-3 text-red-500 hover:text-red-600 hover:bg-red-50 bg-red-50/50 w-fit gap-2 text-xs font-bold"
      >
        <Youtube size={14} />
        作り方動画を見る
      </Button>
    )}
  </div>
);

const NutrientBar = ({ color, dark, label, value }: any) => (
  <div className="flex items-center gap-2">
    <span
      className={cn(
        "text-[10px] font-bold w-12 text-right",
        dark ? "text-stone-300" : "text-stone-400",
      )}
    >
      {label}
    </span>
    <div
      className={cn(
        "flex-1 h-3 rounded-full overflow-hidden",
        dark ? "bg-stone-700" : "bg-stone-200",
      )}
    >
      <div className={cn("h-full", color)} style={{ width: `${value}%` }}></div>
    </div>
  </div>
);
