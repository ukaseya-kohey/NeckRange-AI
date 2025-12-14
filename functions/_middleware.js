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
