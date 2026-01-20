import Link from 'next/link'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  formatCurrency,
} from '@factupe/ui'
import { Plus, Package, Edit, Trash2 } from 'lucide-react'
import { listProducts } from '@/actions/products'

export const metadata = {
  title: 'Productos',
}

const taxTypeLabels: Record<string, string> = {
  '10': 'Gravado',
  '20': 'Exonerado',
  '30': 'Inafecto',
  '40': 'Exportacion',
}

export default async function ProductsPage() {
  const { data: products = [] } = await listProducts()
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Productos y Servicios</h1>
          <p className="text-muted-foreground">
            Gestiona tu catalogo de productos y servicios
          </p>
        </div>
        <Link href="/products/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Producto
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catalogo</CardTitle>
          <CardDescription>
            Todos tus productos y servicios registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Codigo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead>Tipo IGV</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No hay productos registrados
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <span className="font-medium">{product.name}</span>
                          {product.isService && (
                            <Badge variant="secondary" className="ml-2">
                              Servicio
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {product.code}
                    </TableCell>
                    <TableCell>{product.category || '-'}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(Number(product.unitPrice), product.currency)}
                    </TableCell>
                    <TableCell>
                      {taxTypeLabels[product.taxType || '10'] || product.taxType}
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.isActive ? 'success' : 'secondary'}>
                        {product.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/products/${product.id}/edit`}>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
