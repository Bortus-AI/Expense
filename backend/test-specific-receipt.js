const llmService = require('./services/llmService');

async function testSpecificReceipt() {
  console.log('Testing LLM with actual receipt OCR text...\n');
  
  const testCases = [
    {
      name: 'OpenAI Receipt (Good)',
      ocrText: `
Page 1 of 1
Receipt
Invoice number3466BF65 0030
Date paidJune 22, 2025
OpenAI, LLC
548 Market Street
PMB 97273
San Francisco, California 94104 5401
United States
ar@openai.com
Bill to
Alex Paetznick
P.O. Box 1057
Round Rock, Texas 78680
United States
 1 737 240 7810
bpvarsity@gmail.com
Ship to
Alex Paetznick
179 Holly Street
Apt 301
Georgetown, Texas 78626
United States
 1 737 240 7810
$21.28 paid on June 22, 2025
DescriptionQty
Unit price
Tax
Amount
ChatGPT Plus Subscription
Jun 22 – Jul 22, 2025
1$20.008% (on
$
Amount paid$21.28
Payment history
Payment methodDateAmount paidReceipt number
Mastercard - 1165June 22, 2025$21.282415 2475
`
    },
    {
      name: 'Problematic Receipt (Should not return "name")',
      ocrText: `
RECEIPT
Date: 2025-01-15
Time: 14:30

Merchant Information:
Store: Local Grocery Store
Address: 123 Main Street

Items:
- Bread: $2.99
- Milk: $3.49
- Eggs: $4.99

SUBTOTAL: $11.47
TAX: $0.92
TOTAL: $12.39

Thank you for your purchase!
`
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n=== Testing: ${testCase.name} ===`);
    console.log('OCR Text:', testCase.ocrText.substring(0, 100) + '...');
    
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
        
        if (result.data.merchant === 'name' || result.data.merchant === 'merchant') {
          console.log('❌ LLM returned invalid merchant name!');
        } else {
          console.log('✅ Merchant name looks good!');
        }
      } else {
        console.log('❌ LLM OCR processing failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
    
    console.log('\n' + '='.repeat(50));
  }
}

testSpecificReceipt(); 