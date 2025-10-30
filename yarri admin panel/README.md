# Yaari Admin Panel

Modern admin panel for managing Yaari dating app.

## Features

- 🔐 Admin Login
- 📊 Dashboard with Statistics
- 👥 User Management
- 💳 Payment Management
- 💰 Wallet Management
- ⚙️ Settings

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure MongoDB in `.env.local`:
```
MONGODB_URI=mongodb://localhost:27017/yarri
JWT_SECRET=your-secret-key
```

3. Create default admin (run in MongoDB):
```javascript
db.admins.insertOne({
  email: "admin@yaari.com",
  password: "$2a$10$XqZ8J5K5K5K5K5K5K5K5K.K5K5K5K5K5K5K5K5K5K5K5K5K5K5K", // password: admin123
  createdAt: new Date()
})
```

4. Run development server:
```bash
npm run dev
```

Admin panel runs on: http://localhost:3000

## Default Login
- Email: admin@yaari.com
- Password: admin123

## Tech Stack

- Next.js 14
- TypeScript
- MongoDB
- Tailwind CSS
- JWT Authentication
