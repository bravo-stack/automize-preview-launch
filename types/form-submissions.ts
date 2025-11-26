export type SubmissionStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export interface FormSubmission {
  id: string
  created_at: string
  updated_at: string
  form_type: string
  brand_name: string
  submitter_identifier: string
  status: SubmissionStatus
  client_id: number | null
  processed_at: string | null
  processed_by: string | null
  internal_notes: string | null
}

export interface DayDropRequestDetails {
  id: string
  submission_id: string
  drop_name: string
  collection_name: string
  drop_date: string
  timezone_and_time: string
  offers: string
  link_to_products: string
  sms_required: boolean
  sms_images: string | null
  sms_style: string | null
  sms_personalisation: string | null
  site_locked: string | null
  additional_notes: string | null
}

export interface WebsiteRevampRequestDetails {
  id: string
  submission_id: string
  media_buyer_name: string
  home_page: string | null
  collection_page: string | null
  product_pages: string | null
  size_chart: string | null
  bundles: string | null
  description: string | null
  reviews: string | null
  policies: string | null
  backend: string | null
  track_order: string | null
  about_us: string | null
  additional_notes: string | null
}

export interface DayDropRequest extends FormSubmission {
  discord_username: string
  drop_name: string
  collection_name: string
  drop_date: string
  timezone_and_time: string
  offers: string
  link_to_products: string
  sms_required: boolean
  sms_images: string | null
  sms_style: string | null
  sms_personalisation: string | null
  site_locked: string | null
  additional_notes: string | null
}

export interface WebsiteRevampRequest extends FormSubmission {
  email: string
  media_buyer_name: string
  home_page: string | null
  collection_page: string | null
  product_pages: string | null
  size_chart: string | null
  bundles: string | null
  description: string | null
  reviews: string | null
  policies: string | null
  backend: string | null
  track_order: string | null
  about_us: string | null
  additional_notes: string | null
}

export interface CreateDayDropRequestPayload {
  brand_name: string
  discord_username: string
  drop_name: string
  collection_name: string
  drop_date: string
  timezone_and_time: string
  offers: string
  link_to_products: string
  sms_required: boolean
  sms_images?: string
  sms_style?: string
  sms_personalisation?: string
  site_locked?: string
  additional_notes?: string
}

export interface CreateWebsiteRevampRequestPayload {
  email: string
  brand_name: string
  media_buyer_name: string
  home_page?: string
  collection_page?: string
  product_pages?: string
  size_chart?: string
  bundles?: string
  description?: string
  reviews?: string
  policies?: string
  backend?: string
  track_order?: string
  about_us?: string
  additional_notes?: string
}
