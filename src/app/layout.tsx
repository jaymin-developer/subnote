import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Link from 'next/link'

import { Providers } from '@/components/providers'

import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'SubNote — 유튜브 자막 교정 & 요약',
  description: '유튜브 영상을 읽을 수 있는 글로 변환합니다',
}

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) => {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <Providers>
          <header className="border-b border-gray-200 dark:border-gray-800">
            <div className="mx-auto flex h-14 max-w-4xl items-center px-4">
              <Link href="/" className="text-lg font-bold text-blue-600 dark:text-blue-400">
                SubNote
              </Link>
            </div>
          </header>
          <main className="flex-1">
            {children}
          </main>
          <footer className="border-t border-gray-200 py-6 text-center text-xs text-gray-400 dark:border-gray-800">
            Powered by Claude API
          </footer>
        </Providers>
      </body>
    </html>
  )
}

export default RootLayout
