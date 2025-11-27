import './globals.css'

export const metadata = {
  title: 'Yaari Admin Panel',
  description: 'Admin panel for Yaari dating app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
