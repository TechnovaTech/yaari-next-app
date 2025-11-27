'use client'
import { useEffect, useState } from 'react'
import { Search, Edit, Trash2, Eye } from 'lucide-react'

interface User {
  _id: string
  name?: string
  phone?: string
  email?: string
  gender?: string
  balance?: number
  isActive: boolean
  profilePic?: string
  createdAt: string
  about?: string
  hobbies?: string[]
  gallery?: string[]
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = () => {
    setLoading(true)
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        setUsers([])
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const handleView = (user: User) => {
    setSelectedUser(user)
    setShowModal(true)
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    
    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' })
      if (res.ok) {
        alert('User deleted successfully')
        loadUsers()
      } else {
        alert('Failed to delete user')
      }
    } catch (error) {
      alert('Error deleting user')
    }
  }

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      })
      if (res.ok) {
        loadUsers()
      } else {
        alert('Failed to update user status')
      }
    } catch (error) {
      alert('Error updating user status')
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
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
        <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search users..."
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
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Email</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Gender</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Balance</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.filter((user: User) => 
                !search || 
                (user.name && user.name.toLowerCase().includes(search.toLowerCase())) ||
                (user.phone && user.phone.includes(search)) ||
                (user.email && user.email.toLowerCase().includes(search.toLowerCase()))
              ).length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.filter((user: User) => 
                  !search || 
                  (user.name && user.name.toLowerCase().includes(search.toLowerCase())) ||
                  (user.phone && user.phone.includes(search)) ||
                  (user.email && user.email.toLowerCase().includes(search.toLowerCase()))
                ).map((user: User) => (
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
                    <td className="py-4 px-4">{user.email || '-'}</td>
                    <td className="py-4 px-4">{user.gender || '-'}</td>
                    <td className="py-4 px-4">{user.balance || 0} coin</td>
                    <td className="py-4 px-4">
                      <button 
                        onClick={() => toggleUserStatus(user._id, user.isActive)}
                        className={`px-3 py-1 rounded-full text-sm cursor-pointer hover:opacity-80 ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex space-x-2">
                        <button onClick={() => handleView(user)} className="p-2 hover:bg-gray-100 rounded-lg">
                          <Eye size={18} className="text-gray-600" />
                        </button>
                        <button onClick={() => handleDelete(user._id)} className="p-2 hover:bg-gray-100 rounded-lg">
                          <Trash2 size={18} className="text-red-600" />
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
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">User Details</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4 mb-6">
                {selectedUser.profilePic ? (
                  <img src={selectedUser.profilePic} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <div className="w-20 h-20 bg-primary rounded-full"></div>
                )}
                <div>
                  <h3 className="text-xl font-bold">{selectedUser.name || 'User'}</h3>
                  <p className="text-gray-600">{selectedUser.phone || selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {selectedUser.phone && (
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Phone</label>
                    <p className="text-gray-800">{selectedUser.phone}</p>
                  </div>
                )}
                {selectedUser.email && (
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Email</label>
                    <p className="text-gray-800">{selectedUser.email}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-semibold text-gray-600">Gender</label>
                  <p className="text-gray-800 capitalize">{selectedUser.gender || 'Not set'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Balance</label>
                  <p className="text-gray-800">{selectedUser.balance || 0} coin</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Status</label>
                  <p className="text-gray-800">{selectedUser.isActive ? 'Active' : 'Inactive'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Joined</label>
                  <p className="text-gray-800">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {selectedUser.about && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">About</label>
                  <p className="text-gray-800">{selectedUser.about}</p>
                </div>
              )}

              {selectedUser.hobbies && selectedUser.hobbies.length > 0 && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Hobbies</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedUser.hobbies.map((hobby: string, i: number) => (
                      <span key={i} className="bg-orange-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                        {hobby}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedUser.gallery && selectedUser.gallery.filter((img: string) => img && img.trim()).length > 0 && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Gallery</label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {selectedUser.gallery.filter((img: string) => img && img.trim()).map((img: string, i: number) => (
                      <img key={i} src={img} alt={`Gallery ${i + 1}`} className="w-full h-24 object-cover rounded-lg" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
