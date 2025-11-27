'use client'
interface AvatarCircleProps {
  src: string
  alt: string
  className?: string
}

export default function AvatarCircle({ src, alt, className }: AvatarCircleProps) {
  return (
    <div className={`w-40 h-40 rounded-full overflow-hidden bg-white/20 mb-8 ${className || ''}`}>
      <img src={src} alt={alt} className="w-full h-full object-cover" />
    </div>
  )
}