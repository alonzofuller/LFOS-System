#!/bin/bash
echo "=== Step 1: Check PostCSS configs ==="
ls -la postcss.config.* 2>/dev/null || echo "No postcss.config files found"

echo ""
echo "=== Step 2: Verify Tailwind version ==="
grep "tailwindcss" package.json

echo ""
echo "=== Step 3: Check tsconfig jsx ==="
grep "jsx" tsconfig.json

echo ""
echo "=== Step 4: Clear ALL build artifacts ==="
rm -rf .next
rm -rf .vercel
rm -rf node_modules/.cache
echo "Cleared .next, .vercel, node_modules/.cache"

echo ""
echo "=== Step 5: Fresh install ==="
rm -rf node_modules
npm install 2>&1 | tail -5

echo ""
echo "=== Step 6: Verify postcss.config.js content ==="
cat postcss.config.js

echo ""
echo "=== Step 7: Verify no .mjs postcss config exists ==="
if [ -f "postcss.config.mjs" ]; then
  echo "ERROR: postcss.config.mjs still exists!"
  cat postcss.config.mjs
else
  echo "GOOD: No postcss.config.mjs found"
fi

echo ""
echo "=== Step 8: Check tailwind.config.js content paths ==="
head -20 tailwind.config.js

echo ""
echo "=== Done ==="
