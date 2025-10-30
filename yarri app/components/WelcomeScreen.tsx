interface WelcomeScreenProps {
  onNext: () => void
}

export default function WelcomeScreen({ onNext }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-300 via-orange-200 to-orange-300 flex flex-col items-center justify-center p-6">
      <div className="absolute top-8 left-6 right-6 flex justify-between items-start">
        <div className="flex flex-col space-y-2">
          <div className="w-12 h-10 bg-orange-300 rounded-xl opacity-80"></div>
          <div className="w-12 h-10 bg-orange-300 rounded-xl opacity-80"></div>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-red-400 rounded-full mb-2"></div>
        </div>
        <div className="flex flex-col space-y-2">
          <div className="w-12 h-10 bg-blue-300 rounded-xl opacity-80"></div>
          <div className="w-12 h-10 bg-blue-300 rounded-xl opacity-80"></div>
        </div>
      </div>

      <div className="flex justify-center items-center mb-8">
        <div className="w-48 h-48 relative">
          <div className="absolute left-0 w-24 h-32 bg-orange-800 rounded-t-full"></div>
          <div className="absolute right-0 w-24 h-32 bg-orange-900 rounded-t-full"></div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-lg max-w-sm w-full text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Yaari</h1>
          <p className="text-gray-600 text-sm">Connect with your phone</p>
        </div>
        
        <div className="mb-6">
          <input
            type="text"
            placeholder="Enter your Phone Number"
            className="w-full p-4 border border-gray-300 rounded-xl text-base focus:outline-none focus:border-primary text-center"
          />
        </div>
        
        <button 
          onClick={onNext}
          className="w-full bg-primary text-white py-4 rounded-xl font-semibold text-base mb-3"
        >
          Get OTP
        </button>
        
        <p className="text-xs text-gray-500">
          Terms & Condition
        </p>
      </div>
    </div>
  )
}