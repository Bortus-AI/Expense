import React, { useState } from 'react';
import { aiAPI } from '../services/api';
import { toast } from 'react-toastify';

const LLMTest = () => {
  const [healthStatus, setHealthStatus] = useState(null);
  const [categorizationTest, setCategorizationTest] = useState({
    description: 'OpenAI ChatGPT Plus Subscription',
    amount: 21.28
  });
  const [categorizationResult, setCategorizationResult] = useState(null);
  const [ocrTest, setOcrTest] = useState({
    ocrText: `Receipt
OpenAI, LLC
548 Market Street
San Francisco, California 94104-5401

Invoice: 3466BF65-0031
Date paid: July 22, 2025

ChatGPT Plus Subscription
Jul 22 - Aug 22, 2025
Qty: 1
Unit price: $20.00
Tax: 8% (on $16.00)
Amount: $20.00

Subtotal: $20.00
Sales Tax - Texas: $1.28
Total: $21.28
Amount paid: $21.28`
  });
  const [ocrResult, setOcrResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const response = await aiAPI.llmHealth();
      setHealthStatus(response.data);
      toast.success('LLM health check completed');
    } catch (error) {
      console.error('Health check failed:', error);
      toast.error('LLM health check failed');
    } finally {
      setLoading(false);
    }
  };

  const testCategorization = async () => {
    setLoading(true);
    try {
      const response = await aiAPI.testLLMCategorization({
        description: categorizationTest.description,
        amount: categorizationTest.amount,
        companyId: 1
      });
      setCategorizationResult(response.data);
      toast.success('LLM categorization test completed');
    } catch (error) {
      console.error('Categorization test failed:', error);
      toast.error('LLM categorization test failed');
    } finally {
      setLoading(false);
    }
  };

  const testOCR = async () => {
    setLoading(true);
    try {
      const response = await aiAPI.testLLMOCR({
        ocrText: ocrTest.ocrText,
        receiptData: {
          filename: 'test_receipt.pdf',
          fileSize: 1024,
          fileType: '.pdf'
        }
      });
      setOcrResult(response.data);
      toast.success('LLM OCR test completed');
    } catch (error) {
      console.error('OCR test failed:', error);
      toast.error('LLM OCR test failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <h2>🤖 LLM Integration Test</h2>
      
      {/* Health Check */}
      <div className="card mb-4">
        <div className="card-header">
          <h5>LLM Health Check</h5>
        </div>
        <div className="card-body">
          <button 
            className="btn btn-primary" 
            onClick={checkHealth}
            disabled={loading}
          >
            {loading ? 'Checking...' : 'Check LLM Health'}
          </button>
          
          {healthStatus && (
            <div className="mt-3">
              <h6>Health Status:</h6>
              <pre className="bg-light p-3 rounded">
                {JSON.stringify(healthStatus, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Categorization Test */}
      <div className="card mb-4">
        <div className="card-header">
          <h5>LLM Categorization Test</h5>
        </div>
        <div className="card-body">
          <div className="mb-3">
            <label className="form-label">Transaction Description:</label>
            <input
              type="text"
              className="form-control"
              value={categorizationTest.description}
              onChange={(e) => setCategorizationTest({
                ...categorizationTest,
                description: e.target.value
              })}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Amount:</label>
            <input
              type="number"
              className="form-control"
              value={categorizationTest.amount}
              onChange={(e) => setCategorizationTest({
                ...categorizationTest,
                amount: parseFloat(e.target.value) || 0
              })}
            />
          </div>
          <button 
            className="btn btn-success" 
            onClick={testCategorization}
            disabled={loading}
          >
            {loading ? 'Testing...' : 'Test Categorization'}
          </button>
          
          {categorizationResult && (
            <div className="mt-3">
              <h6>Categorization Result:</h6>
              <pre className="bg-light p-3 rounded">
                {JSON.stringify(categorizationResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* OCR Test */}
      <div className="card mb-4">
        <div className="card-header">
          <h5>LLM OCR Processing Test</h5>
        </div>
        <div className="card-body">
          <div className="mb-3">
            <label className="form-label">OCR Text:</label>
            <textarea
              className="form-control"
              rows="10"
              value={ocrTest.ocrText}
              onChange={(e) => setOcrTest({
                ...ocrTest,
                ocrText: e.target.value
              })}
            />
          </div>
          <button 
            className="btn btn-info" 
            onClick={testOCR}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Test OCR Processing'}
          </button>
          
          {ocrResult && (
            <div className="mt-3">
              <h6>OCR Processing Result:</h6>
              <pre className="bg-light p-3 rounded">
                {JSON.stringify(ocrResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LLMTest; 