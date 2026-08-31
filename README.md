# QuadQR App

A clean consumer-facing QuadQR generator and scanner built with Next.js, Tailwind CSS, shadcn/ui-style components and semantic theme tokens, and `quadqr-js`.

## Included

- Generator for links, plain text, email, SMS, and phone numbers
- All four QuadQR styles: Classic, Depth, Soft, and Inset (hidden and disabled in High Density Mode)
- Optional logo with automatic logo sizing and clear-background toggle
- Automatic compression
- Fixed **2-module quiet zone in both Screen and Print output**
- Advanced-only High Density Mode, output size, and Screen/Print output mode
- 720 px default export size with 512, 720, 900, 1200, and 1600 px options
- Native QuadQR Screen/Print rendering while preserving the requested 2-module quiet zone
- Camera scanner using QuadQR's live scanner
- Finder-eye overlay with connected lines and no debug text
- Image scanning for desktop/mobile fallback
- Result recognition with contextual actions for links, text, email, SMS, and phone
- Installable PWA with service worker and home-screen icons
- Static Next.js export for GitHub Pages
- `gh-pages` deployment script and optional GitHub Actions workflow
- Light/dark theme switch in the top bar with the preference saved locally
- Raleway loaded from Google Fonts

There are intentionally no signing, encryption, raw-key, or password controls in this app.

## shadcn/ui and tweakcn themes

The project includes `components.json` and uses shadcn semantic theme tokens throughout the UI instead of fixed Slate colors. The main theme variables live in `app/globals.css` under `:root` and `.dark`.

This makes it straightforward to use a tweakcn theme later. Replace the theme variable values for tokens such as:

- `--background` / `--foreground`
- `--card` / `--card-foreground`
- `--primary` / `--primary-foreground`
- `--secondary` / `--secondary-foreground`
- `--muted` / `--muted-foreground`
- `--accent` / `--accent-foreground`
- `--border`, `--input`, and `--ring`

Keep the `@theme inline` mappings in place so Tailwind utilities such as `bg-primary`, `text-muted-foreground`, and `border-border` continue to follow the selected theme.

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

The app requires `quadqr-js` 1.5.4 or newer within the current major version. The committed `package-lock.json` pins installs to the verified release until dependencies are intentionally updated.

### Screen and Print quiet zones

The app passes `quietZone: 2` and the selected Screen/Print mode directly to QuadQR. Current QuadQR releases apply the requested quiet zone consistently in both modes, so the app does not crop, resize, or manually replace the library's output palette.

## PWA notes

The service worker caches the app shell and same-origin assets as they are used. Once the site has been loaded successfully, supported browsers can install it from the browser install prompt or Add to Home Screen menu.

Camera scanning requires a secure context. GitHub Pages provides HTTPS automatically.
