# QuadQR App

A clean consumer-facing QuadQR generator and scanner built with Next.js, Tailwind CSS, shadcn-style Radix UI components, and `quadqr-js`.

## Included

- Generator for links, plain text, email, SMS, and phone numbers
- All four QuadQR styles: Classic, Depth, Soft, and Inset
- Optional logo with automatic logo sizing and clear-background toggle
- Automatic compression
- Fixed 2-module quiet zone in the app UI
- Advanced-only High Density Mode and Screen/Print output mode
- Camera scanner using QuadQR's live scanner
- Finder-eye overlay with connected lines and no debug text
- Image scanning for desktop/mobile fallback
- Result recognition with contextual actions for links, text, email, SMS, and phone
- Installable PWA with service worker and home-screen icons
- Static Next.js export for GitHub Pages
- `gh-pages` deployment script and optional GitHub Actions workflow

There are intentionally no signing, encryption, raw-key, or password controls in this app.

## Run locally

Requirements: Node.js 20.19+ recommended.

```bash
npm install
npm run dev
```

Open the local URL shown by Next.js.

> Camera access works on `localhost` during development and on HTTPS in production. GitHub Pages is HTTPS.

## Build a static site

```bash
npm run build
```

The exported site is written to `out/`.

If the app is hosted at a GitHub project path such as `https://username.github.io/my-repo/`, build with:

```bash
NEXT_PUBLIC_BASE_PATH=/my-repo npm run build
```

On Windows PowerShell:

```powershell
$env:NEXT_PUBLIC_BASE_PATH="/my-repo"
npm run build
```

## Deploy with gh-pages

Push this project to GitHub and make sure the repository has an `origin` remote, then run:

```bash
npm run deploy
```

The deploy script automatically reads the repository name, builds with the correct GitHub Pages base path, adds `.nojekyll`, and publishes `out/` to the `gh-pages` branch.

In GitHub repository settings, set **Pages → Build and deployment → Source** to **Deploy from a branch**, then choose `gh-pages` and `/ (root)`.

### Automatic deploys

An optional workflow is included at `.github/workflows/deploy-pages.yml`. It runs the same `npm run deploy` flow after pushes to `main` or `master`. If you prefer manual deployments, delete that workflow file.

## QuadQR dependency

`package.json` uses the npm `latest` tag for `quadqr-js`, so a fresh install picks up the latest published QuadQR release. Commit the generated `package-lock.json` after your first `npm install` if you want production builds to stay pinned until you intentionally update dependencies.

## PWA notes

The service worker caches the app shell and assets as they are used. Once the site has been loaded successfully, supported browsers can install it from the browser install prompt or Add to Home Screen menu.

Camera scanning requires a secure context. GitHub Pages provides HTTPS automatically.
