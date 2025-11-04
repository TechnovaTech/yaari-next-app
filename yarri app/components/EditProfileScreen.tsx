import { User, Plus, X, ChevronLeft } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../utils/translations'
import { trackScreenView, trackEvent, updateUserProfile } from '../utils/clevertap'

interface EditProfileScreenProps {
  onBack: () => void
}

export default function EditProfileScreen({ onBack }: EditProfileScreenProps) {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [userName, setUserName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [aboutMe, setAboutMe] = useState('')
  const [hobbies, setHobbies] = useState<string[]>([])
  const [newHobby, setNewHobby] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [gender, setGender] = useState('')
  const [profilePic, setProfilePic] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi'>('en')

  // Build API URL that avoids CORS in local dev; force remote on native
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://admin.yaari.me'
  const buildApiUrl = (path: string) => {
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    const isNative = Capacitor.isNativePlatform()
    return (!isLocal || isNative) ? `${API_BASE}/api${path}` : `/api${path}`
  }

  // Add function to fetch user images from database
  const fetchUserImages = async (userId: string) => {
    try {
      const response = await fetch(buildApiUrl(`/users/${userId}/images`))
      if (response.ok) {
        const result = await response.json()
        
        // Fix localhost and 0.0.0.0 URLs
        let profilePic = result.profilePic || ''
        if (profilePic) {
          profilePic = profilePic.replace(/https?:\/\/(0\.0\.0\.0|localhost):\d+/g, 'https://admin.yaari.me')
        }
        
        const gallery = (result.gallery || [])
          .map((url: string) => 
            (url || '').replace(/https?:\/\/(0\.0\.0\.0|localhost):\d+/g, 'https://admin.yaari.me')
          )
          .filter((url: string) => !!url && url.trim().length > 0)
        
        return {
          profilePic,
          gallery
        }
      } else {
        console.error('Failed to fetch user images:', response.status, response.statusText)
        return { profilePic: '', gallery: [] }
      }
    } catch (error) {
      console.error('Error fetching user images:', error)
      return { profilePic: '', gallery: [] }
    }
  }

  useEffect(() => {
    trackScreenView('Edit Profile')
    const user = localStorage.getItem('user')
    if (user) {
      const userData = JSON.parse(user)
      setUserName(userData.name || '')
      setPhoneNumber(userData.phone || '')
      setEmail(userData.email || '')
      setAboutMe(userData.about || '')
      setHobbies(userData.hobbies || [])
      setGender(userData.gender || '')
      setSelectedLanguage(userData.language || 'en')
      
      // Load images from database instead of localStorage
      if (userData.id) {
        fetchUserImages(userData.id).then(imageData => {
          setProfilePic(imageData.profilePic)
          setImages(imageData.gallery)
        })
      } else {
        // Fallback to localStorage if no user ID
        setProfilePic(userData.profilePic || '')
        setImages(userData.gallery || [])
      }
    }
  }, [])

  const addHobby = () => {
    if (newHobby.trim()) {
      setHobbies([...hobbies, newHobby.trim()])
      setNewHobby('')
    }
  }

  const removeHobby = (index: number) => {
    setHobbies(hobbies.filter((_, i) => i !== index))
  }

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height
          const maxSize = 1200
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          } else if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')!
          ctx.drawImage(img, 0, 0, width, height)
          canvas.toBlob((blob) => {
            resolve(new File([blob!], file.name, { type: 'image/jpeg' }))
          }, 'image/jpeg', 0.8)
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    })
  }

  // Add photo upload functions
  const uploadPhotoToDatabase = async (file: File, isProfilePic: boolean = false): Promise<string | null> => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}')
      const userId = userData?.id
      if (!userId) {
        console.error('User ID missing while uploading photo:', userData)
        alert('User session invalid. Please log in again.')
        return null
      }

      const compressedFile = await compressImage(file)
      const formData = new FormData()
      formData.append('photo', compressedFile)
      formData.append('userId', String(userId))
      formData.append('isProfilePic', isProfilePic.toString())

      const response = await fetch(buildApiUrl('/upload-photo'), {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        const photoUrl = result.photoUrl?.replace(/https?:\/\/(0\.0\.0\.0|localhost):\d+/g, 'https://admin.yaari.me') || result.photoUrl
        return photoUrl
      } else {
        console.error('Photo upload failed:', response.status, response.statusText)
        return null
      }
    } catch (error) {
      console.error('Error uploading photo:', error)
      return null
    }
  }

  const uploadMultiplePhotos = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(file => uploadPhotoToDatabase(file, false))
    const results = await Promise.all(uploadPromises)
    return results.filter(url => url !== null) as string[]
  }

  const deletePhotoFromDatabase = async (photoUrl: string): Promise<boolean> => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const normalizedUrl = (photoUrl || '').replace(/https?:\/\/(0\.0\.0\.0|localhost):\d+/g, API_BASE)
      console.log('Sending delete request:', { userId: user.id, photoUrl, normalizedUrl })
      
      const response = await fetch(buildApiUrl('/delete-photo'), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          photoUrl: photoUrl,
          normalizedPhotoUrl: normalizedUrl
        }),
      })

      const result = await response.json()
      console.log('Delete API response:', result)

      if (response.ok) {
        console.log('Refreshing gallery from server...')
        if (user?.id) {
          const imageData = await fetchUserImages(String(user.id))
          console.log('New gallery data:', imageData.gallery)
          setImages(imageData.gallery)
        }
        return true
      } else {
        console.error('Photo deletion failed:', response.status, result)
        return false
      }
    } catch (error) {
      console.error('Error deleting photo:', error)
      return false
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-8">
        <button onClick={onBack}>
          <ChevronLeft size={24} className="text-gray-800" />
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedLanguage('en')}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              selectedLanguage === 'en'
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setSelectedLanguage('hi')}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              selectedLanguage === 'hi'
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            HI
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="px-4 pb-6">
        <h1 className="text-3xl font-bold text-black">{t.editProfile}</h1>
      </div>

      {/* Profile Picture Section */}
      <div className="flex items-center gap-4 px-4 mb-8">
        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
          {profilePic && profilePic !== 'loading' ? (
            <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
          ) : profilePic === 'loading' ? (
            <div className="text-gray-500 text-xs">Uploading...</div>
          ) : (
            <User size={48} className="text-gray-500" />
          )}
        </div>
        <input
          type="file"
          id="profilePic"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (file) {
              // Show loading state
              setProfilePic('loading')
              
              try {
                const photoUrl = await uploadPhotoToDatabase(file, true)
                if (photoUrl) {
                  setProfilePic(photoUrl)
                  alert('Profile picture uploaded successfully!')
                } else {
                  alert('Failed to upload profile picture. Please try again.')
                  setProfilePic('') // Reset on failure
                }
              } catch (error) {
                console.error('Profile picture upload error:', error)
                alert('Error uploading profile picture. Please try again.')
                setProfilePic('') // Reset on failure
              }
            }
          }}
        />
        <label htmlFor="profilePic" className="px-6 py-3 border-2 border-primary text-primary rounded-full font-semibold cursor-pointer flex items-center justify-center">
          {t.uploadPicture}
        </label>
      </div>

      {/* Gender Display */}
      <div className="px-4 mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
        <div className="w-full p-4 border border-gray-300 rounded-full text-base bg-gray-100 text-gray-700 capitalize">
          {gender || 'Not set'}
        </div>
      </div>

      {/* Form Fields */}
      <div className="px-4 space-y-6 pb-24">
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="User Name"
          className="w-full p-4 border border-gray-300 rounded-full text-base focus:outline-none focus:border-primary bg-gray-50"
          style={{ fontSize: '16px' }}
        />
        
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Phone Number"
          disabled={!!phoneNumber}
          className="w-full p-4 border border-gray-300 rounded-full text-base focus:outline-none focus:border-primary bg-gray-50 disabled:bg-gray-200 disabled:cursor-not-allowed"
          style={{ fontSize: '16px' }}
        />
        
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email Address"
          disabled={!!email}
          className="w-full p-4 border border-gray-300 rounded-full text-base focus:outline-none focus:border-primary bg-gray-50 disabled:bg-gray-200 disabled:cursor-not-allowed"
          style={{ fontSize: '16px' }}
        />

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">{t.aboutMe}</label>
          <textarea
            value={aboutMe}
            onChange={(e) => setAboutMe(e.target.value)}
            placeholder="Tell us about yourself..."
            rows={4}
            className="w-full p-4 border border-gray-300 rounded-2xl text-base focus:outline-none focus:border-primary bg-gray-50 resize-none"
            style={{ fontSize: '16px' }}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">{t.photoGallery}</label>
          <div className="grid grid-cols-3 gap-2">
            {images.map((img, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-lg relative overflow-hidden">
                {img === 'loading' ? (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                    Uploading...
                  </div>
                ) : (
                  <>
                    <img 
                      src={img} 
                      alt="" 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        console.error('Failed to load image:', img)
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    <button 
                      onClick={async () => {
                        console.log('Deleting photo:', img)
                        const photoUrl = img
                        setImages(prev => prev.filter((_, idx) => idx !== i))
                        const deleted = await deletePhotoFromDatabase(photoUrl)
                        console.log('Delete result:', deleted)
                        if (!deleted) {
                          setImages(prevImages => [...prevImages, photoUrl])
                          alert('Failed to delete photo from database. Please try again.')
                        }
                      }}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center z-10"
                    >
                      <X size={14} className="text-white" />
                    </button>
                  </>
                )}
              </div>
            ))}
            <input
              type="file"
              id="galleryPic"
              accept="image/*"
              multiple
              className="hidden"
              onChange={async (e) => {
                const files = Array.from(e.target.files || [])
                if (files.length > 0) {
                  try {
                    // Show loading state
                    const loadingImages = Array(files.length).fill('loading')
                    setImages([...images, ...loadingImages])
                    
                    const uploadedUrls = await uploadMultiplePhotos(files)
                    
                    // Remove loading placeholders and add actual URLs
                    setImages(prevImages => {
                      const withoutLoading = prevImages.filter(img => img !== 'loading')
                      return [...withoutLoading, ...uploadedUrls]
                    })
                    
                    if (uploadedUrls.length > 0) {
                      alert(`${uploadedUrls.length} photo(s) uploaded successfully!`)
                    } else {
                      alert('Failed to upload photos. Please try again.')
                    }
                  } catch (error) {
                    console.error('Gallery photos upload error:', error)
                    alert('Error uploading photos. Please try again.')
                    // Remove loading placeholders on error
                    setImages(prevImages => prevImages.filter(img => img !== 'loading'))
                  }
                  
                  // Reset the input to allow selecting the same files again
                  e.target.value = ''
                }
              }}
            />
            <label htmlFor="galleryPic" className="aspect-square bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer">
              <Plus size={24} className="text-gray-400" />
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">{t.hobbies}</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {hobbies.map((hobby, i) => (
              <span key={i} className="bg-orange-50 text-gray-800 px-4 py-2 rounded-full text-sm border border-gray-200 flex items-center gap-2">
                {hobby}
                <button onClick={() => removeHobby(i)}>
                  <X size={14} className="text-gray-600" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newHobby}
              onChange={(e) => setNewHobby(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addHobby()}
              placeholder="Add a hobby"
              className="flex-1 p-3 border border-gray-300 rounded-full text-sm focus:outline-none focus:border-primary bg-gray-50"
              style={{ fontSize: '16px' }}
            />
            <button onClick={addHobby} className="px-4 py-3 bg-primary text-white rounded-full font-semibold text-sm whitespace-nowrap flex items-center justify-center">
              {t.add}
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="fixed bottom-8 left-4 right-4">
        <button 
          onClick={async () => {
            if (!userName.trim()) {
              alert('Please enter your name')
              return
            }
            
            setLoading(true)
            trackEvent('ProfileSaveAttempt')
            try {
              const user = JSON.parse(localStorage.getItem('user') || '{}')
              
              // Validate user ID exists
              if (!user.id) {
                console.error('User ID not found in localStorage:', user)
                alert('User session invalid. Please log in again.')
                return
              }
              
              const payload = {
                name: userName,
                phone: phoneNumber,
                email: email,
                about: aboutMe,
                hobbies,
                language: selectedLanguage,
                // Remove image data from payload since photos are uploaded separately
                // profilePic and gallery images are now stored as URLs in the database
              }
              
              console.log('Saving profile for user ID:', user.id)
              console.log('Payload:', payload)

              const res = await fetch(buildApiUrl(`/users/${user.id}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              })
              
              console.log('API Response Status:', res.status, res.statusText)
              
              let result
              try {
                result = await res.json()
                console.log('Save response:', result)
              } catch (parseError) {
                console.error('Failed to parse response JSON:', parseError)
                result = { error: 'Invalid server response' }
              }
              
              if (res.ok) {
                const updatedUser = { ...user, name: userName, phone: phoneNumber, email: email, about: aboutMe, hobbies, language: selectedLanguage, profilePic, gallery: images }
                localStorage.setItem('user', JSON.stringify(updatedUser))
                
                // Make CleverTap calls non-blocking to prevent UI freeze
                updateUserProfile({
                  Name: userName,
                  Email: email,
                  Phone: phoneNumber,
                  Gender: gender,
                  'About': aboutMe,
                  'Hobbies': hobbies.join(', '),
                  'Profile Picture': profilePic,
                }).catch(error => {
                  console.warn('CleverTap profile update failed:', error)
                })
                
                trackEvent('ProfileSaved')
                alert('Profile saved successfully!')
                
                // Use immediate navigation to prevent UI freeze
                setTimeout(() => {
                  window.location.href = '/users'
                }, 0)
              } else {
                const errorMsg = result?.error || result?.message || `HTTP ${res.status}: ${res.statusText}`
                console.error('API Error:', errorMsg, 'Full response:', result)
                trackEvent('ProfileSaveFailed', { error: errorMsg, status: res.status })
                alert(`Failed to save profile: ${errorMsg}`)
              }
            } catch (error: any) {
               console.error('Profile save error:', error)
               trackEvent('ProfileSaveError', { error: error?.message || 'Unknown error' })
               
               // Provide more specific error messages
               const errorMessage = error?.message || error?.toString() || ''
               if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
                 alert('Network error. Please check your internet connection and try again.')
               } else if (errorMessage.includes('413') || errorMessage.includes('Payload Too Large')) {
                 alert('Photos are too large. Please try with smaller images or fewer photos.')
               } else if (errorMessage.includes('timeout')) {
                 alert('Upload timeout. Please try with fewer or smaller photos.')
               } else {
                 alert('Error saving profile. Please try again.')
               }
            } finally {
              setLoading(false)
            }
          }}
          disabled={loading}
          className="w-full bg-primary text-white py-4 rounded-full font-semibold text-lg disabled:opacity-50 flex items-center justify-center"
        >
          {loading ? 'Saving...' : t.saveChanges}
        </button>
      </div>
    </div>
  )
}