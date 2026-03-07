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
      throw new Error('WhatsApp sender not configured');
    }

    const url = `${this.config.apiUrl}/${this.config.phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: groupId,
        type: 'text',
        text: {
          body: message,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WhatsApp API error: ${response.status} - ${error}`);
    }
  }
}
