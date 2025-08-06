'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createItem } from '@/lib/actions/db'
import { Calendar, Clock, FileText, Plus, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AddMeeting({ pods, closing = false }) {
  const [isEditing, setIsEditing] = useState(false)
  const [meetingTitle, setMeetingTitle] = useState<string>('')
  const [newStartTime, setNewStartTime] = useState<string>('')
  const [newEndTime, setNewEndTime] = useState<string>('')
  const [newNotes, setNewNotes] = useState<string>('')
  const [minDateTime, setMinDateTime] = useState<string>('')
  const [pod, setPod] = useState('none')

  const router = useRouter()

  useEffect(() => {
    const now = new Date()
    const isoString = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
    setMinDateTime(isoString)
  }, [])

  const handleRescheduleClick = () => {
    setIsEditing(true)
  }

  const handleConfirm = async () => {
    try {
      if (!newStartTime || !newEndTime) {
        alert('Please select valid start and end times.')
        return
      }

      const success = await createItem('booking', {
        name: meetingTitle,
        start_time: newStartTime,
        end_time: newEndTime,
        notes: newNotes,
        pod: pod === 'none' ? null : pod,
        type: closing ? 'closing' : null,
      })
      if (success) {
        router.refresh()
        alert(`Successfully created ${meetingTitle} meeting.`)
      } else {
        alert('Error updating meeting.')
        console.error(`Failed to reschedule meeting with ID: `)
      }
    } catch (error) {
      alert('Error updating meeting.')
      console.error('Error rescheduling meeting:', error)
    } finally {
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  return (
    <>
      <Button
        onClick={handleRescheduleClick}
        variant="outline"
        className="gap-2 bg-card/50 backdrop-blur-sm hover:bg-card/80"
      >
        <Plus className="h-4 w-4" />
        New {closing && 'Closing'} Meeting
      </Button>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg border-border/50 bg-card/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Create {closing ? 'Closing' : 'Regular'} Meeting
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="meetingTitle"
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Meeting Title
                </Label>
                <Input
                  id="meetingTitle"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="E.g. Client Onboarding Call"
                  className="bg-background/50"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="newStartTime"
                    className="flex items-center gap-2"
                  >
                    <Clock className="h-4 w-4" />
                    Start Time
                  </Label>
                  <Input
                    type="datetime-local"
                    id="newStartTime"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    min={minDateTime}
                    className="bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="newEndTime"
                    className="flex items-center gap-2"
                  >
                    <Clock className="h-4 w-4" />
                    End Time
                  </Label>
                  <Input
                    type="datetime-local"
                    id="newEndTime"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    min={newStartTime}
                    className="bg-background/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Assigned Pod
                </Label>
                <select
                  value={pod}
                  onChange={(e) => setPod(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="none">No pod assigned</option>
                  {pods.map((pod, index) => (
                    <option key={index} value={pod.name}>
                      {pod.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newNotes" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes (Optional)
                </Label>
                <textarea
                  id="newNotes"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={3}
                  placeholder="Add any additional notes or details..."
                  className="flex w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button onClick={handleConfirm} className="w-full sm:w-auto">
                  Create Meeting
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
