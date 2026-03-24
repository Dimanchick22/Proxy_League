import React, { useState } from 'react'
import Modal from './Modal'
import { roomAPI } from '../services/api'

const CreateRoomModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    max_players: 2,
    password: '',
    is_private: false,
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await roomAPI.create(formData)
      onSuccess(response.data)
      onClose()
      setFormData({
        name: '',
        description: '',
        max_players: 2,
        password: '',
        is_private: false,
      })
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create room')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'max_players' ? parseInt(value) : value)
    }))
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Room">
      <form onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label>Room Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Enter room name"
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
          <label>Maximum Players *</label>
          <select name="max_players" value={formData.max_players} onChange={handleChange} required>
            {[2, 3, 4, 5, 6, 8, 10].map(num => (
              <option key={num} value={num}>{num} Players</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="is_private"
              checked={formData.is_private}
              onChange={handleChange}
              style={{ width: 'auto' }}
            />
            Private Room
          </label>
        </div>

        {formData.is_private && (
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter room password"
            />
          </div>
        )}

        <div className="modal-footer">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Room'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default CreateRoomModal
