// ============================================================
// JoinScreen - Formulaire pour rejoindre un quiz
// A IMPLEMENTER : champs code et nom, bouton rejoindre
// ============================================================

import { useState } from 'react'

interface JoinScreenProps {
  /** Callback appele quand le joueur soumet le formulaire */
  onJoin: (code: string, name: string) => void
  /** Message d'erreur optionnel (ex: "Code invalide") */
  error?: string
}

/**
 * Composant formulaire pour rejoindre un quiz existant.
 *
 * Ce qu'il faut implementer :
 * - Un champ pour le code du quiz (6 caracteres, majuscules)
 *   avec la classe .code-input pour le style monospace
 * - Un champ pour le pseudo du joueur
 * - Un bouton "Rejoindre" (classe .btn-primary)
 * - Afficher le message d'erreur s'il existe (classe .error-message)
 * - Valider que les deux champs ne sont pas vides avant d'appeler onJoin
 *
 * Classes CSS disponibles : .join-form, .form-group, .code-input,
 * .error-message, .btn-primary
 */
function JoinScreen({ onJoin, error }: JoinScreenProps) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim() || !name.trim()) return
    onJoin(code.toUpperCase(), name.trim())
  }

  return (
    <form className="join-form" onSubmit={handleSubmit}>
      <h1>Rejoindre un Quiz</h1>
      {error && <p className="error-message">{error}</p>}
      <div className="form-group">
        <label>Code du quiz</label>
        <input
          className="code-input"
          type="text"
          placeholder="Ex : A3F9K2"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
      </div>
      <div className="form-group">
        <label>Ton pseudo</label>
        <input
          type="text"
          placeholder="Ex : Alice"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <button className="btn-primary" type="submit">Rejoindre</button>
    </form>
  )
}

export default JoinScreen
