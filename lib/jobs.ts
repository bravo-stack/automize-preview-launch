'use server'

import { createClient } from './db/server'

export async function createJob(jobData) {
  const { job } = jobData
  const { channelName, message } = JSON.parse(job.extendedData.body)

  try {
    const res = await fetch('https://api.cron-job.org/jobs', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer n4mS6HyELzWXFtyR5qIAqCUuaL4PHvVaA/HUQ44Jz90=`,
      },
      body: JSON.stringify(jobData),
    })

    if (!res.ok) throw new Error('Failed to save the job')
    const { jobId } = await res.json()

    const db = createClient()
    await db.from('job').insert({ jobId, channel_name: channelName, message })

    return true
  } catch (error) {
    console.error('Error saving job:', error)
    return false
  }
}

export async function updateJob(jobData, id) {
  const { job } = jobData
  const { channelName, message } = JSON.parse(job.extendedData.body)

  try {
    const res = await fetch(`https://api.cron-job.org/jobs/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer n4mS6HyELzWXFtyR5qIAqCUuaL4PHvVaA/HUQ44Jz90=`,
      },
      body: JSON.stringify(jobData),
    })

    if (!res.ok) throw new Error('Failed to save the job')

    const db = createClient()
    await db
      .from('job')
      .update({ channel_name: channelName, message })
      .eq('jobId', id)

    return true
  } catch (error) {
    console.error('Error saving job:', error)
    return false
  }
}

export async function deleteJob(id) {
  try {
    const res = await fetch(`https://api.cron-job.org/jobs/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer n4mS6HyELzWXFtyR5qIAqCUuaL4PHvVaA/HUQ44Jz90=`,
      },
    })

    if (!res.ok) throw new Error('Failed to save the job')
    const db = createClient()
    await db.from('job').delete().eq('jobId', id)

    return true
  } catch (error) {
    console.error('Error saving job:', error)
    return false
  }
}
