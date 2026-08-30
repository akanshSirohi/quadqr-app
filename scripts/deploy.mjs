import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: process.platform === "win32", env });
  if (result.status !== 0) process.exit(result.status || 1);
}

function repoNameFromRemote() {
  try {
    const remote = execFileSync("git", ["config", "--get", "remote.origin.url"], { encoding: "utf8" }).trim();
    const match = remote.match(/[/:]([^/]+)\/([^/]+?)(?:\.git)?$/);
    return match?.[2] || "";
  } catch {
    return "";
  }
}

const repoName = process.env.GITHUB_REPOSITORY?.split("/").pop() || repoNameFromRemote();
if (!repoName) {
  console.error("Could not detect the GitHub repository name. Set NEXT_PUBLIC_BASE_PATH manually and run npm run build, then npx gh-pages -d out.");
  process.exit(1);
}

const basePath = repoName.endsWith(".github.io") ? "" : `/${repoName}`;
const env = { ...process.env, NEXT_PUBLIC_BASE_PATH: basePath };

console.log(`Building for GitHub Pages at ${basePath || "/"}`);
run("npx", ["next", "build"], env);
if (existsSync("out")) writeFileSync("out/.nojekyll", "");
run("npx", ["gh-pages", "-d", "out", "-t", "true"], env);
console.log("Published to the gh-pages branch.");
