import { useState, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../utils/translations'
import { trackScreenView } from '../utils/clevertap'

interface TransactionHistoryScreenProps {
  onBack: () => void
}

interface Transaction {
  _id?: string
  type?: string
  amountRupees?: number
  coins?: number
  status?: string
  createdAt?: string
  description?: string
}

export default function TransactionHistoryScreen({ onBack }: TransactionHistoryScreenProps) {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const API_URL = 'https://acsgroup.cloud'

  useEffect(() => {
    trackScreenView('Transaction History')
    const userRaw = localStorage.getItem('user')
    if (!userRaw) {
      setError('Please login to view transactions')
      setLoading(false)
      return
    }
    try {
      const user = JSON.parse(userRaw)
      fetchTransactions(user.id)
    } catch {
      setError('Please login to view transactions')
      setLoading(false)
    }
  }, [])

  const fetchTransactions = async (userId: string) => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`${API_URL}/api/users/${userId}/transactions`)
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load transactions')
      }
      const list = Array.isArray(data) ? data : (data.transactions || [])
      setTransactions(list)
    } catch (err: any) {
      setError(err?.message || 'Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (iso?: string) => {
    try {
      if (!iso) return ''
      const d = new Date(iso)
      return d.toLocaleString()
    } catch {
      return ''
    }
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
      <div className="px-4 pb-3">
        <h1 className="text-3xl font-bold text-black">{t.transactionHistory}</h1>
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="px-6 py-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="px-6 py-8">
          <p className="text-gray-600 text-sm">No transactions yet.</p>
        </div>
      ) : (
        <div className="px-4 pb-24 space-y-3">
          {transactions.map((tx, i) => (
            <div key={tx._id || i} className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-1">
                <p className="font-semibold text-gray-900 capitalize">{tx.type || 'Transaction'}</p>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                  {tx.status || 'success'}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{formatDate(tx.createdAt)}</span>
                <span>₹{tx.amountRupees ?? 0}</span>
              </div>
              {typeof tx.coins === 'number' && (
                <p className="text-xs text-gray-500 mt-1">Coins: {tx.coins}</p>
              )}
              {tx.description && (
                <p className="text-xs text-gray-500 mt-1">{tx.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}