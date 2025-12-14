#!/bin/bash

# NeckRange AI - Cloudflare Pages ビルドスクリプト

echo "🚀 Building NeckRange AI..."

# Node.jsバージョン確認
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# 依存関係のインストール
echo "📦 Installing dependencies..."
npm ci || npm install

# ビルド実行
echo "🔨 Building application..."
npm run build

# ビルド結果確認
echo "✅ Build complete!"
echo "Files in dist/:"
ls -lh dist/

# 重要なファイルの確認
echo ""
echo "Checking critical files:"
[ -f "dist/index.html" ] && echo "✓ index.html exists" || echo "✗ index.html missing"
[ -f "dist/_redirects" ] && echo "✓ _redirects exists" || echo "✗ _redirects missing"
[ -f "dist/_headers" ] && echo "✓ _headers exists" || echo "✗ _headers missing"
[ -d "dist/assets" ] && echo "✓ assets/ directory exists" || echo "✗ assets/ missing"

echo ""
echo "🎉 Build script completed successfully!"
