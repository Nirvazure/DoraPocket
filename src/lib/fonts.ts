import { Noto_Sans_SC, Quicksand } from 'next/font/google'

const quicksand = Quicksand({
  subsets: ['latin'],
  variable: '--font-quicksand',
  display: 'swap',
})

const notoSansSc = Noto_Sans_SC({
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-sans-sc',
  display: 'swap',
})

export const fontSans = {
  variable: `${quicksand.variable} ${notoSansSc.variable}`,
}
