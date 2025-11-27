'use client'
import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'

interface User {
  _id: string
  name?: string
  phone?: string
  gender?: string
  profilePic?: string
  callAccess?: 'none' | 'audio' | 'video' | 'full'
}

export default function CallAccessPage() {
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [genderFilter, setGenderFilter] = useState('female')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = () => {
    setLoading(true)
    fetch('/api/call-access')
      .then(res => res.json())
      .then(data => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }

  const handleUserClick = (user: User) => {
    setSelectedUser(user)
    setShowModal(true)
  }

  const updateCallAccess = async (access: 'none' | 'audio' | 'video' | 'full') => {
    if (!selectedUser) return
    try {
      const res = await fetch(`/api/users/${selectedUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callAccess: access })
      })
      if (res.ok) {
        setShowModal(false)
        setSelectedUser(null)
        loadUsers()
      } else {
        alert('Failed to update call access')
      }
    } catch (error) {
      alert('Error updating call access')
    }
  }

  const filteredUsers = users.filter((user: User) => {
    const matchesSearch = !search || 
      (user.name && user.name.toLowerCase().includes(search.toLowerCase())) ||
      (user.phone && user.phone.includes(search))
    const matchesGender = !genderFilter || user.gender === genderFilter
    return matchesSearch && matchesGender
  })

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Call Access Control</h1>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center justify-center" style={{ minHeight: '400px' }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-600 text-lg">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Call Access Control</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="mb-6 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          >
            <option value="">All Genders</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-4 px-4 font-semibold text-gray-700">User</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Phone</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Gender</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Call Access</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user: User) => (
                  <tr key={user._id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        {user.profilePic ? (
                          <img src={user.profilePic} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                            {(user.name || 'U')[0].toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium">{user.name || 'User'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">{user.phone || '-'}</td>
                    <td className="py-4 px-4 capitalize">{user.gender || '-'}</td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        user.callAccess === 'full' ? 'bg-green-100 text-green-700' :
                        user.callAccess === 'video' ? 'bg-blue-100 text-blue-700' :
                        user.callAccess === 'audio' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {user.callAccess === 'full' ? '🎥 + 📞' :
                         user.callAccess === 'video' ? '🎥 Only' :
                         user.callAccess === 'audio' ? '📞 Only' :
                         'None'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleUserClick(user)}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition text-sm"
                      >
                        Edit
                      </button>
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
              <h2 className="text-2xl font-bold text-gray-800">Call Access Control</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-4">Set call permissions for <strong>{selectedUser.name || 'User'}</strong></p>
              
              <div className="space-y-3">
                <button
                  onClick={() => updateCallAccess('full')}
                  className="w-full p-4 border-2 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-800">Full Access</div>
                      <div className="text-sm text-gray-600">Video + Audio calls enabled</div>
                    </div>
                    <span className="text-2xl">🎥 + 📞</span>
                  </div>
                </button>

                <button
                  onClick={() => updateCallAccess('video')}
                  className="w-full p-4 border-2 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-800">Video Only</div>
                      <div className="text-sm text-gray-600">Only video calls enabled</div>
                    </div>
                    <span className="text-2xl">🎥</span>
                  </div>
                </button>

                <button
                  onClick={() => updateCallAccess('audio')}
                  className="w-full p-4 border-2 rounded-xl hover:border-yellow-500 hover:bg-yellow-50 transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-800">Audio Only</div>
                      <div className="text-sm text-gray-600">Only audio calls enabled</div>
                    </div>
                    <span className="text-2xl">📞</span>
                  </div>
                </button>

                <button
                  onClick={() => updateCallAccess('none')}
                  className="w-full p-4 border-2 rounded-xl hover:border-gray-500 hover:bg-gray-50 transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-800">No Access</div>
                      <div className="text-sm text-gray-600">All calls disabled</div>
                    </div>
                    <span className="text-2xl">🚫</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
