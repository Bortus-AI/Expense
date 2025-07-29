const db = require('../database/init');

class SettingsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Get a setting value
  async getSetting(key, companyId = null) {
    const cacheKey = `${companyId || 'global'}_${key}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.value;
      }
      this.cache.delete(cacheKey);
    }

    return new Promise((resolve, reject) => {
      const query = companyId 
        ? 'SELECT setting_value, setting_type FROM system_settings WHERE setting_key = ? AND (company_id = ? OR company_id IS NULL) ORDER BY company_id DESC LIMIT 1'
        : 'SELECT setting_value, setting_type FROM system_settings WHERE setting_key = ? AND company_id IS NULL LIMIT 1';
      
      const params = companyId ? [key, companyId] : [key];
      
      db.get(query, params, (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          const value = this.parseSettingValue(row.setting_value, row.setting_type);
          
          // Cache the result
          this.cache.set(cacheKey, {
            value,
            timestamp: Date.now()
          });
          
          resolve(value);
        } else {
          resolve(null);
        }
      });
    });
  }

  // Set a setting value
  async setSetting(key, value, companyId = null, description = null, isAdminOnly = false) {
    return new Promise((resolve, reject) => {
      const settingType = this.getSettingType(value);
      const stringValue = this.stringifySettingValue(value);
      
      db.run(`
        INSERT OR REPLACE INTO system_settings 
        (company_id, setting_key, setting_value, setting_type, description, is_admin_only, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [companyId, key, stringValue, settingType, description, isAdminOnly], (err) => {
        if (err) {
          reject(err);
        } else {
          // Clear cache for this setting
          const cacheKey = `${companyId || 'global'}_${key}`;
          this.cache.delete(cacheKey);
          resolve(this.lastID);
        }
      });
    });
  }

  // Get all settings for a company
  async getAllSettings(companyId = null) {
    return new Promise((resolve, reject) => {
      const query = companyId 
        ? 'SELECT * FROM system_settings WHERE company_id = ? OR company_id IS NULL ORDER BY company_id DESC, setting_key'
        : 'SELECT * FROM system_settings WHERE company_id IS NULL ORDER BY setting_key';
      
      const params = companyId ? [companyId] : [];
      
      db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // Group by setting_key and take the most specific (company-specific overrides global)
          const settings = {};
          rows.forEach(row => {
            if (!settings[row.setting_key] || row.company_id !== null) {
              settings[row.setting_key] = {
                value: this.parseSettingValue(row.setting_value, row.setting_type),
                type: row.setting_type,
                description: row.description,
                isAdminOnly: row.is_admin_only,
                companyId: row.company_id
              };
            }
          });
          resolve(settings);
        }
      });
    });
  }

  // Get LLM model setting
  async getLLMModel(companyId = null) {
    return await this.getSetting('llm_model', companyId) || 'llama3.1:8b';
  }

  // Set LLM model setting
  async setLLMModel(model, companyId = null) {
    return await this.setSetting(
      'llm_model', 
      model, 
      companyId, 
      'LLM model for AI features (e.g., llama3.1:8b, llama3.2:3b)', 
      true
    );
  }

  // Parse setting value based on type
  parseSettingValue(value, type) {
    switch (type) {
      case 'number':
        return parseFloat(value);
      case 'boolean':
        return value === 'true' || value === '1';
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      default:
        return value;
    }
  }

  // Stringify setting value for storage
  stringifySettingValue(value) {
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  // Determine setting type from value
  getSettingType(value) {
    if (typeof value === 'number') {
      return 'number';
    } else if (typeof value === 'boolean') {
      return 'boolean';
    } else if (typeof value === 'object') {
      return 'json';
    } else {
      return 'string';
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

module.exports = new SettingsService(); 