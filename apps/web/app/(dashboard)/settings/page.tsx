import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
} from '@factupe/ui'

export const metadata = {
  title: 'Configuracion',
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuracion</h1>
        <p className="text-muted-foreground">
          Configura tu empresa y preferencias del sistema
        </p>
      </div>

      <div className="grid gap-6">
        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informacion de la Empresa</CardTitle>
            <CardDescription>
              Datos de tu empresa para los comprobantes electronicos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ruc">RUC</Label>
                <Input id="ruc" defaultValue="20123456789" disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Razon Social</Label>
                <Input id="name" defaultValue="Empresa Demo S.A.C." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tradeName">Nombre Comercial</Label>
                <Input id="tradeName" defaultValue="Demo Company" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electronico</Label>
                <Input id="email" type="email" defaultValue="demo@factupe.com" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Direccion Fiscal</Label>
                <Input id="address" defaultValue="Av. Principal 123, Lima" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button>Guardar Cambios</Button>
            </div>
          </CardContent>
        </Card>

        {/* SUNAT Config */}
        <Card>
          <CardHeader>
            <CardTitle>Configuracion SUNAT</CardTitle>
            <CardDescription>
              Credenciales y configuracion para envio a SUNAT
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="userSol">Usuario SOL</Label>
                <Input id="userSol" placeholder="MODDATOS" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passwordSol">Clave SOL</Label>
                <Input id="passwordSol" type="password" placeholder="********" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="certificate">Certificado Digital</Label>
                <Input id="certificate" type="file" accept=".pfx,.p12" />
                <p className="text-xs text-muted-foreground">
                  Sube tu certificado digital (.pfx o .p12)
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button>Guardar Configuracion</Button>
            </div>
          </CardContent>
        </Card>

        {/* Document Series */}
        <Card>
          <CardHeader>
            <CardTitle>Series de Documentos</CardTitle>
            <CardDescription>
              Configura las series para tus comprobantes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">F001 - Facturas</p>
                  <p className="text-sm text-muted-foreground">
                    Correlativo actual: 00001
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Editar
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">B001 - Boletas</p>
                  <p className="text-sm text-muted-foreground">
                    Correlativo actual: 00012
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Editar
                </Button>
              </div>
              <Button variant="outline" className="w-full">
                Agregar Nueva Serie
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
