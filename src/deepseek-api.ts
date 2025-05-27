
// deepseek-api.ts
interface DeepseekConfig {
    apiKey: string;
    baseUrl?: string;
    defaultModel?: string;
  }
  
  interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
  }
  
  export class DeepseekAPI {
    private readonly config: DeepseekConfig;
  
    constructor(config: DeepseekConfig) {
      this.config = {
        baseUrl: config.baseUrl || 'https://api.deepseek.com/v1',
        defaultModel: config.defaultModel || 'deepseek-chat',
        apiKey: config.apiKey
      };
    }
  
    /**
     * Sends content with context to Deepseek
     * @param content The main content to analyze
     * @param context Additional context/instructions
     * @param model Optional model override
     * @returns Promise with the response content
     */
    public async sendToDeepseek(
      content: string,
      context: string,
      model?: string
    ): Promise<string> {
      const messages = this.prepareMessages(content, context);
      const response = await this.callDeepseekAPI(messages, model || this.config.defaultModel!);
      return response.choices[0].message.content;
    }
  
    private prepareMessages(content: string, context: string): ChatMessage[] {
      return [
        {
          role: 'system',
          content: 'You are a helpful assistant that analyzes content.'
        },
        {
          role: 'user',
          content: `Content to analyze:\n\n${content}`
        },
        {
          role: 'user',
          content: `Additional context: ${context}`
        }
      ];
    }
  
    private async callDeepseekAPI(messages: ChatMessage[], model: string): Promise<any> {
      const url = `${this.config.baseUrl}/chat/completions`;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      };
  
      const body = {
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000
      };
  
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
  
      if (!response.ok) {
        throw new Error(`Deepseek API error: ${response.statusText}`);
      }
  
      return await response.json();
    }
  }