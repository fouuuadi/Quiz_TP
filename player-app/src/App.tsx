// ============================================================
// Player App - Composant principal
// A IMPLEMENTER : gestion des messages et routage par phase
// ============================================================

import { useState, useEffect } from 'react'
import { useWebSocket } from './hooks/useWebSocket'
import type { QuizPhase, QuizQuestion } from '@shared/index'
import JoinScreen from './components/JoinScreen'
import WaitingLobby from './components/WaitingLobby'
import AnswerScreen from './components/AnswerScreen'
import FeedbackScreen from './components/FeedbackScreen'
import ScoreScreen from './components/ScoreScreen'

const WS_URL = 'ws://localhost:3001'

function App() {
  const { status, sendMessage, lastMessage } = useWebSocket(WS_URL)

  // --- Etats de l'application ---
  const [phase, setPhase] = useState<QuizPhase | 'join' | 'feedback'>('join')
  const [playerName, setPlayerName] = useState('')
  const [players, setPlayers] = useState<string[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<Omit<QuizQuestion, 'correctIndex'> | null>(null)
  const [remaining, setRemaining] = useState(0)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [lastAnswerIndex, setLastAnswerIndex] = useState<number | null>(null)
  const [lastCorrect, setLastCorrect] = useState(false)
  const [score, setScore] = useState(0)
  const [rankings, setRankings] = useState<{ name: string; score: number }[]>([])
  const [error, setError] = useState<string | undefined>(undefined)

  // --- Traitement des messages du serveur ---
  useEffect(() => {
    if (!lastMessage) return

    // TODO: Traiter chaque type de message du serveur
    // Utiliser un switch sur lastMessage.type

    switch (lastMessage.type) {
      case 'joined': {
        setPlayers(lastMessage.players)
        setPhase('lobby')
        setError(undefined)
        break
      }

      case 'question': {
        setCurrentQuestion(lastMessage.question)
        setRemaining(lastMessage.question.timerSec)
        setHasAnswered(false)
        setLastAnswerIndex(null)
        setPhase('question')
        break
      }

      case 'tick': {
        setRemaining(lastMessage.remaining)
        break
      }

      case 'results': {
        // On compare la reponse du joueur avec la bonne reponse
        const correct = lastAnswerIndex === lastMessage.correctIndex
        setLastCorrect(correct)
        // On recupere le score du joueur depuis l'objet { nomJoueur: score }
        const myScore = lastMessage.scores[playerName] ?? score
        setScore(myScore)
        setPhase('feedback')
        break
      }

      case 'leaderboard': {
        setRankings(lastMessage.rankings)
        setPhase('leaderboard')
        break
      }

      case 'ended': {
        setPhase('ended')
        break
      }

      case 'error': {
        setError(lastMessage.message)
        break
      }
    }
  }, [lastMessage])

  // --- Handlers ---

  const handleJoin = (code: string, name: string) => {
    setPlayerName(name)
    sendMessage({ type: 'join', quizCode: code, name })
  }

  const handleAnswer = (choiceIndex: number) => {
    if (hasAnswered) return
    setHasAnswered(true)
    setLastAnswerIndex(choiceIndex)
    sendMessage({ type: 'answer', questionId: currentQuestion!.id, choiceIndex })
  }

  // --- Rendu par phase ---
  const renderPhase = () => {
    switch (phase) {
      case 'join':
        return <JoinScreen onJoin={handleJoin} error={error} />

      case 'lobby':
        return <WaitingLobby players={players} />

      case 'question':
        return currentQuestion ? (
          <AnswerScreen
            question={currentQuestion}
            remaining={remaining}
            onAnswer={handleAnswer}
            hasAnswered={hasAnswered}
          />
        ) : null

      case 'feedback':
        return <FeedbackScreen correct={lastCorrect} score={score} />

      case 'results':
        // Pendant 'results' on reste sur FeedbackScreen
        return <FeedbackScreen correct={lastCorrect} score={score} />

      case 'leaderboard':
        return <ScoreScreen rankings={rankings} playerName={playerName} />

      case 'ended':
        return (
          <div className="phase-container">
            <h1>Quiz termine !</h1>
            <p className="ended-message">Merci d'avoir participe !</p>
            <button className="btn-primary" onClick={() => setPhase('join')}>
              Rejoindre un autre quiz
            </button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h2>Quiz Player</h2>
        <span className={`status-badge status-${status}`}>
          {status === 'connected' ? 'Connecte' : status === 'connecting' ? 'Connexion...' : 'Deconnecte'}
        </span>
      </header>
      <main className="app-main">
        {renderPhase()}
      </main>
    </div>
  )
}

export default App
