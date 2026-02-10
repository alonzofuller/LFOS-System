import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const root = process.cwd();

function run(cmd) {
  try {
    const out = execSync(cmd, { cwd: root, encoding: 'utf-8', stdio: 'pipe' });
    return out.trim();
  } catch (e) {
    return `ERROR: ${e.message}`;
  }
}

console.log("=== STEP 1: Check PostCSS config files ===");
const postcssFiles = run("ls -la postcss.config.* 2>/dev/null || echo 'No postcss config files found'");
console.log(postcssFiles);

// Ensure postcss.config.mjs is truly gone
const badFile = path.join(root, 'postcss.config.mjs');
if (fs.existsSync(badFile)) {
  console.log("!! FOUND postcss.config.mjs - DELETING IT NOW");
  fs.unlinkSync(badFile);
  console.log("Deleted postcss.config.mjs");
} else {
  console.log("GOOD: postcss.config.mjs does not exist");
}

console.log("\n=== STEP 2: Verify Tailwind version in package.json ===");
const twVersion = run("grep tailwindcss package.json");
console.log(twVersion);

console.log("\n=== STEP 3: Check tsconfig jsx setting ===");
const jsxSetting = run("grep jsx tsconfig.json");
console.log(jsxSetting);

console.log("\n=== STEP 4: Clear ALL build artifacts ===");

const dirsToDelete = ['.next', '.vercel', 'node_modules/.cache'];
for (const dir of dirsToDelete) {
  const fullPath = path.join(root, dir);
  if (fs.existsSync(fullPath)) {
    console.log(`Deleting ${dir}...`);
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log(`Deleted ${dir}`);
  } else {
    console.log(`${dir} does not exist (already clean)`);
  }
}

console.log("\n=== STEP 5: Verify postcss.config.js content ===");
const postcssContent = fs.readFileSync(path.join(root, 'postcss.config.js'), 'utf-8');
console.log(postcssContent);

console.log("\n=== STEP 6: Verify tailwind.config.js content ===");
const twContent = fs.readFileSync(path.join(root, 'tailwind.config.js'), 'utf-8');
console.log(twContent);

console.log("\n=== STEP 7: Verify globals.css first 10 lines ===");
const cssContent = fs.readFileSync(path.join(root, 'src/app/globals.css'), 'utf-8');
console.log(cssContent.split('\n').slice(0, 10).join('\n'));

console.log("\n=== STEP 8: Verify layout.tsx exists and imports ===");
const layoutContent = fs.readFileSync(path.join(root, 'src/app/layout.tsx'), 'utf-8');
console.log(layoutContent.split('\n').slice(0, 15).join('\n'));

console.log("\n=== STEP 9: Verify Sidebar.tsx is not corrupted ===");
const sidebarContent = fs.readFileSync(path.join(root, 'src/components/Sidebar.tsx'), 'utf-8');
const sidebarLines = sidebarContent.split('\n');
console.log(`Sidebar.tsx: ${sidebarLines.length} lines`);
console.log(`First line: ${sidebarLines[0]}`);
console.log(`Contains 'export': ${sidebarContent.includes('export')}`);
console.log(`Contains 'Sidebar': ${sidebarContent.includes('Sidebar')}`);

console.log("\n=== ALL CHECKS COMPLETE ===");
