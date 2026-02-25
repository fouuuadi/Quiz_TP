// ============================================================
// CreateQuiz - Formulaire de creation d'un quiz
// A IMPLEMENTER : construire le formulaire dynamique
// ============================================================

import { useState } from 'react'
import type { QuizQuestion } from '@shared/index'

interface CreateQuizProps {
  /** Callback appele quand le formulaire est soumis */
  onSubmit: (title: string, questions: QuizQuestion[]) => void
}

/**
 * Composant formulaire pour creer un nouveau quiz.
 *
 * Ce qu'il faut implementer :
 * - Un champ pour le titre du quiz
 * - Une liste dynamique de questions (pouvoir en ajouter/supprimer)
 * - Pour chaque question :
 *   - Un champ texte pour la question
 *   - 4 champs texte pour les choix de reponse
 *   - Un selecteur (radio) pour la bonne reponse (correctIndex)
 *   - Un champ pour la duree du timer en secondes
 * - Un bouton pour ajouter une question
 * - Un bouton pour soumettre le formulaire
 *
 * Astuce : utilisez un state pour stocker un tableau de questions
 * et generez un id unique pour chaque question (ex: crypto.randomUUID())
 *
 * Classes CSS disponibles : .create-form, .form-group, .question-card,
 * .question-card-header, .choices-inputs, .choice-input-group,
 * .btn-add-question, .btn-remove, .btn-primary
 */
interface QuestionDraft {
  id: string
  text: string
  choices: [string, string, string, string]
  correctIndex: number
  timerSec: number
}

function makeQuestion(): QuestionDraft {
  return {
    id: crypto.randomUUID(),
    text: '',
    choices: ['', '', '', ''],
    correctIndex: 0,
    timerSec: 20,
  }
}

function CreateQuiz({ onSubmit }: CreateQuizProps) {
  const [title, setTitle] = useState('')
  const [questions, setQuestions] = useState<QuestionDraft[]>([makeQuestion()])

  const updateQuestion = (index: number, field: keyof QuestionDraft, value: unknown) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    )
  }

  const updateChoice = (qIndex: number, cIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q
        const choices = [...q.choices] as [string, string, string, string]
        choices[cIndex] = value
        return { ...q, choices }
      })
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { alert('Le titre est requis'); return }
    if (questions.length === 0) { alert('Ajoute au moins une question'); return }
    for (const q of questions) {
      if (!q.text.trim()) { alert('Chaque question doit avoir un texte'); return }
      if (q.choices.some((c) => !c.trim())) { alert('Chaque choix doit etre rempli'); return }
    }
    onSubmit(title.trim(), questions)
  }

  return (
    <div className="phase-container">
      <h1>Creer un Quiz</h1>
      <form className="create-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Titre du quiz</label>
          <input
            type="text"
            placeholder="Ex : Quiz culture generale"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {questions.map((q, qIndex) => (
          <div key={q.id} className="question-card">
            <div className="question-card-header">
              <span>Question {qIndex + 1}</span>
              {questions.length > 1 && (
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== qIndex))}
                >
                  Supprimer
                </button>
              )}
            </div>

            <div className="form-group">
              <label>Texte de la question</label>
              <input
                type="text"
                placeholder="Ex : Quelle est la capitale de la France ?"
                value={q.text}
                onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
              />
            </div>

            <div className="choices-inputs">
              {q.choices.map((choice, cIndex) => (
                <div key={cIndex} className="choice-input-group">
                  <input
                    type="radio"
                    name={`correct-${q.id}`}
                    checked={q.correctIndex === cIndex}
                    onChange={() => updateQuestion(qIndex, 'correctIndex', cIndex)}
                  />
                  <input
                    type="text"
                    placeholder={`Choix ${cIndex + 1}`}
                    value={choice}
                    onChange={(e) => updateChoice(qIndex, cIndex, e.target.value)}
                  />
                </div>
              ))}
            </div>

            <div className="form-group">
              <label>Duree du timer (secondes)</label>
              <input
                type="number"
                min={5}
                max={60}
                value={q.timerSec}
                onChange={(e) => updateQuestion(qIndex, 'timerSec', Number(e.target.value))}
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          className="btn-add-question"
          onClick={() => setQuestions((prev) => [...prev, makeQuestion()])}
        >
          + Ajouter une question
        </button>

        <button type="submit" className="btn-primary">
          Creer le quiz
        </button>
      </form>
    </div>
  )
}

export default CreateQuiz
