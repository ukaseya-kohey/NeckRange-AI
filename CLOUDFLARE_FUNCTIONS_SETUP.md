# Cloudflare Pages Functions でMIMEタイプを修正

## 問題

Cloudflare Pagesの `_headers` ファイルだけでは、MIMEタイプが正しく設定されないことがあります。

## 解決策

**Cloudflare Pages Functions** を使用して、動的にHTTPヘッダーを修正します。

---

## 実装方法

### 1. functionsディレクトリの作成

プロジェクトルートに `functions` ディレクトリを作成し、`_middleware.js` ファイルを配置します。

```
webapp/
├── functions/
│   └── _middleware.js    ← Cloudflare Pages Functionsミドルウェア
├── dist/
├── src/
└── ...
```

### 2. _middleware.js の内容

```javascript
// Cloudflare Pages Functions - MIMEタイプを修正するミドルウェア

export async function onRequest(context) {
  const response = await context.next();
  const url = new URL(context.request.url);
  
  // 新しいヘッダーを作成
  const headers = new Headers(response.headers);
  
  // JavaScriptファイルのMIMEタイプを修正
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.mjs')) {
    headers.set('Content-Type', 'application/javascript; charset=utf-8');
  }
  
  // CSSファイルのMIMEタイプを修正
  if (url.pathname.endsWith('.css')) {
    headers.set('Content-Type', 'text/css; charset=utf-8');
  }
  
  // 新しいレスポンスを返す
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  });
}
```

---

## デプロイ方法

### 自動デプロイ

1. `functions` ディレクトリをGitHubにプッシュ
2. Cloudflare Pagesが自動的に検出してデプロイ
3. すべてのリクエストがミドルウェアを経由

### 確認方法

デプロイ後、Cloudflare Pagesのログで確認：

```
✓ Detected Functions directory
✓ Compiling Functions...
✓ Compiled 1 Function
```

---

## 動作原理

### リクエストフロー

```
ユーザー
  ↓
Cloudflare Pages Functions (_middleware.js)
  ↓ レスポンスヘッダーを修正
  ↓ Content-Type: application/javascript
  ↓
静的ファイル (dist/)
  ↓
ユーザー
```

### 処理内容

1. **すべてのリクエストを傍受**
2. **ファイル拡張子を確認**
   - `.js` または `.mjs` → `Content-Type: application/javascript`
   - `.css` → `Content-Type: text/css`
3. **修正されたレスポンスを返す**

---

## メリット

### ✅ 確実性
- `_headers` ファイルが機能しない場合でも動作
- すべてのリクエストで確実にヘッダーを設定

### ✅ 柔軟性
- JavaScriptで動的に制御可能
- 条件分岐やロジックを追加可能

### ✅ パフォーマンス
- Cloudflare Edgeで実行（超高速）
- 追加のラウンドトリップなし

---

## トラブルシューティング

### Functions が検出されない場合

#### 原因1: ディレクトリ構造が間違っている

**正しい構造**:
```
webapp/
├── functions/
│   └── _middleware.js
├── dist/
└── ...
```

**間違った構造**:
```
webapp/
├── src/
│   └── functions/  ← これは機能しない
└── ...
```

#### 原因2: ファイル名が間違っている

**正しいファイル名**: `_middleware.js` (アンダースコアで始まる)

**間違ったファイル名**: `middleware.js` (アンダースコアなし)

### ビルドエラーが発生する場合

#### エラー例
```
Error: Functions compilation failed
```

#### 解決方法
1. `_middleware.js` の構文を確認
2. `export async function onRequest` が正しいか確認
3. Cloudflare Pagesのビルドログを確認

---

## 検証方法

### 1. デプロイログを確認

Cloudflare Pagesのデプロイログで以下を確認：

```
✓ Detected Functions directory at /functions
✓ Compiling Functions...
✓ Compiled 1 Function successfully
```

### 2. ブラウザで確認

1. F12 → Network タブ
2. ページをリロード
3. `index-xxx.js` をクリック
4. **Response Headers** を確認

**期待される結果**:
```
Content-Type: application/javascript; charset=utf-8
```

### 3. curlで確認

```bash
curl -I https://your-site.pages.dev/assets/index-xxx.js
```

**期待される出力**:
```
HTTP/2 200
content-type: application/javascript; charset=utf-8
```

---

## 代替案

### A. Cloudflare Workers（より高度な制御）

Cloudflare Workersを使用して、より複雑なロジックを実装できます。

### B. ビルド時にヘッダーを埋め込む

ViteプラグインでHTMLにメタタグを追加する方法もあります。

---

## 参考リンク

- [Cloudflare Pages Functions ドキュメント](https://developers.cloudflare.com/pages/platform/functions/)
- [Cloudflare Workers ドキュメント](https://developers.cloudflare.com/workers/)

---

## 最終確認チェックリスト

- [ ] `functions/_middleware.js` ファイルが存在
- [ ] GitHubにプッシュ完了
- [ ] Cloudflare Pagesで再デプロイ完了
- [ ] デプロイログで "Compiled 1 Function" を確認
- [ ] ブラウザキャッシュをクリア
- [ ] ページが正常に表示される
- [ ] Network タブで `Content-Type: application/javascript` を確認

---

最終更新: 2024-12-14
