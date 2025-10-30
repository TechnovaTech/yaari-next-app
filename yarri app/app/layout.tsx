import './globals.css'
import { Baloo_Tammudu_2 } from 'next/font/google'
import { LanguageProvider } from '../contexts/LanguageContext'
import { SocketProvider } from '../contexts/SocketContext'
import GlobalCallUI from '../components/GlobalCallUI'
import NativeStatusBar from '../components/NativeStatusBar'
import CleverTapInit from '../components/CleverTapInit'

const balooTammudu = Baloo_Tammudu_2({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-baloo',
})

export const metadata = {
  title: 'Yaari',
  description: 'Yaari mobile application',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  themeColor: '#FF6B35',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={balooTammudu.variable}>
      <body className={balooTammudu.className}>
        {/* Client-only status bar configuration */}
        <NativeStatusBar />
        {/* CleverTap initialization */}
        <CleverTapInit />
        <SocketProvider>
          <LanguageProvider>
            <div className="mobile-container">
              <GlobalCallUI />
              {children}
            </div>
          </LanguageProvider>
        </SocketProvider>
      </body>
    </html>
  )
}