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

export const metadata = {
  title: 'Productos',
}

// TODO: Replace with real data from database
const products = [
  {
    id: 'prd_1',
    code: 'PROD001',
    name: 'Producto de ejemplo 1',
    unitPrice: 100,
    currency: 'PEN',
    taxType: '10',
    category: 'General',
    isService: false,
    isActive: true,
  },
  {
    id: 'prd_2',
    code: 'SERV001',
    name: 'Servicio de consultoria',
    unitPrice: 500,
    currency: 'PEN',
    taxType: '10',
    category: 'Servicios',
    isService: true,
    isActive: true,
  },
  {
    id: 'prd_3',
    code: 'PROD002',
    name: 'Producto exonerado',
    unitPrice: 50,
    currency: 'PEN',
    taxType: '20',
    category: 'Exonerados',
    isService: false,
    isActive: true,
  },
]

const taxTypeLabels: Record<string, string> = {
  '10': 'Gravado',
  '20': 'Exonerado',
  '30': 'Inafecto',
  '40': 'Exportacion',
}

export default function ProductsPage() {
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
              {products.map((product) => (
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
                    {formatCurrency(product.unitPrice, product.currency)}
                  </TableCell>
                  <TableCell>
                    {taxTypeLabels[product.taxType] || product.taxType}
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
