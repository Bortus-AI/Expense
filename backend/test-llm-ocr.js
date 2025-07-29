const llmService = require('./services/llmService');

async function testLLMOCR() {
  console.log('Testing LLM OCR processing with multiple receipt formats...\n');
  
  const testCases = [
    {
      name: 'Restaurant Receipt',
      ocrText: `MCDONALD'S
1234 Main Street
Date: 12/15/2024
Time: 14:30

Big Mac Meal: $8.99
French Fries: $2.49
Coke: $1.99

SUBTOTAL: $13.47
TAX: $1.08
TOTAL: $14.55

Thank you for your visit!`
    },
    {
      name: 'Gas Station Receipt',
      ocrText: `SHELL
456 Gas Station Blvd
Date: 01/20/2025

Regular Gas: 15.2 gal @ $3.25/gal
Amount: $49.40

Thank you!`
    },
    {
      name: 'Online Subscription',
      ocrText: `OPENAI
ChatGPT Plus Subscription
Date: January 15, 2025

Monthly Plan: $20.00
TOTAL: $20.00

Payment processed successfully`
    },
    {
      name: 'Office Supply Store',
      ocrText: `STAPLES
Office Supplies
Date: 02/10/2025

Printer Paper: $12.99
Pens: $5.49
Notebooks: $8.75

SUBTOTAL: $27.23
TAX: $2.18
TOTAL: $29.41`
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n=== Testing: ${testCase.name} ===`);
    console.log('OCR Text:', testCase.ocrText);
    
    try {
      const result = await llmService.processOCRText(testCase.ocrText, {
        filename: `${testCase.name.toLowerCase().replace(/\s+/g, '_')}.pdf`,
        fileSize: 1024,
        fileType: '.pdf'
      });

      console.log('LLM Result:', JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log('✅ LLM OCR processing successful!');
        console.log('Extracted data:', result.data);
      } else {
        console.log('❌ LLM OCR processing failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
    
    console.log('\n' + '='.repeat(50));
  }
}

testLLMOCR(); 