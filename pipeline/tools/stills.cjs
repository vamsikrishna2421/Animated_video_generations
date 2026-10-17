// node pipeline/tools/stills.cjs <compId> <outDir> <frame...>: one bundle, many stills (jpeg).
const path = require("node:path");
const fs = require("node:fs");
const V = path.resolve(__dirname, "../../video");
const { bundle } = require(V + "/node_modules/@remotion/bundler");
const { renderStill, selectComposition } = require(V + "/node_modules/@remotion/renderer");
(async () => {
  const [, , compId, outDir, ...frames] = process.argv;
  fs.mkdirSync(outDir, { recursive: true });
  const serveUrl = await bundle({ entryPoint: V + "/src/index.ts", enableCaching: false, symlinkPublicDir: true, publicDir: V + "/public" });
  const browserExecutable = process.env.CHROME || "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
  const composition = await selectComposition({ serveUrl, id: compId, browserExecutable });
  for (const f of frames) {
    await renderStill({ composition, serveUrl, output: path.join(outDir, `${compId}_${String(f).padStart(5, "0")}.jpg`), frame: Number(f), imageFormat: "jpeg", jpegQuality: 70, browserExecutable });
    console.log("still", f);
  }
  fs.rmSync(serveUrl, { recursive: true, force: true });
})().catch((e) => { console.error(e); process.exit(1); });
