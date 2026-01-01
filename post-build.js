import fs from "fs-extra";
import path from "path";
import { glob } from "glob";
import { execSync } from "child_process";

import { fileURLToPath } from "url";

// Convert import.meta.url to __dirname equivalent
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define paths (using relative paths from saferpdf.com/ to SaferPDF/)
const buildDir = path.join(__dirname, "dist");
const saferPDFRoot = path.join(__dirname, "..", "SaferPDF");
const targetAssetsDir = path.join(saferPDFRoot, "static/assets");
const targetContentFile = path.join(
  saferPDFRoot,
  "themes/hugoplate/layouts/index.html"
);
const targetSuccessFile = path.join(
  saferPDFRoot,
  "content/english/success/index.md"
);
const targetLoginFile = path.join(
  saferPDFRoot,
  "content/english/login/index.md"
);
const targetPricingFile = path.join(
  saferPDFRoot,
  "content/english/pricing/index.md"
);
const targetMergeFile = path.join(
  saferPDFRoot,
  "content/english/merge/index.md"
);
const targetMergeLayout = path.join(
  saferPDFRoot,
  "themes/hugoplate/layouts/merge/single.html"
);

// Clean directories
async function cleanDirectories() {
  console.log("🧹 Cleaning target directories...");
  await fs.emptyDir(targetAssetsDir);
  console.log(`   ✓ Emptied: ${targetAssetsDir}`);
  await fs.remove(targetContentFile);
  console.log(`   ✓ Removed: ${targetContentFile}`);
}

// Move assets
async function moveAssets() {
  console.log("\n📦 Copying assets...");
  const sourceAssets = path.join(buildDir, "assets");
  await fs.copy(sourceAssets, targetAssetsDir, {
    overwrite: true,
  });

  // Count and list copied files
  const copiedFiles = await fs.readdir(targetAssetsDir);
  console.log(`   ✓ Copied ${copiedFiles.length} files from ${sourceAssets}`);
  console.log(`   → Target: ${targetAssetsDir}`);
  copiedFiles.forEach(file => {
    const stats = fs.statSync(path.join(targetAssetsDir, file));
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`      - ${file} (${sizeMB} MB)`);
  });
}

// Update and move index.html
async function updateAndMoveIndex() {
  console.log("\n📝 Generating Hugo templates...");

  const [jsFile] = glob.sync("assets/index.*.js", { cwd: buildDir });
  const [successJSFile] = glob.sync("assets/success.*.js", { cwd: buildDir });
  const [loginJSFile] = glob.sync("assets/login.*.js", { cwd: buildDir });
  const [mergeJSFile] = glob.sync("assets/merge.*.js", { cwd: buildDir });
  const [cssFile] = glob.sync("assets/*.css", { cwd: buildDir });

  console.log("   📄 Found asset files:");
  console.log(`      - Main app: ${jsFile}`);
  console.log(`      - Success page: ${successJSFile}`);
  console.log(`      - Login page: ${loginJSFile}`);
  console.log(`      - Merge page: ${mergeJSFile}`);
  console.log(`      - CSS: ${cssFile}`);

  // Construct new index.html content
  const indexContent = `
{{ define "main" }}
<script type="module" crossorigin src="/${jsFile}"></script>

<link rel="stylesheet" href="/${cssFile}">
<section class="section pt-14">
<div id="root" class="w-full"></div>
</section>

{{ end }}
`.trim();

  // Write updated index.html to targetContentDir
  await fs.outputFile(targetContentFile, indexContent, "utf8");
  console.log(`   ✓ Generated: ${targetContentFile}`);

  const successContent = `
---
title: Thank you!
---
<script type="module" crossorigin src="/${successJSFile}"></script>

<link rel="stylesheet" href="/${cssFile}">
<section class="section pt-14">
<div id="root" class="w-full"></div>
</section>
`;
  await fs.outputFile(targetSuccessFile, successContent, "utf8");
  console.log(`   ✓ Generated: ${targetSuccessFile}`);

  const loginContent = `
---
title: Login
---
<script type="module" crossorigin src="/${loginJSFile}"></script>
<link rel="stylesheet" href="/${cssFile}">
<section class="section pt-14">
<div id="root" class="w-full"></div>
</section>
`;
  await fs.outputFile(targetLoginFile, loginContent, "utf8");
  console.log(`   ✓ Generated: ${targetLoginFile}`);

  // Create merge content file (for SEO metadata)
  const mergeContent = `
---
title: Merge PDFs
meta_title: SaferPDF - Merge PDFs Online Securely
description: Combine multiple PDF files into one. Drag and drop to reorder, merge with optional compression. Everything happens locally in your browser.
image: "/images/saferpdf-thumbnail.png"
---
`;
  await fs.outputFile(targetMergeFile, mergeContent, "utf8");
  console.log(`   ✓ Generated: ${targetMergeFile}`);

  // Create merge layout (like homepage - no title rendering)
  const mergeLayout = `
{{ define "main" }}
<script type="module" crossorigin src="/${mergeJSFile}"></script>
<link rel="stylesheet" href="/${cssFile}">
<section class="section pt-14">
<div id="root" class="w-full"></div>
</section>
{{ end }}
`.trim();
  await fs.outputFile(targetMergeLayout, mergeLayout, "utf8");
  console.log(`   ✓ Generated: ${targetMergeLayout}`);
}

const [pricingJSFile] = glob.sync("assets/pricing.*.js", { cwd: buildDir });
const [cssFile] = glob.sync("assets/*.css", { cwd: buildDir });

async function updatePricingContentWithPromo(
  existingFilePath,
  targetPricingFile,
  pricingJSFile,
  cssFile,
) {
  try {
    console.log("\n💰 Updating pricing page...");

    // Step 1: Read the existing file content
    const fileContent = await fs.readFile(existingFilePath, "utf8");
    console.log(`   📖 Read existing file: ${existingFilePath}`);

    // Step 2: Extract promotional content
    const promoContentRegex =
      /\[\/\/\]: # \(START TEXT\)([\s\S]*?)\[\/\/\]: # \(END TEXT\)/;
    const match = fileContent.match(promoContentRegex);
    const promoContent = match ? match[1].trim() : ""; // Default to empty string if not found

    if (promoContent) {
      console.log(`   ✓ Preserved promotional content (${promoContent.length} chars)`);
    } else {
      console.log(`   ⚠ No promotional content found between markers`);
    }

    const pricingContent = `
---
title: Pricing
meta_title: SaferPDF Compress - Pricing
image: "/images/saferpdf-thumbnail.png"
---
[//]: # (START TEXT)

${promoContent}

[//]: # (END TEXT)

<script type="module" crossorigin src="/${pricingJSFile}"></script>
<link rel="stylesheet" href="/${cssFile}">
<section class="section pt-14">
<div id="root" class="w-full"></div>
</section>
`;

    // Step 4: Write the updated content to the target file
    await fs.writeFile(targetPricingFile, pricingContent, "utf8");
    console.log(`   ✓ Updated: ${targetPricingFile}`);
  } catch (error) {
    console.error("   ❌ Error updating pricing content:", error);
  }
}

// Stage changes in git
async function stageGitChanges() {
  console.log("\n📝 Staging changes in git...");

  try {
    // Change to SaferPDF directory
    const gitCommands = [
      {
        cmd: "git add -A static/assets/",
        desc: "Staging all asset changes (deletions and additions)",
      },
      {
        cmd: "git add themes/hugoplate/layouts/index.html",
        desc: "Staging homepage template",
      },
      {
        cmd: "git add content/english/login/index.md",
        desc: "Staging login page",
      },
      {
        cmd: "git add content/english/pricing/index.md",
        desc: "Staging pricing page",
      },
      {
        cmd: "git add content/english/success/index.md",
        desc: "Staging success page",
      },
      {
        cmd: "git add content/english/merge/index.md",
        desc: "Staging merge page content",
      },
      {
        cmd: "git add themes/hugoplate/layouts/merge/single.html",
        desc: "Staging merge page layout",
      },
    ];

    for (const { cmd, desc } of gitCommands) {
      console.log(`   ${desc}...`);
      execSync(cmd, { cwd: saferPDFRoot, stdio: "inherit" });
    }

    console.log("\n   📊 Git status after staging:");
    execSync("git status --short static/assets/ themes/hugoplate/layouts/index.html themes/hugoplate/layouts/merge/ content/english/login/ content/english/pricing/ content/english/success/ content/english/merge/", {
      cwd: saferPDFRoot,
      stdio: "inherit",
    });

    console.log("\n   ✅ All changes staged and ready for commit!");
    console.log("\n   💡 Files are now staged in SaferPDF repo");
    console.log("      You can commit them whenever you're ready with:");
    console.log("      cd ../SaferPDF");
    console.log('      git commit -m "Update React app build"');
  } catch (error) {
    console.error("\n   ⚠️  Git staging failed:", error.message);
    console.log("   You may need to stage changes manually.");
  }
}

// Run script
(async () => {
  console.log("\n🚀 Starting post-build integration...\n");
  console.log("📂 Project structure:");
  console.log(`   Source: ${buildDir}`);
  console.log(`   Target: ${saferPDFRoot}\n`);

  try {
    await cleanDirectories();
    await moveAssets();
    await updateAndMoveIndex();
    await updatePricingContentWithPromo(
      targetPricingFile,
      targetPricingFile,
      pricingJSFile,
      cssFile,
    );
    await stageGitChanges();
    console.log("\n✅ Build adjustment completed successfully!\n");
  } catch (error) {
    console.error("\n❌ Error during build adjustment:", error);
    process.exit(1);
  }
})();
