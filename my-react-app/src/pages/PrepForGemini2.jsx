import { useState, useEffect } from 'react'
import './PrepForGemini2.css'

function PrepForGemini2({ navigate }) {
  const [selectedMeetingIndex, setSelectedMeetingIndex] = useState('')
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingMeetings, setLoadingMeetings] = useState(true)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('') // 'success' or 'error'

  // Fetch meetings on component mount
  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        setLoadingMeetings(true)
        const response = await fetch('https://tammer.app.n8n.cloud/webhook/all-meetings')
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log('Meetings data received:', data)
        // Handle different possible response formats
        const meetingsList = Array.isArray(data) ? data : (data.meetings || data.data || [])
        console.log('Processed meetings list:', meetingsList)
        setMeetings(meetingsList)
      } catch (error) {
        console.error('Error fetching meetings:', error)
        setMessage('Failed to load meetings. Please try again.')
        setMessageType('error')
      } finally {
        setLoadingMeetings(false)
      }
    }

    fetchMeetings()
  }, [])

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
    
    if (selectedMeetingIndex === '' || selectedMeetingIndex === null) {
      setMessage('Please select a meeting')
      setMessageType('error')
      return
    }

    const selectedMeeting = meetings[parseInt(selectedMeetingIndex)]
    if (!selectedMeeting) {
      setMessage('Invalid meeting selection')
      setMessageType('error')
      return
    }

    // Extract the meeting ID from the meeting object
    // Try common field names for meeting ID
    const meetingId = selectedMeeting.id || 
                      selectedMeeting.meetingId || 
                      selectedMeeting._id || 
                      selectedMeeting.meeting_id ||
                      selectedMeeting.ID ||
                      selectedMeeting.MeetingID
    
    if (!meetingId) {
      console.error('Meeting object structure:', selectedMeeting)
      console.error('Available keys:', Object.keys(selectedMeeting))
      setMessage('Meeting ID not found in meeting data. Check console for meeting structure.')
      setMessageType('error')
      return
    }

    setLoading(true)
    setMessage('')
    setMessageType('')

    try {
      console.log('Submitting with meeting ID:', meetingId, 'from meeting:', selectedMeeting)
      const url = `https://tammer.app.n8n.cloud/webhook/gemini-prompt?id=${encodeURIComponent(meetingId)}`
      console.log('URL:', url)
      const response = await fetch(
        `${url}`
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const text = await response.text()
      console.log('Response received, length:', text.length)

      if (!text || text.trim().length === 0) {
        throw new Error('Empty response from server')
      }

      // Copy to clipboard with fallback
      try {
        await navigator.clipboard.writeText(text)
        console.log('Text copied to clipboard successfully')
      } catch (clipboardError) {
        console.error('Clipboard API failed, trying fallback:', clipboardError)
        // Fallback method for older browsers or when clipboard API fails
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        try {
          document.execCommand('copy')
          console.log('Text copied using fallback method')
        } catch (fallbackError) {
          console.error('Fallback copy failed:', fallbackError)
          throw new Error('Failed to copy to clipboard. Please copy manually.')
        }
        document.body.removeChild(textArea)
      }
      
      setMessage('String copied to clipboard successfully!')
      setMessageType('success')
      setSelectedMeetingIndex('') // Clear the selection
      
      // Open Gemini in a new tab
      window.open('https://gemini.google.com/app', '_blank')
    } catch (error) {
      console.error('Error:', error)
      setMessage(error.message || 'Something went wrong. Please try again.')
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
    <div className="prep-for-gemini-2">
      <h1>Prep for Gemini 2</h1>
      <form onSubmit={handleSubmit} className="gemini-form">
        <div className="form-group">
          <label htmlFor="meetingId">Select Meeting</label>
          <select
            id="meetingId"
            value={selectedMeetingIndex}
            onChange={(e) => setSelectedMeetingIndex(e.target.value)}
            disabled={loading || loadingMeetings}
          >
            <option value="">-- Select a meeting --</option>
            {meetings.map((meeting, index) => {
              // Display name from various possible fields
              const displayName = meeting.name || meeting.title || meeting.meetingName || meeting.subject || `Meeting ${index + 1}`
              return (
                <option key={index} value={index}>
                  {displayName}
                </option>
              )
            })}
          </select>
        </div>
        <div className="form-actions">
          <button type="submit" disabled={loading || selectedMeetingIndex === '' || loadingMeetings}>
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
      {loadingMeetings && (
        <div className="message info">
          Loading meetings...
        </div>
      )}
    </div>
  )
}

export default PrepForGemini2
