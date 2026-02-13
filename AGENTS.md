# エージェント定義

- 役割: あなたは熟練したWebエンジニアです。保守性が高く、シンプルなコードを記述します。
- 目的: その日の献立を調整・提案するアプリケーション「きまぐれごはん」の構築。
- 行動指針:
  - 仕様の遵守: `AGENTS.md` に記載された仕様（データ構造、ルール）を正として行動する。
  - KISS原則: 必要以上に複雑な構成を避け、シンプルさを維持する。
  - リリースノート: `docs/releases/` 配下に `YYYYMMDD_M.m.md` (例: `20260202_1.0.md`) の形式で作成する。
  - 既知の問題: `docs/known_issues/` 配下に `YYYYMMDDHHMMSS_簡潔な問題名.md` (例: `20260201170000_firestore_connection_issue.md`) の形式で作成・管理する。

# [0] プロジェクト概要

- 名称: きまぐれごはん
- コンセプト: 計画的に料理を決めるのではなく、その日の献立を調整するというのが目的のアプリ。
- キャッチコピー: 「計画しない」が、いちばん続く。食べたものと気分を入力するだけで、今日を『100点』にする献立アプリ
- ターゲット: 毎日の献立決めに疲れを感じており、冷蔵庫の余り物やその日の気分・体調に合わせて柔軟に食事を決めたいユーザー。
- デザイン方針: 動物のキャラクターやアイコンを多用し、毎日の献立決めを楽しく、心理的ハードルを下げる温かみのあるデザイン。

# [1] 定義

- 「食事プラン」: ユーザーが入力する、その日の食事の予定や実績。
  - 「記録(Log)」: 既に食べたもの、または食べる予定が決まっているもの。
  - 「提案(Target)」: アプリに対して献立の提案を求める枠。
- 「献立」: 食事プランに基づき、AIが生成・補完した1日の食事内容の完全なリスト。
- 「ユーザーデータ」: 各ユーザーのデータは独立して管理される (`users/{userId}` 配下)。

# [2] データ構造 (TypeScript Interface)

```typescript
// --- Firestore & App State Structure ---

interface UserConfig {
  dailyCalorieLimit?: number;
  ngIngredients: NgIngredients;
}

interface NgIngredients {
  carbo: { enabled: boolean; max?: number }; // 糖質
  wheat: { enabled: boolean; max?: number }; // 小麦
  sugar: { enabled: boolean; max?: number }; // 砂糖
  dairy: { enabled: boolean; max?: number }; // 乳製品
  oil: { enabled: boolean; max?: number };   // 油
}

// Firestore Path: users/{userId}/daily_menus/{dateString}
// dateString format: "YYYY-MM-DD"
interface DailyMenuDocument {
  id: string; // "YYYY-MM-DD"
  date: string; // ISO 8601 or "YYYY-MM-DD"
  input: MenuInput;
  output: MenuOutput;
  createdAt: string;
  updatedAt: string;
}

// --- Input (Request to Gemini) ---

interface MenuInput {
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

interface MealPlanInput {
  label: string; // "朝", "昼", "間食", "夜食" 等
  type: "log" | "target";
  content?: string; // type="log" の場合の料理名。type="target" の場合は、その行に含める固定メニュー（リクエスト）として扱う。
}

// --- Output (Response from Gemini) ---

interface MenuOutput {
  meals: MealOutput[];
  totalCalorie: number;
  totalNutrients: Nutrient[];
  reason: string; // 決定理由
  date: string;
}

interface MealOutput {
  label: string;
  type: "log" | "target";
  dishes: Dish[];
  subTotalCalorie: number;
  subTotalNutrients: Nutrient[];
}

interface Dish {
  name: string;
  ingredients?: string[]; // 提案時のみ
  calorie: number; // 記録時は概算、提案時は計算値
  nutrients: Nutrient[]; // 記録時は概算
  recipeUrl?: string; // 提案時のみ (調理方法動画リンク)
}

interface Nutrient {
  name: string; // タンパク質, 脂質, 炭水化物 等
  amount: number;
  unit: string; // g, mg 等
}
```

# [3] 機能要件

## 1. 献立調整・提案 (Gemini API連携)

- 入力インターフェース:
  - 1日の食事プラン（食べたもの、提案してほしい枠）を時系列で入力。
    - 具体的な商品名が入力された場合、検索して栄養素を（概算値として）埋める処理を行う。説明文等で商品名入力が有効であることを明示する。
  - 冷蔵庫の在庫や気分、NG食材などの条件設定。
- 生成ロジック (Gemini 2.0 Flash):
  - ユーザーの「記録」データを考慮し、1日または週単位での栄養バランスを調整するように「提案」枠の料理を生成する。
  - 「記録」された料理のおおよそのカロリー・栄養素も推測して算出する。
  - 提案料理に対しては、調理方法がわかる動画リンク（YouTube検索結果URL等）を生成する。
- 出力:
  - 1日の完全な献立リスト、栄養サマリー、提案の根拠（「昼が重かったので夜は軽くしました」等）を表示。

## 2. 履歴管理・リスト表示

- データ保存:
  - 確定した献立は Firestore の `users/{userId}/daily_menus` コレクションに保存する。
  - ドキュメントIDは `YYYY-MM-DD` 形式とし、日付による検索・取得を高速化する。
- リスト表示:
  - 過去の献立をカレンダーまたはリスト形式で閲覧可能にする。
  - 「何を食べたか」のログとしても機能させる。

## 3. 認証・管理

- 認証基盤:
  - Firebase Authを使用。Googleログインおよび匿名ログインをサポート。
- 利用制限:
  - FirestoreのRead/Write回数削減のため、頻繁な更新が必要ないマスタデータ等はクライアント側でキャッシュする等の配慮を行う。

# [4] 技術スタック

- Frontend: Next.js (App Router), Tailwind CSS
  - UI Library: shadcn/ui (Radix UIベース。アクセシビリティが高く、Tailwindでのカスタマイズが容易で、提示されたデザインの洗練に適している)
- Backend: Firebase Functions (Node.js), Express, Gemini API (Google Gen AI SDK), Firebase Auth
- Mobile Wrapper: BubbleWrap (Android TWA)
- Package Manager: pnpm
- Finder/Formatter: Biome
- Storage: Firestore (Production & Local Emulator)

# [5] ルール

## 1. パッケージ管理 (Node.js)

- pnpm を使用すること。
  - いかなる作業用プロジェクトであっても、指示がない限り他のパッケージ管理ツール（npm, yarn 等）の使用は禁止。

## 2. コード品質管理 (Linter / Formatter)

- Formatter: Biome を使用する。
- Linter: ESLint を使用し、perfectionist プラグインを導入すること。
  - 設定は `repos/eslint.config.mjs` (存在する場合) をベースとしてプロジェクトに合わせて拡張する。
  - インポート、オブジェクト、変数宣言のソートを徹底すること。
  - 実装サイクルの最後に Linter によるチェック・修正、および Formatter による整形を実行すること。

## 3. 作業用一時ディレクトリ

- プロジェクト直下に `.tmp` ディレクトリを作成して使用すること。
  - このディレクトリは `.gitignore` に追加して Git の管理対象外とし、作業過程や一時的な出力を保持するために使用する。
  - ログファイルなどは可能な限り `/.tmp` ディレクトリに出力し、検証完了後に `/.tmp` 内を空にすること。

## 4. ドキュメンテーション

- Markdownファイル (`.md`) 内で強調表示（`**` で囲むボールド体など）を過度に使用しないこと。必要な箇所のみに留める。

# [6] 開発サイクル

以下のフローに従って開発を進めること。

1. 計画策定 (Planning)
   - プロンプトの最初に `[実装計画]` がある場合のみ、実装計画を策定する。
   - `docs/plans/` 配下に `N_計画名.md` (Nは連番) の形式で保存する。
   - 手動確認チェックリスト: 計画書内には必ず「手動確認チェックリスト」のセクションまたはチェックボックスによる項目を設け、人間による動作確認を促す構成とする。

2. ドキュメント更新 (Documentation)
   - ドキュメントファースト: 実装の前に設計（`AGENTS.md`）を更新し、整合性を保つ。
   - コード変更が生じる場合、必ず本ドキュメント `AGENTS.md` の該当箇所（データ構造、機能要件など）を先に更新する。

3. 実装 (Implementation)
   - KISS原則に従い、シンプルに実装する。

4. 品質管理・検証 (Verification)
   - 実装サイクルの最後に、以下のコマンドを実行して品質を検証する。これを通過しないコードは完了とみなさない。
     - Verification Loop: `make verify`
       - Linter (Biome) によるチェックと自動修正が行われる。
       - `pnpm build` が実行され、ビルドエラーがないか確認される。
     - Log Cleanup: `make verify` によって `.tmp/` 内がクリーンアップされたことを確認する。

# [7] リリース・エンジニアリング

## 1. 段階的リリース計画

1. 初期リリース: PWA対応のWebページ＋BubbleWrapによるAndroidアプリ (TWA)。
2. 次期リリース: 十分な需要が確認でき次第、Flutter等を用いたネイティブアプリ化を検討。

## 2. Web Deployment (Firebase)

- コマンド: `make deploy` または `pnpm build && firebase deploy`
- Hosting設定: SPA/SSGとして適切に配信設定を行う。

## 3. Android App (BubbleWrap)

- 構成ファイル: `twa-manifest.json` (プロジェクトルート)
- ビルド: `bubblewrap build` または `make android-build`

# [8] ディレクトリ構造

- frontend: Next.js application
  - app: App Router root
  - components: UI Components (shadcn/ui components included)
  - lib: Utility functions, Firebase init
  - types: TypeScript definitions
  - public: Static assets
- backend: Firebase Functions
  - src: Backend logic (API endpoints, Gemini integration)
- docs: Documentation & Plans
- twa-manifest.json: Android TWA configuration
- android-keystore.jks: Android signing key
- store_icon.png: Play Store icon asset