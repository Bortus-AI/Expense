const express = require('express');
const router = express.Router();
const { authenticateToken, getUserCompanies } = require('../middleware/auth');
const settingsService = require('../services/settingsService');

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(getUserCompanies);

// Get all settings (admin only)
router.get('/', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.currentRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const companyId = req.user.currentCompany?.id;
    const settings = await settingsService.getAllSettings(companyId);
    
    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// Get specific setting
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const companyId = req.user.currentCompany?.id;
    
    // Check if setting is admin-only
    const allSettings = await settingsService.getAllSettings(companyId);
    const setting = allSettings[key];
    
    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    if (setting.isAdminOnly && req.user.currentRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    res.json({
      success: true,
      setting: {
        key,
        value: setting.value,
        type: setting.type,
        description: setting.description,
        isAdminOnly: setting.isAdminOnly
      }
    });
  } catch (error) {
    console.error('Error getting setting:', error);
    res.status(500).json({ error: 'Failed to get setting' });
  }
});

// Update setting (admin only)
router.put('/:key', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.currentRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { key } = req.params;
    const { value, description } = req.body;
    const companyId = req.user.currentCompany?.id;
    
    if (value === undefined) {
      return res.status(400).json({ error: 'Value is required' });
    }
    
    await settingsService.setSetting(key, value, companyId, description);
    
    res.json({
      success: true,
      message: 'Setting updated successfully'
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// Get LLM model setting
router.get('/llm/model', async (req, res) => {
  try {
    const companyId = req.user.currentCompany?.id;
    const model = await settingsService.getLLMModel(companyId);
    
    res.json({
      success: true,
      model
    });
  } catch (error) {
    console.error('Error getting LLM model:', error);
    res.status(500).json({ error: 'Failed to get LLM model' });
  }
});

// Set LLM model setting (admin only)
router.put('/llm/model', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.currentRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { model } = req.body;
    const companyId = req.user.currentCompany?.id;
    
    if (!model) {
      return res.status(400).json({ error: 'Model is required' });
    }
    
    await settingsService.setLLMModel(model, companyId);
    
    res.json({
      success: true,
      message: 'LLM model updated successfully'
    });
  } catch (error) {
    console.error('Error updating LLM model:', error);
    res.status(500).json({ error: 'Failed to update LLM model' });
  }
});

// Test LLM model connection
router.post('/llm/test', async (req, res) => {
  try {
    const companyId = req.user.currentCompany?.id;
    const model = await settingsService.getLLMModel(companyId);
    
    // Test the model with Ollama
    const llmService = require('../services/llmService');
    const isConnected = await llmService.testConnection();
    
    res.json({
      success: true,
      model,
      connected: isConnected
    });
  } catch (error) {
    console.error('Error testing LLM model:', error);
    res.status(500).json({ error: 'Failed to test LLM model' });
  }
});

module.exports = router; 