/**
 * UBL XML Builder
 *
 * Generates UBL 2.1 compliant XML for SUNAT electronic documents.
 *
 * @module sunat/builders/ubl-builder
 */

import type { UBLDocumentData, UBLLineItem } from '../types'
import { SUNAT_CATALOGS } from '../types'

/**
 * UBL 2.1 XML Builder for SUNAT documents
 *
 * @example
 * ```ts
 * const builder = new UBLBuilder()
 * const xml = builder.buildInvoice(documentData)
 * ```
 */
export class UBLBuilder {
  private readonly UBL_VERSION = '2.1'
  private readonly CUSTOMIZATION_ID = '2.0'

  /**
   * Build Invoice XML (Factura 01 or Boleta 03)
   */
  buildInvoice(data: UBLDocumentData): string {
    const isFactura = data.documentType === SUNAT_CATALOGS.DOCUMENT_TYPES.FACTURA
    const invoiceTypeCode = data.documentType

    return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent/>
    </ext:UBLExtension>
  </ext:UBLExtensions>
  <cbc:UBLVersionID>${this.UBL_VERSION}</cbc:UBLVersionID>
  <cbc:CustomizationID>${this.CUSTOMIZATION_ID}</cbc:CustomizationID>
  <cbc:ID>${data.series}-${data.number}</cbc:ID>
  <cbc:IssueDate>${data.issueDate}</cbc:IssueDate>
  <cbc:IssueTime>${data.issueTime}</cbc:IssueTime>
  ${data.dueDate ? `<cbc:DueDate>${data.dueDate}</cbc:DueDate>` : ''}
  <cbc:InvoiceTypeCode listID="0101">${invoiceTypeCode}</cbc:InvoiceTypeCode>
  ${data.observations ? `<cbc:Note><![CDATA[${data.observations}]]></cbc:Note>` : ''}
  ${this.buildLegends(data.legends || [])}
  <cbc:DocumentCurrencyCode>${data.currency}</cbc:DocumentCurrencyCode>
  ${this.buildSupplierParty(data)}
  ${this.buildCustomerParty(data)}
  ${this.buildTaxTotal(data)}
  ${this.buildLegalMonetaryTotal(data)}
  ${data.items.map((item) => this.buildInvoiceLine(item)).join('\n  ')}
</Invoice>`
  }

  /**
   * Build Credit Note XML
   */
  buildCreditNote(data: UBLDocumentData): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<CreditNote xmlns="urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2"
            xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
            xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
            xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent/>
    </ext:UBLExtension>
  </ext:UBLExtensions>
  <cbc:UBLVersionID>${this.UBL_VERSION}</cbc:UBLVersionID>
  <cbc:CustomizationID>${this.CUSTOMIZATION_ID}</cbc:CustomizationID>
  <cbc:ID>${data.series}-${data.number}</cbc:ID>
  <cbc:IssueDate>${data.issueDate}</cbc:IssueDate>
  <cbc:IssueTime>${data.issueTime}</cbc:IssueTime>
  ${data.observations ? `<cbc:Note><![CDATA[${data.observations}]]></cbc:Note>` : ''}
  ${this.buildLegends(data.legends || [])}
  <cbc:DocumentCurrencyCode>${data.currency}</cbc:DocumentCurrencyCode>
  ${this.buildDiscrepancyResponse(data)}
  ${this.buildBillingReference(data)}
  ${this.buildSupplierParty(data)}
  ${this.buildCustomerParty(data)}
  ${this.buildTaxTotal(data)}
  ${this.buildLegalMonetaryTotal(data)}
  ${data.items.map((item) => this.buildCreditNoteLine(item)).join('\n  ')}
</CreditNote>`
  }

  /**
   * Build Debit Note XML
   */
  buildDebitNote(data: UBLDocumentData): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<DebitNote xmlns="urn:oasis:names:specification:ubl:schema:xsd:DebitNote-2"
           xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
           xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
           xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent/>
    </ext:UBLExtension>
  </ext:UBLExtensions>
  <cbc:UBLVersionID>${this.UBL_VERSION}</cbc:UBLVersionID>
  <cbc:CustomizationID>${this.CUSTOMIZATION_ID}</cbc:CustomizationID>
  <cbc:ID>${data.series}-${data.number}</cbc:ID>
  <cbc:IssueDate>${data.issueDate}</cbc:IssueDate>
  <cbc:IssueTime>${data.issueTime}</cbc:IssueTime>
  ${data.observations ? `<cbc:Note><![CDATA[${data.observations}]]></cbc:Note>` : ''}
  ${this.buildLegends(data.legends || [])}
  <cbc:DocumentCurrencyCode>${data.currency}</cbc:DocumentCurrencyCode>
  ${this.buildDiscrepancyResponse(data)}
  ${this.buildBillingReference(data)}
  ${this.buildSupplierParty(data)}
  ${this.buildCustomerParty(data)}
  ${this.buildTaxTotal(data)}
  ${this.buildLegalMonetaryTotal(data)}
  ${data.items.map((item) => this.buildDebitNoteLine(item)).join('\n  ')}
</DebitNote>`
  }

  private buildSupplierParty(data: UBLDocumentData): string {
    return `<cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="6">${data.issuerRuc}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name><![CDATA[${data.issuerTradeName || data.issuerName}]]></cbc:Name>
      </cac:PartyName>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName><![CDATA[${data.issuerName}]]></cbc:RegistrationName>
        <cac:RegistrationAddress>
          <cbc:ID>${data.issuerUbigeo || '150101'}</cbc:ID>
          <cbc:AddressTypeCode>0000</cbc:AddressTypeCode>
          <cac:AddressLine>
            <cbc:Line><![CDATA[${data.issuerAddress || '-'}]]></cbc:Line>
          </cac:AddressLine>
        </cac:RegistrationAddress>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>`
  }

  private buildCustomerParty(data: UBLDocumentData): string {
    return `<cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="${data.customerDocumentType}">${data.customerDocumentNumber}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName><![CDATA[${data.customerName}]]></cbc:RegistrationName>
        ${
          data.customerAddress
            ? `<cac:RegistrationAddress>
          <cac:AddressLine>
            <cbc:Line><![CDATA[${data.customerAddress}]]></cbc:Line>
          </cac:AddressLine>
        </cac:RegistrationAddress>`
            : ''
        }
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>`
  }

  private buildTaxTotal(data: UBLDocumentData): string {
    const taxSubtotals: string[] = []

    // IGV
    if (data.igvAmount > 0 || data.taxableAmount > 0) {
      taxSubtotals.push(`<cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${data.currency}">${data.taxableAmount.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${data.currency}">${data.igvAmount.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cac:TaxScheme>
          <cbc:ID>1000</cbc:ID>
          <cbc:Name>IGV</cbc:Name>
          <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>`)
    }

    // Exonerated
    if (data.exemptAmount > 0) {
      taxSubtotals.push(`<cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${data.currency}">${data.exemptAmount.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${data.currency}">0.00</cbc:TaxAmount>
      <cac:TaxCategory>
        <cac:TaxScheme>
          <cbc:ID>9997</cbc:ID>
          <cbc:Name>EXO</cbc:Name>
          <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>`)
    }

    // Unaffected
    if (data.unaffectedAmount > 0) {
      taxSubtotals.push(`<cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${data.currency}">${data.unaffectedAmount.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${data.currency}">0.00</cbc:TaxAmount>
      <cac:TaxCategory>
        <cac:TaxScheme>
          <cbc:ID>9998</cbc:ID>
          <cbc:Name>INA</cbc:Name>
          <cbc:TaxTypeCode>FRE</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>`)
    }

    const totalTaxAmount = data.igvAmount + data.iscAmount + data.otherTaxes

    return `<cac:TaxTotal>
    <cbc:TaxAmount currencyID="${data.currency}">${totalTaxAmount.toFixed(2)}</cbc:TaxAmount>
    ${taxSubtotals.join('\n    ')}
  </cac:TaxTotal>`
  }

  private buildLegalMonetaryTotal(data: UBLDocumentData): string {
    const lineExtensionAmount = data.taxableAmount + data.exemptAmount + data.unaffectedAmount

    return `<cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${data.currency}">${lineExtensionAmount.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxInclusiveAmount currencyID="${data.currency}">${data.total.toFixed(2)}</cbc:TaxInclusiveAmount>
    ${data.globalDiscount > 0 ? `<cbc:AllowanceTotalAmount currencyID="${data.currency}">${data.globalDiscount.toFixed(2)}</cbc:AllowanceTotalAmount>` : ''}
    ${data.otherCharges > 0 ? `<cbc:ChargeTotalAmount currencyID="${data.currency}">${data.otherCharges.toFixed(2)}</cbc:ChargeTotalAmount>` : ''}
    <cbc:PayableAmount currencyID="${data.currency}">${data.total.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>`
  }

  private buildInvoiceLine(item: UBLLineItem): string {
    return `<cac:InvoiceLine>
    <cbc:ID>${item.id}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="${item.unitCode}">${item.quantity}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="PEN">${item.taxableAmount.toFixed(2)}</cbc:LineExtensionAmount>
    <cac:PricingReference>
      <cac:AlternativeConditionPrice>
        <cbc:PriceAmount currencyID="PEN">${item.unitPriceWithTax.toFixed(6)}</cbc:PriceAmount>
        <cbc:PriceTypeCode>${item.priceTypeCode}</cbc:PriceTypeCode>
      </cac:AlternativeConditionPrice>
    </cac:PricingReference>
    ${this.buildItemTaxTotal(item)}
    <cac:Item>
      <cbc:Description><![CDATA[${item.description}]]></cbc:Description>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="PEN">${item.unitPrice.toFixed(6)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`
  }

  private buildCreditNoteLine(item: UBLLineItem): string {
    return `<cac:CreditNoteLine>
    <cbc:ID>${item.id}</cbc:ID>
    <cbc:CreditedQuantity unitCode="${item.unitCode}">${item.quantity}</cbc:CreditedQuantity>
    <cbc:LineExtensionAmount currencyID="PEN">${item.taxableAmount.toFixed(2)}</cbc:LineExtensionAmount>
    <cac:PricingReference>
      <cac:AlternativeConditionPrice>
        <cbc:PriceAmount currencyID="PEN">${item.unitPriceWithTax.toFixed(6)}</cbc:PriceAmount>
        <cbc:PriceTypeCode>${item.priceTypeCode}</cbc:PriceTypeCode>
      </cac:AlternativeConditionPrice>
    </cac:PricingReference>
    ${this.buildItemTaxTotal(item)}
    <cac:Item>
      <cbc:Description><![CDATA[${item.description}]]></cbc:Description>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="PEN">${item.unitPrice.toFixed(6)}</cbc:PriceAmount>
    </cac:Price>
  </cac:CreditNoteLine>`
  }

  private buildDebitNoteLine(item: UBLLineItem): string {
    return `<cac:DebitNoteLine>
    <cbc:ID>${item.id}</cbc:ID>
    <cbc:DebitedQuantity unitCode="${item.unitCode}">${item.quantity}</cbc:DebitedQuantity>
    <cbc:LineExtensionAmount currencyID="PEN">${item.taxableAmount.toFixed(2)}</cbc:LineExtensionAmount>
    <cac:PricingReference>
      <cac:AlternativeConditionPrice>
        <cbc:PriceAmount currencyID="PEN">${item.unitPriceWithTax.toFixed(6)}</cbc:PriceAmount>
        <cbc:PriceTypeCode>${item.priceTypeCode}</cbc:PriceTypeCode>
      </cac:AlternativeConditionPrice>
    </cac:PricingReference>
    ${this.buildItemTaxTotal(item)}
    <cac:Item>
      <cbc:Description><![CDATA[${item.description}]]></cbc:Description>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="PEN">${item.unitPrice.toFixed(6)}</cbc:PriceAmount>
    </cac:Price>
  </cac:DebitNoteLine>`
  }

  private buildItemTaxTotal(item: UBLLineItem): string {
    const taxSchemeId = item.taxType === '10' ? '1000' : item.taxType === '20' ? '9997' : '9998'
    const taxSchemeName = item.taxType === '10' ? 'IGV' : item.taxType === '20' ? 'EXO' : 'INA'
    const taxTypeCode = item.taxType === '10' ? 'VAT' : item.taxType === '20' ? 'VAT' : 'FRE'

    return `<cac:TaxTotal>
      <cbc:TaxAmount currencyID="PEN">${item.taxAmount.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="PEN">${item.taxableAmount.toFixed(2)}</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="PEN">${item.taxAmount.toFixed(2)}</cbc:TaxAmount>
        <cac:TaxCategory>
          <cbc:Percent>${item.igvPercentage}</cbc:Percent>
          <cbc:TaxExemptionReasonCode>${item.taxType}</cbc:TaxExemptionReasonCode>
          <cac:TaxScheme>
            <cbc:ID>${taxSchemeId}</cbc:ID>
            <cbc:Name>${taxSchemeName}</cbc:Name>
            <cbc:TaxTypeCode>${taxTypeCode}</cbc:TaxTypeCode>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>
    </cac:TaxTotal>`
  }

  private buildLegends(legends: Array<{ code: string; value: string }>): string {
    if (legends.length === 0) return ''

    return legends
      .map(
        (legend) =>
          `<cbc:Note languageLocaleID="${legend.code}"><![CDATA[${legend.value}]]></cbc:Note>`
      )
      .join('\n  ')
  }

  private buildDiscrepancyResponse(data: UBLDocumentData): string {
    if (!data.noteReasonCode) return ''

    return `<cac:DiscrepancyResponse>
    <cbc:ReferenceID>${data.referenceDocumentNumber}</cbc:ReferenceID>
    <cbc:ResponseCode>${data.noteReasonCode}</cbc:ResponseCode>
    <cbc:Description><![CDATA[${data.noteReasonDescription || ''}]]></cbc:Description>
  </cac:DiscrepancyResponse>`
  }

  private buildBillingReference(data: UBLDocumentData): string {
    if (!data.referenceDocumentNumber) return ''

    return `<cac:BillingReference>
    <cac:InvoiceDocumentReference>
      <cbc:ID>${data.referenceDocumentNumber}</cbc:ID>
      <cbc:DocumentTypeCode>${data.referenceDocumentType}</cbc:DocumentTypeCode>
    </cac:InvoiceDocumentReference>
  </cac:BillingReference>`
  }
}
