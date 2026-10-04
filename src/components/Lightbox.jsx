import { createContext, lazy, Suspense, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Glass from './Glass.jsx'
import { exposureLine, srcSet } from '../lib/photos.js'
import { prefersReducedMotion, hasWebGL } from '../lib/device.js'

// The Liquid Glass Carousel (three.js) is the viewer; it loads only when a
// photo is first opened. The simple viewer below stays as the fallback for
// reduced motion or no WebGL.
const CarouselViewer = lazy(() => import('./carousel/CarouselViewer.jsx'))
const useCarousel = () => hasWebGL() && !prefersReducedMotion()

const LightboxContext = createContext(() => {})
export const useLightbox = () => useContext(LightboxContext)

const EASE = 'cubic-bezier(.2,.7,.1,1)'
const PAD = { x: 24, top: 72, bottom: 104 }

/** Largest rect with the photo's aspect ratio that fits the viewport stage. */
function fitRect(photo) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const small = vw < 760
  const padX = small ? 0 : PAD.x * 2
  const maxW = vw - padX * 2
  const maxH = vh - (small ? 64 + 120 : PAD.top + PAD.bottom)
  let w = maxW
  let h = w / photo.aspect
  if (h > maxH) {
    h = maxH
    w = h * photo.aspect
  }
  return { w, h, x: (vw - w) / 2, y: (small ? 64 : PAD.top) + (maxH - h) / 2 }
}

function Viewer({ state, onClose, onStep }) {
  const { items, index, origin } = state
  const photo = items[index]
  const dialogRef = useRef(null)
  const frameRef = useRef(null)
  const [rect, setRect] = useState(() => fitRect(photo))
  const [sharpSlug, setSharpSlug] = useState(null)
  const sharp = sharpSlug === photo.slug
  const [closing, setClosing] = useState(false)
  const firstRun = useRef(true)
  const reduced = prefersReducedMotion()

  useEffect(() => {
    const onResize = () => setRect(fitRect(photo))
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [photo])

  // Enter: move from the thumbnail's position to the stage — the viewer
  // physically moves closer while the lens pulls focus.
  useLayoutEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    if (firstRun.current) {
      firstRun.current = false
      dialogRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: reduced ? 1 : 320, easing: 'ease-out', fill: 'both' })
      const from = origin?.getBoundingClientRect()
      if (from && from.width && !reduced) {
        const r = fitRect(photo)
        const sx = from.width / r.w
        const sy = from.height / r.h
        const s = Math.max(sx, sy)
        const tx = from.left + from.width / 2 - (r.x + r.w / 2)
        const ty = from.top + from.height / 2 - (r.y + r.h / 2)
        frame.animate(
          [
            { transform: `translate(${tx}px, ${ty}px) scale(${s})`, filter: 'blur(0px)' },
            { transform: 'translate(0,0) scale(1.012)', filter: 'blur(3px)', offset: 0.55 },
            { transform: 'translate(0,0) scale(1)', filter: 'blur(0px)' },
          ],
          { duration: 720, easing: EASE },
        )
      }
      return
    }
    // Stepping between photos: a short exposure change rather than a slide.
    if (!reduced) {
      frame.animate(
        [
          { opacity: 0, transform: 'scale(.985)', filter: 'blur(6px) brightness(1.4)' },
          { opacity: 1, transform: 'scale(1)', filter: 'blur(0px) brightness(1)' },
        ],
        { duration: 420, easing: EASE },
      )
    }
  }, [index]) // eslint-disable-line react-hooks/exhaustive-deps

  const close = useCallback(() => {
    if (closing) return
    setClosing(true)
    const frame = frameRef.current
    const from = origin?.getBoundingClientRect()
    const visible = from && from.bottom > 0 && from.top < window.innerHeight && from.width
    const done = () => onClose()
    if (reduced) return done()
    dialogRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 360, delay: 120, easing: 'ease-in', fill: 'both' })
    if (frame && visible && index === state.startIndex) {
      const r = fitRect(photo)
      const s = Math.max(from.width / r.w, from.height / r.h)
      const tx = from.left + from.width / 2 - (r.x + r.w / 2)
      const ty = from.top + from.height / 2 - (r.y + r.h / 2)
      frame.animate([{ transform: 'none' }, { transform: `translate(${tx}px, ${ty}px) scale(${s})` }], { duration: 480, easing: EASE, fill: 'both' }).onfinish = done
    } else {
      const anim = frame?.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.97)' }], { duration: 360, easing: 'ease-in', fill: 'both' })
      if (anim) anim.onfinish = done
      else done()
    }
  }, [closing, index, onClose, origin, photo, reduced, state.startIndex])

  // Keyboard: Esc closes, arrows step, Tab stays inside the dialog.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') return close()
      if (e.key === 'ArrowRight') return onStep(1)
      if (e.key === 'ArrowLeft') return onStep(-1)
      if (e.key === 'Tab') {
        const f = [...dialogRef.current.querySelectorAll('button, a[href]')].filter((el) => !el.disabled)
        if (!f.length) return
        const first = f[0]
        const last = f.at(-1)
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close, onStep])

  useEffect(() => {
    dialogRef.current?.querySelector('.lightbox__close')?.focus()
  }, [])

  // Touch: horizontal swipe to step, swipe down to close.
  const touch = useRef(null)
  const onPointerDown = (e) => {
    if (e.pointerType !== 'mouse') touch.current = { x: e.clientX, y: e.clientY }
  }
  const onPointerUp = (e) => {
    const t = touch.current
    touch.current = null
    if (!t) return
    const dx = e.clientX - t.x
    const dy = e.clientY - t.y
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) onStep(dx < 0 ? 1 : -1)
    else if (dy > 90) close()
  }

  const thumbSrc = origin?.querySelector?.('img')?.currentSrc
  const meta = [state.label, photo.exif?.year].filter(Boolean).join(' · ')
  const exposure = exposureLine(photo)

  return (
    <div
      ref={dialogRef}
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      <div className="lightbox__backdrop" onClick={close} />
      <div
        ref={frameRef}
        className={`lightbox__frame ${sharp ? 'is-sharp' : ''}`}
        style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h, backgroundColor: photo.color }}
      >
        {index === state.startIndex && thumbSrc && <img className="lightbox__thumb" src={thumbSrc} alt="" aria-hidden="true" />}
        <picture key={photo.slug}>
          <source type="image/avif" srcSet={srcSet(photo, 'avif')} sizes={`${Math.round(rect.w)}px`} />
          <source type="image/webp" srcSet={srcSet(photo, 'webp')} sizes={`${Math.round(rect.w)}px`} />
          <img
            className="lightbox__img"
            srcSet={srcSet(photo, 'jpg')}
            sizes={`${Math.round(rect.w)}px`}
            src={`/photos/${photo.slug}/${photo.slug}-${photo.widths.at(-1)}.jpg`}
            width={photo.width}
            height={photo.height}
            alt={photo.alt}
            onLoad={() => setSharpSlug(photo.slug)}
            decoding="async"
          />
        </picture>
      </div>

      <Glass as="div" className="lightbox__bar" radius={999}>
        <p className="lightbox__count" aria-live="polite">
          <span className="sr-only">Photo </span>
          {String(index + 1).padStart(2, '0')}
          <span aria-hidden="true"> / </span>
          <span className="sr-only"> of </span>
          {String(items.length).padStart(2, '0')}
        </p>
        <div className="lightbox__caption">
          {meta && <span className="meta">{meta}</span>}
          {exposure && <span className="meta meta--dim">{exposure}</span>}
        </div>
        <div className="lightbox__controls">
          <button type="button" className="icon-btn" onClick={() => onStep(-1)} disabled={items.length < 2} aria-label="Previous photo">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <button type="button" className="icon-btn" onClick={() => onStep(1)} disabled={items.length < 2} aria-label="Next photo">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </Glass>
      <Glass as="div" className="lightbox__close-wrap" radius={999}>
        <button type="button" className="icon-btn lightbox__close" onClick={close} aria-label="Close photo viewer">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </Glass>
    </div>
  )
}

export function LightboxProvider({ children }) {
  const [state, setState] = useState(null)
  const originRef = useRef(null)

  const open = useCallback((items, index, origin, label = '') => {
    originRef.current = origin
    setState({ items, index, startIndex: index, origin, label })
  }, [])

  const onStep = useCallback((d) => {
    setState((s) => (s && s.items.length > 1 ? { ...s, index: (s.index + d + s.items.length) % s.items.length } : s))
  }, [])

  const onClose = useCallback(() => setState(null), [])

  // Lock page scroll while open, without layout shift from the scrollbar.
  useEffect(() => {
    if (!state) return
    const html = document.documentElement
    const gap = window.innerWidth - html.clientWidth
    html.style.overflow = 'hidden'
    html.style.paddingRight = `${gap}px`
    document.getElementById('root')?.setAttribute('inert', '')
    return () => {
      html.style.overflow = ''
      html.style.paddingRight = ''
      document.getElementById('root')?.removeAttribute('inert')
      // Return focus to the photograph that was opened.
      originRef.current?.focus?.({ preventScroll: true })
    }
  }, [!!state]) // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo(() => open, [open])
  return (
    <LightboxContext.Provider value={value}>
      {children}
      {state && <ViewerPortal state={state} onClose={onClose} onStep={onStep} />}
    </LightboxContext.Provider>
  )
}

function ViewerPortal(props) {
  const carousel = useMemo(useCarousel, [])
  return createPortal(
    carousel ? (
      <Suspense fallback={<div className="carousel carousel--loading" aria-hidden="true" />}>
        <CarouselViewer state={props.state} onClose={props.onClose} />
      </Suspense>
    ) : (
      <Viewer {...props} />
    ),
    document.body,
  )
}
