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
  formatDate,
} from '@factupe/ui'
import { Plus, FileText, Download, Eye } from 'lucide-react'
import { listDocuments } from '@/actions/documents'

export const metadata = {
  title: 'Documentos',
}

const documentTypeLabels: Record<string, string> = {
  '01': 'Factura',
  '03': 'Boleta',
  '07': 'Nota Credito',
  '08': 'Nota Debito',
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' }> = {
  draft: { label: 'Borrador', variant: 'default' },
  pending: { label: 'Pendiente', variant: 'warning' },
  sent: { label: 'Enviado', variant: 'default' },
  accepted: { label: 'Aceptado', variant: 'success' },
  rejected: { label: 'Rechazado', variant: 'destructive' },
  voided: { label: 'Anulado', variant: 'destructive' },
}

export default async function DocumentsPage() {
  const { data: documents = [] } = await listDocuments()
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documentos</h1>
          <p className="text-muted-foreground">
            Gestiona tus comprobantes electronicos
          </p>
        </div>
        <Link href="/documents/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Documento
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Documentos</CardTitle>
          <CardDescription>
            Todos tus comprobantes electronicos emitidos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Documento</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No hay documentos emitidos
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((doc) => {
                  const status = statusLabels[doc.status] || statusLabels.draft
                  return (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {doc.series}-{doc.number}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {documentTypeLabels[doc.type] || doc.type}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{doc.customer?.name || '-'}</TableCell>
                      <TableCell>{formatDate(doc.issueDate)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(doc.total), doc.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/documents/${doc.id}`}>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
