import { api } from '@/api/client'
import { BASE_URL } from '@/constants/endpoints'

export const uploadImageToStorage = async (file) => {
  const contentType = file.type || 'application/octet-stream'

  try {
    const presignResponse = await api.post(`${BASE_URL}/uploads/presign`, {
      filename: file.name,
      content_type: contentType,
    })

    const { url, key } = presignResponse.data

    const uploadResponse = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      body: file,
    })

    if (!uploadResponse.ok) {
      throw new Error('Image upload failed')
    }

    const confirmResponse = await api.post(`${BASE_URL}/uploads/confirm`, {
      key,
      filename: file.name,
      content_type: contentType,
    })

    return {
      url: confirmResponse.data.file.url,
      storage_key: confirmResponse.data.file.key,
    }
  } catch (error) {
    const formData = new FormData()
    formData.append('file', file)

    const token = localStorage.getItem('token')
    const uploadResponse = await fetch(`${BASE_URL}/uploads`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })

    if (!uploadResponse.ok) {
      let message = 'Image upload failed'
      try {
        const errorData = await uploadResponse.json()
        message = errorData.error || errorData.errors?.[0] || message
      } catch {
        message = error.message || message
      }
      throw new Error(message)
    }

    const data = await uploadResponse.json()

    return {
      url: data.file.url,
      storage_key: data.file.key,
    }
  }
}

export const deleteUploadedImage = async (storageKey) => {
  if (!storageKey) return

  await api.delete(`${BASE_URL}/uploads`, {
    data: { key: storageKey },
  })
}
