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
const targetMergeLayout = path.join(
  saferPDFRoot,
  "themes/hugoplate/layouts/merge/single.html"
);

// Each language has its own content directory in the Hugo site. The layouts
// (index.html, merge/single.html) are shared — Hugo's i18n routing renders
// them per language. The page-specific content files (success/login/pricing/
// merge) need their frontmatter (title, meta_title, description) localized,
// so we generate them in each language directory.
const LANGUAGES = [
  {
    code: "en",
    contentDir: "content/english",
    pages: {
      success: { title: "Thank you!" },
      login: { title: "Login" },
      pricing: { title: "Pricing", meta_title: "SaferPDF Compress - Pricing" },
      merge: {
        title: "Merge PDFs",
        meta_title: "SaferPDF - Merge PDFs Online Securely",
        description:
          "Combine multiple PDF files into one. Drag and drop to reorder, merge with optional compression. Everything happens locally in your browser.",
      },
    },
  },
  {
    code: "fr",
    contentDir: "content/french",
    pages: {
      success: { title: "Merci !" },
      login: { title: "Connexion" },
      pricing: { title: "Tarifs", meta_title: "SaferPDF Compression - Tarifs" },
      merge: {
        title: "Fusionner des PDF",
        meta_title: "SaferPDF - Fusionner des PDF en ligne en toute sécurité",
        description:
          "Combinez plusieurs fichiers PDF en un seul. Glissez-déposez pour réorganiser, fusionnez avec compression optionnelle. Tout se passe localement dans votre navigateur.",
      },
    },
  },
  {
    code: "de",
    contentDir: "content/german",
    pages: {
      success: { title: "Vielen Dank!" },
      login: { title: "Anmelden" },
      pricing: { title: "Preise", meta_title: "SaferPDF Komprimierung - Preise" },
      merge: {
        title: "PDFs zusammenfügen",
        meta_title: "SaferPDF - PDFs sicher online zusammenfügen",
        description:
          "Kombinieren Sie mehrere PDF-Dateien zu einer. Per Drag & Drop neu anordnen, mit optionaler Komprimierung zusammenfügen. Alles geschieht lokal in Ihrem Browser.",
      },
    },
  },
];

const localizedTargets = (lang) => ({
  success: path.join(saferPDFRoot, lang.contentDir, "success/index.md"),
  login: path.join(saferPDFRoot, lang.contentDir, "login/index.md"),
  pricing: path.join(saferPDFRoot, lang.contentDir, "pricing/index.md"),
  merge: path.join(saferPDFRoot, lang.contentDir, "merge/index.md"),
});

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

  const copiedFiles = await fs.readdir(targetAssetsDir);
  console.log(`   ✓ Copied ${copiedFiles.length} files from ${sourceAssets}`);
  console.log(`   → Target: ${targetAssetsDir}`);
  copiedFiles.forEach((file) => {
    const stats = fs.statSync(path.join(targetAssetsDir, file));
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`      - ${file} (${sizeMB} MB)`);
  });
}

function frontmatter(meta) {
  const lines = ["---"];
  for (const [key, value] of Object.entries(meta)) {
    if (value === undefined) continue;
    // Always quote to keep YAML happy with punctuation/colons
    lines.push(`${key}: "${value.replace(/"/g, '\\"')}"`);
  }
  lines.push("---");
  return lines.join("\n");
}

function reactPageBody(jsFile, cssFile) {
  return [
    `<script type="module" crossorigin src="/${jsFile}"></script>`,
    `<link rel="stylesheet" href="/${cssFile}">`,
    `<section class="section pt-14">`,
    `<div id="root" class="w-full"></div>`,
    `</section>`,
  ].join("\n");
}

async function writeSharedLayouts(jsFile, mergeJSFile, cssFile) {
  const indexLayout = `
{{ define "main" }}
${reactPageBody(jsFile, cssFile)}
{{ end }}
`.trim();
  await fs.outputFile(targetContentFile, indexLayout, "utf8");
  console.log(`   ✓ Generated: ${targetContentFile}`);

  const mergeLayout = `
{{ define "main" }}
${reactPageBody(mergeJSFile, cssFile)}
{{ end }}
`.trim();
  await fs.outputFile(targetMergeLayout, mergeLayout, "utf8");
  console.log(`   ✓ Generated: ${targetMergeLayout}`);
}

async function writeLanguagePages(lang, jsFiles, cssFile) {
  const targets = localizedTargets(lang);
  const pages = lang.pages;

  console.log(`\n🌐 Generating pages for [${lang.code}] → ${lang.contentDir}`);

  await fs.outputFile(
    targets.success,
    `${frontmatter(pages.success)}\n${reactPageBody(jsFiles.success, cssFile)}\n`,
    "utf8"
  );
  console.log(`   ✓ Generated: ${targets.success}`);

  await fs.outputFile(
    targets.login,
    `${frontmatter(pages.login)}\n${reactPageBody(jsFiles.login, cssFile)}\n`,
    "utf8"
  );
  console.log(`   ✓ Generated: ${targets.login}`);

  // Merge content has only metadata — the layout (themes/.../merge/single.html)
  // renders the actual React mount point.
  await fs.outputFile(
    targets.merge,
    `${frontmatter({
      ...pages.merge,
      image: "/images/saferpdf-thumbnail.png",
    })}\n`,
    "utf8"
  );
  console.log(`   ✓ Generated: ${targets.merge}`);

  // Pricing preserves any existing promo content between START/END markers
  await writePricing(targets.pricing, pages.pricing, jsFiles.pricing, cssFile);
}

async function writePricing(targetPricingFile, pageMeta, pricingJSFile, cssFile) {
  let promoContent = "";
  try {
    const fileContent = await fs.readFile(targetPricingFile, "utf8");
    const promoContentRegex =
      /\[\/\/\]: # \(START TEXT\)([\s\S]*?)\[\/\/\]: # \(END TEXT\)/;
    const match = fileContent.match(promoContentRegex);
    promoContent = match ? match[1].trim() : "";
    if (promoContent) {
      console.log(
        `   💰 Preserved promo content from ${targetPricingFile} (${promoContent.length} chars)`
      );
    }
  } catch {
    // file doesn't exist yet — first build for this language
  }

  const pricingContent = `${frontmatter({
    ...pageMeta,
    image: "/images/saferpdf-thumbnail.png",
  })}
[//]: # (START TEXT)

${promoContent}

[//]: # (END TEXT)

${reactPageBody(pricingJSFile, cssFile)}
`;
  await fs.outputFile(targetPricingFile, pricingContent, "utf8");
  console.log(`   ✓ Generated: ${targetPricingFile}`);
}

// Update and move templates + per-language content
async function updateAndMoveIndex() {
  console.log("\n📝 Generating Hugo templates...");

  const [jsFile] = glob.sync("assets/index.*.js", { cwd: buildDir });
  const [successJSFile] = glob.sync("assets/success.*.js", { cwd: buildDir });
  const [loginJSFile] = glob.sync("assets/login.*.js", { cwd: buildDir });
  const [pricingJSFile] = glob.sync("assets/pricing.*.js", { cwd: buildDir });
  const [mergeJSFile] = glob.sync("assets/merge.*.js", { cwd: buildDir });
  const [cssFile] = glob.sync("assets/*.css", { cwd: buildDir });

  console.log("   📄 Found asset files:");
  console.log(`      - Main app: ${jsFile}`);
  console.log(`      - Success page: ${successJSFile}`);
  console.log(`      - Login page: ${loginJSFile}`);
  console.log(`      - Pricing page: ${pricingJSFile}`);
  console.log(`      - Merge page: ${mergeJSFile}`);
  console.log(`      - CSS: ${cssFile}`);

  await writeSharedLayouts(jsFile, mergeJSFile, cssFile);

  const jsFiles = {
    success: successJSFile,
    login: loginJSFile,
    pricing: pricingJSFile,
    merge: mergeJSFile,
  };

  for (const lang of LANGUAGES) {
    await writeLanguagePages(lang, jsFiles, cssFile);
  }
}

// Stage changes in git
async function stageGitChanges() {
  console.log("\n📝 Staging changes in git...");

  try {
    const baseCommands = [
      {
        cmd: "git add -A static/assets/",
        desc: "Staging all asset changes (deletions and additions)",
      },
      {
        cmd: "git add themes/hugoplate/layouts/index.html",
        desc: "Staging homepage template",
      },
      {
        cmd: "git add themes/hugoplate/layouts/merge/single.html",
        desc: "Staging merge page layout",
      },
    ];

    const langCommands = LANGUAGES.flatMap((lang) =>
      ["login", "pricing", "success", "merge"].map((page) => ({
        cmd: `git add ${lang.contentDir}/${page}/index.md`,
        desc: `Staging ${page} page (${lang.code})`,
      }))
    );

    for (const { cmd, desc } of [...baseCommands, ...langCommands]) {
      console.log(`   ${desc}...`);
      execSync(cmd, { cwd: saferPDFRoot, stdio: "inherit" });
    }

    const langPaths = LANGUAGES.map((l) =>
      ["login", "pricing", "success", "merge"]
        .map((p) => `${l.contentDir}/${p}/`)
        .join(" ")
    ).join(" ");

    console.log("\n   📊 Git status after staging:");
    execSync(
      `git status --short static/assets/ themes/hugoplate/layouts/index.html themes/hugoplate/layouts/merge/ ${langPaths}`,
      { cwd: saferPDFRoot, stdio: "inherit" }
    );

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
    await stageGitChanges();
    console.log("\n✅ Build adjustment completed successfully!\n");
  } catch (error) {
    console.error("\n❌ Error during build adjustment:", error);
    process.exit(1);
  }
})();
