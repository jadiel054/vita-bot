/**
 * VitaBot — Configuração de Pagamento
 *
 * Configure aqui suas chaves PIX e links de checkout para cada plano.
 * Suporta PIX (chave aleatória, CPF, CNPJ, e-mail ou telefone) e links externos.
 *
 * COMO CONFIGURAR:
 * 1. Substitua OWNER_PIX_KEY pela sua chave PIX real
 * 2. Substitua os links de checkout pelos links do seu gateway (ex: Stripe, Hotmart, Kiwify, PagSeguro)
 * 3. Em produção, use variáveis de ambiente para não expor dados sensíveis
 */

export interface PaymentConfig {
  /** Chave PIX do recebedor */
  pixKey: string;
  /** Nome que aparece no comprovante PIX */
  pixReceiverName: string;
  /** Cidade do recebedor (obrigatório no padrão PIX) */
  pixCity: string;
  /** Links de checkout externo por plano (opcional) */
  checkoutLinks: {
    pro: string;
    premium: string;
  };
  /** Número WhatsApp para contato comercial */
  whatsappSales: string;
}

/**
 * Configuração principal de pagamento.
 * Edite os valores abaixo com suas informações reais.
 */
export const PAYMENT_CONFIG: PaymentConfig = {
  // ── PIX ───────────────────────────────────────────────────────────────────
  // Substitua pela sua chave PIX (CPF, CNPJ, e-mail, telefone ou chave aleatória)
  pixKey: process.env.EXPO_PUBLIC_PIX_KEY ?? "+5549999940482",
  pixReceiverName: process.env.EXPO_PUBLIC_PIX_RECEIVER_NAME ?? "VitaBot Saude",
  pixCity: process.env.EXPO_PUBLIC_PIX_CITY ?? "Chapeco",

  // ── Links de Checkout ─────────────────────────────────────────────────────
  // Substitua pelos links do seu gateway de pagamento
  checkoutLinks: {
    pro: process.env.EXPO_PUBLIC_CHECKOUT_PRO ?? "",
    premium: process.env.EXPO_PUBLIC_CHECKOUT_PREMIUM ?? "",
  },

  // ── WhatsApp Comercial ────────────────────────────────────────────────────
  whatsappSales: process.env.EXPO_PUBLIC_WHATSAPP_SALES ?? "+5549999940482",
};

/**
 * Gera o payload PIX (padrão EMV/BR Code) para pagamento.
 * Compatível com todos os bancos e apps de pagamento brasileiros.
 */
export function generatePixPayload(
  pixKey: string,
  receiverName: string,
  city: string,
  amount: number,
  description: string
): string {
  const sanitize = (str: string) =>
    str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .trim()
      .substring(0, 25);

  const sanitizedName = sanitize(receiverName);
  const sanitizedCity = sanitize(city);
  const sanitizedDesc = sanitize(description).substring(0, 20);

  const formatField = (id: string, value: string) => {
    const len = value.length.toString().padStart(2, "0");
    return `${id}${len}${value}`;
  };

  const amountStr = amount.toFixed(2);

  // Merchant Account Info (ID 26)
  const gui = formatField("00", "br.gov.bcb.pix");
  const key = formatField("01", pixKey);
  const additionalData = description ? formatField("02", sanitizedDesc) : "";
  const merchantAccountInfo = formatField("26", gui + key + additionalData);

  // Additional Data Field (ID 62)
  const txid = formatField("05", "***");
  const additionalDataField = formatField("62", txid);

  // Build payload (without CRC)
  const payload =
    formatField("00", "01") + // Payload format indicator
    merchantAccountInfo +
    formatField("52", "0000") + // Merchant category code
    formatField("53", "986") + // Transaction currency (BRL)
    formatField("54", amountStr) + // Transaction amount
    formatField("58", "BR") + // Country code
    formatField("59", sanitizedName) + // Merchant name
    formatField("60", sanitizedCity) + // Merchant city
    additionalDataField +
    "6304"; // CRC placeholder

  // CRC16 CCITT calculation
  const crc = crc16(payload);
  return payload + crc.toString(16).toUpperCase().padStart(4, "0");
}

function crc16(str: string): number {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
    }
    crc &= 0xffff;
  }
  return crc;
}

/**
 * Gera o link de WhatsApp para contato comercial.
 */
export function getWhatsAppSalesLink(planName: string, price: string): string {
  const message = encodeURIComponent(
    `Olá! Tenho interesse em assinar o plano ${planName} do VitaBot por ${price}/mês. Poderia me ajudar?`
  );
  const phone = PAYMENT_CONFIG.whatsappSales.replace(/\D/g, "");
  return `https://wa.me/${phone}?text=${message}`;
}
