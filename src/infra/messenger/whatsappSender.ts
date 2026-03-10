import type { Messenger } from './messenger.js';

interface WhatsAppConfig {
  apiUrl: string;
  phoneNumberId: string;
  accessToken: string;
  verifyToken?: string;
}

export class WhatsAppSender implements Messenger {
  private config: WhatsAppConfig | null = null;

  constructor() {
    const apiUrl = process.env.WHATSAPP_API_URL;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

    if (apiUrl && phoneNumberId && accessToken) {
      this.config = {
        apiUrl,
        phoneNumberId,
        accessToken,
        verifyToken,
      };
    }
  }

  isEnabled(): boolean {
    return this.config !== null;
  }

  getVerifyToken(): string | undefined {
    return this.config?.verifyToken;
  }

  async sendMessage(groupId: string, message: string): Promise<void> {
    if (!this.config) {
      const err = new Error('WhatsApp sender not configured');
      console.error('[WhatsAppSender] sendMessage failed:', err.message);
      throw err;
    }

    const url = `${this.config.apiUrl}/${this.config.phoneNumberId}/messages`;
    const to = groupId.replace(/\D/g, '');
    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: message },
    };

    console.log('[WhatsAppSender] enviando mensagem', {
      to: payload.to,
      bodyPreview: message.length > 60 ? `${message.slice(0, 60)}...` : message,
    });

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.accessToken}`,
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error('[WhatsAppSender] erro de rede ao chamar Meta:', err);
      throw err;
    }

    const responseText = await response.text();
    if (!response.ok) {
      console.error('[WhatsAppSender] resposta da Meta (erro)', {
        status: response.status,
        body: responseText,
      });
      throw new Error(
        `WhatsApp API error: ${response.status} - ${responseText}`
      );
    }

    console.log('[WhatsAppSender] mensagem enviada com sucesso', {
      to: payload.to,
      metaResponse: responseText.slice(0, 200),
    });
  }
}
