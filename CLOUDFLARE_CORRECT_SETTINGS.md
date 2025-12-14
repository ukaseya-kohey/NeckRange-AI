# Cloudflare Pages 正しい設定

## ⚠️ 重要: Framework Preset の設定

Cloudflare Pagesで「Vite」を選択すると、VitePress用の設定が適用されます。
このプロジェクトは通常のVite + Reactなので、**「None」**を選択してください。

---

## ✅ 正しい設定

### Settings → Builds & deployments

#### Framework preset
```
None
```
**注意**: 「Vite」ではなく「None」を選択！

#### Build command
```
npm run build
```

#### Build output directory
```
dist
```

#### Root directory
```
/
```
（空欄でもOK）

---

## 🔧 環境変数

### Settings → Environment variables

```
Name: NODE_VERSION
Value: 18
Environment: Production
```

---

## 📋 設定手順（画像付き説明）

### ステップ1: プロジェクトを開く

1. Cloudflare Pagesダッシュボードにアクセス
2. プロジェクト（neckrange-ai）をクリック

### ステップ2: 設定を開く

1. 左側メニューから **Settings** をクリック
2. **Builds & deployments** をクリック

### ステップ3: Build configuration を編集

1. **Build configuration** セクションを見つける
2. 右上の **Configure Build** ボタンをクリック

### ステップ4: 設定を入力

**Framework preset**:
- ドロップダウンをクリック
- **「None」** を選択
- 「Vite」は選択しない！

**Build command**:
```
npm run build
```

**Build output directory**:
```
dist
```

**Root directory**:
```
/
```
または空欄

### ステップ5: 環境変数を追加

1. 下にスクロールして **Environment variables** セクションを見つける
2. **Add variable** ボタンをクリック
3. 以下を入力:
   - **Variable name**: `NODE_VERSION`
   - **Value**: `18`
   - **Environment**: `Production` を選択
4. **Save** をクリック

### ステップ6: 保存して再デプロイ

1. ページ下部の **Save** ボタンをクリック
2. 自動的に再デプロイが開始される

---

## 🔍 なぜ「None」を選択するのか？

### Framework preset の違い

| Preset | 用途 | デフォルトコマンド |
|--------|------|-------------------|
| **None** | カスタム設定 | 指定したコマンドを実行 |
| **Vite** | VitePress（ドキュメント） | `npm run docs:build` |
| **React** | Create React App | `npm run build` |
| **Vue** | Vue CLI | `npm run build` |

このプロジェクトは:
- ✅ Vite（ビルドツール）を使用
- ✅ React（フレームワーク）を使用
- ✅ カスタムビルドコマンド: `npm run build`

→ **「None」を選択して、カスタムコマンドを使用**

---

## 📊 期待されるデプロイログ

設定が正しければ:

```
✓ Cloning repository...
✓ Installing dependencies...
  npm ci

✓ Building application...
  npm run build
  
  > neckrange-ai@1.0.0 build
  > tsc && vite build
  
  vite v5.4.21 building for production...
  ✓ 42 modules transformed.
  dist/index.html                   0.56 kB
  dist/assets/index-_S3G8yAk.css   14.39 kB
  dist/assets/index-CPFt5LlP.js   210.61 kB
  ✓ built in 2.5s

✓ Detected Functions directory
✓ Compiled 1 Function successfully
✓ Uploading...
✓ Deployment successful!
```

---

## ❌ よくある間違い

### 間違い1: Framework preset を「Vite」に設定

**結果**:
```
Error: npm run docs:build failed
Command not found
```

**解決**: 「None」に変更

### 間違い2: Build command が空欄

**結果**:
```
No build command specified
Skipping build step
Error: Output directory "dist" not found
```

**解決**: `npm run build` を入力

### 間違い3: Build output directory が空欄

**結果**:
```
Error: Could not find build output
```

**解決**: `dist` を入力

---

## 🆘 トラブルシューティング

### 設定を変更したのにエラーが続く

1. **保存されているか確認**
   - Save ボタンをクリックしたか？
   - ページを再読み込みして設定を確認

2. **キャッシュをクリア**
   - Settings → General → **Purge cache**

3. **再デプロイをトリガー**
   - Deployments → **Retry deployment**

### どこで設定を変更するかわからない

**パス**: 
```
Cloudflare Pages Dashboard 
→ プロジェクトを選択
→ Settings（左メニュー）
→ Builds & deployments
→ Configure Build（ボタン）
```

---

## ✅ 設定完了後のチェックリスト

- [ ] Framework preset: **None** に設定
- [ ] Build command: `npm run build` を入力
- [ ] Build output directory: `dist` を入力
- [ ] Environment variable: `NODE_VERSION = 18` を追加
- [ ] **Save** ボタンをクリック
- [ ] 再デプロイが開始された
- [ ] デプロイログで `✓ built in X.Xs` を確認
- [ ] Status: Success ✅

---

## 🎯 最終確認

正しく設定されていれば、Deploymentsタブで:

```
Status: Success ✅
Build time: ~2-3 minutes
Deployed to: https://your-project.pages.dev
```

が表示され、ページが正常に表示されるはずです！

---

最終更新: 2024-12-14
