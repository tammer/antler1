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
  const [meetingHighlights, setMeetingHighlights] = useState('')
  const [loadingHighlights, setLoadingHighlights] = useState(false)
  const [geminiSummary, setGeminiSummary] = useState('')
  const [loadingGeminiSummary, setLoadingGeminiSummary] = useState(false)

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

  // Format JSON into HTML - labels as h2, highlightText as p
  const formatJsonToHtml = (data) => {
    if (!data) return '<p>No highlights available</p>'
    
    // If it's already a string, try to parse it
    let jsonData = data
    if (typeof data === 'string') {
      try {
        jsonData = JSON.parse(data)
      } catch (e) {
        // If it's not JSON, return it as is
        return `<p>${escapeHtml(data)}</p>`
      }
    }

    let htmlParts = []

    // Handle array of highlight objects
    if (Array.isArray(jsonData)) {
      jsonData.forEach((item) => {
        if (item && typeof item === 'object') {
          if (item.label) {
            htmlParts.push(`<h2>${escapeHtml(item.label)}</h2>`)
          }
          if (item.highlightText) {
            htmlParts.push(`<p>${escapeHtml(item.highlightText)}</p>`)
          }
        }
      })
    }
    // Handle single object
    else if (jsonData && typeof jsonData === 'object') {
      // Check if it has label and highlightText at root level
      if (jsonData.label) {
        htmlParts.push(`<h2>${escapeHtml(jsonData.label)}</h2>`)
      }
      if (jsonData.highlightText) {
        htmlParts.push(`<p>${escapeHtml(jsonData.highlightText)}</p>`)
      }
      // Check if it has an array of highlights
      if (Array.isArray(jsonData.highlights)) {
        jsonData.highlights.forEach((item) => {
          if (item && typeof item === 'object') {
            if (item.label) {
              htmlParts.push(`<h2>${escapeHtml(item.label)}</h2>`)
            }
            if (item.highlightText) {
              htmlParts.push(`<p>${escapeHtml(item.highlightText)}</p>`)
            }
          }
        })
      }
      // Iterate through all properties to find label/highlightText pairs
      Object.keys(jsonData).forEach((key) => {
        const value = jsonData[key]
        if (key === 'label' && typeof value === 'string') {
          htmlParts.push(`<h2>${escapeHtml(value)}</h2>`)
        } else if (key === 'highlightText' && typeof value === 'string') {
          htmlParts.push(`<p>${escapeHtml(value)}</p>`)
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
          // Recursively check nested objects
          if (value.label) {
            htmlParts.push(`<h2>${escapeHtml(value.label)}</h2>`)
          }
          if (value.highlightText) {
            htmlParts.push(`<p>${escapeHtml(value.highlightText)}</p>`)
          }
        }
      })
    }

    if (htmlParts.length === 0) {
      return '<p>No highlights found in the response</p>'
    }

    return `<div class="highlights-formatted">${htmlParts.join('')}</div>`
  }

  // Escape HTML to prevent XSS
  const escapeHtml = (text) => {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  // Fetch meeting highlights
  const fetchMeetingHighlights = async (meetingId) => {
    try {
      setLoadingHighlights(true)
      const response = await fetch(
        `https://tammer.app.n8n.cloud/webhook/meeting-highlights?id=${encodeURIComponent(meetingId)}`
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const text = await response.text()
      let jsonData
      
      // Try to parse as JSON
      try {
        jsonData = JSON.parse(text)
      } catch (e) {
        // If not JSON, use the text as is
        jsonData = text
      }
      
      // Format to HTML
      const htmlContent = formatJsonToHtml(jsonData)
      setMeetingHighlights(htmlContent)
    } catch (error) {
      console.error('Error fetching meeting highlights:', error)
      setMeetingHighlights('<p class="error-message">Failed to load meeting highlights.</p>')
    } finally {
      setLoadingHighlights(false)
    }
  }

  // Fetch Gemini Summary
  const fetchGeminiSummary = async (meetingId) => {
    try {
      setLoadingGeminiSummary(true)
      const response = await fetch(
        `https://tammer.app.n8n.cloud/webhook/summary?id=${encodeURIComponent(meetingId)}`
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const htmlContent = await response.text()
      if (htmlContent === '') {
        setGeminiSummary('<p class="error-message">Failed to load Gemini summary. (Probably Gemini is rate limited. Try again later.)</p>')
        return
      }
      setGeminiSummary(htmlContent)
    } catch (error) {
      console.error('Error fetching Gemini summary:', error)
      setGeminiSummary('<p class="error-message">Failed to load Gemini summary.</p>')
    } finally {
      setLoadingGeminiSummary(false)
    }
  }

  // Handle meeting selection
  const handleMeetingSelect = async (index) => {
    setSelectedMeetingIndex(index.toString())
    const selectedMeeting = meetings[index]
    setSearchTerm(getDisplayName(selectedMeeting, index))
    setShowDropdown(false)
    
    // Extract the meeting ID and fetch highlights
    const meetingId = selectedMeeting.id || 
                      selectedMeeting.meetingId || 
                      selectedMeeting._id || 
                      selectedMeeting.meeting_id ||
                      selectedMeeting.ID ||
                      selectedMeeting.MeetingID
    
    if (meetingId) {
      // Fetch both highlights and Gemini summary in parallel
      await Promise.all([
        fetchMeetingHighlights(meetingId),
        fetchGeminiSummary(meetingId)
      ])
    } else {
      setMeetingHighlights('Meeting ID not found.')
      setGeminiSummary('')
    }
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
        setMeetingHighlights('') // Clear highlights when selection is cleared
        setGeminiSummary('') // Clear Gemini summary when selection is cleared
      }
    }
  }

  // Handle input focus
  const handleInputFocus = () => {
    setShowDropdown(true)
  }

  // Handle clear button
  const handleClear = () => {
    setSearchTerm('')
    setSelectedMeetingIndex('')
    setMeetingHighlights('')
    setGeminiSummary('')
    setShowDropdown(false)
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
      setMeetingHighlights('') // Clear highlights
      setGeminiSummary('') // Clear Gemini summary
      
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
      <h1>Meetgeek Manager</h1>
      <form onSubmit={handleSubmit} className="gemini-form">
        <div className="form-group-with-highlights">
          <div className="form-group combobox-group">
            <label htmlFor="meetingId">Select Meeting</label>
            <div className="combobox-link-wrapper">
              <div id="combobox-container" className="combobox-container">
                <div className="combobox-input-wrapper">
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
                  {(searchTerm || selectedMeetingIndex) && (
                    <button
                      type="button"
                      className="clear-button"
                      onClick={handleClear}
                      disabled={loading || loadingMeetings}
                      aria-label="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>
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
              {selectedMeetingIndex !== '' && meetings[parseInt(selectedMeetingIndex)] && (() => {
                const selectedMeeting = meetings[parseInt(selectedMeetingIndex)]
                const meetingId = selectedMeeting.id || 
                                  selectedMeeting.meetingId || 
                                  selectedMeeting._id || 
                                  selectedMeeting.meeting_id ||
                                  selectedMeeting.ID ||
                                  selectedMeeting.MeetingID
                return meetingId ? (
                  <button 
                    type="button"
                    onClick={() => window.open(`https://app2.meetgeek.ai/meeting/${meetingId}`, '_blank', 'noopener,noreferrer')}
                    className="watch-video-button"
                  >
                    Watch on Meetgeek
                  </button>
                ) : null
              })()}
            </div>
          </div>
          <div className="highlights-row">
            <div className="highlights-container">
              <label>Meetgek Generic Summary (not that good)</label>
              <div className="highlights-content">
                {loadingHighlights ? (
                  <div className="highlights-loading">Loading highlights...</div>
                ) : meetingHighlights ? (
                  <div 
                    className="highlights-text" 
                    dangerouslySetInnerHTML={{ __html: meetingHighlights }}
                  />
                ) : (
                  <div className="highlights-placeholder">Select a meeting to view highlights</div>
                )}
              </div>
            </div>
            <div className="highlights-container">
              <label>Our Own Summary (Better)</label>
              <div className="highlights-content">
                {loadingGeminiSummary ? (
                  <div className="highlights-loading">
                    <div className="spinner"></div>
                    <div>Loading Gemini Summary</div>
                  </div>
                ) : geminiSummary ? (
                  <div 
                    className="highlights-text gemini-summary" 
                    dangerouslySetInnerHTML={{ __html: geminiSummary }}
                  />
                ) : (
                  <div className="highlights-placeholder">Select a meeting to view Gemini summary</div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" disabled={loading || selectedMeetingIndex === '' || loadingMeetings}>
            {loading ? 'Loading...' : 'Analyze in Gemini'}
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
