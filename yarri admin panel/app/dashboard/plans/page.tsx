'use client'
import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react'

interface Plan {
  _id?: string
  title?: string
  coins: number
  price: number
  originalPrice?: number
  isActive?: boolean
}

export default function ManagePlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [form, setForm] = useState<Plan>({ coins: 0, price: 0, originalPrice: 0, title: '', isActive: true })
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const loadPlans = async () => {
    const res = await fetch('/api/plans')
    const data = await res.json()
    setPlans(data)
  }

  useEffect(() => { loadPlans() }, [])

  const handleCreateOrUpdate = async () => {
    if (!form.coins || !form.price) {
      alert('Please enter coins and price')
      return
    }
    setLoading(true)
    try {
      if (editingId) {
        await fetch(`/api/plans/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        setEditingId(null)
      } else {
        await fetch('/api/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      }
      setForm({ coins: 0, price: 0, originalPrice: 0, title: '', isActive: true })
      await loadPlans()
    } catch (e) {
      alert('Failed to save plan')
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (p: Plan) => {
    setEditingId(p._id || null)
    setForm({ coins: p.coins, price: p.price, originalPrice: p.originalPrice || p.price, title: p.title || '', isActive: p.isActive })
  }

  const removePlan = async (id?: string) => {
    if (!id) return
    if (!confirm('Delete this plan?')) return
    await fetch(`/api/plans/${id}`, { method: 'DELETE' })
    await loadPlans()
  }

  const toggleActive = async (p: Plan) => {
    if (!p._id) return
    await fetch(`/api/plans/${p._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !p.isActive })
    })
    await loadPlans()
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Manage Plans</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">{editingId ? 'Edit Plan' : 'Create Plan'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={form.title || ''}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="e.g., Starter Pack"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Coins</label>
            <input
              type="number"
              value={form.coins}
              onChange={(e) => setForm({ ...form, coins: Number(e.target.value) })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹)</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Original Price (₹)</label>
            <input
              type="number"
              value={form.originalPrice || 0}
              onChange={(e) => setForm({ ...form, originalPrice: Number(e.target.value) })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Active</label>
            <select
              value={form.isActive ? 'true' : 'false'}
              onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={handleCreateOrUpdate}
            disabled={loading}
            className="flex items-center space-x-2 bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary/90 transition"
          >
            <Plus size={20} />
            <span>{editingId ? 'Save Changes' : 'Create Plan'}</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Existing Plans</h2>
        <div className="space-y-3">
          {plans.length === 0 ? (
            <p className="text-gray-500">No plans yet</p>
          ) : (
            plans.map((p) => (
              <div key={p._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-semibold text-gray-800">{p.title || 'Untitled Plan'}</p>
                  <p className="text-sm text-gray-600">Coins: {p.coins} • Price: ₹{p.price} {p.originalPrice && p.originalPrice > p.price ? <span className="text-gray-400 line-through ml-1">₹{p.originalPrice}</span> : null}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => toggleActive(p)} className={`px-3 py-2 rounded-lg text-sm ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {p.isActive ? <CheckCircle size={16} /> : <XCircle size={16} />} {p.isActive ? 'Active' : 'Inactive'}
                  </button>
                  <button onClick={() => startEdit(p)} className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm flex items-center space-x-1">
                    <Pencil size={16} /> <span>Edit</span>
                  </button>
                  <button onClick={() => removePlan(p._id)} className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm flex items-center space-x-1">
                    <Trash2 size={16} /> <span>Delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}