/**
 * Direct SUNAT Adapter
 *
 * Communicates directly with SUNAT webservices via SOAP.
 * Supports both beta (testing) and production environments.
 *
 * @module sunat/adapters/direct
 */

import * as fs from 'fs'
import * as path from 'path'
import { BaseSunatAdapter } from '../base'
import type {
  SunatAdapter,
  SunatResponse,
  SunatStatusResponse,
  DocumentWithItems,
  AdapterConfig,
} from '../../types'
import { UBLBuilder, documentToUBLData } from '../../builders'
import { loadCertificate, signXML, getHashFromSignedXml } from '../../utils/xml-signer'
import { SoapClient } from './soap-client'
import { zipDocument, unzipResponse } from './zip-utils'

/**
 * SUNAT Webservice URLs
 */
const SUNAT_URLS = {
  beta: {
    invoice: 'https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService',
    retention: 'https://e-beta.sunat.gob.pe/ol-ti-itemision-otroscpe-gem-beta/billService',
    guia: 'https://e-beta.sunat.gob.pe/ol-ti-itemision-guia-gem-beta/billService',
    consultation: 'https://e-beta.sunat.gob.pe/ol-it-wsconscpegem-beta/billConsultService',
  },
  production: {
    invoice: 'https://e-factura.sunat.gob.pe/ol-ti-itcpfegem/billService',
    retention: 'https://e-factura.sunat.gob.pe/ol-ti-itemision-otroscpe-gem/billService',
    guia: 'https://e-factura.sunat.gob.pe/ol-ti-itemision-guia-gem/billService',
    consultation: 'https://e-factura.sunat.gob.pe/ol-it-wsconscpegem/billConsultService',
  },
}

/**
 * Configuration for direct SUNAT adapter
 */
export interface DirectAdapterConfig extends AdapterConfig {
  certificatePath: string
  certificatePassword: string
  userSol: string
  passwordSol: string
}

/**
 * Direct SUNAT Adapter
 *
 * @example
 * ```ts
 * const adapter = new DirectAdapter({
 *   environment: 'beta',
 *   ruc: '20123456789',
 *   userSol: 'MODDATOS',
 *   passwordSol: 'moddatos',
 *   certificatePath: '/path/to/certificate.pfx',
 *   certificatePassword: 'password',
 * })
 *
 * const response = await adapter.sendDocument(document)
 * ```
 */
export class DirectAdapter extends BaseSunatAdapter implements SunatAdapter {
  private config: DirectAdapterConfig
  private soapClient: SoapClient
  private certificate: ReturnType<typeof loadCertificate> | null = null

  constructor(config: DirectAdapterConfig) {
    super()
    this.config = config
    this.validateConfig()

    const urls = SUNAT_URLS[config.environment]
    this.soapClient = new SoapClient({
      ruc: config.ruc,
      userSol: config.userSol,
      passwordSol: config.passwordSol,
    })
  }

  getName(): string {
    return 'direct'
  }

  getSupportedDocuments(): string[] {
    return ['01', '03', '07', '08', '09', '20', '40']
  }

  /**
   * Send document to SUNAT
   */
  async sendDocument(document: DocumentWithItems): Promise<SunatResponse> {
    try {
      // 1. Load certificate if not loaded
      if (!this.certificate) {
        this.certificate = await this.loadCertificateFile()
      }

      // 2. Build UBL XML
      const builder = new UBLBuilder()
      const ublData = documentToUBLData(document)
      let xml: string

      switch (document.type) {
        case '01':
        case '03':
          xml = builder.buildInvoice(ublData)
          break
        case '07':
          xml = builder.buildCreditNote(ublData)
          break
        case '08':
          xml = builder.buildDebitNote(ublData)
          break
        default:
          throw new Error(`Unsupported document type: ${document.type}`)
      }

      // 3. Sign XML
      const signedXml = signXML(xml, this.certificate)
      const hash = getHashFromSignedXml(signedXml)

      // 4. Create filename
      const filename = `${this.config.ruc}-${document.type}-${document.series}-${document.number}`

      // 5. Zip the signed XML
      const zipBuffer = await zipDocument(filename, signedXml)

      // 6. Send to SUNAT via SOAP
      const url = this.getServiceUrl(document.type)
      const soapResponse = await this.soapClient.sendBill(url, filename, zipBuffer)

      // 7. Process response
      if (soapResponse.applicationResponse) {
        const cdrContent = await unzipResponse(Buffer.from(soapResponse.applicationResponse, 'base64'))
        const cdrResponse = this.parseCDR(cdrContent)

        return {
          success: cdrResponse.responseCode === '0',
          status: this.mapResponseCode(cdrResponse.responseCode),
          responseCode: cdrResponse.responseCode,
          responseMessage: cdrResponse.description,
          notes: cdrResponse.notes,
          hash,
          cdrData: soapResponse.applicationResponse,
          xmlSigned: signedXml,
        }
      }

      // Handle ticket-based response (for some document types)
      if (soapResponse.ticket) {
        return {
          success: true,
          status: 'pending',
          ticket: soapResponse.ticket,
          hash,
          xmlSigned: signedXml,
        }
      }

      throw new Error('Invalid SUNAT response')
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Query status by ticket
   */
  async queryStatus(ticket: string): Promise<SunatStatusResponse> {
    try {
      const url = SUNAT_URLS[this.config.environment].invoice
      const response = await this.soapClient.getStatus(url, ticket)

      if (response.applicationResponse) {
        const cdrContent = await unzipResponse(Buffer.from(response.applicationResponse, 'base64'))
        const cdrResponse = this.parseCDR(cdrContent)

        return {
          status: this.mapResponseCode(cdrResponse.responseCode),
          responseCode: cdrResponse.responseCode,
          responseMessage: cdrResponse.description,
          cdrData: response.applicationResponse,
        }
      }

      if (response.statusCode) {
        return {
          status: response.statusCode === '0' ? 'pending' : 'exception',
          responseCode: response.statusCode,
          responseMessage: response.statusMessage || 'Procesando',
        }
      }

      throw new Error('Invalid status response')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return {
        status: 'exception',
        responseCode: 'ERROR',
        responseMessage: errorMessage,
      }
    }
  }

  /**
   * Void document (send Comunicación de Baja)
   */
  async voidDocument(document: DocumentWithItems, reason: string): Promise<SunatResponse> {
    try {
      if (!this.certificate) {
        this.certificate = await this.loadCertificateFile()
      }

      // Build void communication XML
      const voidXml = this.buildVoidCommunication(document, reason)
      const signedXml = signXML(voidXml, this.certificate)

      // Generate filename for void communication
      const today = new Date()
      const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
      const correlative = '00001' // Should be managed
      const filename = `${this.config.ruc}-RA-${dateStr}-${correlative}`

      const zipBuffer = await zipDocument(filename, signedXml)
      const url = SUNAT_URLS[this.config.environment].invoice
      const response = await this.soapClient.sendSummary(url, filename, zipBuffer)

      if (response.ticket) {
        return {
          success: true,
          status: 'pending',
          ticket: response.ticket,
          responseMessage: 'Comunicación de baja enviada. Consulte el ticket para el resultado.',
        }
      }

      throw new Error('No ticket received from SUNAT')
    } catch (error) {
      return this.handleError(error)
    }
  }

  // === Private methods ===

  private validateConfig(): void {
    if (!this.config.ruc || this.config.ruc.length !== 11) {
      throw new Error('Invalid RUC')
    }
    if (!this.config.userSol) {
      throw new Error('SOL user is required')
    }
    if (!this.config.passwordSol) {
      throw new Error('SOL password is required')
    }
    if (!this.config.certificatePath) {
      throw new Error('Certificate path is required')
    }
    if (!this.config.certificatePassword) {
      throw new Error('Certificate password is required')
    }
  }

  private async loadCertificateFile() {
    const certPath = path.resolve(this.config.certificatePath)
    if (!fs.existsSync(certPath)) {
      throw new Error(`Certificate file not found: ${certPath}`)
    }

    const pfxBuffer = fs.readFileSync(certPath)
    return loadCertificate(pfxBuffer, this.config.certificatePassword)
  }

  private getServiceUrl(documentType: string): string {
    const urls = SUNAT_URLS[this.config.environment]

    switch (documentType) {
      case '01':
      case '03':
      case '07':
      case '08':
        return urls.invoice
      case '20':
      case '40':
        return urls.retention
      case '09':
      case '31':
        return urls.guia
      default:
        return urls.invoice
    }
  }

  private parseCDR(cdrXml: string): { responseCode: string; description: string; notes: string[] } {
    // Parse CDR XML to extract response code and description
    const responseCodeMatch = cdrXml.match(/<cbc:ResponseCode[^>]*>(\d+)<\/cbc:ResponseCode>/)
    const descriptionMatch = cdrXml.match(/<cbc:Description[^>]*>([^<]+)<\/cbc:Description>/)
    const notesMatches = cdrXml.matchAll(/<cbc:Note[^>]*>([^<]+)<\/cbc:Note>/g)

    const notes: string[] = []
    for (const match of notesMatches) {
      notes.push(match[1])
    }

    return {
      responseCode: responseCodeMatch ? responseCodeMatch[1] : 'ERROR',
      description: descriptionMatch ? descriptionMatch[1] : 'Unknown response',
      notes,
    }
  }

  private mapResponseCode(code: string): SunatResponse['status'] {
    const codeNum = parseInt(code, 10)

    if (code === '0') return 'accepted'
    if (codeNum >= 100 && codeNum <= 1999) return 'exception' // Exceptions
    if (codeNum >= 2000 && codeNum <= 3999) return 'rejected' // Errors
    if (codeNum >= 4000) return 'observed' // Observations (accepted with warnings)

    return 'exception'
  }

  private handleError(error: unknown): SunatResponse {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Check for specific SUNAT error codes
    const soapFaultMatch = errorMessage.match(/faultcode:\s*(\d+)/)
    if (soapFaultMatch) {
      return {
        success: false,
        status: 'exception',
        responseCode: soapFaultMatch[1],
        responseMessage: errorMessage,
      }
    }

    return {
      success: false,
      status: 'exception',
      responseCode: 'ERROR',
      responseMessage: errorMessage,
    }
  }

  private buildVoidCommunication(document: DocumentWithItems, reason: string): string {
    const today = new Date()
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const correlative = '00001'

    return `<?xml version="1.0" encoding="UTF-8"?>
<VoidedDocuments xmlns="urn:sunat:names:specification:ubl:peru:schema:xsd:VoidedDocuments-1"
                 xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
                 xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
                 xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"
                 xmlns:sac="urn:sunat:names:specification:ubl:peru:schema:xsd:SunatAggregateComponents-1">
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent/>
    </ext:UBLExtension>
  </ext:UBLExtensions>
  <cbc:UBLVersionID>2.0</cbc:UBLVersionID>
  <cbc:CustomizationID>1.0</cbc:CustomizationID>
  <cbc:ID>RA-${dateStr.replace(/-/g, '')}-${correlative}</cbc:ID>
  <cbc:ReferenceDate>${document.issueDate instanceof Date ? document.issueDate.toISOString().split('T')[0] : document.issueDate}</cbc:ReferenceDate>
  <cbc:IssueDate>${dateStr}</cbc:IssueDate>
  <cac:Signature>
    <cbc:ID>IDSign${this.config.ruc}</cbc:ID>
    <cac:SignatoryParty>
      <cac:PartyIdentification>
        <cbc:ID>${this.config.ruc}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name><![CDATA[${document.tenant?.name || ''}]]></cbc:Name>
      </cac:PartyName>
    </cac:SignatoryParty>
    <cac:DigitalSignatureAttachment>
      <cac:ExternalReference>
        <cbc:URI>#SignatureSP</cbc:URI>
      </cac:ExternalReference>
    </cac:DigitalSignatureAttachment>
  </cac:Signature>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="6">${this.config.ruc}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName><![CDATA[${document.tenant?.name || ''}]]></cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <sac:VoidedDocumentsLine>
    <cbc:LineID>1</cbc:LineID>
    <cbc:DocumentTypeCode>${document.type}</cbc:DocumentTypeCode>
    <sac:DocumentSerialID>${document.series}</sac:DocumentSerialID>
    <sac:DocumentNumberID>${document.number}</sac:DocumentNumberID>
    <sac:VoidReasonDescription><![CDATA[${reason}]]></sac:VoidReasonDescription>
  </sac:VoidedDocumentsLine>
</VoidedDocuments>`
  }
}
