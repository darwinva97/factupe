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
  formatDocument,
} from '@factupe/ui'
import { Plus, Users, Edit, Trash2 } from 'lucide-react'

export const metadata = {
  title: 'Clientes',
}

// TODO: Replace with real data from database
const customers = [
  {
    id: 'cst_1',
    documentType: '6',
    documentNumber: '20100047218',
    name: 'Cliente Demo S.A.C.',
    email: 'contacto@clientedemo.com',
    phone: '+51 1 234 5678',
    isActive: true,
  },
  {
    id: 'cst_2',
    documentType: '1',
    documentNumber: '12345678',
    name: 'Juan Perez Garcia',
    email: 'juan.perez@email.com',
    phone: '+51 999 888 777',
    isActive: true,
  },
  {
    id: 'cst_3',
    documentType: '6',
    documentNumber: '20456789012',
    name: 'Empresa XYZ E.I.R.L.',
    email: 'ventas@xyz.com',
    phone: '+51 1 456 7890',
    isActive: false,
  },
]

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">
            Gestiona tu cartera de clientes
          </p>
        </div>
        <Link href="/customers/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>
            Todos tus clientes registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefono</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{customer.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatDocument(customer.documentType, customer.documentNumber)}
                  </TableCell>
                  <TableCell>{customer.email || '-'}</TableCell>
                  <TableCell>{customer.phone || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={customer.isActive ? 'success' : 'secondary'}>
                      {customer.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/customers/${customer.id}/edit`}>
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
