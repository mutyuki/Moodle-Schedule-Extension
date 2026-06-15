import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const distDir = path.join(rootDir, "dist");
const requiredFiles = ["manifest.json"];
const optionalDirectories = ["src", "icons", "assets", "popup", "options"];

function shouldCopy(source) {
  const relativePath = path.relative(rootDir, source);
  const pathParts = relativePath.split(path.sep);
  const fileName = path.basename(source);

  if (pathParts.includes("__tests__")) {
    return false;
  }

  return !fileName.endsWith(".test.js") && !fileName.endsWith(".spec.js");
}

async function copyIfExists(source, destination) {
  try {
    await cp(source, destination, {
      recursive: true,
      filter: shouldCopy
    });
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

for (const fileName of requiredFiles) {
  await cp(path.join(rootDir, fileName), path.join(distDir, fileName));
}

for (const directoryName of optionalDirectories) {
  await copyIfExists(path.join(rootDir, directoryName), path.join(distDir, directoryName));
}
