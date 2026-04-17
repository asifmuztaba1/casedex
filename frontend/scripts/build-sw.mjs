import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const templatePath = join(root, "public", "sw.template.js");
const outPath = join(root, "public", "sw.js");

const hash = (process.env.BUILD_ID || String(Date.now())).slice(-12);
const content = readFileSync(templatePath, "utf8").replaceAll("__BUILD_HASH__", hash);

writeFileSync(outPath, content);
console.log(`[sw] built public/sw.js with hash=${hash}`);
