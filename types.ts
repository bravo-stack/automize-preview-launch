export interface Booking {
  id: number
  client_id: number | null
  pod: string | null
  name: string
  start_time: string // ISO date time
  end_time: string // ISO date time
  created_at: string // ISO date time
}

export interface ServiceDetail {
  service: string
  duration: number
}

export interface Service {
  type: string
  details: ServiceDetail[]
  extra?: string
}

export interface SelectedPackage {
  exterior: string[]
  interior: string[]
  additional: string[]
  [key: string]: string[]
}

export interface TimeSlot {
  time: string
  available: boolean
}
