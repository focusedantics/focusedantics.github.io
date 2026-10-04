/**
 * Site-wide copy and links. Edit freely — no component logic lives here.
 *
 * Anything marked OWNER is a value only the owner can confirm. Empty strings
 * hide the thing that depends on them instead of showing placeholder text.
 */
export const site = {
  name: 'FocusedAntics',
  url: 'https://focusedantics.github.io',

  // Hero positioning statement — keep it to one short line.
  statement: 'Photographs made at the edge of the light.',

  // OWNER: the area you take bookings in, e.g. "Blacksburg, VA & the New River Valley".
  // Leave empty to hide it.
  serviceArea: 'Virginia',

  instagram: {
    handle: 'focusedantics',
    url: 'https://www.instagram.com/focusedantics/',
    dm: 'https://ig.me/m/focusedantics',
  },

  // OWNER: paste the public Adobe Lightroom album link here. The album card
  // stays hidden until this is filled in.
  lightroomAlbumUrl: '',

  // Lightroom albums, shown in the Albums section of the Work page.
  // `cover` is a slug from content/photos.js; `meta` is an optional small label.
  albums: [
    { url: 'https://adobe.ly/3VgRulm', title: 'VT vs VMI', meta: 'Game day', cover: 'dsc03214' },
    { url: 'https://adobe.ly/4iFu82O', title: 'VT vs Maryland', meta: 'Game day', cover: 'dsc04402' },
    { url: 'https://adobe.ly/3UPW6io', title: 'VT vs ODU', meta: 'Game day', cover: 'img-9229' },
    { url: 'https://adobe.ly/4ykFzRL', title: 'Exhibition', meta: '', cover: 'exhibition-cover' },
  ],

  // Where booking requests are delivered. The form posts to FormSubmit
  // (formsubmit.co, free, no account), which emails the request here.
  // The very first submission sends a one-time "Activate form" email to
  // this address — click it once and every booking after that arrives.
  // After activating, FormSubmit also gives you a random alias; paste it in
  // place of the address in `endpoint` to keep the address out of the code.
  booking: {
    email: 'grant.erickson@outlook.com',
    endpoint: 'https://formsubmit.co/ajax/grant.erickson@outlook.com',
  },

  // OWNER: a public contact email to list on the Contact page ('' hides it).
  contactEmail: '',
}

/**
 * Session types shown on Services and offered in the booking form.
 * OWNER: rename, remove or add sessions; `price` is optional ('' hides it);
 * `photo` is a slug from content/photos.js.
 */
export const services = [
  {
    id: 'portrait',
    name: 'Portrait sessions',
    summary: 'Individual portraits built around available light and a location that suits you.',
    includes: [], // OWNER: e.g. ['Edited gallery', '…']
    price: '',
    photo: 'dsc00314',
  },
  {
    id: 'events',
    name: 'Events & performance',
    summary: 'Game days, performances and gatherings, photographed from inside the moment.',
    includes: [], // OWNER: e.g. ['Edited gallery', '…']
    price: '',
    photo: 'dsc04324',
  },
  {
    id: 'creative',
    name: 'Creative & editorial',
    summary: 'Concept-led work for artists, groups and projects that need a distinct image.',
    includes: [], // OWNER: e.g. ['Edited gallery', '…']
    price: '',
    photo: 'dsc03793',
  },
]

/**
 * About page. Written in the first person so it reads as you.
 * OWNER: make it yours — every line here is editable, and `name` (empty by
 * default) adds "I'm <name>" to the intro when filled in.
 */
export const about = {
  name: '',
  headline: ['Focused on people.', 'Antics welcome.'],
  intro:
    'I photograph the moments people forget to pose for — game-day brass mid-note, a campus snowball fight, a friend caught in the light before they notice the camera.',
  body: [
    'Most of what I shoot starts with a feeling rather than a plan: the energy of a crowd, a colour that won’t leave me alone, a face that deserves more than a phone snap. I carry a full-frame camera when I can and a phone when I can’t, and I edit on the move.',
    'The antics are half the point. I’d rather be in the middle of the noise than behind a rope — close enough that the photograph feels like you were there.',
  ],
  // Three frames for the collage at the top of the page (slugs from content/photos.js).
  collage: ['dsc03793', '79a1143', 'snow-day-cover'],
  // "What I shoot" — each links to a collection on the Work page.
  subjects: [
    { collection: 'game-day', line: 'Stadiums, sidelines and the band that never stops.' },
    { collection: 'portraits', line: 'People, with light that suits them.' },
    { collection: 'nature', line: 'Storms, coastlines and good dogs.' },
    { collection: 'built-worlds', line: 'Virtual photography inside worlds made of blocks.' },
  ],
}
