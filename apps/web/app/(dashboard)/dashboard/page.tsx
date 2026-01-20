import { headers } from 'next/headers'
import Link from 'next/link'
import { auth } from '@factupe/auth/config'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  formatCurrency,
} from '@factupe/ui'
import { FileText, Users, Package, TrendingUp, Plus } from 'lucide-react'
import { getDashboardStats, getRecentDocuments } from '@/actions/documents'

export const metadata = {
  title: 'Dashboard',
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const [stats, recentDocs] = await Promise.all([
    getDashboardStats(),
    getRecentDocuments(3),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Bienvenido, {session?.user.name}
          </p>
        </div>
        <Link href="/documents/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Documento
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Documentos del Mes
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingDocuments} pendientes, {stats.acceptedDocuments} aceptados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Clientes activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Productos/Servicios
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ventas del Mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.monthlyRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              +12.5% respecto al mes anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Documents */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rapidas</CardTitle>
            <CardDescription>
              Crea documentos de forma rapida
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Link href="/documents/new?type=01">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Nueva Factura
              </Button>
            </Link>
            <Link href="/documents/new?type=03">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Nueva Boleta
              </Button>
            </Link>
            <Link href="/customers/new">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Nuevo Cliente
              </Button>
            </Link>
            <Link href="/products/new">
              <Button variant="outline" className="w-full justify-start">
                <Package className="mr-2 h-4 w-4" />
                Nuevo Producto
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documentos Recientes</CardTitle>
            <CardDescription>
              Ultimos documentos emitidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentDocs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay documentos emitidos
                </p>
              ) : (
                recentDocs.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{doc.series}-{doc.number}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.customer?.name || 'Sin cliente'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(Number(doc.total))}</p>
                      <p className={`text-xs ${doc.status === 'accepted' ? 'text-success' : doc.status === 'pending' ? 'text-warning' : 'text-muted-foreground'}`}>
                        {doc.status === 'accepted' ? 'Aceptado' : doc.status === 'pending' ? 'Pendiente' : doc.status === 'draft' ? 'Borrador' : doc.status}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Link href="/documents" className="mt-4 block">
              <Button variant="link" className="w-full">
                Ver todos los documentos
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
