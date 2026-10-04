import { useEffect, useRef, useState } from 'react'
import Glass from '../Glass.jsx'
import { createEngine, makeParams } from './engine.js'
import { exposureLine } from '../../lib/photos.js'
import { isSmallScreen } from '../../lib/device.js'

/**
 * Full-screen photo viewer built on the Liquid Glass Carousel.
 * Opens on the photo that was clicked; drag, scroll or use the arrow keys to
 * move; click (or Enter) on the centre frame to pull it into focus.
 * This file is only loaded on demand, so three.js stays out of page loads.
 */

/** Smallest derivative that stays sharp at the card's focused size. */
function textureSrc(photo, cardH) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const need = photo.aspect * cardH * 1.2 * dpr
  const w = photo.widths.find((x) => x >= need) ?? photo.widths.at(-1)
  return `/photos/${photo.slug}/${photo.slug}-${w}.webp`
}

export default function CarouselViewer({ state, onClose }) {
  const { items, index: startIndex, label } = state
  const rootRef = useRef(null)
  const mountRef = useRef(null)
  const engineRef = useRef(null)
  const [index, setIndex] = useState(startIndex)
  const [focused, setFocused] = useState(false)
  const [closing, setClosing] = useState(false)
  const small = isSmallScreen()

  const close = () => {
    if (closing) return
    setClosing(true)
    rootRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 280, easing: 'ease-in', fill: 'forwards' }).finished.then(onClose, onClose)
  }

  useEffect(() => {
    const mount = mountRef.current
    const vh = window.innerHeight
    const cardH = Math.round(Math.min(small ? vh * 0.6 : vh * 0.7, 820))
    const params = makeParams({
      background: '#08080a',
      sizeMode: 'image', // every card keeps its photograph's own aspect ratio
      cardHeight: cardH,
      gap: small ? 10 : 18,
      maxDpr: small ? 1.5 : 2,
      focusScale: small ? 1.08 : 1.18,
      lens: { ringColor: '#e3a857', dispersion: small ? 7 : 10, samples: small ? 8 : 16 },
      motion: { sensitivity: 5, glide: 5, snap: true },
      entry: { enabled: true, enterFrom: 'bottom', transition: { duration: 0.6, ease: [0.2, 0.7, 0.1, 1] } },
    })
    let engine
    try {
      engine = createEngine(mount, () => params, {
        onIndex: setIndex,
        onFocus: setFocused,
      })
    } catch {
      onClose()
      return
    }
    engineRef.current = engine
    engine.setItems(
      items.map((p) => ({ src: textureSrc(p, cardH), aspect: p.aspect })),
      startIndex,
    )
    return () => {
      engineRef.current = null
      engine.destroy()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard: arrows step, Enter focuses, Esc unfocuses then closes, Tab stays inside.
  useEffect(() => {
    const onKey = (e) => {
      const engine = engineRef.current
      if (!engine) return
      if (e.key === 'Escape') {
        if (e.defaultPrevented || engine.isFocused()) return // the engine handles it
        e.preventDefault()
        close()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        engine.go(1)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        engine.go(-1)
      } else if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault()
        engine.isFocused() ? engine.closeFocus() : engine.openFocus()
      } else if (e.key === 'Tab') {
        const f = [...rootRef.current.querySelectorAll('button:not([disabled])')]
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
    // Focus the dialog itself (not a button) so Enter means "focus this photo".
    rootRef.current?.focus({ preventScroll: true })
    return () => window.removeEventListener('keydown', onKey)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const photo = items[index] ?? items[0]
  const exposure = exposureLine(photo)
  const meta = [label, photo?.exif?.year].filter(Boolean).join(' · ')

  return (
    <div ref={rootRef} className="carousel" tabIndex={-1} role="dialog" aria-modal="true" aria-label={`${label || 'Photo'} viewer`}>
      <div ref={mountRef} className="carousel__stage" />

      <p className="sr-only" aria-live="polite">
        {`Photo ${index + 1} of ${items.length}${photo?.alt ? `: ${photo.alt}` : ''}${focused ? ' (in focus)' : ''}`}
      </p>

      <Glass as="div" className="carousel__close-wrap" radius={999}>
        <button type="button" className="icon-btn carousel__close" onClick={close} aria-label="Close gallery">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </Glass>

      <Glass as="div" className="carousel__bar" radius={999}>
        <p className="lightbox__count" aria-hidden="true">
          {String(index + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
        </p>
        <div className="lightbox__caption">
          {meta && <span className="meta">{meta}</span>}
          {exposure && <span className="meta meta--dim">{exposure}</span>}
          <span className="meta meta--dim carousel__hint">{focused ? 'Click outside or Esc to release' : small ? 'Swipe · tap the centre frame' : 'Drag or scroll · click the centre frame'}</span>
        </div>
        <div className="lightbox__controls">
          <button type="button" className="icon-btn" onClick={() => engineRef.current?.go(-1)} disabled={items.length < 2 || focused} aria-label="Previous photo">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <button type="button" className="icon-btn" onClick={() => engineRef.current?.go(1)} disabled={items.length < 2 || focused} aria-label="Next photo">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </Glass>
    </div>
  )
}
