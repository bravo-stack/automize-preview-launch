import crypto from 'crypto'

const encryptionKey = process.env.ENCRYPTION_KEY as string

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16) // Generate a random initialization vector (IV)
  // @ts-ignore works prior
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(encryptionKey, 'hex'),
    iv,
  )
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted // Concatenate IV and encrypted text
}

export function decrypt(encryptedText: string): string {
  const [iv, encrypted] = encryptedText.split(':')
  // @ts-ignore works prior
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(encryptionKey, 'hex'),
    Buffer.from(iv, 'hex'),
  )
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}
