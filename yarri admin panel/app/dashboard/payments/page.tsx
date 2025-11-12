'use client'
import { useEffect, useState } from 'react'
import { Search, Download } from 'lucide-react'

export default function PaymentsPage() {
  const [payments, setPayments] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/payments')
      .then(res => res.json())
      .then(data => setPayments(data))
      .catch(() => {})
  }, [])

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Payment Management</h1>
        <button className="flex items-center space-x-2 bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary/90 transition">
          <Download size={20} />
          <span>Export</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search payments..."
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
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Transaction IDs</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">User Email</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Phone Number</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Amount</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Type</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No payments found
                  </td>
                </tr>
              ) : (
                payments.map((payment: any) => (
                  <tr key={payment._id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-4 font-mono text-sm">{payment.transactionId || payment.paymentId || payment.orderId}</td>
                    <td className="py-4 px-4">{payment.userEmail || '-'}</td>
                    <td className="py-4 px-4">{payment.userPhone || '-'}</td>
                    <td className="py-4 px-4 font-bold text-green-600">₹{payment.amount}</td>
                    <td className="py-4 px-4">{payment.type}</td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        payment.status === 'success' ? 'bg-green-100 text-green-700' :
                        payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-500">{new Date(payment.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
