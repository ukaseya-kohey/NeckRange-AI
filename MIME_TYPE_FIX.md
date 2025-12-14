# MIMEタイプエラーの修正手順

## エラー内容

```
Failed to load module script: Expected a JavaScript-or-Wasm module script 
but the server responded with a MIME type of "application/octet-stream".
```

このエラーは、JavaScriptファイルが正しいMIMEタイプで配信されていないことが原因です。

---

## 実施した修正

### 1. _headers ファイルの更新

`public/_headers` ファイルに、正しいContent-Typeヘッダーを追加しました：

```
/assets/*.js
  Content-Type: text/javascript
  Cache-Control: public, max-age=31536000, immutable

/assets/*.mjs
  Content-Type: text/javascript
  Cache-Control: public, max-age=31536000, immutable

/assets/*.css
  Content-Type: text/css
  Cache-Control: public, max-age=31536000, immutable

/*.js
  Content-Type: text/javascript

/*.mjs
  Content-Type: text/javascript
```

### 2. _mimetypes ファイルの追加

`public/_mimetypes` ファイルを作成し、MIMEタイプの定義を追加：

```
.js text/javascript
.mjs text/javascript
.css text/css
.json application/json
.wasm application/wasm
```

### 3. 相対パスの使用

`vite.config.ts` に `base: './'` を設定済み

---

## Cloudflare Pages 側の確認事項

### ビルド設定

```
Build command: npm run build
Build output directory: dist
Node.js version: 18
```

### デプロイ後の確認

1. **_headers ファイルが含まれているか**
   - デプロイされたファイル一覧で `_headers` を確認
   - 内容が正しくデプロイされているか確認

2. **レスポンスヘッダーを確認**
   - ブラウザのDeveloper Tools → Network タブ
   - `index-xxx.js` ファイルをクリック
   - Response Headers で `Content-Type: text/javascript` になっているか確認

---

## トラブルシューティング

### 方法1: ブラウザキャッシュをクリア

1. キャッシュとCookieをクリア
2. ハードリロード（Ctrl+Shift+R または Cmd+Shift+R）

### 方法2: Cloudflare Pagesのキャッシュをパージ

1. Cloudflare Pagesダッシュボードを開く
2. プロジェクトページで「Settings」→「Purge cache」

### 方法3: 再デプロイ

1. GitHubに最新のコミットがプッシュされていることを確認
2. Cloudflare Pagesが自動的に再デプロイ
3. または、手動で「Retry deployment」をクリック

---

## 検証方法

### ブラウザのNetwork タブで確認

1. F12を押してDeveloper Toolsを開く
2. Networkタブを選択
3. ページをリロード
4. `index-xxx.js` ファイルをクリック
5. **Response Headers** を確認：

#### ✅ 正常な場合
```
Content-Type: text/javascript
Status: 200 OK
```

#### ❌ エラーがある場合
```
Content-Type: application/octet-stream
Status: 200 OK
```

---

## Cloudflare Pages の _headers ファイル仕様

### 重要なポイント

1. **順序が重要**: より具体的なパターンを上に配置
2. **ワイルドカードの使用**: `*` でパターンマッチング
3. **インデント**: ヘッダーは2スペースでインデント

### 正しい記述例

```
# 具体的なパス（優先度高）
/assets/*.js
  Content-Type: text/javascript

# 汎用パス（優先度低）
/*
  X-Frame-Options: DENY
```

### 間違った記述例

```
# インデントが間違っている
/assets/*.js
Content-Type: text/javascript  ❌

# ヘッダー名が間違っている
/assets/*.js
  ContentType: text/javascript  ❌
```

---

## 代替案

### A. Cloudflare Workers を使用

もし _headers ファイルが機能しない場合、Cloudflare Workersで動的にヘッダーを追加できます。

```javascript
export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    
    const url = new URL(request.url);
    if (url.pathname.endsWith('.js') || url.pathname.endsWith('.mjs')) {
      headers.set('Content-Type', 'text/javascript');
    }
    
    return new Response(response.body, {
      status: response.status,
      headers: headers
    });
  }
};
```

### B. リバースプロキシを使用

Cloudflare Workers でリバースプロキシを設定し、MIMEタイプを強制的に設定。

---

## 最終確認チェックリスト

- [ ] `npm run build` でビルド成功
- [ ] `dist/_headers` ファイルが存在
- [ ] `dist/_mimetypes` ファイルが存在
- [ ] `dist/_redirects` ファイルが存在
- [ ] GitHubにプッシュ完了
- [ ] Cloudflare Pagesで再デプロイ完了
- [ ] ブラウザキャッシュをクリア
- [ ] ページが正常に表示される
- [ ] コンソールエラーがない

---

## サポート

問題が解決しない場合：

1. ブラウザのNetwork タブのスクリーンショット
2. Cloudflare Pagesのビルドログ
3. エラーメッセージの全文

を添えてGitHub Issuesで報告してください。

---

最終更新: 2024-12-14
