import Header from '@/components/Header'
import Providers from '@/components/SessionProvider'
import { ToastContainer } from '@/components/ToastContainer'
import { LanguageProvider } from '@/contexts/LanguageContext'

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  return (
    <LanguageProvider locale={locale as 'zh' | 'en'}>
      <Providers>
        <div className="min-h-screen flex flex-col">
          <Header />
          {children}
          <ToastContainer />
        </div>
      </Providers>
    </LanguageProvider>
  )
}