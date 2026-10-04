# FocusedAntics

Photography portfolio for [@focusedantics](https://www.instagram.com/focusedantics/). It's a React + Vite single-page site, deployed to GitHub Pages as static files.

```
npm install
npm run dev               # local dev server
npm run build             # production build → dist/
npm run optimize-images   # masters → responsive AVIF / WebP / JPEG
```

## Editing content (no code needed)

| What | Where |
| --- | --- |
| Hero photo, homepage layout, contact-sheet strip, album-card photo | `src/content/photos.js` → `home` |
| Galleries on the Work page (order, titles, labels) | `src/content/photos.js` → `collections` |
| Alt text and crop focal point for each photo | `src/content/photos.js` → `photoInfo` |
| Statement, service area, Instagram, **Lightroom album link**, email | `src/content/site.js` → `site` |
| Sessions offered (Services page + booking form) | `src/content/site.js` → `services` |
| About text | `src/content/site.js` → `about` |

Photos are referenced by **slug**: the master's filename, lower-cased, with anything that isn't a letter or digit turned into `-`. For example, `DSC03793.jpg` becomes `dsc03793`.

Things that stay hidden until you fill them in:
- `site.lightroomAlbumUrl`: the "View Full Album ↗" card.
- `site.contactEmail`: without it, the booking form hands the enquiry to an Instagram DM. With it, the form opens an email draft instead.

## Photos

Google Drive is where the photos come from, not where the site loads them from. The site only ever loads its own optimized copies.

1. Download the Drive folder's photos into **`photos/originals/`**. These are the masters. The script only reads them and never changes them, and git ignores them.
2. Run **`npm run optimize-images`**. For each master it:
   - applies the EXIF orientation, then strips all metadata (including GPS) from the web copies and embeds an sRGB profile;
   - writes AVIF, WebP and JPEG at 640 / 960 / 1280 / 1600 / 1920 / 2560 px wide, skipping any width larger than the original (it never upscales);
   - uses quality-based settings with 4:4:4 chroma (AVIF q64, WebP q86, mozjpeg q86), tuned to look visually lossless rather than to hit a fixed file size;
   - writes `public/photos/<slug>/…` and `src/content/photos.generated.json`, which holds dimensions, widths, a blur placeholder, the average colour and camera settings;
   - prints a table of each photo's original size, output sizes and dimensions.

   The script is incremental: unchanged photos are skipped. Use `--force` to re-encode everything, or `--only=slug1,slug2` to process specific photos. HEIC files from an iPhone work too.
3. Reference the new slugs in `src/content/photos.js`, then commit `public/photos` and the generated JSON.

Every image renders as `<picture>` (AVIF → WebP → JPEG) with `srcset`/`sizes` and explicit width and height. The hero loads eagerly with `fetchpriority="high"` and is preloaded. Every other image is lazy-loaded.

## Deploying

`.github/workflows/deploy.yml` builds and publishes on every push to `main`.
One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

The build writes a real `index.html` for every route, so deep links such as `/work` load normally. It also writes `404.html`, `sitemap.xml` and `robots.txt`.

## How the visual system works

- **Wordmark** (`BrandMark`, `LiquidLogo`): a liquid-metal effect adapted from [liquid-logo](https://github.com/collidingScopes/liquid-logo). It uses one small WebGL canvas, runs only in the hero, and pauses when off-screen. The real text stays in the page.
- **Liquid glass** (`Glass`): uses the refraction model from [liquid-glass-js](https://github.com/dashersw/liquid-glass-js), baked into an SVG displacement map, so it bends the *live* backdrop. Used only on controls (nav, CTAs, filters, lightbox). Browsers without SVG backdrop filters get a frosted CSS fallback, and phones always get the simpler version.
- **Ambient light** (`ShaderStage` → `ShaderField`): [@shadergradient/react](https://github.com/ruucm/shadergradient) on [React Three Fiber](https://github.com/pmndrs/react-three-fiber). It is lazy-loaded (three.js isn't in the first-load bundle), mounts only near the viewport, stops rendering when off-screen, and drops to a lower pixel density on phones. A static CSS gradient underneath is the complete design on its own.
- **Photo viewer** (`carousel/`): clicking a photograph opens the Liquid Glass Carousel (adapted from Originkit; three.js with a refractive lens shader). It opens on the clicked photo; drag, scroll, swipe or use ← → to move; click the centre frame or press Enter to bring it into focus; Esc releases focus, then closes. It loads only when first opened. With reduced motion or no WebGL, a simple static viewer is used instead.
- **Motion**: focus pulls (images sharpen from a blurred placeholder), an AF bracket in the hero, contact-sheet frames that develop from negative to positive, and exposure-change page transitions.
- **Reduced motion or low-power devices**: all continuous motion, parallax and WebGL switch off, and the site looks complete without them.
