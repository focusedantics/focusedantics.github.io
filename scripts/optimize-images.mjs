#!/usr/bin/env node
/**
 * FocusedAntics image pipeline — `npm run optimize-images`
 *
 * Reads master photographs from photos/originals/ (never modified),
 * writes responsive AVIF / WebP / JPEG derivatives to public/photos/<slug>/,
 * and writes src/content/photos.generated.json (dimensions, widths, blur
 * placeholder, average colour) for the React components.
 *
 * Flags:
 *   --force        re-encode everything, even if derivatives are up to date
 *   --only=a,b     only process these slugs
 */
import fs from 'node:fs/promises'
import { existsSync, statSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import sharp from 'sharp'
import exifr from 'exifr'

const ROOT = path.resolve(import.meta.dirname, '..')
const SRC_DIR = path.join(ROOT, 'photos/originals')
const OUT_DIR = path.join(ROOT, 'public/photos')
const MANIFEST = path.join(ROOT, 'src/content/photos.generated.json')

const WIDTHS = [640, 960, 1280, 1600, 1920, 2560]
// One extra, larger WebP for the full-screen viewer (4K-wide screens). Only
// made when the master is wider than the largest regular derivative, and only
// downloaded when someone opens that photo full screen.
const FULL_WIDTH = 3840
const INPUT_EXT = /\.(jpe?g|png|tiff?|webp|heic|heif|avif)$/i

// Quality-first settings, tuned by eye at 1:1 against the masters (grain,
// skin, maroon-on-white edges) to be visually lossless — not to hit a byte
// budget. Full chroma keeps saturated edges clean. See README → Photos.
const ENCODERS = {
  avif: (img) => img.avif({ quality: 58, effort: 4, chromaSubsampling: '4:4:4' }),
  webp: (img) => img.webp({ quality: 84, effort: 4, smartSubsample: true }),
  jpg: (img) => img.jpeg({ quality: 84, mozjpeg: true, progressive: true }),
}

const args = process.argv.slice(2)
const FORCE = args.includes('--force')
const ONLY = args.find((a) => a.startsWith('--only='))?.slice(7).split(',')

export const slugify = (file) =>
  path
    .basename(file, path.extname(file))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const kb = (n) => `${(n / 1024).toFixed(0)} KB`
const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`

/** Decode a master into a sharp pipeline with orientation applied. */
async function load(file) {
  if (/\.hei[cf]$/i.test(file)) {
    // sharp's bundled libvips cannot decode HEVC; decode HEIC via libheif (wasm).
    const { default: convert } = await import('heic-convert')
    const buf = await convert({ buffer: await fs.readFile(file), format: 'PNG' })
    return sharp(Buffer.from(buf), { limitInputPixels: false })
  }
  return sharp(file, { limitInputPixels: false }).rotate() // bake EXIF orientation
}

/**
 * Camera settings for editorial captions. Location (GPS) is deliberately never
 * read or published; delivery files carry no metadata at all.
 */
/** "Canon" + "Canon EOS R" → "Canon EOS R"; "SONY" + "ILCE-7M3" → "Sony α7 III". */
function cameraName(make = '', model = '') {
  const m = String(model).trim()
  const k = String(make).trim()
  const name = !k || m.toLowerCase().startsWith(k.toLowerCase()) ? m : `${k} ${m}`
  return name.replace(/^SONY ILCE-7M3$/, 'Sony α7 III').replace(/^SONY /, 'Sony ') || null
}

async function readExif(file) {
  try {
    const e = await exifr.parse(file, { gps: false, pick: ['Make', 'Model', 'LensModel', 'FocalLength', 'FNumber', 'ExposureTime', 'ISO', 'DateTimeOriginal'] })
    if (!e) return null
    const shutter = e.ExposureTime ? (e.ExposureTime >= 1 ? `${e.ExposureTime}s` : `1/${Math.round(1 / e.ExposureTime)}`) : null
    const out = {
      camera: cameraName(e.Make, e.Model),
      lens: e.LensModel?.replace(/^iPhone .*? back .*?camera /, '') || null,
      focal: e.FocalLength ? `${Math.round(e.FocalLength)}mm` : null,
      aperture: e.FNumber ? `ƒ/${+e.FNumber.toFixed(1)}` : null,
      shutter,
      iso: e.ISO ? `ISO ${e.ISO}` : null,
      year: e.DateTimeOriginal instanceof Date ? e.DateTimeOriginal.getFullYear() : null,
    }
    return Object.values(out).some(Boolean) ? out : null
  } catch {
    return null
  }
}

/**
 * Ensure the full-screen WebP exists; returns its width, or null if the
 * largest regular derivative already covers it. The long edge is capped at
 * FULL_WIDTH so portraits stay within phones' 4096px texture limit.
 */
async function ensureFull(base, slug, dir, width, height) {
  const w = Math.min(width, FULL_WIDTH, Math.round(FULL_WIDTH * (width / height)))
  if (w <= Math.min(width, WIDTHS.at(-1))) return null
  const out = path.join(dir, `${slug}-full.webp`)
  if (!FORCE && existsSync(out)) return w
  await base
    .clone()
    .resize({ width: w, withoutEnlargement: true, kernel: 'lanczos3' })
    .withIccProfile('srgb')
    .webp({ quality: 88, effort: 4, smartSubsample: true })
    .toFile(out)
  return w
}

async function processOne(file, previous) {
  const slug = slugify(file)
  const srcStat = statSync(file)
  const dir = path.join(OUT_DIR, slug)
  const base = await load(file)
  // Force a real decode so width/height reflect the orientation-corrected pixels.
  const { data: _, info } = await base.clone().raw().toBuffer({ resolveWithObject: true })
  const { width, height } = info

  let widths = WIDTHS.filter((w) => w <= width)
  if (!widths.length || widths.at(-1) < Math.min(width, WIDTHS.at(-1))) widths.push(Math.min(width, WIDTHS.at(-1)))
  widths = [...new Set(widths)]

  const upToDate =
    !FORCE &&
    previous?.source === path.basename(file) &&
    previous?.sourceBytes === srcStat.size &&
    widths.every((w) => Object.keys(ENCODERS).every((ext) => existsSync(path.join(dir, `${slug}-${w}.${ext}`))))

  if (upToDate) return { ...previous, full: await ensureFull(base, slug, dir, width, height), exif: await readExif(file), _skipped: true }

  await fs.rm(dir, { recursive: true, force: true })
  await fs.mkdir(dir, { recursive: true })

  const outputs = []
  for (const w of widths) {
    for (const [ext, encode] of Object.entries(ENCODERS)) {
      const out = path.join(dir, `${slug}-${w}.${ext}`)
      // Metadata is stripped by default; embed a compact sRGB profile so colour stays correct.
      const pipeline = base.clone().resize({ width: w, withoutEnlargement: true, kernel: 'lanczos3' }).withIccProfile('srgb')
      const res = await encode(pipeline).toFile(out)
      outputs.push({ w, ext, bytes: res.size })
    }
  }

  // Tiny blurred placeholder used for the "pull focus" load-in, and an average colour.
  const lqip = await base.clone().resize(24, 24, { fit: 'inside' }).webp({ quality: 40 }).toBuffer()
  const { dominant } = await base.clone().resize(64, 64, { fit: 'inside' }).stats()

  return {
    slug,
    source: path.basename(file),
    sourceBytes: srcStat.size,
    width,
    height,
    widths,
    placeholder: `data:image/webp;base64,${lqip.toString('base64')}`,
    color: `rgb(${dominant.r} ${dominant.g} ${dominant.b})`,
    exif: await readExif(file),
    full: await ensureFull(base, slug, dir, width, height),
    _outputs: outputs,
  }
}

async function main() {
  if (!existsSync(SRC_DIR)) {
    console.error(`No masters found. Put the original photographs in ${path.relative(ROOT, SRC_DIR)}/`)
    process.exit(1)
  }
  const previous = existsSync(MANIFEST) ? JSON.parse(await fs.readFile(MANIFEST, 'utf8')) : {}
  const files = (await fs.readdir(SRC_DIR))
    .filter((f) => INPUT_EXT.test(f))
    .sort()
    .map((f) => path.join(SRC_DIR, f))
    .filter((f) => !ONLY || ONLY.includes(slugify(f)))

  const manifest = ONLY ? { ...previous } : {}
  const rows = []
  let totalIn = 0
  let totalOut = 0

  const results = new Array(files.length)
  let next = 0
  const workers = Array.from({ length: Math.min(files.length, Math.max(1, Math.floor(os.availableParallelism() / 2))) }, async () => {
    while (next < files.length) {
      const i = next++
      const file = files[i]
      try {
        results[i] = await processOne(file, previous[slugify(file)])
        console.log(`• ${path.basename(file)} — ${results[i]._skipped ? 'up to date' : `${results[i].width}×${results[i].height}`}`)
      } catch (err) {
        console.log(`• ${path.basename(file)} — FAILED: ${err.message}`)
      }
    }
  })
  await Promise.all(workers)

  for (const entry of results) {
    if (!entry) continue
    const { _outputs, _skipped, ...clean } = entry
    manifest[clean.slug] = clean
    if (_skipped) continue
    const at = (ext, w) => _outputs.find((o) => o.ext === ext && o.w === w)?.bytes
    const top = clean.widths.at(-1)
    const mid = clean.widths.find((w) => w >= 1280) ?? top
    const outBytes = _outputs.reduce((s, o) => s + o.bytes, 0)
    totalIn += clean.sourceBytes
    totalOut += outBytes
    rows.push({
      photo: clean.source,
      dimensions: `${clean.width}×${clean.height}`,
      master: mb(clean.sourceBytes),
      widths: clean.widths.join(' '),
      'avif @1280': kb(at('avif', mid)),
      'avif @max': `${kb(at('avif', top))} (${top})`,
      'webp @max': kb(at('webp', top)),
      'jpg @max': kb(at('jpg', top)),
      'vs master': `${Math.round((at('avif', top) / clean.sourceBytes) * 100)}%`,
    })
  }

  // Remove derivative folders whose master no longer exists.
  if (!ONLY && existsSync(OUT_DIR)) {
    for (const d of await fs.readdir(OUT_DIR)) {
      if (!manifest[d]) {
        await fs.rm(path.join(OUT_DIR, d), { recursive: true, force: true })
        console.log(`– removed stale derivatives: ${d}`)
      }
    }
  }

  await fs.mkdir(path.dirname(MANIFEST), { recursive: true })
  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)))
  await fs.writeFile(MANIFEST, JSON.stringify(sorted, null, 2) + '\n')

  if (rows.length) {
    console.log('')
    console.table(rows)
    console.log(`Processed ${rows.length} photo(s) from ${mb(totalIn)} of masters. "vs master" compares the largest AVIF to the original file.`)
    console.log(`All derivatives together: ${mb(totalOut)} on disk. A visitor downloads one format at one width per photo.`)
  }
  console.log(`Manifest: ${path.relative(ROOT, MANIFEST)} (${Object.keys(sorted).length} photos)`)
}

main()
