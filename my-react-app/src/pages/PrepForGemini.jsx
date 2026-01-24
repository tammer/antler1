import { useState, useEffect } from 'react'
import './PrepForGemini.css'

function PrepForGemini({ navigate }) {
  const [meetingId, setMeetingId] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('') // 'success' or 'error'

  // Clear success message after 5 seconds
  useEffect(() => {
    if (messageType === 'success') {
      const timer = setTimeout(() => {
        setMessage('')
        setMessageType('')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [messageType, message])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!meetingId.trim()) {
      setMessage('Please enter a meeting ID')
      setMessageType('error')
      return
    }

    setLoading(true)
    setMessage('')
    setMessageType('')

    try {
      const response = await fetch(
        `https://tammer.app.n8n.cloud/webhook/gemini-prompt?id=${encodeURIComponent(meetingId.trim())}`
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const text = await response.text()

      // Copy to clipboard
      await navigator.clipboard.writeText(text)
      
      setMessage('String copied to clipboard successfully!')
      setMessageType('success')
      setMeetingId('') // Clear the input
      
      // Open Gemini in a new tab
      window.open('https://gemini.google.com/app', '_blank')
    } catch (error) {
      console.error('Error:', error)
      setMessage('Something went wrong. Please try again.')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = (e) => {
    e.preventDefault()
    navigate('home')
  }

  return (
    <div className="prep-for-gemini">
      <h1>Prep for Gemini</h1>
      <form onSubmit={handleSubmit} className="gemini-form">
        <div className="form-group">
          <label htmlFor="meetingId">Meeting ID</label>
          <input
            type="text"
            id="meetingId"
            value={meetingId}
            onChange={(e) => setMeetingId(e.target.value)}
            placeholder="Enter meeting ID"
            disabled={loading}
          />
        </div>
        <div className="form-actions">
          <button type="submit" disabled={loading || !meetingId.trim()}>
            {loading ? 'Loading...' : 'Submit'}
          </button>
          <button type="button" onClick={handleBack} className="back-button">
            Back to Home
          </button>
        </div>
      </form>
      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}
    </div>
  )
}

export default PrepForGemini
