// PostToolUse hook: auto-fix the edited file with Biome and report remaining
// violations back to the agent (exit 2 => stderr is shown to Claude).
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const CHECKED = /\.(ts|tsx|mts|mjs|js|json|css)$/;

const input = JSON.parse(readFileSync(0, "utf8"));
const filePath = input.tool_input?.file_path;
const cwd = input.cwd ?? ".";
const biome = join(cwd, "node_modules", ".bin", "biome");

if (filePath && CHECKED.test(filePath) && existsSync(filePath) && existsSync(biome)) {
  const args = ["check", "--write", "--no-errors-on-unmatched", relative(cwd, filePath)];
  const result = spawnSync(biome, args, { cwd, encoding: "utf8" });
  if (result.status !== 0) {
    process.stderr.write(`Biome found issues in ${filePath}:\n${result.stdout}${result.stderr}`);
    process.exit(2);
  }
}
