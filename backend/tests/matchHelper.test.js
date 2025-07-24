const { findPotentialMatches } = require('../utils/matchHelper');

describe('findPotentialMatches', () => {
  test('exact amount and date match', () => {
    const receipt = {
      extracted_amount: 50,
      extracted_date: '10/01/2023',
      extracted_merchant: 'OpenAI Store'
    };

    const transactions = [
      {
        id: 1,
        amount: -50,
        transaction_date: '2023-10-01',
        description: 'Purchase at OpenAI Store'
      }
    ];

    const matches = findPotentialMatches(receipt, transactions);
    expect(matches.length).toBe(1);
    expect(matches[0].confidence).toBe(105);
    expect(matches[0].transaction.id).toBe(1);
  });

  test('near match within tolerance', () => {
    const receipt = {
      extracted_amount: 50,
      extracted_date: '10/01/2023',
      extracted_merchant: 'OpenAI'
    };

    const transactions = [
      {
        id: 2,
        amount: -52,
        transaction_date: '2023-10-02',
        description: 'Payment to OpenAI'
      }
    ];

    const matches = findPotentialMatches(receipt, transactions);
    expect(matches.length).toBe(1);
    expect(matches[0].confidence).toBe(55);
  });

  test('no reasonable match', () => {
    const receipt = {
      extracted_amount: 1000,
      extracted_date: '10/10/2023',
      extracted_merchant: 'Another'
    };

    const transactions = [
      {
        id: 3,
        amount: -200,
        transaction_date: '2023-10-01',
        description: 'Some store'
      }
    ];

    const matches = findPotentialMatches(receipt, transactions);
    expect(matches.length).toBe(0);
  });
});
