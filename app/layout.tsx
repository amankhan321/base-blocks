import type { Metadata } from 'next'
import { Providers } from './components/Providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Base Blocks',
  description: 'Onchain 2048 on Base — a Farcaster Mini App',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="base:app_id" content="69fd6081de35bbe9eac4ac78" />
        <meta name="fc:miniapp" content={JSON.stringify({
          version: '1',
          imageUrl: 'https://base-blocks-jet.vercel.app/og-image.png',
          button: {
            title: 'Play Base Blocks',
            action: {
              type: 'launch_miniapp',
              name: 'Base Blocks',
              url: 'https://base-blocks-jet.vercel.app',
              splashImageUrl: 'https://base-blocks-jet.vercel.app/splash.png',
              splashBackgroundColor: '#111827',
            },
          },
        })} />
      </head>
      <body className="bg-gray-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}