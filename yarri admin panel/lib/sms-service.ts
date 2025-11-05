interface GupshupConfig {
  userid: string;
  password: string;
  baseUrl: string;
  mask?: string; // Sender ID
  dltTemplateId?: string; // DLT Template ID (URN)
  dltEntityId?: string; // DLT Entity ID (optional)
}

interface SMSResponse {
  success: boolean;
  message?: string;
  error?: string;
  messageId?: string;
}

class SMSService {
  private config: GupshupConfig;

  constructor() {
    // Prefer environment variables; fallback to existing values for dev
    this.config = {
      userid: process.env.GUPSHUP_USERID || '2000260873',
      password: process.env.GUPSHUP_PASSWORD || '*v$4g3My',
      baseUrl: process.env.GUPSHUP_BASE_URL || 'https://enterprise.smsgupshup.com',
      mask: process.env.GUPSHUP_MASK || 'YAARI',
      dltTemplateId: process.env.DLT_TEMPLATE_ID || '1707176166167640000',
      dltEntityId: process.env.DLT_ENTITY_ID || undefined,
    };
  }

  async sendOTP(phoneNumber: string, otp: string): Promise<SMSResponse> {
    try {
      // Format phone number - ensure it starts with 91 for India
      const formattedPhone = phoneNumber.startsWith('91') 
        ? phoneNumber 
        : `91${phoneNumber.replace(/^\+?91/, '')}`;

      // DLT template exact text from CSV (with newline):
      // "Dear Yaari User,\n The OTP for login is @__123__@. Bitesize Learning Private Limited."
      // Replace placeholder with actual OTP. Keep punctuation/spacing identical.
      const message = `Dear Yaari User,\n The OTP for login is ${otp}. Bitesize Learning Private Limited.`;

      const params = new URLSearchParams({
        userid: this.config.userid,
        password: this.config.password,
        send_to: formattedPhone,
        msg: message,
        method: 'sendMessage',
        msg_type: 'text',
        format: 'json',
        auth_scheme: 'plain',
        v: '1.1'
      });

      // Add DLT-related params if available
      if (this.config.mask) params.append('mask', this.config.mask);
      if (this.config.dltTemplateId) params.append('dlt_template_id', this.config.dltTemplateId);
      if (this.config.dltEntityId) params.append('dlt_entity_id', this.config.dltEntityId);

      const response = await fetch(`${this.config.baseUrl}/GatewayAPI/rest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString()
      });

      const responseText = await response.text();
      
      // Try to parse as JSON, fallback to text analysis
      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        // If not JSON, check if response contains success indicators
        if (responseText.toLowerCase().includes('success') || 
            responseText.toLowerCase().includes('sent')) {
          return { success: true, message: 'OTP sent successfully' };
        } else {
          return { success: false, error: responseText };
        }
      }

      // Handle JSON response
      if (result.response && result.response.status === 'success') {
        return { success: true, message: 'OTP sent successfully', messageId: result.response.id };
      } else {
        return { 
          success: false, 
          error: result.response?.details || result.error || 'Failed to send SMS' 
        };
      }

    } catch (error) {
      console.error('SMS Service Error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  async sendMessage(phoneNumber: string, message: string): Promise<SMSResponse> {
    try {
      const formattedPhone = phoneNumber.startsWith('91') 
        ? phoneNumber 
        : `91${phoneNumber.replace(/^\+?91/, '')}`;

      const params = new URLSearchParams({
        userid: this.config.userid,
        password: this.config.password,
        send_to: formattedPhone,
        msg: message,
        method: 'sendMessage',
        msg_type: 'text',
        format: 'json',
        auth_scheme: 'plain',
        v: '1.1'
      });

      if (this.config.mask) params.append('mask', this.config.mask);
      if (this.config.dltTemplateId) params.append('dlt_template_id', this.config.dltTemplateId);
      if (this.config.dltEntityId) params.append('dlt_entity_id', this.config.dltEntityId);

      const response = await fetch(`${this.config.baseUrl}/GatewayAPI/rest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString()
      });

      const responseText = await response.text();
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        if (responseText.toLowerCase().includes('success') || 
            responseText.toLowerCase().includes('sent')) {
          return { success: true, message: 'Message sent successfully' };
        } else {
          return { success: false, error: responseText };
        }
      }

      if (result.response && result.response.status === 'success') {
        return { success: true, message: 'Message sent successfully', messageId: result.response.id };
      } else {
        return { 
          success: false, 
          error: result.response?.details || result.error || 'Failed to send SMS' 
        };
      }

    } catch (error) {
      console.error('SMS Service Error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }
}

export const smsService = new SMSService();
export default SMSService;