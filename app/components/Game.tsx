'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount, useConnect, useDisconnect, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import sdk from '@farcaster/miniapp-sdk'

const CONTRACT_ADDRESS = '0x9C5fc82C59944f1184fF399d816a3423b6bC2724' as `0x${string}`
const CONTRACT_ABI = [
  {
    name: 'saveScore',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_score', type: 'uint256' },
      { name: '_moves', type: 'uint256' }
    ],
    outputs: [],
  },
  {
    name: 'getPlayerBest',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'player', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'scores',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [
      { name: 'player', type: 'address' },
      { name: 'score', type: 'uint256' },
      { name: 'moves', type: 'uint256' },
      { name: 'timestamp', type: 'uint256' },
    ],
  },
  {
    name: 'getTotalEdits',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const


const BOARD_SIZE = 4

function createEmptyBoard() {
  return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0))
}

function addRandomTile(board: number[][]) {
  const empty = []
  for (let r = 0; r < BOARD_SIZE; r++)
    for (let c = 0; c < BOARD_SIZE; c++)
      if (board[r][c] === 0) empty.push({ r, c })
  if (empty.length === 0) return board
  const { r, c } = empty[Math.floor(Math.random() * empty.length)]
  const newBoard = board.map(row => [...row])
  newBoard[r][c] = Math.random() < 0.9 ? 2 : 4
  return newBoard
}

function slideRow(row: number[]) {
  const filtered = row.filter(x => x !== 0)
  let score = 0
  for (let i = 0; i < filtered.length - 1; i++) {
    if (filtered[i] === filtered[i + 1]) {
      filtered[i] *= 2
      score += filtered[i]
      filtered.splice(i + 1, 1)
    }
  }
  while (filtered.length < BOARD_SIZE) filtered.push(0)
  return { row: filtered, score }
}

function moveLeft(board: number[][]) {
  let score = 0
  const newBoard = board.map(row => {
    const { row: newRow, score: s } = slideRow(row)
    score += s
    return newRow
  })
  return { board: newBoard, score }
}

function rotateBoard(board: number[][]) {
  return board[0].map((_, i) => board.map(row => row[i]).reverse())
}

function move(board: number[][], direction: string) {
  let rotated = board
  let times = 0
  if (direction === 'right') times = 2
  if (direction === 'up') times = 3
  if (direction === 'down') times = 1
  for (let i = 0; i < times; i++) rotated = rotateBoard(rotated)
  const { board: moved, score } = moveLeft(rotated)
  let result = moved
  for (let i = 0; i < (4 - times) % 4; i++) result = rotateBoard(result)
  return { board: result, score }
}

function boardsEqual(a: number[][], b: number[][]) {
  return a.every((row, r) => row.every((val, c) => val === b[r][c]))
}

function isGameOver(board: number[][]) {
  for (let r = 0; r < BOARD_SIZE; r++)
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === 0) return false
      if (c < BOARD_SIZE - 1 && board[r][c] === board[r][c + 1]) return false
      if (r < BOARD_SIZE - 1 && board[r][c] === board[r + 1][c]) return false
    }
  return true
}

function getTileStyle(val: number) {
  if (val === 0) return 'bg-gray-800/80 border border-gray-700/50'
  if (val === 2) return 'bg-yellow-400 text-gray-900 shadow-lg shadow-yellow-400/30'
  if (val === 4) return 'bg-yellow-400 text-gray-900 shadow-lg shadow-yellow-400/30'
  if (val === 8) return 'bg-orange-400 text-white shadow-lg shadow-orange-400/40'
  if (val === 16) return 'bg-orange-500 text-white shadow-lg shadow-orange-500/40'
  if (val === 32) return 'bg-red-500 text-white shadow-lg shadow-red-500/40'
  if (val === 64) return 'bg-red-600 text-white shadow-lg shadow-red-600/40'
  if (val === 128) return 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
  if (val === 256) return 'bg-blue-600 text-white shadow-lg shadow-blue-600/50'
  if (val === 512) return 'bg-purple-500 text-white shadow-lg shadow-purple-500/50'
  if (val === 1024) return 'bg-purple-600 text-white shadow-lg shadow-purple-600/50'
  if (val === 2048) return 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg shadow-yellow-400/60'
  return 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
}

function getTileFontSize(val: number) {
  if (val >= 1024) return 'text-lg font-black'
  if (val >= 128) return 'text-xl font-black'
  return 'text-2xl font-black'
}

export default function Game() {
  const [isReady, setIsReady] = useState(false)
  const [board, setBoard] = useState(() => addRandomTile(addRandomTile(createEmptyBoard())))
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [moves, setMoves] = useState(0)
  const [chainCount, setChainCount] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [leaderboard, setLeaderboard] = useState<{player: string, score: number}[]>([])

  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: txSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  // Load best score from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('baseblocks_best')
    if (saved) setBestScore(parseInt(saved))
  }, [])

  // Save best score to localStorage whenever it changes
  useEffect(() => {
    if (bestScore > 0) localStorage.setItem('baseblocks_best', bestScore.toString())
  }, [bestScore])

  useEffect(() => {
    sdk.actions.ready()
    setIsReady(true)
  }, [])

  useEffect(() => {
    if (isPending) setSaveMsg('Confirm in wallet...')
    if (isConfirming) setSaveMsg('Confirming on Base...')
    if (txSuccess) {
      setSaveMsg('✅ Score saved on Base!')
      setSaving(false)
    }
  }, [isPending, isConfirming, txSuccess])

  const handleMove = useCallback((direction: string) => {
    if (gameOver) return
    setBoard(prev => {
      const { board: newBoard, score: gained } = move(prev, direction)
      if (boardsEqual(prev, newBoard)) return prev
      const withTile = addRandomTile(newBoard)
      setMoves(m => m + 1)
      if (gained > 0) setChainCount(c => c + 1)
      setScore(s => {
        const newScore = s + gained
        setBestScore(b => {
          const newBest = Math.max(b, newScore)
          localStorage.setItem('baseblocks_best', newBest.toString())
          return newBest
        })
        return newScore
      })
      if (isGameOver(withTile)) setGameOver(true)
      return withTile
    })
  }, [gameOver])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handleMove('left')
      if (e.key === 'ArrowRight') handleMove('right')
      if (e.key === 'ArrowUp') handleMove('up')
      if (e.key === 'ArrowDown') handleMove('down')
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleMove])

  useEffect(() => {
    let startX = 0
    let startY = 0
    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
    }
    const handleTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX
      const dy = e.changedTouches[0].clientY - startY
      if (Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) > 30) handleMove(dx > 0 ? 'right' : 'left')
      } else {
        if (Math.abs(dy) > 30) handleMove(dy > 0 ? 'down' : 'up')
      }
    }
    window.addEventListener('touchstart', handleTouchStart)
    window.addEventListener('touchend', handleTouchEnd)
    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleMove])

  const resetGame = () => {
    setBoard(addRandomTile(addRandomTile(createEmptyBoard())))
    setScore(0)
    setGameOver(false)
    setMoves(0)
    setChainCount(0)
    setSaveMsg('')
  }

  const handleConnect = () => {
    const cbConnector = connectors.find(c => c.id === 'coinbaseWalletSDK')
    const fcConnector = connectors.find(c => c.id === 'farcasterMiniApp')
    const connector = fcConnector || cbConnector || connectors[0]
    if (connector) connect({ connector })
  }

  const saveScore = () => {
    if (!isConnected) { handleConnect(); return }
    if (score === 0) return
    setSaving(true)
    setSaveMsg('Sending to Base...')
   writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'saveScore',
      args: [BigInt(score), BigInt(moves)],
    })
  }

  const loadLeaderboard = async () => {
    setShowLeaderboard(true)
    try {
      const res = await fetch('https://api.basescan.org/api?module=logs&action=getLogs&address=' + CONTRACT_ADDRESS + '&topic0=0x&apikey=YourApiKeyToken')
      // Simplified: show placeholder until real indexing
      setLeaderboard([
        { player: address || '0x0000...0000', score: bestScore },
      ])
    } catch {
      setLeaderboard([{ player: address || '0x0000...0000', score: bestScore }])
    }
  }

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-white text-lg animate-pulse">Loading Base Blocks...</div>
      </div>
    )
  }

if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white p-6 text-center"
        style={{ background: 'radial-gradient(ellipse at top, #0f172a 0%, #020617 100%)' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎮</div>
        <h1 className="text-2xl font-black mb-1">
          <span className="text-white">BASE </span>
          <span className="text-blue-400">BLOCKS</span>
        </h1>
        <p className="text-gray-500 text-sm mb-8">Onchain 2048 on Base</p>
        <div className="bg-gray-900 border border-gray-700 rounded-3xl p-6 mb-6 max-w-xs w-full">
          <p className="text-gray-400 text-sm">Connect your wallet to play and save scores on Base blockchain.</p>
        </div>
        <button
          onClick={handleConnect}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-full font-black text-base"
          style={{ boxShadow: '0 0 20px rgba(99,102,241,0.4)' }}
        >
          ⬡ Connect Wallet
        </button>
        <p className="text-gray-600 text-xs mt-4">Open in Warpcast or Base App mini apps to connect</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white p-4 max-w-sm mx-auto"
      style={{ background: 'radial-gradient(ellipse at top, #0f172a 0%, #020617 100%)' }}>

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-3xl p-5 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black">🏆 Leaderboard</h2>
              <button onClick={() => setShowLeaderboard(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div className="text-xs text-gray-500 mb-3">Top scores saved on Base blockchain</div>
            {leaderboard.length === 0 ? (
              <div className="text-center text-gray-500 py-4">No scores yet. Be the first!</div>
            ) : (
              leaderboard.map((entry, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-800 rounded-xl p-3 mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-yellow-400 font-black">#{i + 1}</span>
                    <span className="text-xs text-gray-400 font-mono">
                      {entry.player.slice(0,6)}...{entry.player.slice(-4)}
                    </span>
                  </div>
                  <span className="font-black text-blue-400">{entry.score}</span>
                </div>
              ))
            )}
            <div className="text-xs text-gray-600 text-center mt-3">
              Save your score to appear here!
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black">
            <span className="text-white">BASE </span>
            <span className="text-blue-400">BLOCKS</span>
            <span className="text-yellow-400 ml-2">✦</span>
          </h1>
          <p className="text-xs text-gray-500">Onchain 2048 on Base</p>
        </div>
        {isConnected ? (
          <button
            onClick={() => disconnect()}
            className="flex items-center gap-2 bg-green-500/20 border border-green-500/40 text-green-400 text-xs px-3 py-2 rounded-full"
          >
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            {address?.slice(0,4)}...{address?.slice(-3)}
          </button>
        ) : (
          <button
            onClick={handleConnect}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-full font-semibold transition-all"
          >
            <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs">⬡</div>
            Connect Wallet
          </button>
        )}
      </div>

      {/* Score Cards */}
      <div className="flex gap-3 mb-5">
        <div className="flex-1 bg-gray-900/80 border border-gray-700/50 rounded-2xl p-3 flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <div>
            <div className="text-xs text-gray-500 font-medium">BEST</div>
            <div className="text-xl font-black text-yellow-400">{bestScore}</div>
          </div>
        </div>
        <div className="flex-1 bg-gray-900/80 border border-blue-500/30 rounded-2xl p-3 flex items-center gap-3"
          style={{ boxShadow: '0 0 20px rgba(59,130,246,0.1)' }}>
          <span className="text-2xl">⭐</span>
          <div>
            <div className="text-xs text-gray-500 font-medium">SCORE</div>
            <div className="text-xl font-black text-blue-400">{score}</div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={resetGame} className="bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-xl p-2 text-sm transition-all">🔄</button>
          <button onClick={loadLeaderboard} className="bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-xl p-2 text-sm transition-all">📊</button>
        </div>
      </div>

      {saveMsg && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-2 text-center text-xs text-green-400 mb-4">
          {saveMsg}
        </div>
      )}

      {/* Game Board */}
      <div className="relative rounded-3xl p-3 mb-4"
        style={{ background: 'rgba(15, 23, 42, 0.9)', boxShadow: '0 0 30px rgba(99,102,241,0.3)' }}>

        {gameOver && (
          <div className="absolute inset-0 rounded-3xl bg-black/90 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
            <div className="text-4xl mb-2">😢</div>
            <div className="text-2xl font-black mb-1">Game Over!</div>
            <div className="text-yellow-400 text-xl font-bold mb-3">Score: {score}</div>
            <button
              onClick={saveScore}
              disabled={saving || isPending || isConfirming}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-2xl font-black text-sm mb-3 disabled:opacity-50"
            >
              {isPending ? 'Confirm...' : isConfirming ? 'Saving...' : '💾 Save Score on Base'}
            </button>
            <button onClick={resetGame} className="bg-gray-700 text-white px-6 py-2 rounded-2xl font-black text-sm">
              🔄 Play Again
            </button>
          </div>
        )}

        <div className="grid grid-cols-4 gap-2">
          {board.map((row, r) =>
            row.map((val, c) => (
              <div
                key={`${r}-${c}`}
                className={`${getTileStyle(val)} ${getTileFontSize(val)} rounded-2xl flex items-center justify-center aspect-square transition-all duration-100`}
              >
                {val !== 0 ? val : ''}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 bg-gray-900/80 border border-gray-700/50 rounded-2xl p-3 flex items-center gap-2">
          <span className="text-lg">👣</span>
          <div>
            <div className="text-xs text-gray-500">MOVES</div>
            <div className="text-lg font-black text-white">{moves}</div>
          </div>
        </div>
        <div className="flex-1 bg-gray-900/80 border border-purple-500/30 rounded-2xl p-3 flex items-center gap-2">
          <span className="text-lg">🔗</span>
          <div>
            <div className="text-xs text-gray-500">CHAIN</div>
            <div className="text-lg font-black text-purple-400">x{chainCount}</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-2">
        <button onClick={() => handleMove('up')}
          className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold active:scale-95"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 0 20px rgba(99,102,241,0.4)' }}>↑</button>
        <div className="flex gap-2">
          <button onClick={() => handleMove('left')}
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold active:scale-95"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}>←</button>
          <button onClick={() => handleMove('down')}
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold active:scale-95"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 0 20px rgba(99,102,241,0.4)' }}>↓</button>
          <button onClick={() => handleMove('right')}
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold active:scale-95"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}>→</button>
        </div>
      </div>

      <p className="text-center text-xs text-gray-600 mt-3">👆 Swipe or use arrow buttons to play</p>

      {txHash && (
        <button
          onClick={() => window.open('https://basescan.org/tx/' + txHash, '_blank')}
          className="block w-full text-center text-xs text-blue-400 mt-2 hover:underline"
        >
          View on Basescan ↗
        </button>
      )}
    </div>
  )
}