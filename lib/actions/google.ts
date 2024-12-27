'use server'

import { google } from 'googleapis'
import { revalidatePath } from 'next/cache'
import { authorizeDrive } from '../google'

export async function createClientDrive(email: string, folderName: string) {
  try {
    const auth = await authorizeDrive()
    const drive = google.drive({ version: 'v3', auth })

    // 1. Create the Folder (modified)
    const folderMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: ['16jZi8SEYruqcnWUn54NQ2NFyyNxBdmlN'], // id for IXM CLIENT ASSETS Folder
    }

    const folder = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id',
    })

    if (!folder.data.id) {
      throw new Error('Failed to create Drive folder.')
    }

    const folderId = folder.data.id

    // 2. Create a Permission (modified)
    const permission = {
      type: 'user',
      role: 'writer',
      emailAddress: email,
    }

    const options = {
      sendNotificationEmail: true,
      emailMessage: `Congratulations on onboarding to IXM! \nThis is a folder that we'll use to help your brand grow. We'll be in touch with more details shortly!`,
    }

    await drive.permissions.create({
      fileId: folderId,
      requestBody: permission,
      fields: 'id',
      ...options,
    })

    revalidatePath('/')
    return {
      success: true,
      folderId,
      message: `Folder created and shared with ${email} successfully.`,
    }
  } catch (error: any) {
    console.error('Error creating and sharing folder:', error)
    return {
      success: false,
      error: error.message || 'Failed to create and share folder.',
    }
  }
}
