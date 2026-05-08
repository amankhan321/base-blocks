import type { Metadata } from 'next'
import { Providers } from './components/Providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Base Blocks',
  description: 'Onchain 2048 on Base — a Farcaster Mini App',
  other: {
    'fc:miniapp': JSON.stringify({
      version: '1',
      imageUrl: 'https://base-blocks.vercel.app/og-image.png',
      button: {
        title: 'Play Base Blocks',
        action: {
          type: 'launch_miniapp',
          name: 'Base Blocks',
          url: 'https://base-blocks.vercel.app',
          splashImageUrl: 'https://base-blocks.vercel.app/splash.png',
          splashBackgroundColor: '#111827',
        },
      },
    }),
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}