# Cloudflare Pages デプロイ トラブルシューティング

## 「利用可能なデプロイがありません」エラー

### 考えられる原因

#### 1. ビルドが失敗している

**確認方法**:
- Cloudflare Pagesダッシュボード → Deployments タブ
- 最新のデプロイのステータスを確認

**症状**:
- Status: Failed (赤色)
- エラーメッセージが表示される

**解決方法**:
1. ビルドログを確認
2. エラーメッセージを読む
3. 必要に応じて設定を修正

---

#### 2. ビルド設定が間違っている

**確認すべき設定**:

##### Framework preset
```
Vite
```
または
```
None
```

##### Build command
```
npm run build
```

##### Build output directory
```
dist
```

##### Root directory
```
/
```
（空欄またはスラッシュ）

##### Node.js version
環境変数に追加:
```
NODE_VERSION = 18
```

---

#### 3. GitHubリポジトリが接続されていない

**確認方法**:
- Settings → Builds & deployments
- Source が GitHub になっているか確認

**解決方法**:
1. GitHubアカウントを再接続
2. リポジトリへのアクセス権を確認

---

#### 4. ブランチが間違っている

**確認方法**:
- Production branch が `main` になっているか確認

**解決方法**:
1. Settings → Builds & deployments
2. Production branch を `main` に設定

---

### デプロイの再試行

#### 方法1: GitHubから再トリガー

1. リポジトリに空のコミットをプッシュ
```bash
git commit --allow-empty -m "Trigger rebuild"
git push origin main
```

#### 方法2: Cloudflare Pagesから再デプロイ

1. Deployments タブを開く
2. 最新のデプロイを選択
3. "Retry deployment" をクリック

#### 方法3: プロジェクトを削除して再作成

1. Cloudflare Pagesでプロジェクトを削除
2. 新しいプロジェクトを作成
3. GitHubリポジトリを接続
4. ビルド設定を正しく設定

---

### ビルドログの確認方法

#### 正常なビルドログの例

```
Installing dependencies...
✓ Installed 252 packages

Building application...
✓ 42 modules transformed.
dist/index.html                   0.56 kB │ gzip:  0.41 kB
dist/assets/index-_S3G8yAk.css   14.39 kB │ gzip:  3.50 kB
dist/assets/index-CPFt5LlP.js   210.61 kB │ gzip: 70.97 kB
✓ built in 2.68s

Detected Functions directory at /functions
Compiling Functions...
✓ Compiled 1 Function successfully

Deployment successful!
```

#### エラーがあるビルドログの例

```
npm ERR! code ELIFECYCLE
npm ERR! errno 1
npm ERR! neckrange-ai@1.0.0 build: `tsc && vite build`
npm ERR! Exit status 1

Error: Build failed
```

---

### Cloudflare Pages 設定チェックリスト

#### ビルド設定

- [ ] Framework preset: Vite または None
- [ ] Build command: `npm run build`
- [ ] Build output directory: `dist`
- [ ] Root directory: `/` または空欄
- [ ] Node.js version: 18（環境変数）

#### 環境変数

- [ ] `NODE_VERSION = 18`

#### ソース設定

- [ ] GitHub リポジトリが接続されている
- [ ] Production branch: `main`
- [ ] リポジトリへのアクセス権がある

#### ファイル確認

- [ ] `package.json` にビルドスクリプトがある
- [ ] `vite.config.ts` が存在する
- [ ] `functions/_middleware.js` が存在する
- [ ] `public/_redirects` が存在する
- [ ] `public/_headers` が存在する

---

### よくあるエラーと解決方法

#### エラー1: "npm ERR! missing script: build"

**原因**: `package.json` にビルドスクリプトがない

**解決方法**:
```json
{
  "scripts": {
    "build": "tsc && vite build"
  }
}
```

#### エラー2: "Error: ENOENT: no such file or directory, open 'dist/index.html'"

**原因**: ビルド出力ディレクトリが間違っている

**解決方法**:
- Build output directory を `dist` に設定

#### エラー3: "Functions compilation failed"

**原因**: `functions/_middleware.js` の構文エラー

**解決方法**:
- ファイルの構文を確認
- `export async function onRequest` が正しいか確認

#### エラー4: "node: command not found"

**原因**: Node.jsバージョンが設定されていない

**解決方法**:
- 環境変数に `NODE_VERSION = 18` を追加

---

### 手動ビルドテスト

ローカルでビルドが成功するか確認:

```bash
# クリーンビルド
rm -rf node_modules dist
npm install
npm run build

# ビルド結果確認
ls -la dist/
```

**期待される出力**:
```
dist/
├── _headers
├── _mimetypes
├── _redirects
├── index.html
└── assets/
    ├── index-xxx.css
    └── index-xxx.js
```

---

### Cloudflare Pages のログを共有する方法

問題が解決しない場合、以下の情報を共有してください:

1. **デプロイログ全文**
   - Cloudflare Pages → Deployments → 最新のデプロイ → View build log
   
2. **ビルド設定のスクリーンショット**
   - Settings → Builds & deployments
   
3. **エラーメッセージ**
   - 赤色で表示されているエラーの全文

---

### 代替デプロイ方法

#### Wrangler CLI を使用

```bash
# Wrangler をインストール
npm install -g wrangler

# ログイン
wrangler login

# ビルド
npm run build

# デプロイ
wrangler pages deploy dist --project-name=neckrange-ai
```

#### 直接アップロード

1. `dist` フォルダをZIP圧縮
2. Cloudflare Pagesで「Direct Upload」を選択
3. ZIPファイルをアップロード

---

### サポート

問題が解決しない場合:

1. Cloudflare Pagesのビルドログをコピー
2. エラーメッセージをスクリーンショット
3. GitHub Issuesで報告

---

最終更新: 2024-12-14
