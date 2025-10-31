'use client'
import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react'

interface Ad {
  _id: string
  title: string
  description: string
  mediaType: 'photo' | 'video'
  imageUrl: string
  videoUrl: string
  linkUrl: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function ManageAdsPage() {
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAd, setEditingAd] = useState<Ad | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    mediaType: 'photo' as 'photo' | 'video',
    imageUrl: '',
    videoUrl: '',
    linkUrl: '',
    isActive: true
  })
  const [uploadMethod, setUploadMethod] = useState<'url' | 'upload'>('url')
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  useEffect(() => {
    fetchAds()
  }, [])

  const fetchAds = async () => {
    try {
      const response = await fetch('/api/ads')
      const data = await response.json()
      if (data.success) {
        setAds(data.ads)
      }
    } catch (error) {
      console.error('Error fetching ads:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validate required fields based on media type
    if (formData.mediaType === 'photo' && !formData.imageUrl) {
      alert('Please provide an image URL or upload an image file')
      setLoading(false)
      return
    }
    
    if (formData.mediaType === 'video' && !formData.videoUrl) {
      alert('Please provide a video URL or upload a video file')
      setLoading(false)
      return
    }

    try {
      const url = '/api/ads'
      const method = editingAd ? 'PUT' : 'POST'
      const body = editingAd 
        ? { id: editingAd._id, ...formData }
        : formData

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (data.success) {
        await fetchAds()
        setShowModal(false)
        setFormData({
          title: '',
          description: '',
          mediaType: 'photo',
          imageUrl: '',
          videoUrl: '',
          linkUrl: '',
          isActive: true
        })
        setEditingAd(null)
      } else {
        alert(data.message || 'Failed to save ad')
      }
    } catch (error) {
      console.error('Error saving ad:', error)
      alert('Failed to save ad')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (ad: Ad) => {
    setEditingAd(ad)
    setFormData({
      title: ad.title,
      description: ad.description,
      mediaType: ad.mediaType || 'photo',
      imageUrl: ad.imageUrl || '',
      videoUrl: ad.videoUrl || '',
      linkUrl: ad.linkUrl,
      isActive: ad.isActive
    })
    // Set upload method to 'url' since existing ads have URLs
    setUploadMethod('url')
    setUploadedFile(null)
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ad?')) return

    try {
      const response = await fetch(`/api/ads?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (data.success) {
        await fetchAds()
      } else {
        alert(data.error || 'Failed to delete ad')
      }
    } catch (error) {
      console.error('Error deleting ad:', error)
      alert('Failed to delete ad')
    }
  }

  const toggleActive = async (ad: Ad) => {
    try {
      const requestBody: any = {
        id: ad._id,
        title: ad.title,
        description: ad.description,
        mediaType: ad.mediaType || 'photo',
        linkUrl: ad.linkUrl,
        isActive: !ad.isActive
      }

      // Only include the appropriate URL based on media type
      if (ad.mediaType === 'video') {
        requestBody.videoUrl = ad.videoUrl || ''
      } else {
        requestBody.imageUrl = ad.imageUrl || ''
      }

      const response = await fetch('/api/ads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()
      if (data.success) {
        await fetchAds()
      } else {
        alert(data.error || 'Failed to update ad')
      }
    } catch (error) {
      console.error('Error updating ad:', error)
      alert('Failed to update ad')
    }
  }

  const handleFileUpload = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (data.success) {
        // Update the appropriate URL field based on media type
        if (file.type.startsWith('image/')) {
          setFormData(prev => ({ ...prev, imageUrl: data.url }))
        } else if (file.type.startsWith('video/')) {
          setFormData(prev => ({ ...prev, videoUrl: data.url }))
        }
        setUploadedFile(file)
        return data.url
      } else {
        alert(data.error || 'Failed to upload file')
        return null
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Failed to upload file')
      return null
    } finally {
      setUploading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      mediaType: 'photo',
      imageUrl: '',
      videoUrl: '',
      linkUrl: '',
      isActive: true
    })
    setEditingAd(null)
    setUploadMethod('url')
    setUploadedFile(null)
  }

  const handleAddNew = () => {
    resetForm()
    setShowModal(true)
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Manage Ads</h1>
          <p className="text-gray-600 mt-2">Create and manage ad banners for the app</p>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-primary text-white px-6 py-3 rounded-xl flex items-center space-x-2 hover:bg-primary/90 transition"
        >
          <Plus size={20} />
          <span>Add New Ad</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Preview
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Title & Type
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No ads found. Create your first ad banner!
                  </td>
                </tr>
              ) : (
                ads.map((ad) => (
                  <tr key={ad._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="w-20 h-12 bg-gray-200 rounded-lg overflow-hidden relative">
                        {ad.mediaType === 'photo' ? (
                          <img
                            src={ad.imageUrl}
                            alt={ad.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA4MCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMiAyMEgzNlYyNEgzMlYyMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTI4IDI4SDUyVjMySDI4VjI4WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K'
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-blue-100">
                            <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{ad.title}</div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            ad.mediaType === 'photo' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {ad.mediaType === 'photo' ? 'Photo' : 'Video'}
                          </span>
                        </div>
                        {ad.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs mt-1">
                            {ad.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        ad.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {ad.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(ad.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleActive(ad)}
                          className={`p-2 rounded-lg transition ${
                            ad.isActive 
                              ? 'text-red-600 hover:bg-red-50' 
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={ad.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {ad.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          onClick={() => handleEdit(ad)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(ad._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                        {ad.linkUrl && (
                          <a
                            href={ad.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition"
                            title="Open Link"
                          >
                            <ExternalLink size={16} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingAd ? 'Edit Ad' : 'Create New Ad'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Media Type *
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="mediaType"
                      value="photo"
                      checked={formData.mediaType === 'photo'}
                      onChange={(e) => setFormData({ ...formData, mediaType: e.target.value as 'photo' | 'video' })}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Photo</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="mediaType"
                      value="video"
                      checked={formData.mediaType === 'video'}
                      onChange={(e) => setFormData({ ...formData, mediaType: e.target.value as 'photo' | 'video' })}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Video</span>
                  </label>
                </div>
              </div>

              {/* Upload Method Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.mediaType === 'photo' ? 'Image' : 'Video'} Source *
                </label>
                <div className="flex space-x-4 mb-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="uploadMethod"
                      value="url"
                      checked={uploadMethod === 'url'}
                      onChange={(e) => setUploadMethod(e.target.value as 'url' | 'upload')}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">URL</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="uploadMethod"
                      value="upload"
                      checked={uploadMethod === 'upload'}
                      onChange={(e) => setUploadMethod(e.target.value as 'url' | 'upload')}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Upload File</span>
                  </label>
                </div>

                {uploadMethod === 'url' ? (
                  <div>
                    <input
                      type="url"
                      value={formData.mediaType === 'photo' ? formData.imageUrl : formData.videoUrl}
                      onChange={(e) => {
                        if (formData.mediaType === 'photo') {
                          setFormData({ ...formData, imageUrl: e.target.value })
                        } else {
                          setFormData({ ...formData, videoUrl: e.target.value })
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder={formData.mediaType === 'photo' ? 'Enter image URL' : 'Enter video URL (YouTube, Vimeo, or direct)'}
                      required={uploadMethod === 'url'}
                    />
                    {formData.mediaType === 'video' && (
                      <p className="text-xs text-gray-500 mt-1">
                        Supports YouTube, Vimeo, or direct video file URLs
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept={formData.mediaType === 'photo' ? 'image/*' : 'video/*'}
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            await handleFileUpload(file)
                          }
                        }}
                        className="hidden"
                        id="file-upload"
                        disabled={uploading}
                      />
                      <label
                        htmlFor="file-upload"
                        className={`cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                          uploading ? 'bg-gray-400' : 'bg-primary hover:bg-primary-dark'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary`}
                      >
                        {uploading ? 'Uploading...' : `Choose ${formData.mediaType === 'photo' ? 'Image' : 'Video'}`}
                      </label>
                      {uploadedFile && (
                        <div className="mt-2 text-sm text-gray-600">
                          <p>✓ {uploadedFile.name}</p>
                          <p className="text-xs text-gray-500">
                            {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Max file size: 50MB. Supported formats: {formData.mediaType === 'photo' ? 'JPEG, PNG, GIF, WebP' : 'MP4, WebM, OGG, AVI, MOV'}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link URL
                </label>
                <input
                  type="url"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Active
                </label>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
                >
                  {editingAd ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}