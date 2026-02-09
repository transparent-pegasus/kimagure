const fs = require("fs");
const { marked } = require("marked");
const path = require("path");

// Configuration
const DOCS_DIR = path.join(__dirname, "..", "docs", "releases");
const OUTPUT_DIR = path.join(__dirname, "..", "frontend", "public", "releases");

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// HTML Template
const template = (title, content) => `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      background-color: #fef7ed;
    }
    .container {
      background-color: white;
      padding: 2rem;
      border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      border: 2px solid #fed7aa;
    }
    h1, h2, h3 { color: #78350f; }
    h1 { border-bottom: 3px solid #f59e0b; padding-bottom: 0.5rem; }
    h2 { margin-top: 2rem; border-bottom: 2px solid #fed7aa; padding-bottom: 0.3rem; }
    h3 { color: #b45309; }
    ul { padding-left: 1.5rem; }
    li { margin-bottom: 0.5rem; }
    code { background-color: #fef3c7; padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.9em; }
    a { color: #d97706; text-decoration: none; font-weight: 500; }
    a:hover { text-decoration: underline; }
    hr { border: none; border-top: 2px dashed #fed7aa; margin: 2rem 0; }
  </style>
</head>
<body>
  <div class="container">
    ${content}
  </div>
</body>
</html>
`;

// Process files
try {
  const files = fs
    .readdirSync(DOCS_DIR)
    .filter((file) => path.extname(file) === ".md")
    .sort((a, b) => b.localeCompare(a)); // Sort descending

  if (files.length === 0) {
    console.log("No release notes found.");
  } else {
    // Process only the latest file
    const file = files[0];
    const filePath = path.join(DOCS_DIR, file);
    const content = fs.readFileSync(filePath, "utf8");
    const htmlContent = marked(content);
    const title = file.replace(".md", "");

    const outputPath = path.join(OUTPUT_DIR, `${title}.html`);

    fs.writeFileSync(outputPath, template(title, htmlContent));
    console.log(`Generated latest release: ${outputPath}`);
  }
  console.log("Release notes generation complete.");
} catch (err) {
  console.error("Error generating release notes:", err);
  process.exit(1);
}
