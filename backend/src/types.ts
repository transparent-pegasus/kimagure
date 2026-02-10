export interface UserConfig {
  dailyCalorieLimit?: number;
  ngIngredients: NgIngredients;
}

export interface NgIngredients {
  carbo: { enabled: boolean; max?: number }; // 糖質
  wheat: { enabled: boolean; max?: number }; // 小麦
  sugar: { enabled: boolean; max?: number }; // 砂糖
  dairy: { enabled: boolean; max?: number }; // 乳製品
  oil: { enabled: boolean; max?: number }; // 油
  [key: string]: { enabled: boolean; max?: number } | undefined;
}

// Firestore Path: users/{userId}/daily_menus/{dateString}
// dateString format: "YYYY-MM-DD"
export interface DailyMenuDocument {
  id: string; // "YYYY-MM-DD"
  date: string; // ISO 8601 or "YYYY-MM-DD"
  input: MenuInput;
  output: MenuOutput;
  createdAt: string;
  updatedAt: string;
}

export type HistoryItem = DailyMenuDocument;

// --- Input (Request to Gemini) ---

export interface MenuInput {
  mealPlans: MealPlanInput[];
  preferences: {
    ingredients?: string; // 使いたい材料
    dishCategory?: string; // 食べたい料理カテゴリ
    volume: "ichiju_sansai" | "ippin" | "okazu" | "snack"; // 一汁三菜, 一品, おかず, 軽食
    effort: "ready_made_only" | "use_ready_made" | "manual"; // 既製品のみ, あり, なし
    calorieLimit?: number;
    balanceAdjustment: "daily" | "weekly" | "none";
    ngIngredients: NgIngredients;
  };
}

export interface MealPlanInput {
  label: string; // "朝", "昼", "間食", "夜食" 等
  type: "log" | "target";
  content?: string; // type="log" の場合の料理名。type="target" の場合は、その行に含める固定メニュー（リクエスト）として扱う。
}

// --- Output (Response from Gemini) ---

export interface MenuOutput {
  meals: MealOutput[];
  totalCalorie: number;
  totalNutrients: Nutrient[];
  reason: string; // 決定理由
  date: string;
}

export interface MealOutput {
  label: string;
  type: "log" | "target";
  dishes: Dish[];
  subTotalCalorie: number;
  subTotalNutrients: Nutrient[];
}

export interface Dish {
  name: string;
  ingredients?: string[]; // 提案時のみ
  calorie: number; // 記録時は概算、提案時は計算値
  nutrients: Nutrient[]; // 記録時は概算
  recipeUrl?: string; // 提案時のみ (調理方法動画リンク)
}

export interface Nutrient {
  name: string; // タンパク質, 脂質, 炭水化物 等
  amount: number;
  unit: string; // g, mg 等
}
