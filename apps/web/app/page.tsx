import Link from 'next/link'
import { Button } from '@factupe/ui'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold text-primary">
            Factupe
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Iniciar Sesión</Button>
            </Link>
            <Link href="/register">
              <Button>Registrarse</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Facturación Electrónica
            <br />
            <span className="text-primary">Simple y Poderosa</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Sistema open source de facturación electrónica para SUNAT.
            Emite facturas, boletas, notas de crédito y más.
            Extensible, integrable y fácil de usar.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg">Comenzar Gratis</Button>
            </Link>
            <Link href="/docs">
              <Button variant="outline" size="lg">
                Ver Documentación
              </Button>
            </Link>
          </div>
        </section>

        <section className="border-t bg-muted/50 py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-center text-3xl font-bold">Características Principales</h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <div className="rounded-lg border bg-card p-6">
                <h3 className="text-xl font-semibold">Comprobantes Electrónicos</h3>
                <p className="mt-2 text-muted-foreground">
                  Facturas, boletas, notas de crédito/débito, guías de remisión,
                  retenciones y percepciones.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <h3 className="text-xl font-semibold">Integración SUNAT</h3>
                <p className="mt-2 text-muted-foreground">
                  Envío directo a SUNAT o mediante OSE/PSE.
                  Arquitectura flexible de adaptadores.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <h3 className="text-xl font-semibold">API y SDK</h3>
                <p className="mt-2 text-muted-foreground">
                  API REST completa y SDK para integrar con tu sistema.
                  Webhooks para notificaciones en tiempo real.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <h3 className="text-xl font-semibold">Multi-empresa</h3>
                <p className="mt-2 text-muted-foreground">
                  Gestiona múltiples empresas desde una sola cuenta.
                  Roles y permisos granulares.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <h3 className="text-xl font-semibold">Open Source</h3>
                <p className="mt-2 text-muted-foreground">
                  Código abierto bajo licencia MIT.
                  Personaliza y extiende según tus necesidades.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <h3 className="text-xl font-semibold">Tiempo Real</h3>
                <p className="mt-2 text-muted-foreground">
                  Notificaciones en tiempo real del estado de tus comprobantes.
                  Dashboard actualizado automáticamente.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Factupe - Sistema de Facturación Electrónica Open Source</p>
          <p className="mt-2">
            Hecho con Next.js, React 19 y mucho cafe
          </p>
        </div>
      </footer>
    </div>
  )
}
