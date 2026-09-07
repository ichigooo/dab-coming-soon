import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";

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

const productTemplate = await readFile("buy/index.html", "utf8");
const productPages = [
  {
    slug: "block-01",
    name: "DAB BLOCK 01",
    seoTitle: "DAB BLOCK 01 | Flat-Edge Training Block",
    description: "A customizable flat-edge no-hang block for climbing warm-ups, weighted pulls, and hold-specific finger-strength training.",
    image: "/assets/images/dab-block-01-main.jpg?v=20260904",
    imageWidth: 986,
    imageHeight: 878,
    price: "25.00"
  },
  {
    slug: "block-02",
    name: "DAB BLOCK 02",
    seoTitle: "DAB BLOCK 02 | Ergonomic Training Block",
    description: "A customizable ergonomic no-hang block with a variable-height edge for climbing warm-ups, weighted pulls, and balanced finger-strength training.",
    image: "/assets/images/dab-block-02-main.png?v=20260904-02",
    imageWidth: 1439,
    imageHeight: 1089,
    price: "30.00"
  }
];

function productSeoMarkup(product) {
  const url = `https://www.dabclimbing.com/buy/${product.slug}/`;
  const image = `https://www.dabclimbing.com${product.image}`;
  const title = product.seoTitle;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    description: product.description,
    image: [image],
    sku: product.name.replaceAll(" ", "-"),
    category: "Climbing training equipment",
    brand: {
      "@type": "Brand",
      name: "DAB"
    },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "USD",
      price: product.price,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition"
    }
  };

  return `
  <link rel="canonical" href="${url}" />
  <meta property="og:type" content="product" />
  <meta property="og:site_name" content="DAB Climbing" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${product.description}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="${product.imageWidth}" />
  <meta property="og:image:height" content="${product.imageHeight}" />
  <meta property="og:image:alt" content="${product.name} climbing training block" />
  <meta property="product:price:amount" content="${product.price}" />
  <meta property="product:price:currency" content="USD" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${product.description}" />
  <meta name="twitter:image" content="${image}" />
  <script type="application/ld+json">${JSON.stringify(structuredData)}</script>`;
}

for (const product of productPages) {
  const page = productTemplate
    .replace('<meta name="description" content="Customize a DAB no-hang climbing training block for warm-ups, weighted pulls, and finger-strength work." />', `<meta name="description" content="${product.description}" />`)
    .replace('<meta name="robots" content="noindex, follow" />', '<meta name="robots" content="index, follow, max-image-preview:large" />')
    .replace("<title>DAB Climbing | Choose Your Training Block</title>", `<title>${product.seoTitle}</title>`)
    .replace("<!-- PRODUCT_SEO -->", productSeoMarkup(product));
  await writeFile(`dist/buy/${product.slug}/index.html`, page);
}
await cp("thank-you", "dist/thank-you", { recursive: true });
// Browser-delivered 3D geometry is always downloadable. Only explicitly
// approved, display-only models may enter the deploy output.
await cp("assets", "dist/assets", {
  recursive: true,
  filter: includePublicAsset
});
await cp(".openai/hosting.json", "dist/.openai/hosting.json");
await cp("robots.txt", "dist/robots.txt");
await cp("sitemap.xml", "dist/sitemap.xml");
await cp("llms.txt", "dist/llms.txt");
await cp("site.webmanifest", "dist/site.webmanifest");

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
