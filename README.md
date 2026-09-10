# DAB Coming Soon

A lightweight, responsive coming-soon landing page for **DAB**, a climbing brand.

## Project structure

```text
.
├── index.html
├── AGENTS.md
├── README.md
├── assets
│   ├── css
│   │   └── styles.css
│   ├── images
│   │   ├── dab-block.png
│   │   └── dab-logo.svg
│   └── js
│       └── main.js
```

## Run locally

No build step or package installation is required.

From this folder, run:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

You can also open `index.html` directly, though a local server is better for testing.

## Collaboration workflow

Treat Alan's `main` branch as the upstream source of truth and push your work to
your own fork. Configure this once:

```bash
git config remote.pushDefault origin
git config branch.main.pushRemote origin
```

For each change, update `main` before creating a focused feature branch:

```bash
git switch main
git fetch alanyeh
git rebase alanyeh/main
git switch -c your-feature-name
```

Make small commits containing only the files needed for that change:

```bash
git status
git add <specific-files>
git diff --staged
git commit -m "Describe the change"
```

Before sharing the branch, replay it on the latest upstream work and push it to
your fork:

```bash
git fetch alanyeh
git rebase alanyeh/main
git push -u origin your-feature-name
```

Open a pull request from the feature branch into Alan's `main`. Avoid working
directly on `main`, coordinate before editing the same sections, and do not
commit temporary scripts, build output, or accidental file-permission changes.
Rebase regularly when a branch stays open for several days. Conflicts cannot be
eliminated completely, but keeping branches current and changes focused makes
them much less likely.

### Production deployment handoff

`dabclimbing.com` is connected to Alan's production project. A deployment from a
personal Vercel account creates a separate release and does not update the live
custom domain. Every production change must therefore be handed off through a
pull request into `alanyeh/dab-coming-soon` on the `main` branch:

1. Run `npm run build` and complete the relevant checks locally.
2. Push the feature branch to the `origin` fork.
3. Open a pull request from `ichigooo:<feature-branch>` to
   `alanyeh/dab-coming-soon:main`.
4. Merge the approved pull request and deploy from Alan's production project.
5. Verify the live `dabclimbing.com` pages and crawl endpoints before treating
   the release as complete.

Do not report a personal Vercel preview or production alias as a deployment to
`dabclimbing.com`.

## 3D model privacy

The interactive viewer uses reduced, display-only models from `assets/models/`.
Anything in that directory is public and can be downloaded by a visitor, so it
must not contain manufacturing geometry, exact tolerances, internal channels, or
other production details.

Keep production STL/3MF files in the git-ignored `private-models/` directory.
The build script uses an explicit allowlist and publishes only files named:

- `assets/models/dab-block-01.preview.3mf`
- `assets/models/dab-block-02.preview.3mf`

Run `npm run build` before deployment and verify that `dist/client/assets/models/`
contains only those display models. Deploy `dist/`, not the repository root.

If production geometry was previously committed to a remote repository, moving
or deleting the current file does not erase it from Git history. Rotate access
to a private repository or purge that file from history before making the
repository public.

## Email signup

The form currently behaves as a demo:

- When `FORM_ENDPOINT` in `assets/js/main.js` is blank, the submitted email is stored in `localStorage`.
- To make it production-ready, set `FORM_ENDPOINT` to a Formspree, Basin, custom API, or other form endpoint.

## Store launch

The product page is scaffolded at `/buy/` but remains closed by default. Store settings live in `assets/js/store-config.js`.

To launch:

1. Add the final product copy, hold names, prices, shipping, and returns details to `store-config.js`.
2. Set each hold option's `checkoutUrl` to its HTTPS Stripe Payment Link.
3. Change `enabled` from `false` to `true`.

With `enabled: false`, the homepage continues to show “Coming soon,” the shop link stays hidden, and checkout remains disabled. The full product preview is still available directly at `/buy/`.

To smoke-test the configured live checkout links without launching the store, use `/buy/?checkout=1` on `localhost` or `127.0.0.1`. This switch never activates checkout on the production domain.

## Main editing locations

- Page content and structure: `index.html`
- Layout, typography, responsive behavior, and animation: `assets/css/styles.css`
- Signup behavior: `assets/js/main.js`
- Logo and product image: `assets/images/`

## Search visibility

The production build publishes canonical metadata, social previews, structured
product data, `robots.txt`, `sitemap.xml`, `llms.txt`, and the web app manifest.
Product SEO values live in `scripts/build.mjs`; keep their prices and availability
in sync with `assets/js/store-config.js` whenever the catalog changes.

After deploying a catalog change, submit
`https://www.dabclimbing.com/sitemap.xml` in Google Search Console and Bing
Webmaster Tools. The `llms.txt` file is an experimental discovery aid; standard
crawlability, accurate page copy, and structured data remain the primary SEO and
AI-search signals.

## Current design direction

- White background
- Black and gray editorial typography
- Minimal, premium climbing-brand feel
- Large product-led composition
- No language describing the product as “3D printed”
- Responsive desktop and mobile layouts
