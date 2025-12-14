# Cloudflare Pages デプロイチェックリスト

## ✅ プッシュ完了

すべての修正がGitHubにプッシュされました！

---

## 🔧 Cloudflare Pages 設定確認

### 1. ビルド設定

Cloudflare Pagesのダッシュボードで以下を確認してください：

#### ビルドコマンド
```bash
npm run build
```

#### ビルド出力ディレクトリ
```
dist
```

#### ルートディレクトリ
```
/
```
（プロジェクトルート）

#### Node.js バージョン
```
18
```
または
```
18.x
```

---

### 2. 環境変数

現時点では環境変数は**不要**です。
（すべてブラウザ内で処理されます）

---

### 3. ビルドログの確認

デプロイ時に以下のログが出力されているか確認：

```
✓ 42 modules transformed.
dist/index.html                   0.55 kB
dist/assets/index-_S3G8yAk.css   14.39 kB
dist/assets/index-CPFt5LlP.js   210.61 kB
✓ built in 2.80s
```

---

## 🐛 真っ白なページの原因と対処法

### 原因1: ビルド出力ディレクトリが間違っている

**確認方法:**
- Cloudflare Pagesの設定で「Build output directory」を確認
- `dist` になっているか確認

**対処法:**
- Cloudflare Pagesの「Settings」→「Builds & deployments」で `dist` に変更
- 再デプロイを実行

---

### 原因2: ビルドコマンドが間違っている

**確認方法:**
- ビルドコマンドが `npm run build` または `npm install && npm run build` になっているか

**対処法:**
- 正しいビルドコマンドに変更
- 再デプロイを実行

---

### 原因3: Node.jsバージョンが古い

**確認方法:**
- 環境変数に `NODE_VERSION` が設定されているか
- または、Buildの設定でNode.jsバージョンが18以上か

**対処法:**
- 環境変数に追加: `NODE_VERSION = 18`
- 再デプロイを実行

---

### 原因4: _redirectsファイルが含まれていない

**確認方法:**
- ビルドログで `dist/_redirects` が存在するか確認
- またはデプロイ後、ブラウザで `/test` などの存在しないパスにアクセスして404ではなくトップページが表示されるか確認

**対処法:**
- すでに修正済み（`public/_redirects` ファイルが自動的に `dist/` にコピーされます）
- 最新のコミットで再デプロイを実行

---

## 🔍 デプロイ後の確認手順

### 1. ブラウザのコンソールを開く

1. デプロイされたURLにアクセス
2. F12キーを押す（Developer Tools）
3. 「Console」タブを確認

### 2. 確認すべきポイント

#### ✅ 正常な場合:
- エラーメッセージが表示されない
- 「NeckRange AI へようこそ」というタイトルが表示される
- 「測定を開始する」ボタンが表示される

#### ❌ エラーがある場合:
以下のエラーメッセージを確認：

**エラー例1: モジュールが見つからない**
```
Failed to load module script: Expected a JavaScript module script...
```
→ ビルドコマンドまたは出力ディレクトリが間違っている

**エラー例2: 404エラー**
```
GET https://your-site.pages.dev/assets/index-xxx.js 404
```
→ ビルド出力ディレクトリが `dist` になっていない

**エラー例3: MediaPipe読み込みエラー**
```
Failed to load resource: https://cdn.jsdelivr.net/npm/@mediapipe/pose/...
```
→ ネットワークの問題（通常は一時的）

---

## 🚀 再デプロイ手順

### 方法1: Cloudflare Pagesダッシュボードから

1. プロジェクトページを開く
2. 「Deployments」タブを開く
3. 最新のデプロイの右側にある「...」メニューをクリック
4. 「Retry deployment」をクリック

### 方法2: GitHubから自動デプロイ

1. 設定を修正
2. GitHubにプッシュ
3. 自動的に再デプロイが開始される

---

## 📊 正常動作の確認

デプロイ後、以下をテストしてください：

- [ ] トップページが表示される
- [ ] 「測定を開始する」ボタンが動作する
- [ ] カメラ撮影画面が開く（カメラ許可が必要）
- [ ] ファイルアップロードが動作する
- [ ] 画像解析が正常に動作する
- [ ] 診断結果が表示される

---

## 🆘 それでも解決しない場合

### デバッグ情報の収集

1. **ブラウザのコンソールログをコピー**
2. **Cloudflare Pagesのビルドログをコピー**
3. **デプロイされたURLを共有**

### サポート

- GitHub Issues: https://github.com/toyomitsu32/NeckRange-AI/issues
- または、スクリーンショットを共有してください

---

## ✨ 成功した場合

おめでとうございます！🎉

NeckRange AI が正常にデプロイされました。

**次のステップ:**
- カスタムドメインの設定（オプション）
- GitHubのREADMEにデモURLを追加
- SNSでシェア

---

## 📝 補足情報

### ファイル一覧（dist/）

ビルド後、以下のファイルが含まれます：

```
dist/
├── _redirects          # SPAルーティング設定
├── _headers            # セキュリティヘッダー
├── index.html          # メインHTML
└── assets/
    ├── index-xxx.css   # スタイルシート
    └── index-xxx.js    # JavaScript（React + MediaPipe）
```

### 重要なポイント

- `_redirects` ファイル: すべてのルートを index.html にリダイレクト
- `_headers` ファイル: セキュリティヘッダーとキャッシュ設定
- HTTPSが有効: カメラアクセスに必須

---

最終更新: 2024-12-14
