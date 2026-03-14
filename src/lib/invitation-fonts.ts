import {
  Baloo_2,
  Bangers,
  Bubblegum_Sans,
  Caveat,
  Chewy,
  Comic_Neue,
  Dancing_Script,
  Fredoka,
  Indie_Flower,
  Lilita_One,
  Luckiest_Guy,
  Pacifico,
  Patrick_Hand,
} from 'next/font/google'

const luckiestGuy = Luckiest_Guy({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-luckiest-guy',
  display: 'swap',
})

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-fredoka',
  display: 'swap',
})

const bubblegumSans = Bubblegum_Sans({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-bubblegum-sans',
  display: 'swap',
})

const chewy = Chewy({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-chewy',
  display: 'swap',
})

const comicNeue = Comic_Neue({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-comic-neue',
  display: 'swap',
})

const baloo2 = Baloo_2({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-baloo-2',
  display: 'swap',
})

const lilitaOne = Lilita_One({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-lilita-one',
  display: 'swap',
})

const bangers = Bangers({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-bangers',
  display: 'swap',
})

const patrickHand = Patrick_Hand({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-patrick-hand',
  display: 'swap',
})

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-caveat',
  display: 'swap',
})

const pacifico = Pacifico({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-pacifico',
  display: 'swap',
})

const dancingScript = Dancing_Script({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-dancing-script',
  display: 'swap',
})

const indieFlower = Indie_Flower({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-indie-flower',
  display: 'swap',
})

export const invitationFontVariables = [
  luckiestGuy.variable,
  fredoka.variable,
  bubblegumSans.variable,
  chewy.variable,
  comicNeue.variable,
  baloo2.variable,
  lilitaOne.variable,
  bangers.variable,
  patrickHand.variable,
  caveat.variable,
  pacifico.variable,
  dancingScript.variable,
  indieFlower.variable,
].join(' ')

const INVITATION_FONT_VARIABLES: Record<string, string> = {
  'LuckiestGuy-Regular': '--font-luckiest-guy',
  'Fredoka': '--font-fredoka',
  'BubblegumSans': '--font-bubblegum-sans',
  'Chewy': '--font-chewy',
  'ComicSansMS': '--font-comic-neue',
  'Baloo2': '--font-baloo-2',
  'LilitaOne': '--font-lilita-one',
  'Bangers': '--font-bangers',
  'PatrickHand': '--font-patrick-hand',
  'Caveat': '--font-caveat',
  'Pacifico': '--font-pacifico',
  'DancingScript': '--font-dancing-script',
  'IndieFlower': '--font-indie-flower',
}

const SYSTEM_FONT_FAMILIES: Record<string, string> = {
  'Arial-Bold': 'Arial, Helvetica, sans-serif',
  'Arial-Black': '"Arial Black", Arial, sans-serif',
}

export function getCanvasFontFamily(fontKey: string): string {
  const systemFont = SYSTEM_FONT_FAMILIES[fontKey]
  if (systemFont) {
    return systemFont
  }

  const cssVariable = INVITATION_FONT_VARIABLES[fontKey]
  if (cssVariable && typeof window !== 'undefined') {
    const resolvedFamily = getComputedStyle(document.documentElement)
      .getPropertyValue(cssVariable)
      .trim()

    if (resolvedFamily) {
      return `${resolvedFamily}, cursive`
    }
  }

  return 'Arial, Helvetica, sans-serif'
}
