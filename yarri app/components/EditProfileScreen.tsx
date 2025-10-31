import { User, Plus, X } from 'lucide-react'
import { useState, useEffect } from 'react'
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
      setProfilePic(userData.profilePic || '')
      setImages(userData.gallery || [])
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

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center p-4 pt-8">
        <button onClick={onBack} className="mr-3">
          <span className="text-2xl text-black">←</span>
        </button>
      </div>

      {/* Title */}
      <div className="px-4 pb-6">
        <h1 className="text-3xl font-bold text-black">{t.editProfile}</h1>
      </div>

      {/* Profile Picture Section */}
      <div className="flex items-center px-4 mb-8">
        <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden mr-4">
          {profilePic ? (
            <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User size={48} className="text-gray-500" />
          )}
        </div>
        <input
          type="file"
          id="profilePic"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              // Remove size limit - allow any size
              const reader = new FileReader()
              reader.onloadend = () => {
                setProfilePic(reader.result as string)
              }
              reader.onerror = () => {
                alert('Error reading profile picture. Please try again.')
              }
              reader.readAsDataURL(file)
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
          className="w-full p-4 border border-gray-300 rounded-full text-base focus:outline-none focus:border-primary bg-gray-50"
          style={{ fontSize: '16px' }}
        />
        
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email Address"
          className="w-full p-4 border border-gray-300 rounded-full text-base focus:outline-none focus:border-primary bg-gray-50"
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
                <img src={img} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                <button 
                  onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                >
                  <X size={14} className="text-white" />
                </button>
              </div>
            ))}
            <input
              type="file"
              id="galleryPic"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || [])
                if (files.length > 0) {
                  // Process multiple files without size limits
                  const newImages: string[] = []
                  let processedCount = 0
                  
                  files.forEach((file, index) => {
                    const reader = new FileReader()
                    reader.onloadend = () => {
                      newImages[index] = reader.result as string
                      processedCount++
                      
                      // When all files are processed, update state
                      if (processedCount === files.length) {
                        setImages([...images, ...newImages.filter(img => img)])
                      }
                    }
                    reader.onerror = () => {
                      console.warn(`Error reading file: ${file.name}`)
                      processedCount++
                      
                      // Continue processing even if one file fails
                      if (processedCount === files.length) {
                        setImages([...images, ...newImages.filter(img => img)])
                      }
                    }
                    reader.readAsDataURL(file)
                  })
                  
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
              
              const payload = {
                name: userName,
                phone: phoneNumber,
                email: email,
                about: aboutMe,
                hobbies,
                profilePic,
                gallery: images,
              }
              
              console.log('Saving profile:', payload)
              
              const res = await fetch(`https://acsgroup.cloud/api/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              })
              
              const result = await res.json()
              console.log('Save response:', result)
              
              if (res.ok) {
                const updatedUser = { ...user, name: userName, phone: phoneNumber, email: email, about: aboutMe, hobbies, profilePic, gallery: images }
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
                alert('Profile saved to database successfully!')
                
                // Use immediate navigation to prevent UI freeze
                setTimeout(() => {
                  window.location.href = '/users'
                }, 0)
              } else {
                trackEvent('ProfileSaveFailed', { error: result.error || 'Unknown error' })
                alert('Failed to save profile: ' + (result.error || 'Unknown error'))
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