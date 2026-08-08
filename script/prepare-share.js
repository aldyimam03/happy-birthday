"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const rawUrl = process.argv[2];

if (!rawUrl) {
  console.error("Gunakan: npm run prepare:share -- https://domain.com/path/");
  process.exit(1);
}

let siteUrl;
try {
  siteUrl = new URL(rawUrl);
  if (!/^https?:$/.test(siteUrl.protocol)) throw new Error("URL harus memakai HTTP atau HTTPS");
} catch (error) {
  console.error(`URL tidak valid: ${error.message}`);
  process.exit(1);
}

const configPath = path.join(root, "customize.json");
const htmlPath = path.join(root, "index.html");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
config.siteUrl = siteUrl.href;
fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");

const imageUrl = new URL(config.imagePath, siteUrl).href;
let html = fs.readFileSync(htmlPath, "utf8");
html = html.replace(/(<meta property="og:url" content=")[^"]*(" \/>)/, `$1${siteUrl.href}$2`);
html = html.replace(/(<meta property="og:image" content=")[^"]*(" \/>)/, `$1${imageUrl}$2`);
fs.writeFileSync(htmlPath, html, "utf8");

console.log(`Metadata share siap untuk ${siteUrl.href}`);
