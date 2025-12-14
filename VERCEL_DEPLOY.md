# Vercel デプロイガイド - NeckRange AI

## 🚀 Vercelへのデプロイ方法

### 前提条件
- GitHubリポジトリに最新コードがプッシュ済み
- Vercelアカウント（無料で作成可能）

---

## 📋 デプロイ手順

### 1. Vercelプロジェクトを作成

1. **Vercel公式サイトにアクセス**
   - URL: https://vercel.com/
   - 「Sign Up」または「Login」でアカウント作成/ログイン

2. **「Add New Project」をクリック**
   - ダッシュボード右上の「Add New...」→「Project」

3. **GitHubリポジトリを連携**
   - 「Import Git Repository」でGitHubを選択
   - リポジトリ: `toyomitsu32/NeckRange-AI` を選択
   - 「Import」をクリック

### 2. ビルド設定

自動検出される設定を確認：

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
Development Command: npm run dev
```

**重要**: これらの設定は `vercel.json` で自動的に設定されます。

### 3. 環境変数を設定

「Environment Variables」セクションで以下を追加：

```
NODE_VERSION = 18
```

### 4. デプロイ実行

「Deploy」ボタンをクリックして、デプロイを開始します。

---

## ✅ デプロイ成功の確認

### デプロイログで確認すべき項目

1. **インストール成功**
   ```
   Running "npm install"
   added 253 packages
   ```

2. **ビルド成功**
   ```
   Running "npm run build"
   vite v5.4.21 building for production...
   ✓ built in 2.80s
   ```

3. **ファイル生成確認**
   ```
   dist/index.html
   dist/assets/index-xxx.css
   dist/assets/index-xxx.js
   ```

### アプリケーション動作確認

1. **URL取得**
   - デプロイ完了後、Vercelが自動生成したURL（例: `https://neckrange-ai.vercel.app`）を取得

2. **ページ表示確認**
   - URLにアクセスし、以下を確認：
     - ✅ 「NeckRange AI へようこそ」が表示される
     - ✅ 「測定を開始する」ボタンが表示される
     - ✅ 背景グラデーションが表示される

3. **ブラウザコンソール確認**
   - F12でDeveloper Toolsを開く
   - **Consoleタブ**: エラーがないことを確認
   - **Networkタブ**: `index-xxx.js` のContent-Typeが `text/javascript` であることを確認

4. **機能確認**
   - 「測定を開始する」ボタンをクリック
   - カメラアクセス許可を求められることを確認
   - 各ステップが正常に動作することを確認

---

## 🔧 Vercelの利点

### Cloudflare Pagesとの違い

| 項目 | Vercel | Cloudflare Pages |
|------|--------|------------------|
| **MIMEタイプ設定** | ✅ 自動的に正しく設定 | ❌ 手動設定が必要 |
| **ビルド設定** | ✅ シンプルで直感的 | ❌ wrangler.tomlとの競合あり |
| **SPAルーティング** | ✅ 自動対応 | 手動で_redirects必要 |
| **Functionsサポート** | ✅ 簡単に追加可能 | 複雑な設定が必要 |
| **デプロイ速度** | ✅ 高速（1-2分） | 普通（2-5分） |
| **無料枠** | 月100GB転送量 | 無制限 |

---

## 🛠️ トラブルシューティング

### ❌ ビルドエラーが発生した場合

#### **エラー例1: TypeScriptエラー**

```bash
error TS2304: Cannot find name 'React'
```

**解決方法**: 既に修正済み（`src/App.tsx`, `src/components/PoseAnalysis.tsx`）

#### **エラー例2: 依存関係エラー**

```bash
Cannot find module '@mediapipe/pose'
```

**解決方法**:
```bash
cd /home/user/webapp
npm install
git add package-lock.json
git commit -m "fix: 依存関係を修正"
git push origin main
```

### ❌ デプロイ後に真っ白なページが表示される

**原因**: MIMEタイプの問題、または相対パスの問題

**解決方法**: 
1. ブラウザキャッシュをクリア（Ctrl + Shift + R）
2. `vercel.json` が正しく設定されているか確認
3. `vite.config.ts` の `base: './'` が設定されているか確認

### ❌ JavaScript/CSSが読み込まれない

**確認項目**:
1. **Network TabでContent-Typeを確認**
   ```
   index-xxx.js → Content-Type: text/javascript ✅
   index-xxx.css → Content-Type: text/css ✅
   ```

2. **vercel.jsonのheaders設定を確認**

---

## 📚 関連ドキュメント

- `README.md` - プロジェクト概要
- `REQUIREMENTS.md` - 要件定義書
- `BUILD_INSTRUCTIONS.md` - ビルド手順
- `DEPLOYMENT.md` - デプロイメント総合ガイド（Cloudflare/Vercel/Netlify対応）

---

## 🎯 推奨: カスタムドメインの設定

Vercelでは無料でカスタムドメインを設定できます：

1. Vercelダッシュボードで「Settings」→「Domains」
2. ドメイン名を入力（例: `neckrange-ai.com`）
3. DNSレコードを設定（VercelがGUI で案内）

---

## ✨ デプロイ完了！

**Vercel URL**: `https://neckrange-ai.vercel.app` (自動生成)

Vercelへのデプロイで、MIMEタイプエラーや設定の複雑さが解消されます！

何か問題があれば、デプロイログとエラーメッセージを確認してください。
