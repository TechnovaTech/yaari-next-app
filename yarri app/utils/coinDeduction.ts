export const deductCoins = async (userId: string, coins: number, callType: 'audio' | 'video') => {
  try {
    const res = await fetch(`https://admin.yaari.me/api/users/${userId}/deduct-coins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coins, callType })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to deduct coins')
    return data
  } catch (error) {
    console.error('Coin deduction error:', error)
    throw error
  }
}
