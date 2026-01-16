#!/usr/bin/env bash

# --- Mac対応のパス設定 ---
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

set -e

echo "🚀 Starting TypeScript quality check..."

# 1. Prettierでコードを整形
if npx prettier --version >/dev/null 2>&1; then
    echo "🎨 Running Prettier..."
    npx prettier --write .
else
    echo "⚠️ Prettier not found. Skipping format."
fi

# 2. ESLintでエラーチェック & 自動修正
if npx eslint --version >/dev/null 2>&1; then
    echo "🔍 Running ESLint..."
    if ! npx eslint --fix .; then
        echo "❌ ESLint found unfixable errors. Push aborted."
        exit 1
    fi
else
    echo "⚠️ ESLint not found. Skipping lint."
fi

# 3. Git操作（今いるブランチにプッシュ）
echo "📦 Committing and Pushing..."
git add .

# 変更がある場合のみ実行
if ! git diff-index --quiet HEAD; then
    git commit -m "chore: auto-format and lint (TypeScript)"
    
    # 今いるブランチ名を自動取得
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    
    # 上流ブランチがなくてもプッシュできるように設定
    git push -u origin "$CURRENT_BRANCH"
    echo "✅ Successfully pushed to $CURRENT_BRANCH!"
else
    echo "✨ No changes to commit."
fi