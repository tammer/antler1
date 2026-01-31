import { useState, useEffect } from 'react'
import '../App.css'
import { htmlWithBlankLinks } from '../lib/htmlUtils'

const API_TOKEN = 'eu-MnEEeTvj8ZcI1s25WQJFFMk895tJozKCdqeWq2Mvcq4MIaIAuLZWDxikIdH0n4Y5Ygf1afemCmn9itdzKDGujJwd0WsTGxPJolIf5COlM12DcFYsoe2gdVrdjVbAO'
const MEETINGS_API_URL = 'https://api.meetgeek.ai/v1/meetings'
const SUMMARY_API_URL = 'https://tammer.app.n8n.cloud/webhook/summary'

function GetMeetingSummary() {
  const [meetings, setMeetings] = useState([])
  const [selectedMeetingId, setSelectedMeetingId] = useState('')
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loadingMeetings, setLoadingMeetings] = useState(true)

  useEffect(() => {
    fetchMeetings()
  }, [])

  const fetchMeetings = async () => {
    try {
      setLoadingMeetings(true)
      setError('')
      const response = await fetch(`${MEETINGS_API_URL}?limit=500`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch meetings')
      }

      const data = await response.json()
      setMeetings(data.meetings || [])
    } catch (err) {
      setError(`Error loading meetings: ${err.message}`)
      console.error('Error fetching meetings:', err)
    } finally {
      setLoadingMeetings(false)
    }
  }

  const fetchSummary = async (meetingId) => {
    if (!meetingId) {
      setSummary('')
      return
    }

    try {
      setLoading(true)
      setError('')
      setSummary('')
      
      const response = await fetch(`${SUMMARY_API_URL}?id=${meetingId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch summary')
      }

      // The response is HTML, not JSON
      const htmlContent = await response.text()
      setSummary(htmlContent)
    } catch (err) {
      setError(`Error loading summary: ${err.message}`)
      console.error('Error fetching summary:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleMeetingChange = (e) => {
    const meetingId = e.target.value
    setSelectedMeetingId(meetingId)
    fetchSummary(meetingId)
  }

  const selectedMeeting = meetings.find(m => m.meeting_id === selectedMeetingId)

  return (
    <div className="app">
      <h1>Meeting Transcript Summary</h1>
      
      <div className="container">
        <div className="selector-section">
          <label htmlFor="meeting-select">Select a Meeting:</label>
          {loadingMeetings ? (
            <div className="loading">Loading meetings...</div>
          ) : (
            <select
              id="meeting-select"
              value={selectedMeetingId}
              onChange={handleMeetingChange}
              className="meeting-select"
            >
              <option value="">-- Choose a meeting --</option>
              {meetings.map((meeting) => (
                <option key={meeting.meeting_id} value={meeting.meeting_id}>
                  {meeting.title}
                </option>
              ))}
            </select>
          )}
        </div>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {selectedMeeting && (
          <div className="meeting-info">
            <h3>{selectedMeeting.title}</h3>
            <p className="meeting-date">
              {new Date(selectedMeeting.timestamp_start_utc).toLocaleString()}
            </p>
          </div>
        )}

        {loading && (
          <div className="loading">Loading summary...</div>
        )}

        {summary && !loading && (
          <div className="summary-section">
            <h2>Summary</h2>
            <div 
              className="summary-content"
              dangerouslySetInnerHTML={{ __html: htmlWithBlankLinks(summary) }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default GetMeetingSummary
