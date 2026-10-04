/**
 * Photo curation — the one file to edit when changing which photographs appear
 * where. Components never hard-code photos.
 *
 * Each photo is referenced by its slug: the master's file name, lower-cased,
 * with anything that isn't a letter or digit turned into "-".
 *   photos/originals/DSC03793.jpg  →  'dsc03793'
 *
 * Dimensions, responsive widths and camera settings come from
 * photos.generated.json, written by `npm run optimize-images`.
 *
 *   alt    what is in the frame, for screen readers (describe, don't interpret)
 *   focus  "x% y%" — the point that must survive any crop (object-position)
 *   tone   'dark' | 'light' — whether overlaid UI needs to sit on light pixels
 */
export const photoInfo = {
  // — Game day —
  dsc04324: { alt: 'Trombones raised in a packed stadium section, orange pom-poms blurred in the foreground', focus: '38% 55%' },
  dsc03314: { alt: 'A marching band member in a VT shako shouting mid-cheer, bandmates behind', focus: '40% 45%' },
  dsc03306: { alt: 'A smiling clarinetist in mirrored sunglasses makes a heart with both hands among the band', focus: '57% 52%' },
  dsc04265: { alt: 'Rows of band members in maroon and white, instruments at rest, seen from within the stands', focus: '50% 50%' },

  // — Cover —
  dsc01201: { alt: 'A long-haired sable-and-white dog sits in fresh snow on a wooded hillside as flakes fall', focus: '40% 40%' },

  // — New frames (September 2026 upload) —
  dsc01355: { alt: 'A smiling person with long copper braids and a denim jacket, pink blossoms overhead', focus: '45% 38%' },
  dsc01393: { alt: 'A person in a denim jacket stands beneath a flowering cherry tree, backlit by soft sun', focus: '50% 35%' },
  dsc01656: { alt: 'A chestnut horse in a rope halter leans toward the camera with a curious look', focus: '60% 35%' },
  dsc02356: { alt: 'Two people silhouetted in an embrace against a sunset sky over open water', focus: '48% 50%' },
  dsc02401: { alt: 'Four friends on waterfront rocks at sunset, two of them carried in the others’ arms', focus: '45% 55%' },
  dsc03214: { alt: 'A marching band member in a VT uniform raises a gloved fist against a bright blue sky', focus: '55% 40%' },
  'exhibition-cover': { alt: 'A band member in a white VT uniform and HOKIES sash, seen from behind at dusk, a point of sunlight caught in one gloved hand', focus: '55% 35%' },
  dsc04402: { alt: 'A marching band member in a white VT uniform stands in a shaft of light, with a long-exposure blur of motion trailing beside them', focus: '62% 38%', tone: 'dark' },
  dsc03645: { alt: 'Trumpets raised under stadium lights by players in maroon uniforms', focus: '55% 45%' },
  'img-9226': { alt: 'Trumpet players in plumed VT shakos perform on the field in front of a packed crowd', focus: '40% 40%' },
  'img-9229': { alt: 'A trumpet player in a plumed VT shako stands at attention holding the horn upright, crowd blurred behind', focus: '50% 45%' },

  // Low-resolution copy (1125×844) sent in chat; fine at gallery size.
  'snow-day-cover': { alt: 'A snowball fight on a snowy campus: a crowd in winter coats and camouflage with homemade shields beneath stone pylons and snow-laden trees', focus: '50% 58%' },

  // — Portraits —
  '79a1143': { alt: 'A smiling person in a red hijab and white knit top, hands cupped beneath the chin, against dark foliage', focus: '45% 40%' },
  'img-3394': { alt: 'Someone with long braids looks back over their shoulder beside a high window overlooking the Manhattan skyline', focus: '78% 55%' },
  'img-3389': { alt: 'Someone with braids rests their chin on one hand, bathed in green light', focus: '60% 40%' },
  'img-7952': { alt: 'A person with a gold leaf crown in their hair looks toward the camera out of deep shadow', focus: '50% 55%', tone: 'dark' },

  // — Night & light —
  dsc03793: { alt: 'A photographer lit from the front by a bright beam, camera raised, against a deep blue night', focus: '64% 48%', tone: 'dark' },
  dsc00314: { alt: 'Extreme close-up of a single eye catching two points of blue light in darkness', focus: '62% 70%', tone: 'dark' },
  'img-1370': { alt: 'Violet lightning forking across a black sky', focus: '55% 65%', tone: 'dark' },

  // — Field notes —
  'img-1755': { alt: 'A tall glass spire rising from a sweeping museum roof under a bright cloudy sky', focus: '50% 55%' },
  'img-5488': { alt: 'A long-haired sable-and-white dog with snow on its face, looking up', focus: '55% 38%' },

  // — Experiments —
  '9b02ec2f-da32-4bcb-93b3-4ef716425f62': { alt: 'Two stacked frames of a coastline: a lone figure against a low sun, and sea stacks under a pink sky', focus: '50% 70%' },
  '9b02ec2f-da32-4bcb-93b3-4ef716425f62-2': { alt: 'Sea stacks and a glowing sun over a pink-toned ocean at dusk', focus: '55% 45%' },
  'img-9313': { alt: 'A pink flower rendered as a stained-glass mosaic', focus: '50% 50%' },

  // — Built worlds (in-game photography) —
  '2026-07-22-20-51-30': { alt: 'A floating island crowned with a columned temple, drifting in a pale sky', focus: '45% 55%', tone: 'light' },
  '2026-07-22-20-08-56': { alt: 'A block-built castle silhouetted in hazy golden light', focus: '50% 45%', tone: 'light' },
  '2026-07-22-20-34-55': { alt: 'A giant block-built tree glowing against a low sun over a forest', focus: '52% 40%', tone: 'light' },
  '2026-07-22-20-26-29': { alt: 'Desert rails and a scaffolded tower fading into bright haze', focus: '60% 50%', tone: 'light' },
  '2026-07-22-20-44-13': { alt: 'A small stone chapel in a hollow surrounded by pink blossom trees', focus: '50% 55%' },
  '2026-07-22-20-09-57': { alt: 'A hillside village with a rainbow-striped tower beside a river', focus: '55% 50%', tone: 'light' },
  '2026-01-09-14-27-20': { alt: 'A stone castle wall climbing toward a lit spire, seen from below', focus: '55% 40%' },
}

/**
 * Collections, in the order they appear on the Work page.
 * `meta` is the small editorial label — only use facts you can stand behind.
 */
export const collections = [
  {
    id: 'game-day',
    title: 'Game Day',
    meta: 'Virginia Tech',
    photos: ['dsc04324', 'dsc03214', 'exhibition-cover', 'dsc03314', 'dsc04402', 'img-9229', 'dsc04265', 'img-9226', 'dsc03645', 'dsc03306'],
  },
  {
    id: 'portraits',
    title: 'Portraits',
    meta: 'People / Light',
    photos: ['79a1143', 'dsc01355', 'img-3389', 'dsc01393', 'img-3394', 'dsc03793', 'img-7952', 'dsc00314', 'dsc02356'],
  },
  {
    id: 'nature',
    title: 'Nature',
    meta: 'Weather / Coast / Animals',
    photos: ['dsc01201', 'img-1370', 'dsc01656', '9b02ec2f-da32-4bcb-93b3-4ef716425f62-2', 'img-5488', '9b02ec2f-da32-4bcb-93b3-4ef716425f62'],
  },
  {
    id: 'field-notes',
    title: 'Field Notes',
    meta: 'Places / Moments',
    photos: ['dsc02401', 'snow-day-cover', 'img-1755', 'img-9313'],
  },
  {
    id: 'built-worlds',
    title: 'Built Worlds',
    meta: 'In-game photography',
    photos: [
      '2026-07-22-20-51-30',
      '2026-07-22-20-34-55',
      '2026-07-22-20-08-56',
      '2026-07-22-20-44-13',
      '2026-07-22-20-26-29',
      '2026-07-22-20-09-57',
      '2026-01-09-14-27-20',
    ],
  },
]

/** Homepage art direction. Each row is a deliberate composition. */
export const home = {
  hero: 'dsc01201',
  // Which side the title block sits on — put it opposite the subject.
  heroAlign: 'right',

  // Rows of the "Selected work" exhibition. Layouts:
  //   pair     large image + smaller offset image   { photos: [large, small], flip? }
  //   single   one image, narrow and off-centre      { photo, side: 'left'|'right', note? }
  //   bleed    full-bleed — only for masters ≥ 2560px wide
  //   triptych three images sharing one height
  exhibition: [
    { layout: 'pair', photos: ['dsc04324', 'dsc04265'] },
    { layout: 'single', photo: 'dsc00314', side: 'right', note: 'Close enough to see the light arrive.' },
    { layout: 'bleed', photo: 'dsc03306' },
    { layout: 'triptych', photos: ['img-1755', 'img-5488', 'img-1370'] },
    { layout: 'pair', photos: ['2026-07-22-20-51-30', 'dsc03314'], flip: true },
  ],

  // Contact-sheet strip that leads to Instagram.
  social: ['2026-07-22-20-34-55', 'dsc03314', '9b02ec2f-da32-4bcb-93b3-4ef716425f62-2', 'img-5488', '2026-07-22-20-44-13', 'dsc04265'],

  // Background of the Lightroom album card.
  album: 'dsc04324',
}
