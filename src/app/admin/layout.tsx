import type { Metadata, Viewport } from 'next'
import PwaInstall from '@/components/PwaInstall'
import EnableNotifications from '@/components/EnableNotifications'

export const metadata: Metadata = {
  manifest: '/admin.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'CP Admin',
    statusBarStyle: 'default',
  },
  icons: {
    icon: '/api/pwa-icon?size=192',
    apple: '/api/pwa-icon?size=180',
  },
}

export const viewport: Viewport = {
  themeColor: '#172554',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PwaInstall />
      <EnableNotifications />
    </>
  )
}