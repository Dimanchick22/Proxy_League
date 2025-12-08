import React, { useState } from 'react'
import Modal from './Modal'
import { tournamentAPI } from '../services/api'

const CreateTournamentModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'single_elimination',
    max_players: 8,
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await tournamentAPI.create(formData)
      onSuccess()
      onClose()
      setFormData({
        name: '',
        description: '',
        type: 'single_elimination',
        max_players: 8,
      })
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create tournament')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'max_players' ? parseInt(value) : value
    }))
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Tournament">
      <form onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label>Tournament Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Enter tournament name"
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            placeholder="Optional description"
          />
        </div>

        <div className="form-group">
          <label>Tournament Type *</label>
          <select name="type" value={formData.type} onChange={handleChange} required>
            <option value="single_elimination">Single Elimination</option>
            <option value="double_elimination">Double Elimination</option>
            <option value="round_robin">Round Robin</option>
          </select>
        </div>

        <div className="form-group">
          <label>Maximum Players *</label>
          <select name="max_players" value={formData.max_players} onChange={handleChange} required>
            {[2, 4, 8, 16].map(num => (
              <option key={num} value={num}>{num} Players</option>
            ))}
          </select>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Tournament'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default CreateTournamentModal
