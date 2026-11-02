/**
 * **Example content** for "Places nearby", "Following" and stories.
 *
 * Everything here is invented (places, addresses, programmes) and the screens
 * say so. It shows how the sections will look until real places come from the
 * Django API (phase 2: business clients publish their own posts and stories).
 *
 * To replace with real data later: load the same shapes ({@link PublicPlace},
 * {@link Post}) from the API and delete this file.
 *
 * Photos are in `assets/demo/` (cropped from the design mock-ups).
 *
 * @module features/places/demoPlaces
 * @category Feature: Places nearby
 */
import type { ImageSourcePropType } from 'react-native';

import type { IconName } from '@/components/ui';
import type { Language } from '@/data/types';

/** A text in both languages. */
export interface LocalizedText {
  en: string;
  sr: string;
}

/** Picks the text for the current language. */
export function pick(text: LocalizedText, language: Language): string {
  return text[language];
}

/** Filter groups on the "Places nearby" screen. */
export type PlaceCategory = 'culture' | 'shop';

/** One slide of a story. */
export interface StorySlide {
  image: ImageSourcePropType;
  /** Small caption on the photo, e.g. "GRAFIKA U KRUGU". */
  caption: LocalizedText;
  title: LocalizedText;
  text: LocalizedText;
}

/** A round "highlight" under the place header (opens a story). */
export interface Highlight {
  id: string;
  icon: IconName;
  label: LocalizedText;
}

/** A public place (museum, gallery, shop…). */
export interface PublicPlace {
  id: string;
  name: string;
  category: PlaceCategory;
  /** Shown above the name, e.g. "Kulturni prostor". */
  type: LocalizedText;
  icon: IconName;
  address: string;
  area: string;
  latitude: number;
  longitude: number;
  description: LocalizedText;
  thumbnail: ImageSourcePropType;
  cover: ImageSourcePropType;
  followers: number;
  postCount: number;
  highlights: Highlight[];
  /** Story slides (all highlights open the same story for now). */
  story: StorySlide[];
}

/** A post by a place. */
export interface Post {
  id: string;
  placeId: string;
  hoursAgo: number;
  title: LocalizedText;
  text: LocalizedText;
  image: ImageSourcePropType;
  likes: number;
  /** "Example programme" label. */
  isExample: boolean;
}

const workshop = require('../../../assets/demo/atelje-workshop.jpg');
const interior = require('../../../assets/demo/atelje-interior.jpg');
const ateljeThumb = require('../../../assets/demo/atelje-thumb.jpg');
const shop = require('../../../assets/demo/mala-polica.jpg');
const books = require('../../../assets/demo/list-i-slovo.jpg');

/** All example places. */
export const DEMO_PLACES: PublicPlace[] = [
  {
    id: 'atelje-krug',
    name: 'Atelje Krug',
    category: 'culture',
    type: { en: 'Cultural space', sr: 'Kulturni prostor' },
    icon: 'library-outline',
    address: 'Njegoševa 38',
    area: 'Vračar',
    latitude: 44.8049,
    longitude: 20.4742,
    description: {
      en: 'A small space for big ideas. Exhibitions, printmaking and meetings with local artists.',
      sr: 'Mali prostor za velike ideje. Izložbe, grafika i susreti sa lokalnim autorima.',
    },
    thumbnail: ateljeThumb,
    cover: interior,
    followers: 248,
    postCount: 12,
    highlights: [
      { id: 'grafika', icon: 'color-palette-outline', label: { en: 'Prints', sr: 'Grafika' } },
      { id: 'prostor', icon: 'library-outline', label: { en: 'Space', sr: 'Prostor' } },
      { id: 'radionice', icon: 'brush-outline', label: { en: 'Workshops', sr: 'Radionice' } },
    ],
    story: [
      {
        image: workshop,
        caption: { en: 'PRINTS IN THE CIRCLE', sr: 'GRAFIKA U KRUGU' },
        title: { en: 'From sketch to print', sr: 'Od skice do otiska' },
        text: {
          en: 'Saturday, 5 pm · Try linocut in a small group. Curiosity is all you need for your first print — materials are provided.',
          sr: 'Subota, 17 h · Isprobaj linorez u maloj grupi. Za prvi otisak dovoljna je radoznalost — materijal je obezbeđen.',
        },
      },
      {
        image: interior,
        caption: { en: 'THE SPACE', sr: 'PROSTOR' },
        title: { en: 'Open studio', sr: 'Otvoren atelje' },
        text: {
          en: 'Drop by on weekdays from 12 to 8 pm and see the new prints on the wall.',
          sr: 'Svrati radnim danima od 12 do 20 h i pogledaj nove otiske na zidu.',
        },
      },
      {
        image: ateljeThumb,
        caption: { en: 'WORKSHOPS', sr: 'RADIONICE' },
        title: { en: 'Next month', sr: 'Sledećeg meseca' },
        text: {
          en: 'Monotype and cyanotype workshops for beginners. Places are limited.',
          sr: 'Radionice monotipije i cijanotipije za početnike. Broj mesta je ograničen.',
        },
      },
    ],
  },
  {
    id: 'mala-polica',
    name: 'Mala polica',
    category: 'shop',
    type: { en: 'Design shop', sr: 'Prodavnica dizajna' },
    icon: 'storefront-outline',
    address: 'Kursulina 16',
    area: 'Vračar',
    latitude: 44.7996,
    longitude: 20.4786,
    description: {
      en: 'Handmade cups, notebooks and small things for every day.',
      sr: 'Ručno rađene šolje, sveske i male stvari za svaki dan.',
    },
    thumbnail: shop,
    cover: shop,
    followers: 131,
    postCount: 7,
    highlights: [{ id: 'novo', icon: 'sparkles-outline', label: { en: 'New in', sr: 'Novo' } }],
    story: [
      {
        image: shop,
        caption: { en: 'NEW IN', sr: 'NOVO' },
        title: { en: 'Small things for every day', sr: 'Male stvari za svaki dan' },
        text: {
          en: 'Handmade cups and new blue notebooks have arrived.',
          sr: 'Stigle su ručno rađene šolje i nove plave sveske.',
        },
      },
    ],
  },
  {
    id: 'list-i-slovo',
    name: 'List i slovo',
    category: 'shop',
    type: { en: 'Bookshop & reading room', sr: 'Knjižara i čitaonica' },
    icon: 'book-outline',
    address: 'Molerova 24',
    area: 'Vračar',
    latitude: 44.7979,
    longitude: 20.4771,
    description: {
      en: 'Books, a quiet reading room and coffee by the window.',
      sr: 'Knjige, tiha čitaonica i kafa pored prozora.',
    },
    thumbnail: books,
    cover: books,
    followers: 96,
    postCount: 4,
    highlights: [{ id: 'citaonica', icon: 'book-outline', label: { en: 'Reading room', sr: 'Čitaonica' } }],
    story: [
      {
        image: books,
        caption: { en: 'READING ROOM', sr: 'ČITAONICA' },
        title: { en: 'A chair is waiting for you', sr: 'Fotelja te čeka' },
        text: {
          en: 'The reading room is open every day until 9 pm.',
          sr: 'Čitaonica je otvorena svakog dana do 21 h.',
        },
      },
    ],
  },
];

/** All example posts, newest first. */
export const DEMO_POSTS: Post[] = [
  {
    id: 'atelje-krug-1',
    placeId: 'atelje-krug',
    hoursAgo: 2,
    title: { en: 'From sketch to print', sr: 'Od skice do otiska' },
    text: {
      en: 'From sketch to print. On Saturday at 5 pm we make our first linocuts. Materials are waiting for you in the studio.',
      sr: 'Od skice do otiska. U subotu u 17 h pravimo prve linoreze. Materijal te čeka u ateljeu.',
    },
    image: workshop,
    likes: 24,
    isExample: true,
  },
  {
    id: 'mala-polica-1',
    placeId: 'mala-polica',
    hoursAgo: 4,
    title: { en: 'Small things for every day', sr: 'Male stvari za svaki dan' },
    text: {
      en: 'Handmade cups and new blue notebooks have arrived. Have a look at our shelf.',
      sr: 'Stigle su ručno rađene šolje i nove plave sveske. Zavirite na našu policu.',
    },
    image: shop,
    likes: 18,
    isExample: true,
  },
  {
    id: 'list-i-slovo-1',
    placeId: 'list-i-slovo',
    hoursAgo: 26,
    title: { en: 'Evening reading', sr: 'Večernje čitanje' },
    text: {
      en: 'On Thursday at 7 pm we read short stories by local authors.',
      sr: 'U četvrtak u 19 h čitamo kratke priče lokalnih autora.',
    },
    image: books,
    likes: 9,
    isExample: true,
  },
];

/** Returns one example place. */
export function getDemoPlace(id: string): PublicPlace | undefined {
  return DEMO_PLACES.find((place) => place.id === id);
}
