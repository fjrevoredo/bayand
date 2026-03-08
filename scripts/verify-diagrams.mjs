import { existsSync } from "node:fs";
import path from "node:path";

const DIAGRAMS_DIR = path.resolve("docs/diagrams");
const DIAGRAMS = [
  { source: "unlock.mmd", output: "unlock.svg" },
  { source: "unlock-dark.mmd", output: "unlock-dark.svg" },
  { source: "save-entry.mmd", output: "save-entry.svg" },
  { source: "save-entry-dark.mmd", output: "save-entry-dark.svg" },
  { source: "context.mmd", output: "context.svg" },
  { source: "context-dark.mmd", output: "context-dark.svg" },
  { source: "architecture.d2", output: "architecture.svg" },
  { source: "architecture-dark.d2", output: "architecture-dark.svg" },
];

let missing = 0;

for (const diagram of DIAGRAMS) {
  const sourcePath = path.join(DIAGRAMS_DIR, diagram.source);
  const outputPath = path.join(DIAGRAMS_DIR, diagram.output);

  if (!existsSync(sourcePath)) {
    console.error(`❌ Diagram source missing: ${path.relative(process.cwd(), sourcePath)}`);
    missing = 1;
  }

  if (!existsSync(outputPath)) {
    console.error(`❌ Diagram output missing: ${path.relative(process.cwd(), outputPath)}`);
    console.error("Run: bun run diagrams && commit the generated SVGs");
    missing = 1;
  }
}

if (missing !== 0) {
  process.exit(1);
}

console.log("✅ All diagram sources and outputs are present");
