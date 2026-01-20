/**
 * Summary Documents Builder
 *
 * Generates XML for SUNAT summary documents:
 * - Resumen Diario (Daily Summary) - For boletas and their notes
 * - Comunicación de Baja (Voided Documents) - For canceling documents
 *
 * @module sunat/builders/summary-builder
 */

import { formatDate, formatTime } from '../utils/date'
import type { DocumentWithItems } from '../types'

/**
 * Summary document item
 */
export interface SummaryItem {
  documentType: string
  series: string
  startNumber: string
  endNumber: string
  totalAmount: number
  taxableAmount: number
  igvAmount: number
  exemptAmount?: number
  unaffectedAmount?: number
  freeAmount?: number
  otherCharges?: number
  currency: string
  customerDocumentType: string
  customerDocumentNumber: string
  status: '1' | '2' | '3' // 1: Adicionar, 2: Modificar, 3: Anulado
  referenceDocument?: {
    type: string
    series: string
    number: string
  }
}

/**
 * Voided document item
 */
export interface VoidedItem {
  documentType: string
  series: string
  number: string
  reason: string
}

/**
 * Summary Documents Builder
 */
export class SummaryBuilder {
  private readonly UBL_VERSION = '2.0'
  private readonly CUSTOMIZATION_ID = '1.1'

  /**
   * Build Daily Summary XML (Resumen Diario)
   *
   * @param issuerRuc - Issuer's RUC
   * @param issuerName - Issuer's name
   * @param referenceDate - Date of the summarized documents
   * @param correlative - Summary correlative number (1, 2, 3...)
   * @param items - Summary items
   * @returns XML string
   */
  buildDailySummary(
    issuerRuc: string,
    issuerName: string,
    referenceDate: Date,
    correlative: number,
    items: SummaryItem[]
  ): string {
    const today = new Date()
    const refDateStr = formatDate(referenceDate)
    const issueDateStr = formatDate(today)
    const issueTimeStr = formatTime(today)
    const correlativeStr = String(correlative).padStart(5, '0')
    const summaryId = `RC-${refDateStr.replace(/-/g, '')}-${correlativeStr}`

    return `<?xml version="1.0" encoding="UTF-8"?>
<SummaryDocuments xmlns="urn:sunat:names:specification:ubl:peru:schema:xsd:SummaryDocuments-1"
                  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
                  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
                  xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"
                  xmlns:sac="urn:sunat:names:specification:ubl:peru:schema:xsd:SunatAggregateComponents-1">
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent/>
    </ext:UBLExtension>
  </ext:UBLExtensions>
  <cbc:UBLVersionID>${this.UBL_VERSION}</cbc:UBLVersionID>
  <cbc:CustomizationID>${this.CUSTOMIZATION_ID}</cbc:CustomizationID>
  <cbc:ID>${summaryId}</cbc:ID>
  <cbc:ReferenceDate>${refDateStr}</cbc:ReferenceDate>
  <cbc:IssueDate>${issueDateStr}</cbc:IssueDate>
  <cac:Signature>
    <cbc:ID>IDSign${issuerRuc}</cbc:ID>
    <cac:SignatoryParty>
      <cac:PartyIdentification>
        <cbc:ID>${issuerRuc}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name><![CDATA[${issuerName}]]></cbc:Name>
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
        <cbc:ID schemeID="6">${issuerRuc}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName><![CDATA[${issuerName}]]></cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  ${items.map((item, index) => this.buildSummaryLine(item, index + 1)).join('\n')}
</SummaryDocuments>`
  }

  /**
   * Build Voided Documents XML (Comunicación de Baja)
   *
   * @param issuerRuc - Issuer's RUC
   * @param issuerName - Issuer's name
   * @param issueDate - Issue date of original documents
   * @param correlative - Void communication correlative
   * @param items - Items to void
   * @returns XML string
   */
  buildVoidedDocuments(
    issuerRuc: string,
    issuerName: string,
    issueDate: Date,
    correlative: number,
    items: VoidedItem[]
  ): string {
    const today = new Date()
    const refDateStr = formatDate(issueDate)
    const issueDateStr = formatDate(today)
    const correlativeStr = String(correlative).padStart(5, '0')
    const voidId = `RA-${issueDateStr.replace(/-/g, '')}-${correlativeStr}`

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
  <cbc:ID>${voidId}</cbc:ID>
  <cbc:ReferenceDate>${refDateStr}</cbc:ReferenceDate>
  <cbc:IssueDate>${issueDateStr}</cbc:IssueDate>
  <cac:Signature>
    <cbc:ID>IDSign${issuerRuc}</cbc:ID>
    <cac:SignatoryParty>
      <cac:PartyIdentification>
        <cbc:ID>${issuerRuc}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name><![CDATA[${issuerName}]]></cbc:Name>
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
        <cbc:ID schemeID="6">${issuerRuc}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName><![CDATA[${issuerName}]]></cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  ${items.map((item, index) => this.buildVoidedLine(item, index + 1)).join('\n')}
</VoidedDocuments>`
  }

  private buildSummaryLine(item: SummaryItem, lineNumber: number): string {
    return `  <sac:SummaryDocumentsLine>
    <cbc:LineID>${lineNumber}</cbc:LineID>
    <cbc:DocumentTypeCode>${item.documentType}</cbc:DocumentTypeCode>
    <cbc:ID>${item.series}-${item.startNumber}</cbc:ID>
    <cac:AccountingCustomerParty>
      <cac:Party>
        <cac:PartyIdentification>
          <cbc:ID schemeID="${item.customerDocumentType}">${item.customerDocumentNumber}</cbc:ID>
        </cac:PartyIdentification>
      </cac:Party>
    </cac:AccountingCustomerParty>
    ${item.referenceDocument ? `<cac:BillingReference>
      <cac:InvoiceDocumentReference>
        <cbc:ID>${item.referenceDocument.series}-${item.referenceDocument.number}</cbc:ID>
        <cbc:DocumentTypeCode>${item.referenceDocument.type}</cbc:DocumentTypeCode>
      </cac:InvoiceDocumentReference>
    </cac:BillingReference>` : ''}
    <cac:Status>
      <cbc:ConditionCode>${item.status}</cbc:ConditionCode>
    </cac:Status>
    <sac:TotalAmount currencyID="${item.currency}">${item.totalAmount.toFixed(2)}</sac:TotalAmount>
    ${item.taxableAmount > 0 ? `<sac:BillingPayment>
      <cbc:PaidAmount currencyID="${item.currency}">${item.taxableAmount.toFixed(2)}</cbc:PaidAmount>
      <cbc:InstructionID>01</cbc:InstructionID>
    </sac:BillingPayment>` : ''}
    ${(item.exemptAmount || 0) > 0 ? `<sac:BillingPayment>
      <cbc:PaidAmount currencyID="${item.currency}">${item.exemptAmount!.toFixed(2)}</cbc:PaidAmount>
      <cbc:InstructionID>02</cbc:InstructionID>
    </sac:BillingPayment>` : ''}
    ${(item.unaffectedAmount || 0) > 0 ? `<sac:BillingPayment>
      <cbc:PaidAmount currencyID="${item.currency}">${item.unaffectedAmount!.toFixed(2)}</cbc:PaidAmount>
      <cbc:InstructionID>03</cbc:InstructionID>
    </sac:BillingPayment>` : ''}
    ${(item.freeAmount || 0) > 0 ? `<sac:BillingPayment>
      <cbc:PaidAmount currencyID="${item.currency}">${item.freeAmount!.toFixed(2)}</cbc:PaidAmount>
      <cbc:InstructionID>05</cbc:InstructionID>
    </sac:BillingPayment>` : ''}
    ${(item.otherCharges || 0) > 0 ? `<cac:AllowanceCharge>
      <cbc:ChargeIndicator>true</cbc:ChargeIndicator>
      <cbc:Amount currencyID="${item.currency}">${item.otherCharges!.toFixed(2)}</cbc:Amount>
    </cac:AllowanceCharge>` : ''}
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="${item.currency}">${item.igvAmount.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="${item.currency}">${item.taxableAmount.toFixed(2)}</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="${item.currency}">${item.igvAmount.toFixed(2)}</cbc:TaxAmount>
        <cac:TaxCategory>
          <cac:TaxScheme>
            <cbc:ID>1000</cbc:ID>
            <cbc:Name>IGV</cbc:Name>
            <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>
    </cac:TaxTotal>
  </sac:SummaryDocumentsLine>`
  }

  private buildVoidedLine(item: VoidedItem, lineNumber: number): string {
    return `  <sac:VoidedDocumentsLine>
    <cbc:LineID>${lineNumber}</cbc:LineID>
    <cbc:DocumentTypeCode>${item.documentType}</cbc:DocumentTypeCode>
    <sac:DocumentSerialID>${item.series}</sac:DocumentSerialID>
    <sac:DocumentNumberID>${item.number}</sac:DocumentNumberID>
    <sac:VoidReasonDescription><![CDATA[${item.reason}]]></sac:VoidReasonDescription>
  </sac:VoidedDocumentsLine>`
  }
}

/**
 * Create a daily summary from documents
 */
export function createDailySummary(
  documents: DocumentWithItems[],
  issuerRuc: string,
  issuerName: string,
  referenceDate: Date,
  correlative: number
): string {
  const builder = new SummaryBuilder()

  const items: SummaryItem[] = documents.map((doc) => ({
    documentType: doc.type,
    series: doc.series,
    startNumber: doc.number,
    endNumber: doc.number,
    totalAmount: parseFloat(doc.total),
    taxableAmount: parseFloat(doc.taxableAmount),
    igvAmount: parseFloat(doc.igv),
    exemptAmount: parseFloat(doc.exemptAmount || '0'),
    unaffectedAmount: parseFloat(doc.unaffectedAmount || '0'),
    freeAmount: parseFloat(doc.freeAmount || '0'),
    currency: doc.currency,
    customerDocumentType: doc.customer?.documentType || '1',
    customerDocumentNumber: doc.customer?.documentNumber || '-',
    status: '1' as const, // Add
    referenceDocument: doc.referenceDocumentNumber
      ? {
          type: doc.referenceDocumentType || '03',
          series: doc.referenceDocumentNumber.split('-')[0],
          number: doc.referenceDocumentNumber.split('-')[1],
        }
      : undefined,
  }))

  return builder.buildDailySummary(issuerRuc, issuerName, referenceDate, correlative, items)
}

/**
 * Create voided documents communication
 */
export function createVoidedCommunication(
  documents: Array<{ type: string; series: string; number: string; reason: string }>,
  issuerRuc: string,
  issuerName: string,
  issueDate: Date,
  correlative: number
): string {
  const builder = new SummaryBuilder()

  const items: VoidedItem[] = documents.map((doc) => ({
    documentType: doc.type,
    series: doc.series,
    number: doc.number,
    reason: doc.reason,
  }))

  return builder.buildVoidedDocuments(issuerRuc, issuerName, issueDate, correlative, items)
}

export { SummaryBuilder }
