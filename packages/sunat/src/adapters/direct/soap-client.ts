/**
 * SOAP Client for SUNAT Webservices
 *
 * Handles SOAP communication with SUNAT's BillService and related services.
 *
 * @module sunat/adapters/direct/soap-client
 */

export interface SoapClientConfig {
  ruc: string
  userSol: string
  passwordSol: string
}

export interface SoapResponse {
  applicationResponse?: string
  ticket?: string
  statusCode?: string
  statusMessage?: string
}

/**
 * SOAP envelope templates for SUNAT services
 */
const SOAP_TEMPLATES = {
  sendBill: (user: string, password: string, filename: string, content: string) => `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:ser="http://service.sunat.gob.pe"
                  xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
  <soapenv:Header>
    <wsse:Security>
      <wsse:UsernameToken>
        <wsse:Username>${user}</wsse:Username>
        <wsse:Password>${password}</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>
  </soapenv:Header>
  <soapenv:Body>
    <ser:sendBill>
      <fileName>${filename}.zip</fileName>
      <contentFile>${content}</contentFile>
    </ser:sendBill>
  </soapenv:Body>
</soapenv:Envelope>`,

  sendSummary: (user: string, password: string, filename: string, content: string) => `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:ser="http://service.sunat.gob.pe"
                  xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
  <soapenv:Header>
    <wsse:Security>
      <wsse:UsernameToken>
        <wsse:Username>${user}</wsse:Username>
        <wsse:Password>${password}</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>
  </soapenv:Header>
  <soapenv:Body>
    <ser:sendSummary>
      <fileName>${filename}.zip</fileName>
      <contentFile>${content}</contentFile>
    </ser:sendSummary>
  </soapenv:Body>
</soapenv:Envelope>`,

  getStatus: (user: string, password: string, ticket: string) => `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:ser="http://service.sunat.gob.pe"
                  xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
  <soapenv:Header>
    <wsse:Security>
      <wsse:UsernameToken>
        <wsse:Username>${user}</wsse:Username>
        <wsse:Password>${password}</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>
  </soapenv:Header>
  <soapenv:Body>
    <ser:getStatus>
      <ticket>${ticket}</ticket>
    </ser:getStatus>
  </soapenv:Body>
</soapenv:Envelope>`,

  getStatusCdr: (user: string, password: string, ruc: string, tipo: string, serie: string, numero: string) => `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:ser="http://service.sunat.gob.pe"
                  xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
  <soapenv:Header>
    <wsse:Security>
      <wsse:UsernameToken>
        <wsse:Username>${user}</wsse:Username>
        <wsse:Password>${password}</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>
  </soapenv:Header>
  <soapenv:Body>
    <ser:getStatusCdr>
      <rucComprobante>${ruc}</rucComprobante>
      <tipoComprobante>${tipo}</tipoComprobante>
      <serieComprobante>${serie}</serieComprobante>
      <numeroComprobante>${numero}</numeroComprobante>
    </ser:getStatusCdr>
  </soapenv:Body>
</soapenv:Envelope>`,
}

/**
 * SOAP Client for SUNAT services
 */
export class SoapClient {
  private user: string
  private password: string

  constructor(config: SoapClientConfig) {
    // Format: RUC + USER_SOL
    this.user = `${config.ruc}${config.userSol}`
    this.password = config.passwordSol
  }

  /**
   * Send bill (Factura, Boleta, NC, ND)
   */
  async sendBill(url: string, filename: string, zipContent: Buffer): Promise<SoapResponse> {
    const base64Content = zipContent.toString('base64')
    const envelope = SOAP_TEMPLATES.sendBill(this.user, this.password, filename, base64Content)

    const response = await this.executeRequest(url, envelope, 'sendBill')
    return this.parseResponse(response, 'sendBillResponse')
  }

  /**
   * Send summary (Resumen Diario, Comunicación de Baja)
   */
  async sendSummary(url: string, filename: string, zipContent: Buffer): Promise<SoapResponse> {
    const base64Content = zipContent.toString('base64')
    const envelope = SOAP_TEMPLATES.sendSummary(this.user, this.password, filename, base64Content)

    const response = await this.executeRequest(url, envelope, 'sendSummary')
    return this.parseResponse(response, 'sendSummaryResponse')
  }

  /**
   * Get status by ticket
   */
  async getStatus(url: string, ticket: string): Promise<SoapResponse> {
    const envelope = SOAP_TEMPLATES.getStatus(this.user, this.password, ticket)
    const response = await this.executeRequest(url, envelope, 'getStatus')
    return this.parseResponse(response, 'getStatusResponse')
  }

  /**
   * Get CDR by document details
   */
  async getStatusCdr(
    url: string,
    ruc: string,
    tipo: string,
    serie: string,
    numero: string
  ): Promise<SoapResponse> {
    const envelope = SOAP_TEMPLATES.getStatusCdr(this.user, this.password, ruc, tipo, serie, numero)
    const response = await this.executeRequest(url, envelope, 'getStatusCdr')
    return this.parseResponse(response, 'getStatusCdrResponse')
  }

  /**
   * Execute SOAP request
   */
  private async executeRequest(url: string, envelope: string, action: string): Promise<string> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `urn:${action}`,
        'Accept': 'text/xml',
      },
      body: envelope,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`SOAP request failed: ${response.status} - ${errorText}`)
    }

    return response.text()
  }

  /**
   * Parse SOAP response
   */
  private parseResponse(xml: string, responseTag: string): SoapResponse {
    // Check for SOAP Fault
    const faultMatch = xml.match(/<faultcode>([^<]+)<\/faultcode>[\s\S]*?<faultstring>([^<]+)<\/faultstring>/)
    if (faultMatch) {
      throw new Error(`SOAP Fault [${faultMatch[1]}]: ${faultMatch[2]}`)
    }

    const result: SoapResponse = {}

    // Extract applicationResponse (CDR in base64)
    const appResponseMatch = xml.match(/<applicationResponse>([^<]+)<\/applicationResponse>/)
    if (appResponseMatch) {
      result.applicationResponse = appResponseMatch[1]
    }

    // Extract ticket (for async operations)
    const ticketMatch = xml.match(/<ticket>([^<]+)<\/ticket>/)
    if (ticketMatch) {
      result.ticket = ticketMatch[1]
    }

    // Extract status code
    const statusCodeMatch = xml.match(/<statusCode>([^<]+)<\/statusCode>/)
    if (statusCodeMatch) {
      result.statusCode = statusCodeMatch[1]
    }

    // Extract status message
    const statusMessageMatch = xml.match(/<statusMessage>([^<]+)<\/statusMessage>/)
    if (statusMessageMatch) {
      result.statusMessage = statusMessageMatch[1]
    }

    // Extract content (for getStatusCdr)
    const contentMatch = xml.match(/<content>([^<]+)<\/content>/)
    if (contentMatch) {
      result.applicationResponse = contentMatch[1]
    }

    return result
  }
}
