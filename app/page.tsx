import Game from './components/Game'
import { headers } from 'next/headers'

export default async function Home() {
  return (
    <>
      <Game />
      <RedirectGuard />
    </>
  )
}

function RedirectGuard() {
  return (
    <script dangerouslySetInnerHTML={{
      __html: `
        (function() {
          var ua = navigator.userAgent || '';
          var isFarcaster = ua.includes('Farcaster') || 
                            window.location.search.includes('farcaster') ||
                            document.referrer.includes('warpcast') ||
                            window.self !== window.top;
          
          if (!isFarcaster) {
            document.body.innerHTML = \`
              <div style="
                min-height: 100vh;
                background: radial-gradient(ellipse at top, #0f172a 0%, #020617 100%);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-family: sans-serif;
                color: white;
                padding: 2rem;
                text-align: center;
              ">
                <div style="font-size: 4rem; margin-bottom: 1rem;">🎮</div>
                <h1 style="font-size: 2rem; font-weight: 900; margin-bottom: 0.5rem;">
                  <span style="color: white;">BASE </span>
                  <span style="color: #60a5fa;">BLOCKS</span>
                </h1>
                <p style="color: #6b7280; margin-bottom: 2rem; font-size: 0.875rem;">
                  Onchain 2048 on Base
                </p>
                <div style="
                  background: rgba(255,255,255,0.05);
                  border: 1px solid rgba(255,255,255,0.1);
                  border-radius: 1rem;
                  padding: 1.5rem;
                  margin-bottom: 2rem;
                  max-width: 320px;
                ">
                  <p style="font-size: 0.875rem; color: #9ca3af; margin-bottom: 1rem;">
                    This game runs inside the <strong style="color: white;">Base App</strong> or <strong style="color: white;">Warpcast</strong>. Open it there to play!
                  </p>
                </div>
                <a href="https://www.coinbase.com/wallet/base-app" style="
                  background: linear-gradient(135deg, #3b82f6, #6366f1);
                  color: white;
                  padding: 1rem 2rem;
                  border-radius: 9999px;
                  font-weight: 700;
                  text-decoration: none;
                  margin-bottom: 1rem;
                  display: block;
                  box-shadow: 0 0 20px rgba(99,102,241,0.4);
                ">Download Base App</a>
                <a href="https://warpcast.com" style="
                  background: rgba(255,255,255,0.05);
                  border: 1px solid rgba(255,255,255,0.1);
                  color: white;
                  padding: 1rem 2rem;
                  border-radius: 9999px;
                  font-weight: 700;
                  text-decoration: none;
                  display: block;
                ">Open Warpcast</a>
                <p style="color: #374151; font-size: 0.75rem; margin-top: 2rem;">
                  base-blocks-jet.vercel.app
                </p>
              </div>
            \`;
          }
        })();
      `
    }} />
  )
}