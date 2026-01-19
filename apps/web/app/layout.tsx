import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: {
    default: 'Factupe - Facturación Electrónica SUNAT',
    template: '%s | Factupe',
  },
  description: 'Sistema de facturación electrónica para SUNAT. Open source, extensible e integrable.',
  keywords: ['facturación electrónica', 'SUNAT', 'factura', 'boleta', 'Perú', 'open source'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
