// ============================================================
// QuizRoom - Logique d'une salle de quiz
// ============================================================

import WebSocket from 'ws'
import type { QuizQuestion, QuizPhase, ServerMessage } from '../../packages/shared-types'
import { send, broadcast } from './utils'

/** Represente un joueur connecte */
interface Player {
  id: string
  name: string
  ws: WebSocket
}

export class QuizRoom {
  /** Identifiant unique de la salle */
  readonly id: string

  /** Code a 6 caracteres que les joueurs utilisent pour rejoindre */
  readonly code: string

  /** Phase actuelle du quiz */
  phase: QuizPhase = 'lobby'

  /** WebSocket du host (presentateur) */
  hostWs: WebSocket | null = null

  /** Map des joueurs : playerId -> Player */
  players: Map<string, Player> = new Map()

  /** Liste des questions du quiz */
  questions: QuizQuestion[] = []

  /** Titre du quiz */
  title: string = ''

  /** Index de la question en cours (0-based) */
  currentQuestionIndex: number = -1

  /** Map des reponses pour la question en cours : playerId -> choiceIndex */
  answers: Map<string, number> = new Map()

  /** Map des scores cumules : playerId -> score total */
  scores: Map<string, number> = new Map()

  /** Timer ID pour le compte a rebours (pour pouvoir l'annuler) */
  timerId: ReturnType<typeof setInterval> | null = null

  /** Temps restant pour la question en cours */
  remaining: number = 0

  constructor(id: string, code: string) {
    this.id = id
    this.code = code
  }

  /**
   * Ajoute un joueur a la salle.
   * @returns l'ID du joueur cree
   */
  addPlayer(name: string, ws: WebSocket): string {
    const playerId = crypto.randomUUID()
    const player: Player = { id: playerId, name, ws }
    this.players.set(playerId, player)
    this.scores.set(playerId, 0)

    const playerNames = Array.from(this.players.values()).map((p) => p.name)
    this.broadcastToAll({ type: 'joined', playerId, players: playerNames })

    return playerId
  }

  /**
   * Demarre le quiz.
   */
  start(): void {
    if (this.phase !== 'lobby') return
    if (this.players.size === 0) {
      if (this.hostWs) send(this.hostWs, { type: 'error', message: 'Aucun joueur dans la salle' })
      return
    }
    this.nextQuestion()
  }

  /**
   * Passe a la question suivante.
   */
  nextQuestion(): void {
    if (this.timerId) {
      clearInterval(this.timerId)
      this.timerId = null
    }

    this.currentQuestionIndex++

    if (this.currentQuestionIndex >= this.questions.length) {
      this.broadcastLeaderboard()
      return
    }

    this.answers = new Map()
    this.phase = 'question'

    this.broadcastQuestion()

    const question = this.questions[this.currentQuestionIndex]
    this.remaining = question.timerSec

    this.timerId = setInterval(() => this.tick(), 1000)
  }

  /**
   * Traite la reponse d'un joueur.
   */
  handleAnswer(playerId: string, choiceIndex: number): void {
    if (this.phase !== 'question') return
    if (this.answers.has(playerId)) return

    this.answers.set(playerId, choiceIndex)

    const question = this.questions[this.currentQuestionIndex]
    if (choiceIndex === question.correctIndex) {
      const bonus = Math.round(500 * (this.remaining / question.timerSec))
      const points = 1000 + bonus
      const current = this.scores.get(playerId) ?? 0
      this.scores.set(playerId, current + points)
    }

    if (this.answers.size === this.players.size) {
      this.timeUp()
    }
  }

  /**
   * Appelee toutes les secondes par le timer.
   */
  private tick(): void {
    this.remaining--
    this.broadcastToAll({ type: 'tick', remaining: this.remaining })

    if (this.remaining <= 0) {
      this.timeUp()
    }
  }

  /**
   * Appelee quand le temps est ecoule (ou que tout le monde a repondu).
   */
  private timeUp(): void {
    if (this.timerId) {
      clearInterval(this.timerId)
      this.timerId = null
    }
    this.phase = 'results'
    this.broadcastResults()
  }

  /**
   * Retourne la liste de tous les WebSocket des joueurs.
   */
  private getPlayerWsList(): WebSocket[] {
    return Array.from(this.players.values()).map((p) => p.ws)
  }

  /**
   * Envoie un message a tous les clients : host + tous les joueurs.
   */
  private broadcastToAll(message: ServerMessage): void {
    if (this.hostWs) send(this.hostWs, message)
    broadcast(this.getPlayerWsList(), message)
  }

  /**
   * Envoie la question en cours a tous les clients (sans correctIndex).
   */
  private broadcastQuestion(): void {
    const question = this.questions[this.currentQuestionIndex]
    const { correctIndex: _omit, ...questionWithoutAnswer } = question
    this.broadcastToAll({
      type: 'question',
      question: questionWithoutAnswer,
      index: this.currentQuestionIndex,
      total: this.questions.length,
    })
  }

  /**
   * Envoie les resultats de la question en cours.
   */
  private broadcastResults(): void {
    const question = this.questions[this.currentQuestionIndex]

    const distribution = new Array(question.choices.length).fill(0)
    for (const choiceIndex of this.answers.values()) {
      if (choiceIndex >= 0 && choiceIndex < distribution.length) {
        distribution[choiceIndex]++
      }
    }

    const scoresObj: Record<string, number> = {}
    for (const [playerId, score] of this.scores.entries()) {
      const player = this.players.get(playerId)
      if (player) scoresObj[player.name] = score
    }

    this.broadcastToAll({
      type: 'results',
      correctIndex: question.correctIndex,
      distribution,
      scores: scoresObj,
    })
  }

  /**
   * Envoie le classement final.
   */
  broadcastLeaderboard(): void {
    const rankings = Array.from(this.players.values())
      .map((p) => ({ name: p.name, score: this.scores.get(p.id) ?? 0 }))
      .sort((a, b) => b.score - a.score)

    this.phase = 'leaderboard'
    this.broadcastToAll({ type: 'leaderboard', rankings })
  }

  /**
   * Termine le quiz.
   */
  end(): void {
    if (this.timerId) {
      clearInterval(this.timerId)
      this.timerId = null
    }
    this.phase = 'ended'
    this.broadcastToAll({ type: 'ended' })
  }
}
