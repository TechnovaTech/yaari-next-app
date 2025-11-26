const fetch = require('node-fetch')

// Allow overriding API base via env; default to local admin server on 3000
const API_BASE = process.env.API_BASE || 'http://localhost:3000'

async function testCallHistory() {
  console.log('🧪 Testing Call History Functionality\n')
  
  const testCallerId = 'test-caller-' + Date.now()
  const testReceiverId = 'test-receiver-' + Date.now()
  const channelName = 'test-channel-' + Date.now()
  
  try {
    // Test 1: Start a call
    console.log('1️⃣ Testing call start...')
    const startResponse = await fetch(`${API_BASE}/api/call-log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callerId: testCallerId,
        receiverId: testReceiverId,
        callType: 'video',
        action: 'start',
        channelName: channelName
      })
    })
    
    // Try to parse JSON; if it fails, log text for diagnostics
    let startText = await startResponse.text()
    let startResult
    try { startResult = JSON.parse(startText) } catch { startResult = { raw: startText } }
    console.log('   Status:', startResponse.status)
    console.log('   Response:', startResult)
    
    if (!startResponse.ok || !startResult.success) {
      throw new Error('Call start failed')
    }
    console.log('   ✅ Call start successful\n')
    
    // Wait 2 seconds to simulate call duration
    console.log('⏳ Simulating 2 second call...\n')
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Test 2: End the call
    console.log('2️⃣ Testing call end...')
    const endResponse = await fetch(`${API_BASE}/api/call-log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callerId: testCallerId,
        receiverId: testReceiverId,
        callType: 'video',
        action: 'end',
        duration: 120,
        cost: 10,
        status: 'completed'
      })
    })
    
    let endText = await endResponse.text()
    let endResult
    try { endResult = JSON.parse(endText) } catch { endResult = { raw: endText } }
    console.log('   Status:', endResponse.status)
    console.log('   Response:', endResult)
    
    if (!endResponse.ok || !endResult.success || !endResult.verified) {
      throw new Error('Call end or verification failed')
    }
    console.log('   ✅ Call end and verification successful\n')
    
    // Test 3: Retrieve call history
    console.log('3️⃣ Testing call history retrieval...')
    const historyResponse = await fetch(`${API_BASE}/api/call-history?userId=${testCallerId}`)
    
    const historyResult = await historyResponse.json()
    console.log('   Status:', historyResponse.status)
    console.log('   Found calls:', historyResult.length)
    
    if (!historyResponse.ok) {
      throw new Error('Call history retrieval failed')
    }
    
    const testCall = historyResult.find(call => 
      call._id.toString() === endResult.id.toString()
    )
    
    if (!testCall) {
      throw new Error('Test call not found in history')
    }
    
    console.log('   Call details:', {
      callType: testCall.callType,
      duration: testCall.duration,
      status: testCall.status,
      cost: testCall.cost
    })
    console.log('   ✅ Call history retrieval successful\n')
    
    console.log('✅ ALL TESTS PASSED!\n')
    console.log('Call history functionality is working correctly.')
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message)
    console.error('Details:', error)
    process.exit(1)
  }
}

testCallHistory()
