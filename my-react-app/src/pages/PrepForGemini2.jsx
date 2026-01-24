import { useState, useEffect } from 'react'
import './PrepForGemini2.css'

function PrepForGemini2({ navigate }) {
  const [selectedMeetingIndex, setSelectedMeetingIndex] = useState('')
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingMeetings, setLoadingMeetings] = useState(true)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('') // 'success' or 'error'
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

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

  // Filter meetings based on search term
  const filteredMeetings = meetings.filter((meeting, index) => {
    if (!searchTerm.trim()) return true
    const displayName = meeting.name || meeting.title || meeting.meetingName || meeting.subject || `Meeting ${index + 1}`
    return displayName.toLowerCase().includes(searchTerm.toLowerCase())
  })

  // Get display name for selected meeting
  const getDisplayName = (meeting, index) => {
    return meeting.name || meeting.title || meeting.meetingName || meeting.subject || `Meeting ${index + 1}`
  }

  // Handle meeting selection
  const handleMeetingSelect = (index) => {
    setSelectedMeetingIndex(index.toString())
    const selectedMeeting = meetings[index]
    setSearchTerm(getDisplayName(selectedMeeting, index))
    setShowDropdown(false)
  }

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    setShowDropdown(true)
    // Clear selection if user is typing and it doesn't match the selected meeting
    if (selectedMeetingIndex !== '' && meetings[parseInt(selectedMeetingIndex)]) {
      const selectedDisplayName = getDisplayName(meetings[parseInt(selectedMeetingIndex)], parseInt(selectedMeetingIndex))
      if (value !== selectedDisplayName) {
        setSelectedMeetingIndex('')
      }
    }
  }

  // Handle input focus
  const handleInputFocus = () => {
    setShowDropdown(true)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const combobox = document.getElementById('combobox-container')
      if (combobox && !combobox.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

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
      setSearchTerm('') // Clear the search input
      
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
          <div id="combobox-container" className="combobox-container">
            <input
              type="text"
              id="meetingId"
              value={searchTerm}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              placeholder="Type to search meetings..."
              disabled={loading || loadingMeetings}
              autoComplete="off"
            />
            {showDropdown && filteredMeetings.length > 0 && (
              <ul className="combobox-dropdown">
                {filteredMeetings.map((meeting) => {
                  // Find the original index in the meetings array
                  const index = meetings.findIndex(m => m === meeting)
                  if (index === -1) return null
                  const displayName = getDisplayName(meeting, index)
                  const isSelected = selectedMeetingIndex === index.toString()
                  return (
                    <li
                      key={index}
                      className={isSelected ? 'selected' : ''}
                      onClick={() => handleMeetingSelect(index)}
                    >
                      {displayName}
                    </li>
                  )
                })}
              </ul>
            )}
            {showDropdown && searchTerm && filteredMeetings.length === 0 && (
              <ul className="combobox-dropdown">
                <li className="no-results">No meetings found</li>
              </ul>
            )}
          </div>
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
