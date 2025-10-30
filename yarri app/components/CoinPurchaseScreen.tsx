import { ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { trackEvent, trackScreenView, trackSubscription } from '@/utils/clevertap'

interface CoinPurchaseScreenProps {
  onBack: () => void
}

interface Plan {
  _id?: string
  title?: string
  coins: number
  price: number
  originalPrice?: number
  isActive?: boolean
}

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function CoinPurchaseScreen({ onBack }: CoinPurchaseScreenProps) {
  const [balance, setBalance] = useState(0)
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [coinsInput, setCoinsInput] = useState<string>('')
  const [coinsPerRupee, setCoinsPerRupee] = useState<number>(1)
  const [minRecharge, setMinRecharge] = useState<number | null>(null)
  const [maxRecharge, setMaxRecharge] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [useFallbackIcon, setUseFallbackIcon] = useState(false)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
  const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_RUT2Cmr6oeKa0b'

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (user) {
      const userData = JSON.parse(user)
      fetchBalance(userData.id)
    }
    loadSettings()
    loadPlans()
    
    // Track screen view
    trackScreenView('Coin Purchase')
  }, [])

  const loadSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/settings`)
      const data = await res.json()
      if (res.ok) {
        setCoinsPerRupee(data.coinsPerRupee || 1)
        setMinRecharge(data.minRecharge ?? null)
        setMaxRecharge(data.maxRecharge ?? null)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const loadPlans = async () => {
    try {
      const res = await fetch(`${API_URL}/api/plans`)
      const data = await res.json()
      if (res.ok) {
        const active = (data || [])
          .filter((p: Plan) => p.isActive !== false)
          .sort((a: Plan, b: Plan) => (a.price ?? 0) - (b.price ?? 0))
        setPlans(active)
      }
    } catch (error) {
      console.error('Error loading plans:', error)
    }
  }

  const fetchBalance = async (userId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/users/${userId}/balance`)
      const data = await res.json()
      if (res.ok) {
        setBalance(data.balance || 0)
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        user.balance = data.balance
        localStorage.setItem('user', JSON.stringify(user))
      }
    } catch (error) {
      console.error('Error fetching balance:', error)
    }
  }

  const rupeesForInput = (() => {
    const coins = Number(coinsInput)
    if (!coins || !coinsPerRupee) return 0
    return Number((coins / coinsPerRupee).toFixed(2))
  })()

  const minCoins = minRecharge && coinsPerRupee ? Math.ceil(minRecharge * coinsPerRupee) : undefined
  const maxCoins = maxRecharge && coinsPerRupee ? Math.floor(maxRecharge * coinsPerRupee) : undefined

  const isTopupInvalid = !selectedPlan && (
    (!!minRecharge && rupeesForInput > 0 && rupeesForInput < (minRecharge || 0)) ||
    (!!maxRecharge && rupeesForInput > (maxRecharge || Infinity))
  )

  const loadRazorpayScript = () => new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

  const proceedPayment = async () => {
    const user = localStorage.getItem('user')
    if (!user) {
      alert('Please login to continue')
      return
    }
    const userData = JSON.parse(user)

    let amountRupees = 0
    let type: 'plan' | 'topup' = 'topup'
    let planId: string | undefined
    let coinsRequested: number | undefined

    if (selectedPlan) {
      amountRupees = selectedPlan.price
      type = 'plan'
      planId = selectedPlan._id
    } else {
      const coins = Number(coinsInput)
      if (!coins || coins <= 0) {
        alert('Enter number of coins or select a plan')
        return
      }
      coinsRequested = coins
      amountRupees = rupeesForInput

      if (minRecharge !== null && amountRupees < minRecharge) {
        alert(`Minimum recharge is Rs ${minRecharge}`)
        return
      }
      if (maxRecharge !== null && amountRupees > maxRecharge) {
        alert(`Maximum recharge is Rs ${maxRecharge}`)
        return
      }
    }

    setLoading(true)
    try {
      const ok = await loadRazorpayScript()
      if (!ok) {
        alert('Failed to load Razorpay')
        return
      }

      const orderRes = await fetch(`${API_URL}/api/payments/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.id,
          amountRupees,
          type,
          planId,
          coins: coinsRequested,
        }),
      })
      const orderData = await orderRes.json()
      if (!orderRes.ok) {
        alert(orderData.error || 'Order creation failed')
        return
      }

      // Track payment initiation
      trackEvent('Payment Initiated', {
        'Amount': amountRupees,
        'Type': type,
        'Plan ID': planId || 'Custom',
        'Coins': selectedPlan ? selectedPlan.coins : coinsRequested,
        'Payment Method': 'Razorpay'
      })

      const options = {
        key: orderData.keyId || RAZORPAY_KEY_ID,
        amount: orderData.amountPaise,
        currency: orderData.currency || 'INR',
        name: 'Yaari',
        description: selectedPlan ? selectedPlan.title || 'Coin Plan' : `Top-up ${coinsRequested} coins`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch(`${API_URL}/api/payments/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              }),
            })
            const verifyData = await verifyRes.json()
            if (verifyRes.ok) {
              alert('Payment successful! Coins credited.')
              setBalance(verifyData.newBalance || balance)
              
              // Track successful payment
              trackEvent('Payment Successful', {
                'Amount': amountRupees,
                'Type': type,
                'Plan ID': planId || 'Custom',
                'Coins': selectedPlan ? selectedPlan.coins : coinsRequested,
                'Payment ID': response.razorpay_payment_id,
                'Order ID': response.razorpay_order_id
              })
              
              // Track subscription if it's a plan purchase
              if (selectedPlan && planId) {
                trackSubscription(selectedPlan.title || 'Coin Plan', amountRupees, 'INR')
              }
            } else {
              alert(verifyData.error || 'Payment verification failed')
              
              // Track payment failure
              trackEvent('Payment Failed', {
                'Amount': amountRupees,
                'Type': type,
                'Error': verifyData.error || 'Verification failed'
              })
            }
          } catch (err) {
            alert('Payment verification error')
            
            // Track payment error
            trackEvent('Payment Error', {
              'Amount': amountRupees,
              'Type': type,
              'Error': 'Verification error'
            })
          }
        },
        theme: { color: '#FF6B35' },
        prefill: {
          name: userData.name || 'Yaari User',
          contact: userData.phone || '',
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (error) {
      console.error('Payment error:', error)
      alert('Something went wrong while initiating payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'var(--font-baloo)' }}>
      <div className="p-4">
        <button onClick={onBack} className="mb-6">
          <ArrowLeft size={24} className="text-gray-700" />
        </button>

        <div className="bg-orange-50 rounded-2xl p-6 mb-4 flex items-center">
          <div className="w-16 h-16 bg-orange-400 rounded-full flex items-center justify-center mr-4">
            <span className="text-white text-3xl font-extrabold">Y</span>
          </div>
          <div>
            <p className="text-gray-700 text-sm mb-1">Total Coin Balance</p>
            <p className="text-3xl font-extrabold">{balance} coin</p>
          </div>
        </div>

        <div className="border-t border-gray-300 my-6"></div>

        <h2 className="text-orange-500 font-semibold text-lg mb-4">Add More Coins</h2>

        <div className="flex justify-between items-center mb-2 text-xs text-gray-500">
          <span>Coins per Rupee: {coinsPerRupee}</span>
          <span>Min Rs {minRecharge ?? '-'} • Max Rs {maxRecharge ?? '-'}</span>
        </div>

        <div className="flex justify-between items-center mb-2 bg-gray-50 p-3 rounded-lg">
          <input
            type="number"
            value={coinsInput}
            onChange={(e) => setCoinsInput(e.target.value)}
            placeholder="Enter no of coins"
            className="flex-1 bg-transparent outline-none text-sm"
            min={minCoins ?? undefined}
            max={maxCoins ?? undefined}
          />
          <span className="text-gray-600 text-sm">Rs {rupeesForInput}</span>
        </div>

        {isTopupInvalid && (
          <div className="mb-4 text-xs text-red-600">
            {minRecharge && rupeesForInput < minRecharge && (
              <span>Minimum recharge is Rs {minRecharge}.</span>
            )}
            {maxRecharge && rupeesForInput > maxRecharge && (
              <span> Maximum recharge is Rs {maxRecharge}.</span>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-6">
          {plans.map((pkg, index) => (
            <button
              key={pkg._id || index}
              onClick={() => setSelectedPlan(pkg)}
              className={`rounded-3xl p-4 md:p-5 bg-rose-50 hover:bg-rose-100 transition-all border border-gray-200 shadow-md flex flex-col justify-between ${selectedPlan?._id === pkg._id ? 'ring-2 ring-orange-500' : ''}`}
            >
              <div className="flex items-center gap-2">
                {useFallbackIcon ? (
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 shadow-inner flex items-center justify-center shrink-0">
                    <span className="text-yellow-900 font-extrabold text-[10px]">Y</span>
                  </div>
                ) : (
                  <img
                    src="/images/coinicon.png"
                    alt="coin"
                    className="w-9 h-9 md:w-10 md:h-10 object-contain shrink-0"
                    onError={() => setUseFallbackIcon(true)}
                  />
                )}
                <span className="inline-flex items-center h-9 md:h-10 text-xl md:text-2xl font-extrabold text-black leading-none">{pkg.coins}</span>
              </div>
              <div className="mt-4 flex flex-col items-center">
                <p className="text-base md:text-lg font-extrabold text-black">Rs{pkg.price}</p>
                {pkg.originalPrice && pkg.originalPrice > pkg.price ? (
                  <p className="text-xs md:text-sm text-gray-400 line-through mt-1">Rs{pkg.originalPrice}</p>
                ) : null}
              </div>
            </button>
          ))}
        </div>

        <button onClick={proceedPayment} disabled={loading || isTopupInvalid} className="w-full bg-orange-500 text-white py-4 rounded-2xl font-semibold text-base hover:bg-orange-600 transition-colors flex items-center justify-center disabled:opacity-60">
          {loading ? 'Processing...' : 'Proceed to Payment'}
        </button>
      </div>
    </div>
  )
}
