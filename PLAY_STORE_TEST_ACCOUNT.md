# Play Store Test Account

## Test Credentials for Review Team

**Phone Number:** `1111111111` or `+911111111111`  
**OTP:** `123456`

## Usage

This static test account is configured for Play Store review team to login and validate the app without requiring actual SMS delivery.

## Implementation

- Located in: `yarri admin panel/app/api/auth/send-otp/route.ts`
- When phone `+911111111111` requests OTP, system returns fixed OTP `123456`
- No SMS is sent for this test account
- OTP is stored in database with same expiry as regular OTPs (5 minutes)

## Notes

- This account bypasses SMS service
- OTP is always `123456` for this number
- Valid for app review and testing purposes
