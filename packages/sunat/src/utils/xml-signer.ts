/**
 * XML Digital Signature
 *
 * Sign XML documents with digital certificates for SUNAT.
 * Uses XMLDSig standard with RSA-SHA256.
 *
 * @module sunat/utils/xml-signer
 */

import * as crypto from 'crypto'
import * as forge from 'node-forge'

export interface CertificateInfo {
  certificate: string
  privateKey: string
  issuer: string
  subject: string
  validFrom: Date
  validTo: Date
}

export interface SignatureOptions {
  certificatePath?: string
  certificateBase64?: string
  certificatePassword: string
}

/**
 * Load certificate from PFX/P12 file
 */
export function loadCertificate(
  pfxBuffer: Buffer,
  password: string
): CertificateInfo {
  const p12Asn1 = forge.asn1.fromDer(pfxBuffer.toString('binary'))
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password)

  // Get certificate
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })
  const certBag = certBags[forge.pki.oids.certBag]?.[0]

  if (!certBag || !certBag.cert) {
    throw new Error('No certificate found in PFX file')
  }

  // Get private key
  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })
  const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]

  if (!keyBag || !keyBag.key) {
    throw new Error('No private key found in PFX file')
  }

  const cert = certBag.cert
  const privateKey = keyBag.key

  return {
    certificate: forge.pki.certificateToPem(cert),
    privateKey: forge.pki.privateKeyToPem(privateKey),
    issuer: cert.issuer.attributes.map((a: any) => `${a.shortName}=${a.value}`).join(', '),
    subject: cert.subject.attributes.map((a: any) => `${a.shortName}=${a.value}`).join(', '),
    validFrom: cert.validity.notBefore,
    validTo: cert.validity.notAfter,
  }
}

/**
 * Sign XML document with digital certificate
 *
 * @param xml - XML string to sign
 * @param certInfo - Certificate information
 * @returns Signed XML string
 */
export function signXML(xml: string, certInfo: CertificateInfo): string {
  // Find the ExtensionContent element to insert the signature
  const extensionContentRegex = /<ext:ExtensionContent\s*\/?>(\s*<\/ext:ExtensionContent>)?/
  const match = xml.match(extensionContentRegex)

  if (!match) {
    throw new Error('ExtensionContent element not found in XML')
  }

  // Calculate digest of the document (without signature)
  const canonicalXml = canonicalize(xml)
  const digest = calculateDigest(canonicalXml)

  // Create SignedInfo
  const signedInfo = createSignedInfo(digest)

  // Sign the SignedInfo
  const signature = signData(canonicalize(signedInfo), certInfo.privateKey)

  // Get certificate in base64 (without PEM headers)
  const certBase64 = certInfo.certificate
    .replace(/-----BEGIN CERTIFICATE-----/g, '')
    .replace(/-----END CERTIFICATE-----/g, '')
    .replace(/\r?\n/g, '')

  // Build complete signature element
  const signatureElement = `<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Id="SignatureSP">
  ${signedInfo}
  <ds:SignatureValue>${signature}</ds:SignatureValue>
  <ds:KeyInfo>
    <ds:X509Data>
      <ds:X509Certificate>${certBase64}</ds:X509Certificate>
    </ds:X509Data>
  </ds:KeyInfo>
</ds:Signature>`

  // Insert signature into ExtensionContent
  const signedXml = xml.replace(
    extensionContentRegex,
    `<ext:ExtensionContent>\n        ${signatureElement}\n      </ext:ExtensionContent>`
  )

  return signedXml
}

/**
 * Create SignedInfo element
 */
function createSignedInfo(digest: string): string {
  return `<ds:SignedInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
    <ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
    <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
    <ds:Reference URI="">
      <ds:Transforms>
        <ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
      </ds:Transforms>
      <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
      <ds:DigestValue>${digest}</ds:DigestValue>
    </ds:Reference>
  </ds:SignedInfo>`
}

/**
 * Calculate SHA-256 digest
 */
function calculateDigest(data: string): string {
  const hash = crypto.createHash('sha256')
  hash.update(data, 'utf8')
  return hash.digest('base64')
}

/**
 * Sign data with private key using RSA-SHA256
 */
function signData(data: string, privateKeyPem: string): string {
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(data, 'utf8')
  return sign.sign(privateKeyPem, 'base64')
}

/**
 * Simple XML canonicalization (C14N)
 * Note: For production, use a proper XML canonicalization library
 */
function canonicalize(xml: string): string {
  // Remove XML declaration
  let canonical = xml.replace(/<\?xml[^?]*\?>\s*/g, '')

  // Normalize whitespace in tags (simplified)
  canonical = canonical
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .replace(/\s+>/g, '>')
    .replace(/<\s+/g, '<')

  return canonical.trim()
}

/**
 * Get hash code from signed XML (for QR and verification)
 */
export function getHashFromSignedXml(signedXml: string): string {
  const digestMatch = signedXml.match(/<ds:DigestValue>([^<]+)<\/ds:DigestValue>/)
  return digestMatch ? digestMatch[1] : ''
}

/**
 * Verify XML signature
 */
export function verifyXMLSignature(signedXml: string): boolean {
  try {
    // Extract signature value
    const signatureMatch = signedXml.match(/<ds:SignatureValue>([^<]+)<\/ds:SignatureValue>/)
    if (!signatureMatch) return false

    // Extract certificate
    const certMatch = signedXml.match(/<ds:X509Certificate>([^<]+)<\/ds:X509Certificate>/)
    if (!certMatch) return false

    // Extract SignedInfo
    const signedInfoMatch = signedXml.match(/<ds:SignedInfo[^>]*>[\s\S]*?<\/ds:SignedInfo>/)
    if (!signedInfoMatch) return false

    const signatureValue = signatureMatch[1]
    const certBase64 = certMatch[1]
    const signedInfo = signedInfoMatch[0]

    // Convert certificate to PEM
    const certPem = `-----BEGIN CERTIFICATE-----\n${certBase64}\n-----END CERTIFICATE-----`

    // Verify signature
    const verify = crypto.createVerify('RSA-SHA256')
    verify.update(canonicalize(signedInfo), 'utf8')

    return verify.verify(certPem, signatureValue, 'base64')
  } catch {
    return false
  }
}
