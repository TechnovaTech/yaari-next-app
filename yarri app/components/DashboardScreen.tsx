'use client'
import { useState } from 'react'
import { Phone, MessageCircle, User, Settings, History, CreditCard, HelpCircle, LogOut } from 'lucide-react'

export default function DashboardScreen() {
  const [activeTab, setActiveTab] = useState('home')

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeContent />
      case 'profile':
        return <ProfileContent />
      case 'history':
        return <HistoryContent />
      case 'support':
        return <SupportContent />
      default:
        return <HomeContent />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {renderContent()}
      
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex justify-around py-2">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center p-2 ${activeTab === 'home' ? 'text-primary' : 'text-gray-500'}`}
          >
            <Phone size={24} />
            <span className="text-xs mt-1">Home</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center p-2 ${activeTab === 'profile' ? 'text-primary' : 'text-gray-500'}`}
          >
            <User size={24} />
            <span className="text-xs mt-1">Profile</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center p-2 ${activeTab === 'history' ? 'text-primary' : 'text-gray-500'}`}
          >
            <History size={24} />
            <span className="text-xs mt-1">History</span>
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`flex flex-col items-center p-2 ${activeTab === 'support' ? 'text-primary' : 'text-gray-500'}`}
          >
            <HelpCircle size={24} />
            <span className="text-xs mt-1">Support</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function HomeContent() {
  return (
    <div className="pb-20">
      <div className="bg-gradient-to-r from-orange-400 to-pink-400 p-6 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <User className="text-primary" size={24} />
            </div>
            <div>
              <h3 className="text-white font-semibold">Dear Name</h3>
              <p className="text-white/80 text-sm">Transaction History</p>
            </div>
          </div>
          <Settings className="text-white" size={24} />
        </div>
        
        <div className="bg-white/20 rounded-2xl p-4 mb-4">
          <p className="text-white text-sm mb-2">Your Call Balance</p>
          <div className="flex items-center justify-between">
            <div className="flex space-x-4">
              <div className="text-center">
                <p className="text-white text-2xl font-bold">50</p>
                <p className="text-white/80 text-xs">MIN</p>
              </div>
              <div className="text-center">
                <p className="text-white text-2xl font-bold">50</p>
                <p className="text-white/80 text-xs">MIN</p>
              </div>
              <div className="text-center">
                <p className="text-white text-2xl font-bold">50</p>
                <p className="text-white/80 text-xs">MIN</p>
              </div>
            </div>
          </div>
        </div>
        
        <button className="w-full bg-white text-primary py-3 rounded-2xl font-semibold">
          Proceed to Recharge
        </button>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className="bg-gray-200 h-20 rounded-2xl"></div>
          ))}
        </div>
        
        <div className="flex space-x-4">
          <button className="flex-1 bg-primary text-white py-3 rounded-2xl font-semibold">
            Recharge
          </button>
          <button className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-2xl font-semibold">
            History
          </button>
        </div>
      </div>
    </div>
  )
}

function ProfileContent() {
  return (
    <div className="p-6 pb-20">
      <div className="text-center mb-8">
        <div className="w-24 h-24 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center">
          <User className="text-white" size={40} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Dear Name</h2>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm">
          <div className="flex items-center space-x-3">
            <Phone className="text-primary" size={20} />
            <span>Transaction History</span>
          </div>
          <span className="text-gray-400">›</span>
        </div>
        
        <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm">
          <div className="flex items-center space-x-3">
            <MessageCircle className="text-primary" size={20} />
            <span>Call History</span>
          </div>
          <span className="text-gray-400">›</span>
        </div>
        
        <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm">
          <div className="flex items-center space-x-3">
            <CreditCard className="text-primary" size={20} />
            <span>Purchase History</span>
          </div>
          <span className="text-gray-400">›</span>
        </div>
        
        <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm">
          <div className="flex items-center space-x-3">
            <Settings className="text-primary" size={20} />
            <span>Privacy & Security</span>
          </div>
          <span className="text-gray-400">›</span>
        </div>
        
        <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm">
          <div className="flex items-center space-x-3">
            <HelpCircle className="text-primary" size={20} />
            <span>Customer Support</span>
          </div>
          <span className="text-gray-400">›</span>
        </div>
        
        <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm">
          <div className="flex items-center space-x-3">
            <LogOut className="text-red-500" size={20} />
            <span className="text-red-500">Log Out</span>
          </div>
          <span className="text-gray-400">›</span>
        </div>
      </div>
    </div>
  )
}

function HistoryContent() {
  const callHistory = [
    { name: 'User Name', time: '2:30 PM', duration: '5 min' },
    { name: 'User Name', time: '1:15 PM', duration: '3 min' },
    { name: 'User Name', time: '12:45 PM', duration: '8 min' },
    { name: 'User Name', time: '11:30 AM', duration: '2 min' },
    { name: 'User Name', time: '10:15 AM', duration: '6 min' },
  ]

  return (
    <div className="p-6 pb-20">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Call History</h2>
      
      <div className="space-y-4">
        {callHistory.map((call, index) => (
          <div key={index} className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="text-gray-500" size={20} />
              </div>
              <div>
                <p className="font-semibold text-gray-800">{call.name}</p>
                <p className="text-gray-500 text-sm">{call.time}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-gray-600">{call.duration}</p>
              <Phone className="text-primary ml-auto" size={16} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SupportContent() {
  return (
    <div className="p-6 pb-20">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Customer Support</h2>
      
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <h3 className="font-semibold text-gray-800 mb-4">Get a copy of invoice</h3>
        <p className="text-gray-600 text-sm mb-4">
          Need a copy of your invoice? We can help you get it quickly and easily.
        </p>
        <button className="w-full bg-primary text-white py-3 rounded-2xl font-semibold">
          Request Invoice
        </button>
      </div>
      
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4">Need Help?</h3>
        <p className="text-gray-600 text-sm mb-4">
          Our support team is here to help you with any questions or issues you may have.
        </p>
        <button className="w-full bg-gray-200 text-gray-700 py-3 rounded-2xl font-semibold">
          Contact Support
        </button>
      </div>
    </div>
  )
}