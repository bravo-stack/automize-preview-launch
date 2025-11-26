'use server'

import type {
  CreateDayDropRequestPayload,
  CreateWebsiteRevampRequestPayload,
  DayDropRequest,
  FormSubmission,
  SubmissionStatus,
  WebsiteRevampRequest,
} from '@/types/form-submissions'
import { createAdminClient } from '../db/admin'

export async function createDayDropRequest(
  payload: CreateDayDropRequestPayload,
): Promise<{ data: DayDropRequest | null; error: boolean }> {
  const db = createAdminClient()

  const { data: submission, error: submissionError } = await db
    .from('form_submissions')
    .insert({
      form_type: 'day_drop_request',
      brand_name: payload.brand_name,
      submitter_identifier: payload.discord_username,
    })
    .select()
    .single()

  if (submissionError || !submission) {
    console.error('Error creating form submission:', submissionError)
    return { data: null, error: true }
  }

  const { error: detailsError } = await db
    .from('day_drop_request_details')
    .insert({
      submission_id: submission.id,
      drop_name: payload.drop_name,
      collection_name: payload.collection_name,
      drop_date: payload.drop_date,
      timezone_and_time: payload.timezone_and_time,
      offers: payload.offers,
      link_to_products: payload.link_to_products,
      sms_required: payload.sms_required,
      sms_images: payload.sms_images,
      sms_style: payload.sms_style,
      sms_personalisation: payload.sms_personalisation,
      site_locked: payload.site_locked,
      additional_notes: payload.additional_notes,
    })

  if (detailsError) {
    console.error('Error creating day drop request details:', detailsError)
    await db.from('form_submissions').delete().eq('id', submission.id)
    return { data: null, error: true }
  }

  const { data, error } = await db
    .from('day_drop_requests')
    .select('*')
    .eq('id', submission.id)
    .single()

  if (error) {
    console.error('Error fetching created day drop request:', error)
    return { data: null, error: true }
  }

  return { data, error: false }
}

export async function createWebsiteRevampRequest(
  payload: CreateWebsiteRevampRequestPayload,
): Promise<{ data: WebsiteRevampRequest | null; error: boolean }> {
  const db = createAdminClient()

  const { data: submission, error: submissionError } = await db
    .from('form_submissions')
    .insert({
      form_type: 'website_revamp',
      brand_name: payload.brand_name,
      submitter_identifier: payload.email,
    })
    .select()
    .single()

  if (submissionError || !submission) {
    console.error('Error creating form submission:', submissionError)
    return { data: null, error: true }
  }

  const { error: detailsError } = await db
    .from('website_revamp_request_details')
    .insert({
      submission_id: submission.id,
      media_buyer_name: payload.media_buyer_name,
      home_page: payload.home_page,
      collection_page: payload.collection_page,
      product_pages: payload.product_pages,
      size_chart: payload.size_chart,
      bundles: payload.bundles,
      description: payload.description,
      reviews: payload.reviews,
      policies: payload.policies,
      backend: payload.backend,
      track_order: payload.track_order,
      about_us: payload.about_us,
      additional_notes: payload.additional_notes,
    })

  if (detailsError) {
    console.error(
      'Error creating website revamp request details:',
      detailsError,
    )
    await db.from('form_submissions').delete().eq('id', submission.id)
    return { data: null, error: true }
  }

  const { data, error } = await db
    .from('website_revamp_requests')
    .select('*')
    .eq('id', submission.id)
    .single()

  if (error) {
    console.error('Error fetching created website revamp request:', error)
    return { data: null, error: true }
  }

  return { data, error: false }
}

export async function getDayDropRequests(filters?: {
  brand_name?: string
  status?: SubmissionStatus
  from_date?: string
  to_date?: string
  client_id?: number
}): Promise<{ data: DayDropRequest[]; error: boolean }> {
  const db = createAdminClient()

  let query = db
    .from('day_drop_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.brand_name) {
    query = query.ilike('brand_name', `%${filters.brand_name}%`)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.from_date) {
    query = query.gte('created_at', filters.from_date)
  }
  if (filters?.to_date) {
    query = query.lte('created_at', filters.to_date)
  }
  if (filters?.client_id) {
    query = query.eq('client_id', filters.client_id)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching day drop requests:', error)
    return { data: [], error: true }
  }

  return { data: data || [], error: false }
}

export async function getWebsiteRevampRequests(filters?: {
  brand_name?: string
  media_buyer_name?: string
  status?: SubmissionStatus
  from_date?: string
  to_date?: string
  client_id?: number
}): Promise<{ data: WebsiteRevampRequest[]; error: boolean }> {
  const db = createAdminClient()

  let query = db
    .from('website_revamp_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.brand_name) {
    query = query.ilike('brand_name', `%${filters.brand_name}%`)
  }
  if (filters?.media_buyer_name) {
    query = query.ilike('media_buyer_name', `%${filters.media_buyer_name}%`)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.from_date) {
    query = query.gte('created_at', filters.from_date)
  }
  if (filters?.to_date) {
    query = query.lte('created_at', filters.to_date)
  }
  if (filters?.client_id) {
    query = query.eq('client_id', filters.client_id)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching website revamp requests:', error)
    return { data: [], error: true }
  }

  return { data: data || [], error: false }
}

export async function updateSubmissionStatus(
  id: string,
  status: SubmissionStatus,
  processed_by?: string,
  internal_notes?: string,
): Promise<{ error: boolean }> {
  const db = createAdminClient()

  const updateData: Record<string, unknown> = { status }

  if (status === 'completed' || status === 'cancelled') {
    updateData.processed_at = new Date().toISOString()
  }
  if (processed_by) {
    updateData.processed_by = processed_by
  }
  if (internal_notes) {
    updateData.internal_notes = internal_notes
  }

  const { error } = await db
    .from('form_submissions')
    .update(updateData)
    .eq('id', id)

  if (error) {
    console.error('Error updating submission status:', error)
    return { error: true }
  }

  return { error: false }
}

export async function getFormSubmissions(filters?: {
  form_type?: string
  brand_name?: string
  status?: SubmissionStatus
  from_date?: string
  to_date?: string
  client_id?: number
}): Promise<{ data: FormSubmission[]; error: boolean }> {
  const db = createAdminClient()

  let query = db
    .from('form_submissions')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.form_type) {
    query = query.eq('form_type', filters.form_type)
  }
  if (filters?.brand_name) {
    query = query.ilike('brand_name', `%${filters.brand_name}%`)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.from_date) {
    query = query.gte('created_at', filters.from_date)
  }
  if (filters?.to_date) {
    query = query.lte('created_at', filters.to_date)
  }
  if (filters?.client_id) {
    query = query.eq('client_id', filters.client_id)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching form submissions:', error)
    return { data: [], error: true }
  }

  return { data: data || [], error: false }
}
