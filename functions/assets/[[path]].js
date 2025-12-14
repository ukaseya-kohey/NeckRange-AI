// Cloudflare Pages Functions - アセットファイルのMIMEタイプを修正

export async function onRequest(context) {
  const response = await context.next();
  const url = new URL(context.request.url);
  const pathname = url.pathname;
  
  // 新しいヘッダーを作成
  const newHeaders = new Headers(response.headers);
  
  // 拡張子に基づいてContent-Typeを設定
  if (pathname.endsWith('.js') || pathname.endsWith('.mjs')) {
    newHeaders.set('Content-Type', 'text/javascript; charset=utf-8');
    console.log('Setting Content-Type for:', pathname);
  } else if (pathname.endsWith('.css')) {
    newHeaders.set('Content-Type', 'text/css; charset=utf-8');
  }
  
  // レスポンスを返す
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}
