'use client'
interface CallStatsProps {
  userName: string
  duration: number
  cost: number
  remainingBalance: number | null
  rate: number
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export default function CallStats({ userName, duration, cost, remainingBalance, rate }: CallStatsProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <h2 className="text-3xl font-bold text-white mb-4">{userName}</h2>
      <p className="text-2xl text-white mb-2">{formatTime(duration)}</p>
      <p className="text-lg text-white/80">₹{cost}</p>
      {remainingBalance !== null && remainingBalance <= rate && (
        <div className="mt-4 bg-red-500/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 animate-pulse">
          <img src="/images/coinicon.png" alt="coin" className="w-4 h-4 object-contain" />
          <span className="text-white font-semibold mt-2.5">{remainingBalance} coins left</span>
        </div>
      )}
    </div>
  )
}