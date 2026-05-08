'use client'

import { useEffect, useState } from 'react'
import Game from './components/Game'

export default function Home() {
  const [isFarcaster, setIsFarcaster] = useState<boolean | null>(null)

  useEffect(() => {
    const isInFrame = window.self !== window.top
    const ua = navigator.userAgent || ''
    const ref = document.referrer || ''
    const isFarcasterEnv = isInFrame || 
      ua.includes('Farcaster') || 
      ref.includes('warpcast') ||
      ref.includes('farcaster')
    setIsFarcaster(isFarcasterEnv)
  }, [])

  if (isFarcaster === null) return null

  if (!isFarcaster) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at top, #0f172a 0%, #020617 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'sans-serif',
        color: 'white',
        padding: '2rem',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎮</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>
          <span style={{ color: 'white' }}>BASE </span>
          <span style={{ color: '#60a5fa' }}>BLOCKS</span>
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '0.875rem' }}>
          Onchain 2048 on Base
        </p>
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '2rem',
          maxWidth: '320px',
        }}>
          <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: 0 }}>
            This game runs inside the <strong style={{ color: 'white' }}>Base App</strong> or <strong style={{ color: 'white' }}>Warpcast</strong>. Open it there to play!
          </p>
        </div>
        <a href="https://www.coinbase.com/wallet/base-app" style={{
          background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
          color: 'white',
          padding: '1rem 2rem',
          borderRadius: '9999px',
          fontWeight: 700,
          textDecoration: 'none',
          marginBottom: '1rem',
          display: 'block',
          boxShadow: '0 0 20px rgba(99,102,241,0.4)',
        }}>⬇️ Download Base App</a>
        <a href="https://warpcast.com" style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'white',
          padding: '1rem 2rem',
          borderRadius: '9999px',
          fontWeight: 700,
          textDecoration: 'none',
          display: 'block',
        }}>🟣 Open Warpcast</a>
        <p style={{ color: '#374151', fontSize: '0.75rem', marginTop: '2rem' }}>
          base-blocks-jet.vercel.app
        </p>
      </div>
    )
  }

  return <Game />
}