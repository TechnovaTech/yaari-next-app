'use client'
import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    appName: 'Yaari',
    audioCallRate: 10,
    videoCallRate: 20,
    minRecharge: 100,
    maxRecharge: 10000,
    commission: 20,
    coinsPerRupee: 1,
  })
  const [bonusAmount, setBonusAmount] = useState<number>(0)
  const [bonusLoading, setBonusLoading] = useState<boolean>(true)
  const [bonusSaving, setBonusSaving] = useState<boolean>(false)
  const [bonusMessage, setBonusMessage] = useState<string>('')

  useEffect(() => {
    // Load general settings
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(() => {})

    // Load signup bonus amount with a safety fallback to avoid stuck Loading
    let cancelled = false
    const timeout = setTimeout(() => {
      if (!cancelled) setBonusLoading(false)
    }, 3000)

    fetch('/api/settings/signup-bonus')
      .then(res => res.json())
      .then(data => setBonusAmount(Number(data.amount || 0)))
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setBonusLoading(false)
      })

    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [])

  const handleSave = async () => {
    try {
      // Save general + payment settings
      const resSettings = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!resSettings.ok) throw new Error('Failed to save app settings')

      // Save signup bonus alongside other settings so one Save updates everything
      const resBonus = await fetch('/api/settings/signup-bonus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: bonusAmount }),
      })
      if (!resBonus.ok) throw new Error('Failed to save signup bonus')

      alert('All settings saved successfully')
    } catch (error) {
      alert('Failed to save one or more settings')
    }
  }

  const handleSaveBonus = async () => {
    setBonusSaving(true)
    setBonusMessage('')
    try {
      const res = await fetch('/api/settings/signup-bonus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: bonusAmount }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setBonusMessage('Signup bonus updated successfully.')
      } else {
        setBonusMessage(data.error || 'Failed to update.')
      }
    } catch (e) {
      setBonusMessage('Network error')
    } finally {
      setBonusSaving(false)
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
        <button
          onClick={handleSave}
          className="flex items-center space-x-2 bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary/90 transition"
        >
          <Save size={20} />
          <span>Save Changes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">App Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">App Name</label>
              <input
                type="text"
                value={settings.appName}
                onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Audio Call Rate (coins/min)</label>
              <input
                type="number"
                value={settings.audioCallRate}
                onChange={(e) => setSettings({ ...settings, audioCallRate: Number(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Video Call Rate (coins/min)</label>
              <input
                type="number"
                value={settings.videoCallRate}
                onChange={(e) => setSettings({ ...settings, videoCallRate: Number(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Commission (%)</label>
              <input
                type="number"
                value={settings.commission}
                onChange={(e) => setSettings({ ...settings, commission: Number(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Coins Per Rupee</label>
              <input
                type="number"
                step="0.1"
                value={settings.coinsPerRupee}
                onChange={(e) => setSettings({ ...settings, coinsPerRupee: Number(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Example: If set to 0.5, then ₹100 = 50 coins</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Payment Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Recharge (₹)</label>
              <input
                type="number"
                value={settings.minRecharge}
                onChange={(e) => setSettings({ ...settings, minRecharge: Number(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Recharge (₹)</label>
              <input
                type="number"
                value={settings.maxRecharge}
                onChange={(e) => setSettings({ ...settings, maxRecharge: Number(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        {/* Signup Bonus Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Signup Bonus Coins</h2>
          <p className="text-sm text-gray-600 mb-4">New users will receive this many coins on signup.</p>
          {bonusLoading ? (
            <div className="text-gray-500">Loading...</div>
          ) : (
            <div className="space-y-4">
              <input
                type="number"
                min={0}
                value={bonusAmount}
                onChange={(e) => setBonusAmount(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="Enter coins amount"
              />
              <button
                onClick={handleSaveBonus}
                disabled={bonusSaving}
                className={`bg-primary text-white px-4 py-2 rounded-xl ${bonusSaving ? 'opacity-70' : ''}`}
              >
                {bonusSaving ? 'Saving...' : 'Save Signup Bonus'}
              </button>
              {bonusMessage && <div className="text-sm text-gray-700">{bonusMessage}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
