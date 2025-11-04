'use client'
import { useState, useEffect, useRef } from 'react'

interface Ad {
  _id: string
  title: string
  description: string
  imageUrl: string
  videoUrl?: string
  mediaType: 'photo' | 'video'
  linkUrl: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function AdBanner() {
  const [ads, setAds] = useState<Ad[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const touchStartX = useRef<number>(0)
  const touchEndX = useRef<number>(0)
  const autoProgressTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchAds()
  }, [])

  useEffect(() => {
    if (ads.length > 1) {
      const currentAd = ads[currentIndex]
      
      if (currentAd?.mediaType === 'photo') {
        // For photos, auto-progress after 5 seconds
        autoProgressTimer.current = setTimeout(() => {
          setCurrentIndex((prevIndex) => (prevIndex + 1) % ads.length)
        }, 5000)
      }
      // For videos, we'll handle progression when video ends
    }

    return () => {
      if (autoProgressTimer.current) {
        clearTimeout(autoProgressTimer.current)
      }
    }
  }, [ads.length, currentIndex])

  const fetchAds = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ads`)
      const data = await response.json()
      if (data.success && data.ads.length > 0) {
        // Filter only active ads and process URLs
        const processedAds = data.ads
          .filter((ad: Ad) => ad.isActive)
          .map((ad: Ad) => ({
            ...ad,
            imageUrl: ad.imageUrl && ad.imageUrl.startsWith('/uploads/') 
              ? `https://admin.yaari.me${ad.imageUrl}` 
              : ad.imageUrl,
            videoUrl: ad.videoUrl && ad.videoUrl.startsWith('/uploads/') 
              ? `https://admin.yaari.me${ad.videoUrl}` 
              : ad.videoUrl
          }))
        setAds(processedAds)
      }
    } catch (error) {
      console.error('Error fetching ads:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdClick = (ad: Ad) => {
    if (ad.linkUrl) {
      window.open(ad.linkUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const goToPrevious = () => {
    if (autoProgressTimer.current) {
      clearTimeout(autoProgressTimer.current)
    }
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? ads.length - 1 : prevIndex - 1
    )
  }

  const goToNext = () => {
    if (autoProgressTimer.current) {
      clearTimeout(autoProgressTimer.current)
    }
    setCurrentIndex((prevIndex) => (prevIndex + 1) % ads.length)
  }

  const handleVideoEnded = () => {
    if (ads.length > 1) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % ads.length)
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX
  }

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return
    
    const distance = touchStartX.current - touchEndX.current
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe && ads.length > 1) {
      goToNext()
    }
    if (isRightSwipe && ads.length > 1) {
      goToPrevious()
    }
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl h-40 mb-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (ads.length === 0) {
    return (
      <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl h-40 mb-4 flex items-center justify-center">
        <div className="text-center text-orange-700">
          <p className="text-lg font-medium">No ads available</p>
          <p className="text-sm opacity-75">Check back later for updates</p>
        </div>
      </div>
    )
  }

  const currentAd = ads[currentIndex]

  return (
    <div 
      className="relative rounded-2xl h-40 mb-4 overflow-hidden group"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Ad Media (Photo or Video) */}
      <div 
        className="w-full h-full cursor-pointer"
        onClick={() => handleAdClick(currentAd)}
      >
        {currentAd.mediaType === 'photo' ? (
          <img
            src={currentAd.imageUrl}
            alt={currentAd.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Show fallback background if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = document.createElement('div');
              fallback.className = 'w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold';
              fallback.innerHTML = `<div class="text-center"><p>Image not available</p><p class="text-sm opacity-75">${currentAd.title}</p></div>`;
              target.parentNode?.appendChild(fallback);
            }}
          />
        ) : (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            src={currentAd.videoUrl}
            autoPlay
            muted
            playsInline
            onEnded={handleVideoEnded}
            onError={(e) => {
              // Fallback to a gradient background if video fails to load
              const target = e.target as HTMLVideoElement;
              target.style.display = 'none';
              const fallback = document.createElement('div');
              fallback.className = 'w-full h-full bg-gradient-to-br from-orange-400 to-orange-600';
              target.parentNode?.appendChild(fallback);
            }}
          />
        )}
        
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        
        {/* Ad Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-4 text-white">
          <h3 className="text-lg font-bold mb-1 drop-shadow-lg">
            {currentAd.title}
          </h3>
          {currentAd.description && (
            <p className="text-sm opacity-90 drop-shadow-lg line-clamp-2">
              {currentAd.description}
            </p>
          )}
        </div>
      </div>



      {/* Click indicator */}
      {currentAd.linkUrl && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs opacity-70">
          Click to open
        </div>
      )}
    </div>
  )
}