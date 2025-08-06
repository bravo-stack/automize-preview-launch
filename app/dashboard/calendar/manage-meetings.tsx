'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock, Settings, User, X } from 'lucide-react'
import { useState } from 'react'
import CancelMeetingButton from './cancel-meeting'
import EditMeeting from './edit-meeting'

interface ManageMeetingsButtonProps {
  events: {
    id: string
    title: string
    people: string[]
    start: string
    end: string
    notes: string
    pod: string
  }[]
  pods: any
  closing?: boolean
}

function formatDateTime(dateTime: string): string {
  const date = new Date(dateTime)
  return date.toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

export default function ManageMeetingsButton({
  events,
  pods,
  closing = false,
}: ManageMeetingsButtonProps) {
  const [isManagingMeetings, setIsManagingMeetings] = useState(false)

  const handleOpen = () => setIsManagingMeetings(true)
  const handleClose = () => setIsManagingMeetings(false)

  return (
    <>
      <Button
        onClick={handleOpen}
        variant="outline"
        className="gap-2 bg-card/50 backdrop-blur-sm hover:bg-card/80"
      >
        <Settings className="h-4 w-4" />
        Manage {closing && 'Closing'} Meetings
      </Button>

      {isManagingMeetings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <Card className="relative w-full max-w-4xl border-border/50 bg-card/95 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Manage {closing ? 'Closing' : 'Regular'} Meetings
                </CardTitle>
                <Button
                  onClick={handleClose}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {events.length === 0 ? (
                <div className="py-12 text-center">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">
                    No meetings found
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    There are no {closing ? 'closing' : 'regular'} meetings
                    scheduled yet.
                  </p>
                </div>
              ) : (
                <div className="max-h-96 space-y-4 overflow-y-auto">
                  {events.map((event) => (
                    <Card
                      key={event.id}
                      className="border-border/50 bg-muted/20"
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-medium">{event.title}</h4>
                              <Badge variant="secondary" className="text-xs">
                                <User className="mr-1 h-3 w-3" />
                                {event.people}
                              </Badge>
                              {event.pod && (
                                <Badge variant="outline" className="text-xs">
                                  Pod: {event.pod}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatDateTime(event.start)} -{' '}
                              {formatDateTime(event.end)}
                            </div>
                            {event.notes && event.notes !== 'N/A' && (
                              <p className="text-sm text-muted-foreground">
                                {event.notes}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <EditMeeting
                              meetingId={event.id}
                              meetingTitle={event.title}
                              startTime={event.start}
                              endTime={event.end}
                              notes={event.notes}
                              mediabuyer={event.pod}
                              pods={pods}
                              normal
                            />
                            <CancelMeetingButton
                              meetingId={event.id}
                              meetingTitle={event.title}
                              meetingTime={formatDateTime(event.start)}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
