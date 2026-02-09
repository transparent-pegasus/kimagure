# きまぐれごはん

「計画しない」が、いちばん続く。
その日の気分と食べたものを入力するだけで、「今日を100点にする献立」を提案するアプリです。

## 主な機能

1. 食事プランの入力
   - 朝・昼・夜の3枠に食べたもの・食べる予定のものを入力。
   - 間食や夜食などの枠を自由に追加可能。
   - 入力欄を「提案」に切り替えるとAIが献立を生成。
2. AIによる献立提案
   - 管理栄養士の視点で1日の栄養バランスを調整。
   - 既に食べたものの栄養素を推定し、不足分を補うメニューを提案。
   - 提案理由とYouTube検索リンクを付与。
3. 条件設定
   - 調理の手間: 手作り / 一部既製品 / スーパー・コンビニ / 外食。
   - NG食材・栄養制限の設定。
   - 年齢・性別に応じたカロリー目安の自動表示。
4. 履歴管理
   - 過去30日分の献立を一覧表示。

## 技術スタック

- Frontend: Next.js 15, shadcn/ui, Tailwind CSS, Biome
- Backend: Firebase Functions (Node.js)
- Database: Firestore
- Authentication: Firebase Authentication
- AI: Google Gemini API
- Tools: pnpm, Make, Firebase CLI

## 環境構築 (Windows)

本プロジェクトでは、開発ツールの管理にScoop、タスクランナーにMake、Node.jsのバージョン管理にfnmを使用することを推奨しています。

### 1. 必須ツールのインストール

PowerShellで以下を実行し、Scoop, Make, fnmをインストールしてください。

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex
scoop install make fnm
```

fnmを使用して `.nvmrc` に記載されたバージョンのNode.jsをインストール・適用します。

```powershell
fnm install
fnm use
```

pnpmをインストールします。

```powershell
corepack enable
corepack prepare pnpm@latest --activate
```

### 2. 依存関係のインストール

プロジェクトのルートディレクトリで実行してください。

```powershell
pnpm install
```

### 3. Firebaseプロジェクトの設定

Firebase Consoleで新しいプロジェクトを作成し、以下を有効化してください。

- Authentication: Googleログイン、匿名ログイン
- Firestore Database
- Functions
- Hosting

Firebase CLIでログインし、プロジェクトを選択します。

```powershell
npx firebase login
npx firebase use --add
```

### 4. 環境変数の設定

#### フロントエンド (ローカル開発用)

`frontend/.env` ファイルを作成し、Firebase Consoleから取得した値を設定します。

```powershell
Copy-Item frontend/.env.example frontend/.env
```

`.env` を編集:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# ローカル開発時のエミュレータ設定
NEXT_PUBLIC_USE_EMULATOR=true
NEXT_PUBLIC_FUNCTIONS_EMULATOR_URL=http://127.0.0.1:5001

# Google Analytics (本番のみ)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

#### バックエンド (ローカル開発用)

`backend/.env` ファイルを作成します。

```powershell
New-Item backend/.env -ItemType File
```

`.env` を編集:

```
GEMINI_API_KEY=your_gemini_api_key
```

### 5. シークレットの設定 (本番環境)

フロントエンドとバックエンドで異なるシークレット管理方式を使用します。

#### フロントエンド: GitHub Secrets

フロントエンドの環境変数はビルド時に埋め込まれるため、GitHub Actionsのワークフローで使用するSecrets (Repository secrets) に登録してください。

GitHub Repository > Settings > Secrets and variables > Actions で以下を登録:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`

CI/CDワークフロー内で `.env` ファイルを生成し、ビルドを実行します。

#### バックエンド: GCP Secret Manager

Firebase Functions (Cloud Functions) のシークレットはGoogle Cloud Secret Managerを使用します。

```powershell
# Firebase CLIでシークレットを設定
npx firebase functions:secrets:set GEMINI_API_KEY
```

設定後、バックエンドのコードで `defineSecret()` を使用してシークレットにアクセスします。

シークレットを確認する場合:

```powershell
npx firebase functions:secrets:access GEMINI_API_KEY
```

## 開発・運用

このプロジェクトは `Makefile` によりタスクが管理されています。すべてのコマンドはPowerShell上で実行可能です。

### ローカル開発

```powershell
make dev
```

動作:
1. `make build-local` が実行され、フロントエンド・バックエンドがビルドされます。
2. Firebase Emulatorsが起動します。
3. `http://localhost:5000` でアプリにアクセスできます。

エミュレータのUIは `http://localhost:4000` で確認できます。

エミュレータを停止する場合:

```powershell
make dev-stop
```

### ビルドとデプロイ

```powershell
# 本番ビルド
make build

# デプロイ (自動的に make build が実行されます)
make deploy
```

リリースノート: ビルド時に `scripts/generate-releases.js` が実行され、`docs/releases/*.md` からHTML形式のリリースノートが `frontend/public/releases/` に生成されます。

### コード品質管理

プロジェクトの規定により、実装サイクルの最後に必ず実行してください。

```powershell
# 検証サイクル (lint, test, build を一括実行)
make verify

# 個別実行
make lint    # 静的解析 (Biome & ESLint)
make format  # 自動整形 (Biome)
make fix     # 自動修正を適用
```

## ディレクトリ構造

```
kimagure/
├── frontend/          # Next.js アプリケーション
│   ├── app/           # App Router
│   ├── components/    # UIコンポーネント
│   ├── lib/           # ユーティリティ、Firebase初期化
│   └── public/        # 静的アセット
├── backend/           # Firebase Functions
│   └── src/           # APIエンドポイント、Gemini連携
├── docs/              # ドキュメント
│   ├── plans/         # 実装計画
│   └── releases/      # リリースノート
└── Makefile           # タスクランナー設定
```

## トラブルシューティング

### エミュレータが起動しない

ポートが既に使用されている可能性があります。

```powershell
make dev-stop
make dev
```

### Firestoreのルールエラー

`firestore.rules` を確認し、認証済みユーザーのみアクセス可能になっているか確認してください。

### 本番環境でGemini APIが動作しない

GCP Secret Managerにシークレットが正しく設定されているか確認してください。

```powershell
npx firebase functions:secrets:access GEMINI_API_KEY
```

## ライセンス

This project is private.
