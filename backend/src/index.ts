import { GoogleGenerativeAI, type Schema, SchemaType } from "@google/generative-ai";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { defineSecret } from "firebase-functions/params";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import type { DailyMenuDocument, MenuInput, MenuOutput } from "./types";

admin.initializeApp();

const apiKey = defineSecret("GEMINI_API_KEY");

// Schema for structured output
const nutrientSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    name: { type: SchemaType.STRING },
    amount: { type: SchemaType.NUMBER },
    unit: { type: SchemaType.STRING },
  },
  required: ["name", "amount", "unit"],
};

const dishSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    name: { type: SchemaType.STRING },
    ingredients: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    calorie: { type: SchemaType.NUMBER },
    nutrients: { type: SchemaType.ARRAY, items: nutrientSchema },
    recipeUrl: { type: SchemaType.STRING },
  },
  required: ["name", "calorie", "nutrients"],
};

const mealOutputSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    label: { type: SchemaType.STRING },
    type: { type: SchemaType.STRING, enum: ["log", "target"], format: "enum" },
    dishes: { type: SchemaType.ARRAY, items: dishSchema },
    subTotalCalorie: { type: SchemaType.NUMBER },
    subTotalNutrients: { type: SchemaType.ARRAY, items: nutrientSchema },
  },
  required: ["label", "type", "dishes", "subTotalCalorie", "subTotalNutrients"],
};

const menuOutputSchema: Schema = {
  type: SchemaType.OBJECT,
  description: "Suggested menu output",
  properties: {
    meals: { type: SchemaType.ARRAY, items: mealOutputSchema },
    totalCalorie: { type: SchemaType.NUMBER },
    totalNutrients: { type: SchemaType.ARRAY, items: nutrientSchema },
    reason: { type: SchemaType.STRING },
    date: { type: SchemaType.STRING },
  },
  required: ["meals", "totalCalorie", "totalNutrients", "reason", "date"],
};

// Define execution limit param (default 5)
// Note: We'll use process.env for simplicity in GitHub Actions injection,
// but defineInt is cleaner for Firebase. Let's support both.
const dailyLimit = process.env.DAILY_EXECUTION_LIMIT
  ? Number(process.env.DAILY_EXECUTION_LIMIT)
  : 5;

export const suggest_menu = onCall(
  { secrets: [apiKey], maxInstances: 10, timeoutSeconds: 60 },
  async (request): Promise<MenuOutput> => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be logged in.");
    }

    const { input, date } = request.data as {
      input: MenuInput;
      date: string;
    };
    const userId = request.auth.uid;
    // Use server time for execution tracking
    // Adjust to JST for user convenience (optional, but 9 hours offset)
    const now = new Date();
    const jstOffset = 9 * 60 * 60 * 1000;
    const jstDate = new Date(now.getTime() + jstOffset).toISOString().split("T")[0];

    const userRef = admin.firestore().collection("users").doc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.data() || {};
    const profile = userData.profile || {};
    const usage = userData.usage || { date: "", count: 0 };

    // Check limit
    if (usage.date === jstDate && usage.count >= dailyLimit) {
      throw new HttpsError(
        "resource-exhausted",
        `1日の実行回数制限(${dailyLimit}回)を超えました。明日またお試しください。`,
      );
    }

    // Increment usage
    const newCount = usage.date === jstDate ? usage.count + 1 : 1;
    await userRef.set(
      {
        usage: { date: jstDate, count: newCount },
      },
      { merge: true },
    );

    // Initialize with secret (needs to be accessed inside function)
    const gemini = new GoogleGenerativeAI(apiKey.value());
    // ... rest of the function
    const model = gemini.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: menuOutputSchema,
      },
    });

    const prompt = `
      あなたはプロの管理栄養士です。ユーザーの食事記録と希望に基づいて、今日1日の献立を提案・補完してください。

      【ルール】
      1. input.mealPlans のうち、type="log" のものはユーザーが食べた/食べる予定のものです。これらは変更せず、栄養素を推定して出力に含めてください。
      2. input.mealPlans のうち、type="target" のものはあなたの提案枠です。全体の栄養バランス（総カロリー、PFCバランス）が整うようにメニューを決定してください。
         - もし content (例: "白米") が入力されている場合は、**必ずそのメニューを含めて**、それに合うおかず等を提案してください。
      3. 提案する料理には、具体的な料理名、概算カロリー、主要栄養素を含めてください。
      4. 提案理由 (reason) は、ユーザーが納得できる、短く親しみやすい文章（例：「昼が重めだったので夜は野菜中心にしました！」）で出力してください。
      5. 調理の手間 (effort) や NG食材 (ngIngredients) の設定を厳守してください。
      6. **調理の手間が "ready_made_only"（購入品のみ）または "use_ready_made"（一部既製品）の場合**:
         - どのコンビニ（セブン-イレブン、ファミリーマート、ローソン等）でも購入できる一般的な商品のみを提案してください。
         - 例: おにぎり、サンドイッチ、幕の内弁当、サラダチキン、野菜サラダ、カップ味噌汁、ヨーグルト、バナナなど
         - 「野菜と鶏むね肉の和え物」のような一般的でない商品は避けてください。
      7. **調理の手間が "eating_out"（外食）の場合**:
         - ファミリーレストラン、牛丼チェーン、ラーメン店など、一般的な外食チェーンで注文できるメニューを提案してください。

      【入力データ】
      Date: ${date}
      User Profile: ${JSON.stringify(profile)}
      User Input: ${JSON.stringify(input)}
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      const jsonString = response.text();
      const output = JSON.parse(jsonString) as MenuOutput;

      // Ensure date is set correct
      output.date = date;

      return output;
    } catch (error: any) {
      logger.error("Gemini API Error", error);
      throw new HttpsError("internal", "Failed to generate menu suggestions.", error);
    }
  },
);

export const save_history = onCall(
  { maxInstances: 10 },
  async (request): Promise<{ success: boolean; id: string }> => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be logged in.");
    }

    const data = request.data as DailyMenuDocument;
    const userId = request.auth.uid;

    if (!data.date || !data.output) {
      throw new HttpsError("invalid-argument", "Valid data is required.");
    }

    try {
      await admin
        .firestore()
        .collection("users")
        .doc(userId)
        .collection("daily_menus")
        .doc(data.date)
        .set(
          {
            ...data,
            updatedAt: new Date().toISOString(),
            // Ensure createdAt is only set if not exists? But usually overwrite is fine for "save" action
            createdAt: data.createdAt || new Date().toISOString(),
          },
          { merge: true },
        );

      return { success: true, id: data.date };
    } catch (error: any) {
      logger.error("Firestore Save Error", error);
      throw new HttpsError("internal", "Failed to save menu history.", error);
    }
  },
);
export const update_user_profile = onCall(
  { maxInstances: 10 },
  async (request): Promise<{ success: boolean }> => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be logged in.");
    }

    const { profile } = request.data as { profile: any };
    const userId = request.auth.uid;

    try {
      await admin.firestore().collection("users").doc(userId).set(
        {
          profile,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );

      return { success: true };
    } catch (error: any) {
      throw new HttpsError("internal", "Failed to update user profile.", error);
    }
  },
);

export const get_user_profile = onCall({ maxInstances: 10 }, async (request): Promise<any> => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }

  const userId = request.auth.uid;

  try {
    const doc = await admin.firestore().collection("users").doc(userId).get();
    return doc.data()?.profile || null;
  } catch (error: any) {
    throw new HttpsError("internal", "Failed to fetch user profile.", error);
  }
});
