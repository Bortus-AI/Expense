const axios = require('axios');

class LLMService {
  constructor() {
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'llama3.1:8b';
    this.maxTokens = 2048;
    this.temperature = 0.1; // Low temperature for consistent results
  }

  // Test connection to Ollama
  async testConnection() {
    try {
      const response = await axios.get(`${this.ollamaUrl}/api/tags`);
      console.log('✅ Ollama connection successful');
      console.log('Available models:', response.data.models.map(m => m.name));
      return true;
    } catch (error) {
      console.error('❌ Ollama connection failed:', error.message);
      return false;
    }
  }

  // Generate response from Ollama
  async generateResponse(prompt, systemPrompt = null) {
    try {
      const requestBody = {
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: this.temperature,
          num_predict: this.maxTokens,
          top_p: 0.9,
          top_k: 40
        }
      };

      if (systemPrompt) {
        requestBody.system = systemPrompt;
      }

      const response = await axios.post(`${this.ollamaUrl}/api/generate`, requestBody);
      return response.data.response.trim();
    } catch (error) {
      console.error('Error generating LLM response:', error.message);
      throw new Error(`LLM generation failed: ${error.message}`);
    }
  }

  // Enhanced OCR text processing
  async processOCRText(ocrText, receiptData = {}) {
    const systemPrompt = `You are an expert at processing receipt and invoice text. Your task is to extract and structure information from OCR text. Always respond in valid JSON format. Be very careful to extract the correct total amount and merchant name. NEVER return generic terms like "name" or "merchant" - always extract the actual business name.`;

    const prompt = `
Please analyze this OCR text from a receipt and extract the following information in JSON format:

OCR Text: "${ocrText}"

Receipt Data: ${JSON.stringify(receiptData)}

Extract and return ONLY a JSON object with these fields:
{
  "merchant": "extracted merchant name (be specific, avoid generic terms like 'name' or 'merchant')",
  "amount": "extracted total amount (numeric value only, no currency symbols)",
  "date": "extracted date in YYYY-MM-DD format if possible",
  "items": ["list of items purchased"],
  "category": "best category for this transaction",
  "confidence": 0.95,
  "notes": "any additional relevant information"
}

IMPORTANT:
- For amount: Extract the TOTAL amount, not individual line items. Look for words like "TOTAL", "AMOUNT DUE", "BALANCE", etc.
- For merchant: Look for company names, store names, or vendor names. NEVER return generic terms like "name", "merchant", or "vendor". Extract the actual business name.
- For date: Look for invoice dates, transaction dates, or billing dates.
- If any field cannot be determined, use null.
- If you cannot extract a valid merchant name, return null for merchant.

Be precise and accurate.`;

    try {
      const response = await this.generateResponse(prompt, systemPrompt);
      
      // Try to parse JSON response
      try {
        const parsed = JSON.parse(response);
        
        // Validate the extracted data
        if (parsed.merchant === 'name' || parsed.merchant === 'merchant' || parsed.merchant === 'vendor' || 
            parsed.merchant?.includes('If a more specific category') || parsed.merchant?.includes('generic')) {
          console.log('LLM returned invalid merchant name, setting to null:', parsed.merchant);
          parsed.merchant = null;
        }
        
        return {
          success: true,
          data: parsed,
          rawResponse: response
        };
      } catch (parseError) {
        // If JSON parsing fails, try to extract information manually
        return this.extractInfoFromText(response, ocrText);
      }
    } catch (error) {
      console.error('OCR processing failed:', error);
      return {
        success: false,
        error: error.message,
        data: {
          merchant: null,
          amount: null,
          date: null,
          items: [],
          category: null,
          confidence: 0.0,
          notes: 'LLM processing failed'
        }
      };
    }
  }

  // Enhanced transaction categorization
  async categorizeTransaction(transaction, companyContext = {}) {
    const systemPrompt = `You are an expert at categorizing business transactions. Analyze the transaction and provide the best category with confidence score.`;

    const prompt = `
Please categorize this business transaction:

Transaction Details:
- Description: "${transaction.description || ''}"
- Amount: $${transaction.amount || 0}
- Date: ${transaction.transaction_date || ''}
- Company: ${companyContext.name || 'Unknown'}

Available Categories (but you can suggest new ones):
- Software & Technology
- Subscriptions & Memberships
- Office Supplies
- Travel & Transportation
- Meals & Entertainment
- Utilities
- Insurance
- Professional Services
- Marketing & Advertising
- Equipment & Machinery
- Rent & Leasing
- Maintenance & Repairs

Respond with ONLY a JSON object:
{
  "category": "best category name",
  "confidence": 0.95,
  "reasoning": "explanation of why this category was chosen",
  "suggestedSubcategory": "optional subcategory if applicable"
}`;

    try {
      const response = await this.generateResponse(prompt, systemPrompt);
      
      try {
        const parsed = JSON.parse(response);
        return {
          success: true,
          categorization: parsed
        };
      } catch (parseError) {
        return {
          success: false,
          error: 'Failed to parse LLM response',
          categorization: {
            category: 'Unknown',
            confidence: 0.0,
            reasoning: 'LLM response parsing failed',
            suggestedSubcategory: null
          }
        };
      }
    } catch (error) {
      console.error('LLM categorization failed:', error);
      return {
        success: false,
        error: error.message,
        categorization: {
          category: 'Unknown',
          confidence: 0.0,
          reasoning: 'LLM processing failed',
          suggestedSubcategory: null
        }
      };
    }
  }



  // Enhanced duplicate detection
  async detectDuplicates(transaction, similarTransactions = []) {
    const systemPrompt = `You are an expert at detecting duplicate transactions. Analyze if this transaction is a duplicate of existing ones.`;

    const prompt = `
Analyze if this transaction is a duplicate:

Current Transaction:
- Description: "${transaction.description || ''}"
- Amount: $${transaction.amount || 0}
- Date: ${transaction.transaction_date || ''}

Similar Transactions:
${similarTransactions.map(t => `- ${t.description}: $${t.amount} on ${t.transaction_date}`).join('\n')}

Determine if this is a duplicate and respond with ONLY a JSON object:
{
  "isDuplicate": true|false,
  "confidence": 0.95,
  "similarTransactions": ["list of transaction IDs that are duplicates"],
  "reasoning": "explanation of duplicate detection logic",
  "recommendation": "keep|merge|delete"
}`;

    try {
      const response = await this.generateResponse(prompt, systemPrompt);
      
      try {
        const parsed = JSON.parse(response);
        return {
          success: true,
          duplicateAnalysis: parsed
        };
      } catch (parseError) {
        return {
          success: false,
          error: 'Failed to parse duplicate analysis',
          duplicateAnalysis: {
            isDuplicate: false,
            confidence: 0.0,
            similarTransactions: [],
            reasoning: 'LLM response parsing failed',
            recommendation: 'keep'
          }
        };
      }
    } catch (error) {
      console.error('LLM duplicate detection failed:', error);
      return {
        success: false,
        error: error.message,
        duplicateAnalysis: {
          isDuplicate: false,
          confidence: 0.0,
          similarTransactions: [],
          reasoning: 'LLM processing failed',
          recommendation: 'keep'
        }
      };
    }
  }

  // Extract information from text when JSON parsing fails
  extractInfoFromText(llmResponse, originalOcrText) {
    const extracted = {
      merchant: null,
      amount: null,
      date: null,
      items: [],
      category: null,
      confidence: 0.0,
      notes: llmResponse
    };

    // Try to extract amount (look for $XX.XX pattern)
    const amountMatch = llmResponse.match(/\$(\d+\.?\d*)/);
    if (amountMatch) {
      extracted.amount = parseFloat(amountMatch[1]);
    }

    // Try to extract date
    const dateMatch = llmResponse.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      extracted.date = dateMatch[1];
    }

    // Try to extract merchant (look for common patterns)
    const merchantPatterns = [
      /merchant[:\s]+([^\n,]+)/i,
      /vendor[:\s]+([^\n,]+)/i,
      /store[:\s]+([^\n,]+)/i
    ];

    for (const pattern of merchantPatterns) {
      const match = llmResponse.match(pattern);
      if (match) {
        extracted.merchant = match[1].trim();
        break;
      }
    }

    return {
      success: true,
      data: extracted,
      rawResponse: llmResponse
    };
  }

  // Get model information
  async getModelInfo() {
    try {
      const response = await axios.get(`${this.ollamaUrl}/api/show`, {
        params: { name: this.model }
      });
      return {
        success: true,
        model: this.model,
        info: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        model: this.model
      };
    }
  }

  // Health check
  async healthCheck() {
    try {
      const connectionTest = await this.testConnection();
      const modelInfo = await this.getModelInfo();
      
      return {
        status: 'healthy',
        ollamaConnected: connectionTest,
        model: this.model,
        modelInfo: modelInfo.success ? 'available' : 'unavailable',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = new LLMService(); 