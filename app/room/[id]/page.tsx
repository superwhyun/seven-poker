"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, X, Check, Phone, TrendingUp } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

interface Player {
  id: string
  name: string
  isAI: boolean
  cards: PlayingCard[]
  openCards: PlayingCard[] // 공개 카드덱
  hiddenCards: PlayingCard[] // 히든 카드덱
  chips: number
  position: number
  currentBet: number
  lastAction: "fold" | "check" | "call" | "raise" | "waiting" | null
  roundAction: "fold" | "check" | "call" | "raise" | null // 현재 라운드의 최종 액션
  aiPersonality?: "conservative" | "aggressive" | "balanced" // AI 성향
}

interface PlayingCard {
  suit: "hearts" | "diamonds" | "clubs" | "spades"
  rank: string
  isRevealed: boolean
}

const suits = {
  hearts: "♥️",
  diamonds: "♦️",
  clubs: "♣️",
  spades: "♠️",
}

const suitColors = {
  hearts: "text-red-500",
  diamonds: "text-red-500",
  clubs: "text-black",
  spades: "text-black",
}

export default function GameRoomPage() {
  const router = useRouter()
  const params = useParams()
  const roomId = params.id as string

  const [gamePhase, setGamePhase] = useState<"card_selection" | "betting" | "dealing" | "waiting">("dealing")
  const [gameStep, setGameStep] = useState(1) // 1-7 스텝
  const [dealingAnimation, setDealingAnimation] = useState(false)
  const [playerBets, setPlayerBets] = useState<{ [key: string]: number }>({})

  // 카드 덱 생성 함수
  const createDeck = (): PlayingCard[] => {
    const suits: ("hearts" | "diamonds" | "clubs" | "spades")[] = ["hearts", "diamonds", "clubs", "spades"]
    const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]
    const deck: PlayingCard[] = []
    
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({ suit, rank, isRevealed: false })
      }
    }
    
    // 덱 섞기
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[deck[i], deck[j]] = [deck[j], deck[i]]
    }
    
    return deck
  }

  // 스텝별 게임 진행 함수
  const initializeGame = () => {
    const deck = createDeck()
    let cardIndex = 0
    
    const initialPlayers: Player[] = []
    
    // AI 성향 배열
    const aiPersonalities: ("conservative" | "aggressive" | "balanced")[] = ["conservative", "aggressive", "balanced"]
    const aiNames = ["보수적_AI", "공격적_AI", "균형적_AI"]
    
    // 모든 플레이어 생성 (사용자 + AI 3명)
    for (let i = 0; i < 4; i++) {
      const isUser = i === 0
      
      // 스텝 1-3: 각 플레이어에게 3장씩 배분 (모두 히든)
      const playerCards = [
        deck[cardIndex++], 
        deck[cardIndex++], 
        deck[cardIndex++]
      ]
      
      initialPlayers.push({
        id: (i + 1).toString(),
        name: isUser ? "나" : aiNames[i - 1],
        isAI: !isUser,
        cards: playerCards, // 전체 카드 (히든 + 오픈)
        openCards: [], // 공개 카드덱 (처음에는 비어있음)
        hiddenCards: [...playerCards], // 히든 카드덱 (처음 3장)
        chips: 990, // 기본 배팅 10칩 차감
        position: i,
        currentBet: 10, // 기본 배팅 10칩
        lastAction: null,
        roundAction: null,
        aiPersonality: isUser ? undefined : aiPersonalities[i - 1],
      })
    }
    
    console.log("게임 초기화 완료 - 스텝 1-3: 각자 3장씩 히든으로 받음")
    
    return { players: initialPlayers, remainingDeck: deck.slice(cardIndex) }
  }

  const [players, setPlayers] = useState<Player[]>([])
  const [remainingDeck, setRemainingDeck] = useState<PlayingCard[]>([])
  const [gameInitialized, setGameInitialized] = useState(false)

  const [currentRound, setCurrentRound] = useState(1)
  const [pot, setPot] = useState(40) // 초기 팟 40칩 (4명 × 10칩)
  const [currentPlayerTurn, setCurrentPlayerTurn] = useState(0) // 현재 턴인 플레이어
  const [isCountdown, setIsCountdown] = useState(false) // 카운트다운 상태
  const [countdownNumber, setCountdownNumber] = useState(3) // 카운트다운 숫자
  const [gameResult, setGameResult] = useState<{
    isVisible: boolean
    winner: string
    reason: string
    chips: number
    handDescription?: string
  }>({
    isVisible: false,
    winner: "",
    reason: "",
    chips: 0
  })

  // 액션 사운드 재생 함수
  const playActionSound = (action: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(action)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 0.8
      utterance.lang = 'en-US'
      window.speechSynthesis.speak(utterance)
    }
  }

  // 화려한 빵빠레 음악 재생 함수
  const playVictoryMusic = () => {
    if (typeof window !== 'undefined') {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // 웅장한 빵빠레 멜로디 (실제 축하 음악 패턴)
      const fanfareNotes = [
        // 첫 번째 구: 힘찬 시작
        { freq: 523.25, duration: 400, volume: 0.5 }, // C5
        { freq: 659.25, duration: 400, volume: 0.5 }, // E5
        { freq: 783.99, duration: 600, volume: 0.6 }, // G5
        { freq: 523.25, duration: 200, volume: 0.4 }, // C5
        { freq: 659.25, duration: 200, volume: 0.4 }, // E5
        { freq: 783.99, duration: 800, volume: 0.7 }, // G5 (길게)
        
        // 두 번째 구: 상승하는 멜로디
        { freq: 880.00, duration: 300, volume: 0.5 }, // A5
        { freq: 987.77, duration: 300, volume: 0.5 }, // B5
        { freq: 1046.50, duration: 400, volume: 0.6 }, // C6
        { freq: 987.77, duration: 200, volume: 0.4 }, // B5
        { freq: 880.00, duration: 200, volume: 0.4 }, // A5
        { freq: 1046.50, duration: 800, volume: 0.7 }, // C6 (길게)
        
        // 피날레: 화려한 마무리
        { freq: 1318.51, duration: 600, volume: 0.8 }, // E6
        { freq: 1046.50, duration: 400, volume: 0.6 }, // C6
        { freq: 783.99, duration: 400, volume: 0.6 }, // G5
        { freq: 523.25, duration: 1000, volume: 0.9 }, // C5 (웅장하게 마무리)
      ]
      
      let startTime = audioContext.currentTime
      
      // 메인 멜로디
      fanfareNotes.forEach((note, index) => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.setValueAtTime(note.freq, startTime)
        oscillator.type = 'sawtooth' // 더 풍부한 하모닉스
        
        // 동적 볼륨 엔벨로프
        gainNode.gain.setValueAtTime(0, startTime)
        gainNode.gain.linearRampToValueAtTime(note.volume, startTime + 0.05)
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + note.duration / 1000)
        
        oscillator.start(startTime)
        oscillator.stop(startTime + note.duration / 1000)
        
        startTime += note.duration / 1000
      })
      
      // 화음 (Harmony) 추가
      startTime = audioContext.currentTime
      const harmonyNotes = [
        { freq: 261.63, duration: 1000 }, // C4 (낮은 베이스)
        { freq: 329.63, duration: 1000 }, // E4
        { freq: 392.00, duration: 1000 }, // G4
        { freq: 523.25, duration: 2000 }, // C5 (연장)
        { freq: 659.25, duration: 2000 }, // E5 (연장)
        { freq: 783.99, duration: 3000 }, // G5 (더 연장)
      ]
      
      harmonyNotes.forEach((note, index) => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.setValueAtTime(note.freq, startTime)
        oscillator.type = 'triangle' // 부드러운 화음
        
        gainNode.gain.setValueAtTime(0, startTime)
        gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.1)
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + note.duration / 1000)
        
        oscillator.start(startTime)
        oscillator.stop(startTime + note.duration / 1000)
        
        startTime += 0.5 // 화음은 겹치게
      })
      
      // 드럼 효과 (타악기)
      const drumTimes = [0, 0.8, 1.6, 2.4, 3.2, 4.0, 4.8]
      drumTimes.forEach(time => {
        const drumOscillator = audioContext.createOscillator()
        const drumGain = audioContext.createGain()
        
        drumOscillator.connect(drumGain)
        drumGain.connect(audioContext.destination)
        
        drumOscillator.frequency.setValueAtTime(80, audioContext.currentTime + time)
        drumOscillator.type = 'square'
        
        drumGain.gain.setValueAtTime(0.8, audioContext.currentTime + time)
        drumGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + time + 0.2)
        
        drumOscillator.start(audioContext.currentTime + time)
        drumOscillator.stop(audioContext.currentTime + time + 0.2)
      })
    }
  }

  // 게임 결과 표시 함수
  const showGameResult = (winner: string, reason: string, chips: number, handDescription?: string) => {
    setGameResult({
      isVisible: true,
      winner,
      reason,
      chips,
      handDescription
    })
    
    // 내가 이겼을 때 축하 음악과 빵빠레 사운드 재생
    if (winner === "나") {
      // 즉시 축하 음악 재생
      playVictoryMusic()
      
      // 0.5초 후 축하 메시지
      setTimeout(() => {
        playActionSound("Congratulations! You win!")
      }, 500)
    }
    
    // 3초 후 카운트다운 시작
    setTimeout(() => {
      setGameResult(prev => ({ ...prev, isVisible: false }))
      startCountdown(() => {
        startNewRound()
      })
    }, 3000)
  }

  // 카운트다운 시작 함수
  const startCountdown = (callback: () => void) => {
    setIsCountdown(true)
    setCountdownNumber(3)
    
    let count = 3
    const countdownInterval = setInterval(() => {
      playActionSound(count.toString()) // 숫자 사운드 재생
      
      if (count === 1) {
        clearInterval(countdownInterval)
        setTimeout(() => {
          setIsCountdown(false)
          callback() // 콜백 실행 (새 라운드 시작)
        }, 1000) // 1초 후 카운트다운 종료
      } else {
        count--
        setCountdownNumber(count)
      }
    }, 1000) // 1초마다 카운트다운
  }

  // 스텝별 게임 진행 함수
  const proceedToNextStep = () => {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] 스텝 ${gameStep} -> ${gameStep + 1} 진행`)
    
    const nextStep = gameStep + 1
    setGameStep(nextStep)
    
    if (nextStep === 4) {
      // 스텝 4: 첫 번째 오픈 카드 딜링 후 배팅
      console.log(`[${new Date().toISOString()}] 스텝 4: 첫 번째 오픈 카드 딜링`)
      dealCardForStep(4)
    } else if (nextStep >= 5 && nextStep <= 7) {
      // 스텝 5-7: 추가 카드 딜링 후 배팅
      console.log(`[${new Date().toISOString()}] 스텝 ${nextStep}: 카드 딜링`)
      dealCardForStep(nextStep)
    }
  }

  // 스텝별 카드 딜링
  const dealCardForStep = (step: number) => {
    const timestamp = new Date().toISOString()
    const activePlayers = players.filter(p => p.roundAction !== "fold")
    let cardIndex = 0
    
    if (step === 7) {
      // 7번째 카드는 히든으로 (폴드하지 않은 플레이어만)
      console.log(`[${timestamp}] 스텝 7: 히든 카드 딜링 시작 (활성 플레이어: ${activePlayers.length}명)`)
      setPlayers(prev => prev.map(player => {
        if (player.roundAction !== "fold" && remainingDeck.length > cardIndex) {
          const newCard = remainingDeck[cardIndex]
          console.log(`[${new Date().toISOString()}] ${player.name}에게 히든 카드 딜링:`, newCard)
          cardIndex++
          return {
            ...player,
            cards: [...player.cards, newCard],
            hiddenCards: [...player.hiddenCards, newCard]
          }
        }
        return player
      }))
    } else {
      // 4-6번째 카드는 오픈으로 (폴드하지 않은 플레이어만)
      console.log(`[${timestamp}] 스텝 ${step}: 오픈 카드 딜링 시작 (활성 플레이어: ${activePlayers.length}명)`)
      setPlayers(prev => prev.map(player => {
        if (player.roundAction !== "fold" && remainingDeck.length > cardIndex) {
          const newCard = remainingDeck[cardIndex]
          console.log(`[${new Date().toISOString()}] ${player.name}에게 오픈 카드 딜링:`, newCard)
          cardIndex++
          return {
            ...player,
            cards: [...player.cards, newCard],
            openCards: [...player.openCards, newCard]
          }
        }
        return player
      }))
    }
    
    // 딜링 후 덱 업데이트 (활성 플레이어 수만큼만 차감)
    console.log(`[${new Date().toISOString()}] 덱 업데이트: ${remainingDeck.length} -> ${remainingDeck.length - activePlayers.length}`)
    setRemainingDeck(prev => prev.slice(activePlayers.length))
    setGamePhase("betting")
    setCurrentPlayerTurn(0)
    console.log(`[${new Date().toISOString()}] 스텝 ${step} 딜링 완료, 배팅 시작`)
  }

  // 카드 선택 함수 (스텝 3에서만 사용)
  const selectCard = (cardIndex: number) => {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] 카드 선택 시작:`, cardIndex)
    
    console.log(`[${timestamp}] 플레이어 상태 변경 시작`)
    setPlayers(prev => {
      const newPlayers = prev.map(player => {
        if (player.id === "1") {
          console.log(`[${new Date().toISOString()}] 사용자 카드 선택 처리:`, cardIndex)
          const selectedCard = player.hiddenCards[cardIndex]
          const remainingHidden = player.hiddenCards.filter((_, idx) => idx !== cardIndex)
          
          console.log(`[${new Date().toISOString()}] 선택된 카드:`, selectedCard)
          console.log(`[${new Date().toISOString()}] 남은 히든 카드:`, remainingHidden.length)
          
          return {
            ...player,
            openCards: [selectedCard], // 선택한 카드를 오픈덱으로
            hiddenCards: remainingHidden // 나머지는 히든덱에
          }
        } else if (player.isAI) {
          // AI도 랜덤하게 선택
          const randomIndex = Math.floor(Math.random() * 3)
          const selectedCard = player.hiddenCards[randomIndex]
          const remainingHidden = player.hiddenCards.filter((_, idx) => idx !== randomIndex)
          
          console.log(`[${new Date().toISOString()}] AI ${player.name} 카드 선택:`, randomIndex)
          
          return {
            ...player,
            openCards: [selectedCard],
            hiddenCards: remainingHidden
          }
        }
        return player
      })
      
      console.log(`[${new Date().toISOString()}] 모든 플레이어 상태 업데이트 완료`)
      return newPlayers
    })
    
    console.log(`[${new Date().toISOString()}] 카드 선택 완료, 배팅 시작`)
    
    // 즉시 배팅 단계로 전환
    setGamePhase("betting")
    setCurrentPlayerTurn(0)
  }

  // 7포커 핸드 평가 함수
  const evaluateHand = (cards: PlayingCard[]) => {
    if (cards.length !== 7) return { rank: 0, description: "카드 부족", highCard: 0 }
    
    // 카드를 숫자로 변환 (A=14, K=13, Q=12, J=11)
    const getCardValue = (rank: string) => {
      if (rank === 'A') return 14
      if (rank === 'K') return 13
      if (rank === 'Q') return 12
      if (rank === 'J') return 11
      return parseInt(rank)
    }
    
    const values = cards.map(card => getCardValue(card.rank)).sort((a, b) => b - a)
    const suits = cards.map(card => card.suit)
    
    // 같은 숫자 카운트
    const valueCounts: { [key: number]: number } = {}
    values.forEach(value => {
      valueCounts[value] = (valueCounts[value] || 0) + 1
    })
    
    const counts = Object.values(valueCounts).sort((a, b) => b - a)
    const uniqueValues = Object.keys(valueCounts).map(Number).sort((a, b) => b - a)
    
    // 플러시 체크
    const suitCounts: { [key: string]: number } = {}
    suits.forEach(suit => {
      suitCounts[suit] = (suitCounts[suit] || 0) + 1
    })
    const isFlush = Object.values(suitCounts).some(count => count >= 5)
    
    // 스트레이트 체크 (5장 연속)
    let isStraight = false
    let straightHigh = 0
    for (let i = 0; i <= values.length - 5; i++) {
      if (values[i] - values[i + 4] === 4) {
        isStraight = true
        straightHigh = values[i]
        break
      }
    }
    
    // A-2-3-4-5 스트레이트 체크
    if (!isStraight && values.includes(14) && values.includes(5) && values.includes(4) && values.includes(3) && values.includes(2)) {
      isStraight = true
      straightHigh = 5
    }
    
    // 핸드 랭킹 (높을수록 강함)
    if (isStraight && isFlush) {
      return { rank: 8, description: "스트레이트 플러시", highCard: straightHigh }
    } else if (counts[0] === 4) {
      return { rank: 7, description: "포카드", highCard: uniqueValues[0] }
    } else if (counts[0] === 3 && counts[1] === 2) {
      return { rank: 6, description: "풀하우스", highCard: uniqueValues[0] }
    } else if (isFlush) {
      return { rank: 5, description: "플러시", highCard: uniqueValues[0] }
    } else if (isStraight) {
      return { rank: 4, description: "스트레이트", highCard: straightHigh }
    } else if (counts[0] === 3) {
      return { rank: 3, description: "트리플", highCard: uniqueValues[0] }
    } else if (counts[0] === 2 && counts[1] === 2) {
      return { rank: 2, description: "투페어", highCard: Math.max(uniqueValues[0], uniqueValues[1]) }
    } else if (counts[0] === 2) {
      return { rank: 1, description: "원페어", highCard: uniqueValues[0] }
    } else {
      return { rank: 0, description: "하이카드", highCard: uniqueValues[0] }
    }
  }
  
  // 새 라운드 시작
  const startNewRound = () => {
    console.log("새 라운드 시작")
    
    // 게임 상태 초기화
    setGameStep(1)
    setGamePhase("dealing")
    setCurrentRound(prev => prev + 1)
    setCurrentPlayerTurn(0)
    setDealingAnimation(false)
    
    // 새 덱 생성 및 플레이어 상태 초기화
    const gameData = initializeGame()
    setPlayers(gameData.players)
    setRemainingDeck(gameData.remainingDeck)
    setPot(40) // 기본 배팅 40칩 (4명 × 10칩)
    
    // 스텝 1-3 완료 후 바로 스텝 3 (카드 선택)으로
    setTimeout(() => {
      console.log("새 라운드 스텝 1-3 완료, 스텝 3: 카드 선택 시작")
      setGameStep(3)
      setGamePhase("card_selection")
    }, 500)
  }
  
  // 게임 종료 및 승자 결정
  const endGame = () => {
    const activePlayers = players.filter(p => p.roundAction !== "fold")
    console.log("게임 종료 - 승부 판정 시작")
    
    // 승부 결정 전에 모든 플레이어의 히든 카드 공개
    console.log("모든 플레이어의 히든 카드 공개")
    setPlayers(prev => prev.map(player => ({
      ...player,
      hiddenCards: player.hiddenCards.map(card => ({ ...card, isRevealed: true }))
    })))
    
    if (activePlayers.length === 1) {
      // 한 명만 남은 경우
      const winner = activePlayers[0]
      const currentPot = pot // 현재 팟 저장
      console.log(`${winner.name}이 승리! (다른 플레이어 모두 폴드)`)
      
      setPlayers(prev => prev.map(p => 
        p.id === winner.id 
          ? { ...p, chips: p.chips + currentPot }
          : p
      ))
      setPot(0)
      setGamePhase("waiting")
      
      // 결과 표시
      setTimeout(() => {
        showGameResult(
          winner.name,
          "다른 플레이어 모두 폴드",
          currentPot
        )
      }, 1000)
      return
    }
    
    // 여러 명이 남은 경우 핸드 비교
    const handEvaluations = activePlayers.map(player => ({
      player,
      hand: evaluateHand(player.cards)
    }))
    
    // 가장 강한 핸드 찾기
    handEvaluations.sort((a, b) => {
      if (a.hand.rank !== b.hand.rank) return b.hand.rank - a.hand.rank
      return b.hand.highCard - a.hand.highCard
    })
    
    const winner = handEvaluations[0]
    const currentPot = pot // 현재 팟 저장
    console.log(`${winner.player.name}이 승리!`, winner.hand.description)
    
    // 승자에게 팟 지급
    setPlayers(prev => prev.map(p => 
      p.id === winner.player.id 
        ? { ...p, chips: p.chips + currentPot }
        : p
    ))
    setPot(0)
    setGamePhase("waiting")
    
    // 결과 표시 (간단한 알림)
    setTimeout(() => {
      showGameResult(
        winner.player.name,
        "핸드 승부",
        currentPot,
        winner.hand.description
      )
    }, 1000)
  }

  const renderCard = (card: PlayingCard, isRevealed: boolean, isMyCard = false, cardIndex?: number, canSelect = false) => {
    if (!isRevealed && !isMyCard) {
      return (
        <div 
          className={`w-full h-full bg-blue-800 border-2 border-blue-600 rounded-lg flex items-center justify-center shadow-lg ${
            canSelect ? 'cursor-pointer hover:bg-blue-700 hover:border-blue-500 transform hover:scale-105 transition-all' : ''
          }`}
          onClick={canSelect && cardIndex !== undefined ? () => selectCard(cardIndex) : undefined}
        >
          <div className="w-3/4 h-3/4 bg-blue-900 rounded border border-blue-500"></div>
        </div>
      )
    }

    if (!isRevealed && isMyCard && canSelect) {
      return (
        <div 
          className="w-full h-full bg-green-700 border-2 border-green-500 rounded-lg flex items-center justify-center shadow-lg cursor-pointer hover:bg-green-600 hover:border-green-400 transform hover:scale-105 transition-all"
          onClick={cardIndex !== undefined ? () => selectCard(cardIndex) : undefined}
        >
          <div className="text-white text-xs font-bold">선택</div>
        </div>
      )
    }

    return (
      <div 
        className={`w-full h-full bg-white border-2 rounded-lg flex flex-col items-center justify-center shadow-lg ${
          canSelect ? 'border-yellow-400 cursor-pointer hover:bg-yellow-50 hover:shadow-xl transform hover:scale-105 transition-all' : 'border-gray-300'
        }`}
        onClick={canSelect && cardIndex !== undefined ? () => selectCard(cardIndex) : undefined}
      >
        <div className={`text-xs sm:text-sm font-bold ${suitColors[card.suit]} mb-0.5`}>{card.rank}</div>
        <div className={`text-lg sm:text-xl ${suitColors[card.suit]}`}>{suits[card.suit]}</div>
      </div>
    )
  }

  const getPlayerPosition = (position: number, totalPlayers: number) => {
    // 나는 항상 하단 중앙에 고정
    if (position === 0) {
      return { x: 50, y: 85, isBottom: true }
    }

    // 플레이어 수에 따른 배치 로직
    switch (totalPlayers) {
      case 2: {
        // 2명: 좌우 배치 (상대방은 상단 중앙)
        return { x: 50, y: 15, isBottom: false }
      }

      case 3: {
        // 3명: 삼각형 배치 (나 하단, 상대방 2명은 좌상단, 우상단)
        const positions = [
          { x: 25, y: 20 }, // 좌상단
          { x: 75, y: 20 }, // 우상단
        ]
        return positions[position - 1]
      }

      case 4: {
        // 4명: 마름모 배치 (나 하단 중앙, 상대방 3명은 좌측, 상단, 우측)
        const positions = [
          { x: 15, y: 50 }, // 좌측
          { x: 50, y: 15 }, // 상단
          { x: 85, y: 50 }, // 우측
        ]
        return positions[position - 1]
      }

      case 5: {
        // 5명: 2열 배치 (나 하단 중앙, 상대방 4명은 상단 2명, 중단 2명)
        const positions = [
          { x: 30, y: 15 }, // 상단 좌
          { x: 70, y: 15 }, // 상단 우
          { x: 15, y: 45 }, // 중단 좌
          { x: 85, y: 45 }, // 중단 우
        ]
        return positions[position - 1]
      }

      case 6: {
        // 6명: 2열 3행 배치 (나 하단 중앙, 상대방 5명은 상단 2명, 중단 2명, 하단 1명)
        const positions = [
          { x: 30, y: 15 }, // 상단 좌
          { x: 70, y: 15 }, // 상단 우
          { x: 15, y: 40 }, // 중단 좌
          { x: 85, y: 40 }, // 중단 우
          { x: 20, y: 70 }, // 하단 좌 (나와 겹치지 않게)
        ]
        return positions[position - 1]
      }

      case 7: {
        // 7명: 원형 배치 개선
        const positions = [
          { x: 25, y: 12 }, // 좌상단
          { x: 50, y: 8 }, // 상단중앙
          { x: 75, y: 12 }, // 우상단
          { x: 10, y: 40 }, // 좌중단
          { x: 90, y: 40 }, // 우중단
          { x: 25, y: 68 }, // 좌하단
        ]
        return positions[position - 1]
      }

      case 8: {
        // 8명: 원형 배치 최적화
        const positions = [
          { x: 20, y: 10 }, // 좌상단
          { x: 40, y: 5 }, // 상단좌
          { x: 60, y: 5 }, // 상단우
          { x: 80, y: 10 }, // 우상단
          { x: 8, y: 40 }, // 좌중단
          { x: 92, y: 40 }, // 우중단
          { x: 20, y: 70 }, // 좌하단
        ]
        return positions[position - 1]
      }

      default: {
        // 기본값: 원형 배치
        const otherPlayers = totalPlayers - 1
        const angle = (position - 1) * (360 / otherPlayers)
        const radius = 35
        const centerX = 50
        const centerY = 35

        const x = centerX + radius * Math.cos((angle * Math.PI) / 180)
        const y = centerY + radius * Math.sin((angle * Math.PI) / 180)

        return { x, y, isBottom: false }
      }
    }
  }

  const dealNextCard = async () => {
    setDealingAnimation(true)
    setGamePhase("dealing")

    // 각 플레이어에게 순차적으로 카드 추가
    let deckIndex = 0
    for (let i = 0; i < players.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      setPlayers((prev) =>
        prev.map((player) => {
          if (player.position === i && player.cards.length < 7) {
            const newCard = remainingDeck[deckIndex]
            if (newCard) {
              const updatedCards = [...player.cards, newCard]
              const newCardIndex = updatedCards.length - 1
              
              // 7번째 카드(마지막 카드)는 히든으로, 그 외에는 오픈으로
              if (newCardIndex === 6) { // 7번째 카드 (0-indexed)
                return {
                  ...player,
                  cards: updatedCards,
                  hiddenCards: [...player.hiddenCards, newCard]
                }
              } else {
                return {
                  ...player,
                  cards: updatedCards,
                  openCards: [...player.openCards, newCard]
                }
              }
            }
          }
          return player
        }),
      )
      deckIndex++
    }

    // 사용한 카드들을 덱에서 제거
    setRemainingDeck(prev => prev.slice(players.length))
    setCurrentRound(prev => prev + 1)
    setDealingAnimation(false)
    setGamePhase("betting")
    setCurrentPlayerTurn(0) // 새 라운드는 첫 번째 플레이어부터 시작
  }

  // AI 핸드 강도 평가 (현재 가진 모든 카드로)
  const evaluateAIHandStrength = (player: Player) => {
    // 현재 가진 모든 카드 (히든 + 오픈)
    const allCards = [...player.hiddenCards, ...player.openCards]
    if (allCards.length < 3) return { rank: 0, description: "카드 부족", potential: 0 }
    
    // 5장 이상일 때는 실제 핸드 평가
    if (allCards.length >= 5) {
      return evaluateHand(allCards)
    }
    
    // 5장 미만일 때는 잠재력 평가
    return evaluateHandPotential(allCards)
  }
  
  // 완성되지 않은 핸드의 잠재력 평가
  const evaluateHandPotential = (cards: PlayingCard[]) => {
    const getCardValue = (rank: string) => {
      if (rank === 'A') return 14
      if (rank === 'K') return 13
      if (rank === 'Q') return 12
      if (rank === 'J') return 11
      return parseInt(rank)
    }
    
    const values = cards.map(card => getCardValue(card.rank)).sort((a, b) => b - a)
    const suits = cards.map(card => card.suit)
    
    // 같은 숫자 개수 세기
    const valueCounts: { [key: number]: number } = {}
    values.forEach(value => {
      valueCounts[value] = (valueCounts[value] || 0) + 1
    })
    
    const counts = Object.values(valueCounts).sort((a, b) => b - a)
    const uniqueValues = Object.keys(valueCounts).map(Number).sort((a, b) => b - a)
    
    // 같은 슈트 개수 세기
    const suitCounts: { [key: string]: number } = {}
    suits.forEach(suit => {
      suitCounts[suit] = (suitCounts[suit] || 1) + 1
    })
    const maxSameSuit = Math.max(...Object.values(suitCounts))
    
    // 잠재력 점수 계산 (0-10)
    let potential = 0
    
    // 페어 이상
    if (counts[0] >= 2) {
      potential += counts[0] * 2 // 페어:4, 트리플:6, 포카:8
    }
    
    // 플러시 가능성
    if (maxSameSuit >= 3) {
      potential += maxSameSuit - 1 // 3장:2, 4장:3, 5장:4
    }
    
    // 스트레이트 가능성 (연속된 카드)
    let consecutiveCount = 1
    for (let i = 0; i < values.length - 1; i++) {
      if (values[i] - values[i + 1] === 1) {
        consecutiveCount++
      } else if (values[i] !== values[i + 1]) {
        break
      }
    }
    if (consecutiveCount >= 3) {
      potential += consecutiveCount - 1
    }
    
    // 높은 카드 보너스
    const highCards = values.filter(v => v >= 11).length
    potential += highCards * 0.5
    
    return {
      rank: Math.min(Math.floor(potential / 2), 3), // 0-3 랭크
      description: `잠재력 ${potential.toFixed(1)}`,
      potential: potential,
      highCard: values[0]
    }
  }
  
  // AI 플레이어 자동 행동 (핸드 강도 + 단계별 전략)
  const getAIAction = (player: Player, currentBet: number, pot: number) => {
    // 현재 핸드 강도 평가
    const handEvaluation = evaluateAIHandStrength(player)
    const handRank = handEvaluation.rank
    const handPotential = handEvaluation.potential || 0
    
    const highestBet = Math.max(...players.map(p => p.currentBet), 0)
    const myBet = player.currentBet
    const callAmount = highestBet - myBet
    
    // 팟 오즈 계산 (콜 비용 대비 팟 크기)
    const potOdds = callAmount > 0 ? pot / callAmount : 0
    
    // 단계별 전략 계수 (초반 단계 조정)
    const getStepStrategy = (step: number) => {
      switch (step) {
        case 3: // 초기 단계 - 적당히 보수적 (너무 보수적이면 게임이 재미없어짐)
          return { aggression: 0.6, foldThreshold: 3.5, potOddsMultiplier: 1.2 }
        case 4: // 첫 오픈카드 - 보수적
          return { aggression: 0.7, foldThreshold: 3.2, potOddsMultiplier: 1.1 }
        case 5: // 중간 단계 - 균형
          return { aggression: 0.8, foldThreshold: 3, potOddsMultiplier: 1.0 }
        case 6: // 후반 단계 - 적극적
          return { aggression: 1.0, foldThreshold: 2.5, potOddsMultiplier: 0.8 }
        case 7: // 마지막 단계 - 매우 적극적
          return { aggression: 1.3, foldThreshold: 2, potOddsMultiplier: 0.6 }
        default:
          return { aggression: 0.8, foldThreshold: 3, potOddsMultiplier: 1.0 }
      }
    }
    
    const baseStrategy = getStepStrategy(gameStep)
    
    // AI 성향에 따른 전략 조정
    const getPersonalityModifier = (personality?: string) => {
      switch (personality) {
        case "conservative":
          return { aggressionMod: 0.7, foldThresholdMod: 1.2, bluffChance: 0.1, betSizeMod: 0.8 } // 작은 베팅 선호
        case "aggressive":
          return { aggressionMod: 1.3, foldThresholdMod: 0.8, bluffChance: 0.25, betSizeMod: 1.3 } // 큰 베팅 선호
        case "balanced":
          return { aggressionMod: 1.0, foldThresholdMod: 1.0, bluffChance: 0.15, betSizeMod: 1.0 }
        default:
          return { aggressionMod: 1.0, foldThresholdMod: 1.0, bluffChance: 0.15, betSizeMod: 1.0 }
      }
    }
    
    const personalityMod = getPersonalityModifier(player.aiPersonality)
    
    // 최종 전략 계산
    const strategy = {
      aggression: baseStrategy.aggression * personalityMod.aggressionMod,
      foldThreshold: baseStrategy.foldThreshold * personalityMod.foldThresholdMod,
      potOddsMultiplier: baseStrategy.potOddsMultiplier,
      bluffChance: personalityMod.bluffChance
    }
    
    console.log(`${player.name} AI 판단 (스텝 ${gameStep}, ${player.aiPersonality}):`, { 
      handRank, 
      handPotential, 
      description: handEvaluation.description,
      potOdds: potOdds.toFixed(2),
      callAmount,
      chips: player.chips,
      strategy: `공격성: ${strategy.aggression.toFixed(2)}, 폴드임계: ${strategy.foldThreshold.toFixed(1)}, 블러핑: ${(strategy.bluffChance * 100).toFixed(0)}%`
    })
    
    // 칩 부족 시 폴드
    if (callAmount > player.chips) return "fold"
    
    // 단계별 조정된 팟 오즈
    const adjustedPotOdds = potOdds * strategy.potOddsMultiplier
    
    // 블러핑 여부 결정
    const shouldBluff = Math.random() < strategy.bluffChance && handRank < 2 && handPotential < 5
    
    // 초반 단계에서 특별 고려사항
    const isEarlyStage = gameStep <= 4
    const betSizeRatio = callAmount / player.chips // 배팅 크기 대비 내 칩 비율
    
    // 핸드 강도별 의사결정
    if (highestBet === myBet) {
      // 체크/레이즈 상황
      if (handRank >= 6) return "raise" // 풀하우스 이상 -> 항상 레이즈
      if (handRank >= 4) return Math.random() > (0.5 / strategy.aggression) ? "raise" : "check" // 스트레이트 이상
      if (handRank >= 2) return Math.random() > (0.8 / strategy.aggression) ? "raise" : "check" // 투페어 이상
      if (handPotential >= 6) return Math.random() > (0.7 / strategy.aggression) ? "raise" : "check" // 높은 잠재력
      if (shouldBluff && callAmount <= player.chips * 0.1) return "raise" // 블러핑 레이즈
      if (handPotential >= 4 && strategy.aggression > 1.0) return Math.random() > 0.9 ? "raise" : "check" // 후반 적극적 플레이
      return "check"
    } else {
      // 콜/폴드 상황
      if (handRank >= 5) return "call" // 플러시 이상 -> 항상 콜
      if (handRank >= 3) return adjustedPotOdds >= (2 / strategy.aggression) ? "call" : "fold" // 트리플 이상
      if (handRank >= 1) {
        // 원페어 이상: 초반에는 더 관대하게, 배팅 크기도 고려
        const pairCallThreshold = isEarlyStage ? (2.5 / strategy.aggression) : (3 / strategy.aggression)
        const sizeAdjustedThreshold = betSizeRatio > 0.1 ? pairCallThreshold * 1.3 : pairCallThreshold
        return adjustedPotOdds >= sizeAdjustedThreshold ? "call" : "fold"
      }
      if (handPotential >= strategy.foldThreshold * 1.8) {
        // 잠재력 기반: 초반에는 더 적극적으로
        const potentialCallThreshold = isEarlyStage ? 3 : 4
        return adjustedPotOdds >= potentialCallThreshold ? "call" : "fold"
      }
      // 초반에는 더 자주 콜 (게임의 재미를 위해) - 폴드 확률 대폭 감소
      if (isEarlyStage && handPotential >= 2.5) {
        const earlyCallThreshold = betSizeRatio < 0.08 ? 2 : 3 // 작은 배팅이면 더 관대하게
        return adjustedPotOdds >= earlyCallThreshold ? "call" : 
               (Math.random() > 0.5 ? "call" : "fold") // 50% 확률로 콜 (기존 30%에서 증가)
      }
      if (shouldBluff && adjustedPotOdds >= 5 && callAmount <= player.chips * 0.05) return "call" // 블러핑 콜
      return "fold"
    }
  }

  // FOLD한 플레이어를 건너뛰고 다음 턴으로 이동 (0.5초 딜레이 포함)
  const moveToNextPlayer = () => {
    setTimeout(() => {
      setCurrentPlayerTurn(prev => {
        let nextTurn = (prev + 1) % players.length
        const maxAttempts = players.length
        let attempts = 0
        
        // FOLD하지 않은 플레이어를 찾을 때까지 순환
        while (attempts < maxAttempts && players[nextTurn]?.roundAction === "fold") {
          nextTurn = (nextTurn + 1) % players.length
          attempts++
        }
        
        console.log(`[${new Date().toISOString()}] 턴 이동: ${prev} -> ${nextTurn} (${players[nextTurn]?.name})`)
        return nextTurn
      })
    }, 500) // 0.5초 딜레이
  }

  const processAITurn = (playerId: string) => {
    const player = players.find(p => p.id === playerId)
    if (!player || !player.isAI || !players.length) return

    const highestBet = Math.max(...players.map(p => p.currentBet), 0)
    const action = getAIAction(player, highestBet, pot)
    
    console.log(`[${new Date().toISOString()}] ${player.name} 턴 시작 - 액션: ${action}`)
    
    // 0.5초 후에 액션 수행 (턴 표시를 먼저 보여주기 위해)
    setTimeout(() => {
      // 액션 사운드 재생
      playActionSound(action)
      
      let isRaise = false
      
      setPlayers(prev => {
        console.log(`[${new Date().toISOString()}] AI 턴 처리 전 플레이어 수:`, prev.length)
        const updatedPlayers = prev.map(p => {
          if (p.id === playerId) {
            let newBet = p.currentBet
            let newChips = p.chips
            
            switch (action) {
              case "raise":
                // 성향별 레이즈 크기 조정
                const getPersonalityMod = (personality?: string) => {
                  switch (personality) {
                    case "conservative": return 0.8
                    case "aggressive": return 1.3
                    default: return 1.0
                  }
                }
                const baseRaiseAmount = 50 * getPersonalityMod(p.aiPersonality)
                const raiseAmount = Math.min(Math.floor(baseRaiseAmount), p.chips)
                newBet = Math.max(highestBet + raiseAmount, p.currentBet + raiseAmount)
                newChips = p.chips - (newBet - p.currentBet)
                isRaise = true
                break
              case "call":
                const callAmount = Math.min(highestBet - p.currentBet, p.chips)
                newBet = p.currentBet + callAmount
                newChips = p.chips - callAmount
                break
              case "fold":
                return { ...p, lastAction: "fold", roundAction: "fold" }
              case "check":
                break
            }
            
            setPot(prev => prev + (newBet - p.currentBet))
            return { ...p, lastAction: action as any, currentBet: newBet, chips: newChips, roundAction: action as any }
          }
          return p
        })
        
        // raise인 경우 다른 플레이어들의 lastAction을 초기화
        if (isRaise) {
          console.log(`${player.name}이 raise! 다른 플레이어들 액션 초기화`)
          return updatedPlayers.map(player => 
            player.id === playerId 
              ? player  // raise한 플레이어는 그대로
              : player.roundAction === "fold" 
                ? player  // 폴드한 플레이어는 그대로
                : { ...player, lastAction: null }  // 나머지는 액션 초기화
          )
        }
        
        console.log(`[${new Date().toISOString()}] AI 턴 처리 후 플레이어 수:`, updatedPlayers.length)
        return updatedPlayers
      })
      
      // 다음 플레이어로 턴 이동 (FOLD한 플레이어 건너뛰기)
      moveToNextPlayer()
    }, 500) // 0.5초 딜레이
  }

  const checkAllPlayersReady = () => {
    const timestamp = new Date().toISOString()
    const activePlayers = players.filter(p => p.roundAction !== "fold")
    
    console.log(`[${timestamp}] 배팅 체크 시작:`, {
      activePlayers: activePlayers.length,
      actions: activePlayers.map(p => ({ name: p.name, action: p.lastAction, bet: p.currentBet })),
      dealingAnimation,
      gamePhase,
      currentStep: gameStep,
      currentPlayerTurn
    })
    
    // 나를 제외한 모든 플레이어가 폴드했는지 확인
    const humanPlayer = players.find(p => p.id === "1")
    const otherActivePlayers = activePlayers.filter(p => p.id !== "1")
    
    if (humanPlayer && humanPlayer.roundAction !== "fold" && otherActivePlayers.length === 0) {
      console.log(`[${new Date().toISOString()}] 다른 모든 플레이어 폴드 - 사용자 승리!`)
      // 즉시 게임 종료 및 승리 처리
      endGame()
      return
    }
    
    // 활성 플레이어가 1명만 남았으면 게임 종료
    if (activePlayers.length === 1) {
      console.log(`[${new Date().toISOString()}] 활성 플레이어 1명만 남음 - 게임 종료`)
      endGame()
      return
    }
    
    // 모든 활성 플레이어가 액션을 했는지 확인
    const allActed = activePlayers.every(p => p.lastAction !== null)
    
    if (!allActed || dealingAnimation || gamePhase !== "betting") {
      console.log(`[${new Date().toISOString()}] 배팅 체크 실패:`, { 
        allActed, 
        dealingAnimation, 
        activePlayersCount: activePlayers.length, 
        gamePhase,
        currentStep: gameStep,
        currentPlayerTurn 
      })
      return
    }
    
    // 배팅 금액이 모두 맞는지 확인
    const highestBet = players.length > 0 ? Math.max(...players.map(p => p.currentBet), 0) : 0
    const allMatched = activePlayers.every(p => 
      p.currentBet === highestBet || p.roundAction === "fold"
    )
    
    console.log(`[${new Date().toISOString()}] 배팅 매칭 체크:`, { 
      highestBet, 
      allMatched, 
      currentStep: gameStep,
      bets: activePlayers.map(p => ({ name: p.name, bet: p.currentBet, action: p.lastAction }))
    })
    
    if (allMatched) {
      console.log(`[${new Date().toISOString()}] 배팅 라운드 완료 - 현재 스텝: ${gameStep}`)
      // 배팅 턴은 초기화하되 라운드 액션은 유지
      setPlayers(prev => prev.map(p => ({ 
        ...p, 
        lastAction: null,
        roundAction: p.lastAction || p.roundAction // 현재 액션을 라운드 액션으로 저장
      })))
      
      if (gameStep < 7) {
        console.log(`[${new Date().toISOString()}] 다음 스텝 ${gameStep + 1} 진행`)
        proceedToNextStep()
      } else {
        console.log(`[${new Date().toISOString()}] 게임 종료 - 모든 스텝 완료`)
        endGame()
      }
    }
  }

  // 클라이언트에서 게임 초기화
  useEffect(() => {
    if (!gameInitialized) {
      const gameData = initializeGame()
      setPlayers(gameData.players)
      setRemainingDeck(gameData.remainingDeck)
      setGameInitialized(true)
      
      // 스텝 1-3 완료 후 바로 스텝 3 (카드 선택)으로
      setTimeout(() => {
        console.log("스텝 1-3 완료, 스텝 3: 카드 선택 시작")
        setGameStep(3)
        setGamePhase("card_selection")
      }, 500)
    }
  }, [gameInitialized])

  // AI 턴 처리 및 게임 흐름 관리
  useEffect(() => {
    if (gamePhase === "betting" && !dealingAnimation && gameInitialized) {
      const currentPlayer = players[currentPlayerTurn]
      
      console.log(`턴 체크: currentPlayerTurn=${currentPlayerTurn}, player=${currentPlayer?.name}, lastAction=${currentPlayer?.lastAction}`)
      
      if (currentPlayer && currentPlayer.isAI && !currentPlayer.lastAction) {
        console.log(`AI ${currentPlayer.name} 턴 시작`)
        processAITurn(currentPlayer.id)
      } else if (currentPlayer && !currentPlayer.isAI && !currentPlayer.lastAction) {
        console.log(`사용자 ${currentPlayer.name} 턴 - 액션 대기 중`)
      }
      
      // 배팅 라운드 완료 체크
      checkAllPlayersReady()
    }
  }, [currentPlayerTurn, players, gamePhase, dealingAnimation, gameInitialized])

  // 카드 선택 단계에서 사용자가 선택하지 않으면 자동으로 첫 번째 카드 선택
  useEffect(() => {
    if (gamePhase === "card_selection" && gameInitialized) {
      const humanPlayer = players.find(p => p.id === "1")
      if (humanPlayer && humanPlayer.openCards.length === 0) {
        // 10초 후 자동으로 첫 번째 카드 선택 (선택사항)
        const timer = setTimeout(() => {
          selectCard(0)
        }, 10000)
        return () => clearTimeout(timer)
      }
    }
  }, [gamePhase, players, gameInitialized])

  if (!gameInitialized || !players || players.length === 0) {
    return (
      <div className="w-screen h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-xl font-semibold">게임을 준비하고 있습니다...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 overflow-hidden">
      <div className="w-full h-full flex flex-col">
        {/* Header - 높이 고정 */}
        <div className="flex justify-between items-center p-4 bg-black/20 backdrop-blur-sm">
          <Button
            onClick={() => window.close()}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            게임 종료
          </Button>

          <div className="flex items-center space-x-4 text-white">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>플레이어: {players.length}</span>
            </div>
            <Badge className="bg-purple-600">스텝 {gameStep}</Badge>
            <Badge className="bg-yellow-600">라운드 {currentRound}</Badge>
            <Badge className="bg-green-600">팟: {pot} 칩</Badge>
          </div>
        </div>

        {/* Game Table - 남은 공간 전체 사용 */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="relative w-full h-full max-w-[1200px] max-h-[700px] bg-gradient-to-br from-green-800 to-green-900 rounded-3xl border-8 border-yellow-600 shadow-2xl overflow-hidden">
            {/* Table felt pattern */}
            <div className="absolute inset-8 border-4 border-yellow-500/30 rounded-3xl"></div>

            {/* Center area with pot and bets */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
              {/* Main Pot */}
              <motion.div
                key={pot}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white px-8 py-4 rounded-full text-center shadow-lg border-2 border-yellow-400 mb-4"
              >
                <div className="text-sm font-medium">메인 팟</div>
                <div className="text-2xl sm:text-3xl font-bold">{pot}</div>
                <div className="text-xs opacity-90">칩</div>
              </motion.div>


              {/* Current betting round indicator */}
              <div className="mt-3 text-center space-y-2">
                <div className="bg-black/30 backdrop-blur-sm rounded-full px-4 py-1 text-white text-xs font-medium">
                  라운드 {currentRound} - {gamePhase === "card_selection" ? "카드 선택 중" : gamePhase === "betting" ? "배팅 중" : gamePhase === "dealing" ? "카드 딜링 중" : "대기 중"}
                </div>
                {gamePhase === "betting" && players[currentPlayerTurn] && (
                  <motion.div
                    key={`turn-${currentPlayerTurn}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4, type: "spring" }}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-full px-4 py-2 text-sm font-bold shadow-lg"
                  >
                    🎯 {players[currentPlayerTurn]?.name}의 턴
                  </motion.div>
                )}
              </div>
            </div>

            {/* Players positioned around the table */}
            {players && players.length > 0 && players.map((player, index) => {
              const position = getPlayerPosition(index, players.length)
              const isMe = player.id === "1"

              return (
                <div
                  key={player.id}
                  className="absolute"
                  style={{
                    left: `${position.x}%`,
                    top: `${position.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  {isMe ? (
                    // 사용자의 경우: 플레이어 정보와 선택된 카드를 가로로 배치
                    <div className="flex items-center space-x-4">
                      {/* Player Info */}
                      <div className={`bg-slate-800/90 backdrop-blur-sm rounded-xl px-6 py-3 border shadow-lg transition-all duration-500 ${
                        currentPlayerTurn === index && gamePhase === "betting" && !player.lastAction
                          ? "border-yellow-400 ring-4 ring-yellow-400/50 shadow-yellow-400/30 bg-slate-700/90 scale-105" 
                          : "border-slate-600"
                      }`}>
                        <div className="flex items-center justify-center space-x-2 mb-2">
                          <span className="text-white font-semibold text-base">{player.name}</span>
                          {currentPlayerTurn === index && gamePhase === "betting" && !player.lastAction && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ duration: 0.3, type: "spring" }}
                            >
                              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs px-3 py-1 animate-pulse font-bold shadow-lg">
                                🎯 MY TURN
                              </Badge>
                            </motion.div>
                          )}
                        </div>
                        <div className="text-yellow-300 text-sm font-medium mb-2">{player.chips} 칩</div>
                        {player.currentBet > 0 && (
                          <div className="text-red-300 text-xs font-medium mb-2">배팅: {player.currentBet}</div>
                        )}
                        {(player.lastAction || player.roundAction) && (
                          <div
                            className={`text-sm px-3 py-1 rounded-full ${
                              (player.lastAction || player.roundAction) === "fold"
                                ? "bg-red-600"
                                : (player.lastAction || player.roundAction) === "check"
                                  ? "bg-blue-600"
                                  : (player.lastAction || player.roundAction) === "call"
                                    ? "bg-green-600"
                                    : (player.lastAction || player.roundAction) === "raise"
                                      ? "bg-orange-600"
                                      : "bg-gray-600"
                            } text-white`}
                          >
                            {(player.lastAction || player.roundAction)?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      
                      {/* Open Cards (오른쪽에 배치) */}
                      {player.openCards && player.openCards.length > 0 && (
                        <div className="flex flex-col items-center">
                          <div className="text-white text-xs mb-1">공개 카드</div>
                          <div className="flex space-x-1">
                            {player.openCards.map((card, cardIndex) => (
                              <div key={`open-${cardIndex}`} className="w-12 h-16 sm:w-14 sm:h-20">
                                {renderCard(card, true, isMe)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    // 다른 플레이어들의 경우: 기존 레이아웃 유지
                    <div className="text-center">
                      {/* Player Info */}
                      <div className="mb-4">
                        <div className={`bg-slate-800/90 backdrop-blur-sm rounded-xl px-6 py-3 border shadow-lg transition-all duration-500 ${
                          currentPlayerTurn === index && gamePhase === "betting" && !player.lastAction
                            ? "border-yellow-400 ring-4 ring-yellow-400/50 shadow-yellow-400/30 bg-slate-700/90 scale-105" 
                            : "border-slate-600"
                        }`}>
                          <div className="flex items-center justify-center space-x-2 mb-2">
                            <span className="text-white font-semibold text-base">{player.name}</span>
                            {player.isAI && (
                              <Badge className={`text-xs px-2 ${
                                player.aiPersonality === "conservative" ? "bg-blue-600" :
                                player.aiPersonality === "aggressive" ? "bg-red-600" :
                                "bg-green-600"
                              }`}>
                                {player.aiPersonality === "conservative" ? "보수적" :
                                 player.aiPersonality === "aggressive" ? "공격적" : "균형적"}
                              </Badge>
                            )}
                            {currentPlayerTurn === index && gamePhase === "betting" && !player.lastAction && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.3, type: "spring" }}
                              >
                                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs px-3 py-1 animate-pulse font-bold shadow-lg">
                                  🎯 TURN
                                </Badge>
                              </motion.div>
                            )}
                          </div>
                          <div className="text-yellow-300 text-sm font-medium mb-2">{player.chips} 칩</div>
                          {player.currentBet > 0 && (
                            <div className="text-red-300 text-xs font-medium mb-2">배팅: {player.currentBet}</div>
                          )}
                          {(player.lastAction || player.roundAction) && (
                            <div
                              className={`text-sm px-3 py-1 rounded-full ${
                                (player.lastAction || player.roundAction) === "fold"
                                  ? "bg-red-600"
                                  : (player.lastAction || player.roundAction) === "check"
                                    ? "bg-blue-600"
                                    : (player.lastAction || player.roundAction) === "call"
                                      ? "bg-green-600"
                                      : (player.lastAction || player.roundAction) === "raise"
                                        ? "bg-orange-600"
                                        : "bg-gray-600"
                              } text-white`}
                            >
                              {(player.lastAction || player.roundAction)?.toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Other Players' Cards */}
                  {!isMe && (
                    <div className={`flex justify-center max-w-[500px] overflow-hidden ${
                      (player.hiddenCards?.length || 0) + (player.openCards?.length || 0) > 5 ? 'space-x-0.5' : 'space-x-1'
                    }`}>
                      {/* 히든 카드들 먼저 표시 */}
                      {player.hiddenCards && player.hiddenCards.map((card, cardIndex) => {
                        const totalCards = (player.hiddenCards?.length || 0) + (player.openCards?.length || 0)
                        const cardSize = totalCards > 5 ? "w-8 h-12 sm:w-10 sm:h-14" : "w-12 h-16 sm:w-14 sm:h-20"
                        
                        return (
                          <motion.div
                            key={`${player.id}-hidden-${cardIndex}`}
                            className="transform hover:scale-110 transition-transform flex-shrink-0"
                          >
                            <div className={cardSize}>
                              {renderCard(card, card.isRevealed || false, false)}
                            </div>
                          </motion.div>
                        )
                      })}
                      
                      {/* 오픈 카드들 표시 */}
                      {player.openCards && player.openCards.map((card, cardIndex) => {
                        const totalCards = (player.hiddenCards?.length || 0) + (player.openCards?.length || 0)
                        const cardSize = totalCards > 5 ? "w-8 h-12 sm:w-10 sm:h-14" : "w-12 h-16 sm:w-14 sm:h-20"
                        
                        return (
                        <motion.div
                          key={`${player.id}-open-${cardIndex}`}
                          initial={
                            dealingAnimation
                              ? { x: 0, y: -300, rotate: 180, scale: 0 }
                              : false
                          }
                          animate={
                            dealingAnimation
                              ? { x: 0, y: 0, rotate: 0, scale: 1 }
                              : {}
                          }
                          transition={{
                            duration: 0.6,
                            delay: cardIndex * 0.1 + player.position * 0.3,
                            type: "spring",
                            stiffness: 100,
                          }}
                          className="transform hover:scale-110 transition-transform flex-shrink-0"
                        >
                          <div className={cardSize}>
                            {renderCard(card, true, false)}
                          </div>
                        </motion.div>
                        )
                      })}
                    </div>
                  )}
                  
                  {/* 사용자 카드 선택 단계 */}
                  {isMe && gamePhase === "card_selection" && player.openCards && player.openCards.length === 0 && (
                    <div className="mt-4">
                      <div className="text-white text-sm mb-2 text-center">첫 3장 중 공개할 카드를 선택하세요:</div>
                      <div className="flex justify-center space-x-2">
                        {player.hiddenCards && player.hiddenCards.slice(0, 3).map((card, cardIndex) => (
                          <motion.div
                            key={`${player.id}-select-${cardIndex}`}
                            className="transform hover:scale-110 transition-transform flex-shrink-0"
                          >
                            <div className="w-12 h-16 sm:w-14 sm:h-20">
                              {renderCard(card, true, isMe, cardIndex, true)}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* 사용자의 히든 카드들 (내 카드는 항상 보여줌) */}
                  {isMe && gamePhase !== "card_selection" && player.hiddenCards && player.hiddenCards.length > 0 && (
                    <div className="mt-4">
                      <div className="text-white text-xs mb-1 text-center">히든 카드:</div>
                      <div className={`flex justify-center ${
                        (player.hiddenCards?.length || 0) + (player.openCards?.length || 0) > 5 ? 'space-x-0.5' : 'space-x-1'
                      }`}>
                        {player.hiddenCards && player.hiddenCards.map((card, cardIndex) => {
                          const totalCards = (player.hiddenCards?.length || 0) + (player.openCards?.length || 0)
                          const cardSize = totalCards > 5 ? "w-8 h-12 sm:w-10 sm:h-14" : "w-12 h-16 sm:w-14 sm:h-20"
                          
                          return (
                            <motion.div
                              key={`${player.id}-hidden-${cardIndex}`}
                              className="transform hover:scale-110 transition-transform flex-shrink-0"
                              initial={
                                dealingAnimation && cardIndex >= 2
                                  ? { x: 0, y: -300, rotate: 180, scale: 0 }
                                  : false
                              }
                              animate={
                                dealingAnimation && cardIndex >= 2
                                  ? { x: 0, y: 0, rotate: 0, scale: 1 }
                                  : {}
                              }
                              transition={{
                                duration: 0.6,
                                delay: cardIndex * 0.1 + player.position * 0.3,
                                type: "spring",
                                stiffness: 100,
                              }}
                            >
                              <div className={cardSize}>
                                {renderCard(card, true, isMe)}
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Dealing animation overlay */}
            <AnimatePresence>
              {dealingAnimation && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 pointer-events-none"
                >
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      className="w-20 h-20 border-4 border-yellow-400 border-t-transparent rounded-full"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Game Result overlay */}
            <AnimatePresence>
              {gameResult.isVisible && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
                >
                  <div className="text-center max-w-2xl px-8">
                    {/* Winner announcement */}
                    <motion.div
                      initial={{ scale: 0, y: -50 }}
                      animate={{ scale: 1, y: 0 }}
                      transition={{ 
                        duration: 0.6, 
                        ease: "easeOut", 
                        type: "spring",
                        stiffness: 200 
                      }}
                      className="mb-8"
                    >
                      <div className="text-6xl mb-4">🎉</div>
                      <motion.h1
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-5xl font-bold text-yellow-400 mb-2 drop-shadow-2xl"
                        style={{ 
                          textShadow: '0 0 20px rgba(250, 204, 21, 0.8), 0 0 40px rgba(250, 204, 21, 0.6)' 
                        }}
                      >
                        {gameResult.winner}
                      </motion.h1>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-3xl font-bold text-white mb-4"
                      >
                        WINS!
                      </motion.div>
                    </motion.div>

                    {/* Game details */}
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                      className="space-y-4"
                    >
                      <div className="bg-black/40 rounded-xl p-6 border border-yellow-400/30">
                        <div className="text-lg text-gray-300 mb-2">승리 사유</div>
                        <div className="text-2xl font-semibold text-white">{gameResult.reason}</div>
                        {gameResult.handDescription && (
                          <div className="text-xl text-yellow-300 mt-2 font-medium">
                            {gameResult.handDescription}
                          </div>
                        )}
                      </div>
                      
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.1, 1] }}
                        transition={{ delay: 1, duration: 0.4 }}
                        className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl p-6 border-2 border-yellow-400"
                      >
                        <div className="text-lg text-yellow-100 mb-1">획득 칩</div>
                        <div className="text-4xl font-bold text-white drop-shadow-lg">
                          {gameResult.chips.toLocaleString()}
                        </div>
                      </motion.div>
                    </motion.div>

                    {/* Confetti effect */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="absolute inset-0 pointer-events-none"
                    >
                      {[...Array(20)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ 
                            opacity: 0,
                            scale: 0,
                            x: '50vw',
                            y: '50vh'
                          }}
                          animate={{ 
                            opacity: [0, 1, 0],
                            scale: [0, 1, 0.5],
                            x: `${Math.random() * 100}vw`,
                            y: `${Math.random() * 100}vh`,
                            rotate: Math.random() * 360
                          }}
                          transition={{ 
                            duration: 2,
                            delay: Math.random() * 0.5,
                            ease: "easeOut"
                          }}
                          className="absolute w-3 h-3 bg-yellow-400 rounded-full"
                        />
                      ))}
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Countdown overlay */}
            <AnimatePresence>
              {isCountdown && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
                >
                  <div className="text-center">
                    <motion.div
                      key={countdownNumber}
                      initial={{ scale: 0, rotateY: 0 }}
                      animate={{ scale: [0, 1.2, 1], rotateY: [0, 180, 360] }}
                      transition={{ 
                        duration: 0.8, 
                        ease: "easeOut",
                        times: [0, 0.5, 1] 
                      }}
                      className="text-9xl font-bold text-yellow-400 mb-4 drop-shadow-2xl"
                      style={{ 
                        textShadow: '0 0 20px rgba(250, 204, 21, 0.8), 0 0 40px rgba(250, 204, 21, 0.6)' 
                      }}
                    >
                      {countdownNumber}
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-2xl text-white font-semibold"
                    >
                      Next Round Starting...
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Action Buttons - 하단 고정 */}
        <div className="p-6 bg-black/20 backdrop-blur-sm">
          <div className="flex justify-center space-x-4">
            <Button
              onClick={() => {
                playActionSound("fold")
                setPlayers((prev) => prev.map((p) => (p.id === "1" ? { ...p, lastAction: "fold", roundAction: "fold" } : p)))
                moveToNextPlayer()
              }}
              disabled={currentPlayerTurn !== 0 || gamePhase !== "betting"}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 text-lg"
            >
              <X className="h-6 w-6" />
              <span>폴드</span>
            </Button>
            <Button
              onClick={() => {
                const highestBet = players.length > 0 ? Math.max(...players.map(p => p.currentBet), 0) : 0
                const myBet = players[0]?.currentBet || 0
                if (highestBet === myBet) {
                  playActionSound("check")
                  setPlayers((prev) => prev.map((p) => (p.id === "1" ? { ...p, lastAction: "check", roundAction: "check" } : p)))
                  moveToNextPlayer()
                }
              }}
              disabled={currentPlayerTurn !== 0 || gamePhase !== "betting" || players.length === 0 || (players.length > 0 ? Math.max(...players.map(p => p.currentBet), 0) : 0) !== (players[0]?.currentBet || 0)}
              className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 text-lg"
            >
              <Check className="h-6 w-6" />
              <span>체크</span>
            </Button>
            <Button
              onClick={() => {
                const highestBet = players.length > 0 ? Math.max(...players.map(p => p.currentBet), 0) : 0
                const myBet = players[0]?.currentBet || 0
                const callAmount = Math.min(highestBet - myBet, players[0]?.chips || 0)
                
                playActionSound("call")
                setPlayers((prev) => prev.map((p) => {
                  if (p.id === "1") {
                    const newBet = p.currentBet + callAmount
                    const newChips = p.chips - callAmount
                    setPot(prevPot => prevPot + callAmount)
                    return { ...p, lastAction: "call", currentBet: newBet, chips: newChips, roundAction: "call" }
                  }
                  return p
                }))
                moveToNextPlayer()
              }}
              disabled={currentPlayerTurn !== 0 || gamePhase !== "betting" || players.length === 0 || (players.length > 0 ? Math.max(...players.map(p => p.currentBet), 0) : 0) <= (players[0]?.currentBet || 0)}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 text-lg"
            >
              <Phone className="h-6 w-6" />
              <span>콜</span>
            </Button>
            <Button
              onClick={() => {
                const raiseAmount = 50
                playActionSound("raise")
                setPlayers((prev) => {
                  console.log("사용자가 raise! 다른 플레이어들 액션 초기화")
                  return prev.map((p) => {
                    if (p.id === "1") {
                      const newBet = p.currentBet + raiseAmount
                      const newChips = p.chips - raiseAmount
                      setPot(prevPot => prevPot + raiseAmount)
                      return { ...p, lastAction: "raise", currentBet: newBet, chips: newChips, roundAction: "raise" }
                    }
                    // 다른 플레이어들의 액션 초기화 (폴드한 플레이어 제외)
                    return p.lastAction === "fold" ? p : { ...p, lastAction: null }
                  })
                })
                moveToNextPlayer()
              }}
              disabled={currentPlayerTurn !== 0 || gamePhase !== "betting" || players.length === 0 || (players[0]?.chips || 0) < 50}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 text-lg"
            >
              <TrendingUp className="h-6 w-6" />
              <span>레이즈 (+50)</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
