import { cp, mkdir, rm, writeFile } from "node:fs/promises";

const publicModelFiles = new Set([
  "assets/models/dab-block-01.preview.3mf",
  "assets/models/dab-block-02.preview.3mf"
]);

function includePublicAsset(source) {
  const normalizedSource = source.replaceAll("\\", "/");
  if (normalizedSource === "assets/models") return true;
  if (normalizedSource.startsWith("assets/models/")) {
    return publicModelFiles.has(normalizedSource);
  }
  return true;
}

await rm("dist", { force: true, recursive: true });
await mkdir("dist/server", { recursive: true });
await mkdir("dist/.openai", { recursive: true });

await cp("index.html", "dist/index.html");
await cp("buy", "dist/buy", { recursive: true });
// Publish clean, product-specific URLs while sharing the product template.
await mkdir("dist/buy/block-01", { recursive: true });
await mkdir("dist/buy/block-02", { recursive: true });
await cp("buy/index.html", "dist/buy/block-01/index.html");
await cp("buy/index.html", "dist/buy/block-02/index.html");
await cp("thank-you", "dist/thank-you", { recursive: true });
// Browser-delivered 3D geometry is always downloadable. Only explicitly
// approved, display-only models may enter the deploy output.
await cp("assets", "dist/assets", {
  recursive: true,
  filter: includePublicAsset
});
await cp(".openai/hosting.json", "dist/.openai/hosting.json");

await writeFile(
  "dist/server/index.js",
  `export default {
  async fetch(request, env) {
    if (env && env.ASSETS && typeof env.ASSETS.fetch === "function") {
      return env.ASSETS.fetch(request);
    }

    return new Response("Static asset binding is unavailable.", {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8" }
    });
  }
};
`
);
