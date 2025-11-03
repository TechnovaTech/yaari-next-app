'use client'
import { useEffect, useState } from 'react'
import { Search, Plus, Minus } from 'lucide-react'

export default function WalletPage() {
  const [wallets, setWallets] = useState([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [amount, setAmount] = useState('')
  const [action, setAction] = useState<'add' | 'deduct'>('add')

  useEffect(() => {
    loadWallets()
  }, [])

  const loadWallets = () => {
    fetch('/api/wallet')
      .then(res => res.json())
      .then(data => setWallets(data))
      .catch(() => {})
  }

  const handleAddDeduct = (user: any, type: 'add' | 'deduct') => {
    setSelectedUser(user)
    setAction(type)
    setAmount('')
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      alert('Please enter valid amount')
      return
    }

    try {
      const res = await fetch(`/api/wallet/${selectedUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          amount: Number(amount),
        }),
      })

      if (res.ok) {
        alert(`Successfully ${action === 'add' ? 'added' : 'deducted'} ₹${amount}`)
        setShowModal(false)
        loadWallets()
      } else {
        alert('Failed to update wallet')
      }
    } catch (error) {
      alert('Error updating wallet')
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Wallet Management</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search wallets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-4 px-4 font-semibold text-gray-700">User</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Phone</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Balance</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Total Spent</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {wallets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    No wallets found
                  </td>
                </tr>
              ) : (
                wallets.map((wallet: any) => (
                  <tr key={wallet._id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">{wallet.userName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">{wallet.phone}</td>
                    <td className="py-4 px-4 font-bold text-green-600">{wallet.balance} coin</td>
                    <td className="py-4 px-4 text-gray-600">₹{wallet.totalSpent || 0}</td>
                    <td className="py-4 px-4">
                      <div className="flex space-x-2">
                        <button onClick={() => handleAddDeduct(wallet, 'add')} className="flex items-center space-x-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition">
                          <Plus size={16} />
                          <span className="text-sm">Add</span>
                        </button>
                        <button onClick={() => handleAddDeduct(wallet, 'deduct')} className="flex items-center space-x-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition">
                          <Minus size={16} />
                          <span className="text-sm">Deduct</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {action === 'add' ? 'Add' : 'Deduct'} Balance
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-primary rounded-full"></div>
                <div>
                  <p className="font-bold">{selectedUser.userName}</p>
                  <p className="text-sm text-gray-600">{selectedUser.phone}</p>
                </div>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Current Balance</p>
                <p className="text-2xl font-bold text-gray-800">₹{selectedUser.balance}</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Amount to {action === 'add' ? 'Add' : 'Deduct'}
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className={`flex-1 px-4 py-3 text-white rounded-xl font-semibold ${
                  action === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {action === 'add' ? 'Add' : 'Deduct'} ₹{amount || '0'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
