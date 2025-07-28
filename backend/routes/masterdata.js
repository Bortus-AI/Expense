const express = require('express');
const router = express.Router();
const db = require('../database/init');
const { authenticateToken, getUserCompanies, requireCompanyAccess, requireRole, addUserTracking } = require('../middleware/auth');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

// Apply authentication and company access middleware to all routes
router.use(authenticateToken);
router.use(getUserCompanies);
router.use(requireCompanyAccess);
router.use(requireRole('admin')); // Only admins can manage master data
router.use(addUserTracking);

// Helper function to manage master data (categories, job_numbers, cost_codes)
const manageMasterData = (tableName) => {
  // Get all items
  router.get(`/${tableName}`, (req, res) => {
    const companyId = req.companyId;
    
    // For cost_codes, include category information
    if (tableName === 'cost_codes') {
      const query = `
        SELECT cc.*, c.name as category_name 
        FROM ${tableName} cc
        LEFT JOIN categories c ON cc.category_id = c.id AND c.company_id = ?
        WHERE cc.company_id = ? 
        ORDER BY cc.name ASC
      `;
      
      db.all(query, [companyId, companyId], (err, rows) => {
        if (err) {
          console.error(`Error fetching ${tableName}:`, err);
          return res.status(500).json({ error: `Failed to fetch ${tableName}` });
        }
        res.json(rows);
      });
    } else {
      // For categories and job_numbers, use simple query
      db.all(`SELECT * FROM ${tableName} WHERE company_id = ? ORDER BY name ASC`, [companyId], (err, rows) => {
        if (err) {
          console.error(`Error fetching ${tableName}:`, err);
          return res.status(500).json({ error: `Failed to fetch ${tableName}` });
        }
        res.json(rows);
      });
    }
  });

  // Add a new item
  router.post(`/${tableName}`, (req, res) => {
    const { name, category_id } = req.body;
    const companyId = req.companyId;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // For cost_codes, include category_id if provided
    if (tableName === 'cost_codes') {
      const query = `INSERT INTO ${tableName} (company_id, name, category_id) VALUES (?, ?, ?)`;
      const params = [companyId, name, category_id || null];
      
      db.run(query, params, function(err) {
        if (err) {
          console.error(`Error adding ${tableName}:`, err);
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: `${name} already exists in ${tableName}` });
          }
          return res.status(500).json({ error: `Failed to add ${tableName}` });
        }
        res.status(201).json({ id: this.lastID, name, category_id: category_id || null, company_id: companyId });
      });
    } else {
      // For categories and job_numbers, use simple insert
      db.run(`INSERT INTO ${tableName} (company_id, name) VALUES (?, ?)`, [companyId, name], function(err) {
        if (err) {
          console.error(`Error adding ${tableName}:`, err);
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: `${name} already exists in ${tableName}` });
          }
          return res.status(500).json({ error: `Failed to add ${tableName}` });
        }
        res.status(201).json({ id: this.lastID, name, company_id: companyId });
      });
    }
  });

  // Update an item
  router.put(`/${tableName}/:id`, (req, res) => {
    const { id } = req.params;
    const { name, category_id } = req.body;
    const companyId = req.companyId;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // For cost_codes, include category_id if provided
    if (tableName === 'cost_codes') {
      const query = `UPDATE ${tableName} SET name = ?, category_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND company_id = ?`;
      const params = [name, category_id || null, id, companyId];
      
      db.run(query, params, function(err) {
        if (err) {
          console.error(`Error updating ${tableName}:`, err);
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: `${name} already exists in ${tableName}` });
          }
          return res.status(500).json({ error: `Failed to update ${tableName}` });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: `${tableName} not found or not authorized` });
        }
        res.json({ message: `${tableName} updated successfully` });
      });
    } else {
      // For categories and job_numbers, use simple update
      db.run(`UPDATE ${tableName} SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND company_id = ?`, [name, id, companyId], function(err) {
        if (err) {
          console.error(`Error updating ${tableName}:`, err);
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: `${name} already exists in ${tableName}` });
          }
          return res.status(500).json({ error: `Failed to update ${tableName}` });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: `${tableName} not found or not authorized` });
        }
        res.json({ message: `${tableName} updated successfully` });
      });
    }
  });

  // Delete an item
  router.delete(`/${tableName}/:id`, (req, res) => {
    const { id } = req.params;
    const companyId = req.companyId;

    // Before deleting, check if it's used in transactions
    db.get(`SELECT COUNT(*) as count FROM transactions WHERE ${tableName.slice(0, -1)}_id = ? AND company_id = ?`, [id, companyId], (err, row) => {
      if (err) {
        console.error(`Error checking ${tableName} usage:`, err);
        return res.status(500).json({ error: `Failed to check ${tableName} usage` });
      }
      if (row.count > 0) {
        return res.status(409).json({ error: `Cannot delete ${tableName} as it is currently used in ${row.count} transactions.` });
      }

      db.run(`DELETE FROM ${tableName} WHERE id = ? AND company_id = ?`, [id, companyId], function(err) {
        if (err) {
          console.error(`Error deleting ${tableName}:`, err);
          return res.status(500).json({ error: `Failed to delete ${tableName}` });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: `${tableName} not found or not authorized` });
        }
        res.json({ message: `${tableName} deleted successfully` });
      });
    });
  });
};

// Apply management routes for each master data type
manageMasterData('categories');
manageMasterData('job_numbers');
manageMasterData('cost_codes');

// Configure multer for CSV file uploads
const csvStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const csvDir = path.join(__dirname, '../uploads/csv/masterdata');
    if (!fs.existsSync(csvDir)) {
      fs.mkdirSync(csvDir, { recursive: true });
    }
    cb(null, csvDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${req.params.type || 'masterdata'}_${timestamp}_${originalName}`);
  }
});

const csvUpload = multer({ 
  storage: csvStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// CSV Import endpoint for master data
router.post('/:type/import', csvUpload.single('csvFile'), (req, res) => {
  const { type } = req.params;
  const validTypes = ['categories', 'job_numbers', 'cost_codes'];
  
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: 'Invalid master data type' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No CSV file uploaded' });
  }

  const companyId = req.companyId;
  const items = [];
  let importCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  const errors = [];
  const duplicates = [];
  const warnings = []; // Declare warnings array
  const costCodesToInsert = []; // Declare costCodesToInsert array

  console.log(`=== IMPORTING ${type.toUpperCase()} FROM CSV ===`);
  console.log('File:', req.file.filename);
  console.log('Company ID:', companyId);

  fs.createReadStream(req.file.path)
    .pipe(csv({
            headers: ['Cost Code', 'Category'], // Explicitly define headers
            skipLines: 1, // Skip the header row
            mapHeaders: ({ header }) => header.trim() // Trim headers
        }))
        .on('data', (data) => {
            const rawCostCode = data['Cost Code'];
            const rawCategory = data['Category'];

            // Trim whitespace from values
            const costCode = rawCostCode ? String(rawCostCode).trim() : '';
            const category = rawCategory ? String(rawCategory).trim() : '';

            if (!costCode) {
                warnings.push(`Skipping row due to missing or empty 'Cost Code': ${JSON.stringify(data)}`);
                return;
            }

            if (!category) {
                warnings.push(`Warning: 'Category' is missing or empty for Cost Code: "${costCode}". This entry might not be correctly categorized.`);
            }

            costCodesToInsert.push({ costCode, category });
            items.push({ name: costCode, categoryName: category });
        })
    .on('end', async () => {
      console.log(`Processed ${items.length + errorCount} rows from CSV`);
      console.log(`Valid items: ${items.length}, Errors: ${errorCount}`);

      if (items.length === 0) {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ 
          error: 'No valid items found in CSV file',
          details: errors.slice(0, 10)
        });
      }

      // Check for existing items in database
      const existingItems = await new Promise((resolve, reject) => {
        const placeholders = items.map(() => '?').join(',');
        const names = items.map(item => item.name.toLowerCase());
        
        db.all(
          `SELECT name FROM ${type} WHERE company_id = ? AND LOWER(name) IN (${placeholders})`,
          [companyId, ...names],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows.map(row => row.name.toLowerCase()));
          }
        );
      });

      // Filter out existing items
      const newItems = items.filter(item => {
        const exists = existingItems.includes(item.name.toLowerCase());
        if (exists) {
          duplicates.push({
            row: item.rowNumber,
            name: item.name,
            reason: 'Already exists in database'
          });
          skipCount++;
        }
        return !exists;
      });

      console.log(`New items to import: ${newItems.length}`);
      console.log(`Duplicates/skipped: ${skipCount}`);

      // Import new items
      if (newItems.length > 0) {
        // For cost codes, we need to handle category relationships
        if (type === 'cost_codes') {
          // First, get all existing categories for the company to map category names to IDs
          const existingCategories = await new Promise((resolve, reject) => {
            db.all(
              `SELECT id, name FROM categories WHERE company_id = ?`,
              [companyId],
              (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
              }
            );
          });

          const categoryMap = {};
          existingCategories.forEach(cat => {
            categoryMap[cat.name.toLowerCase()] = cat.id;
          });

          // Create missing categories automatically
          const categoriesToCreate = [];
          for (const item of newItems) {
            if (item.categoryName && !categoryMap[item.categoryName.toLowerCase()]) {
              // Check if we haven't already added it to our list
              if (!categoriesToCreate.find(cat => cat.toLowerCase() === item.categoryName.toLowerCase())) {
                categoriesToCreate.push(item.categoryName);
              }
            }
          }

          console.log(`Creating ${categoriesToCreate.length} missing categories...`);
          
          // Create missing categories
          for (const categoryName of categoriesToCreate) {
            try {
              const result = await new Promise((resolve, reject) => {
                db.run(
                  `INSERT INTO categories (company_id, name) VALUES (?, ?)`,
                  [companyId, categoryName],
                  function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                  }
                );
              });
              
              categoryMap[categoryName.toLowerCase()] = result;
              console.log(`✅ Created category: "${categoryName}" (ID: ${result})`);
            } catch (error) {
              console.error(`Error creating category "${categoryName}":`, error);
            }
          }

          const stmt = db.prepare(`INSERT INTO ${type} (company_id, name, category_id) VALUES (?, ?, ?)`);
          
          for (const item of newItems) {
            try {
              let categoryId = null;
              if (item.categoryName) {
                categoryId = categoryMap[item.categoryName.toLowerCase()];
                if (!categoryId) {
                  warnings.push(`Warning: Category "${item.categoryName}" for cost code "${item.name}" was not found and could not be created. Please ensure the category exists or is correctly formatted.`);
                }
              }
              
              // Check if a new category was just created for this item
              if (item.categoryName && categoriesToCreate.includes(item.categoryName) && categoryId) {
                  warnings.push(`Info: New category "${item.categoryName}" created and assigned to cost code "${item.name}".`);
              }
              
              stmt.run([companyId, item.name, categoryId]);
              importCount++;
            } catch (error) {
              console.error(`Error inserting ${item.name}:`, error);
              errors.push({
                row: item.rowNumber,
                name: item.name,
                error: error.message
              });
              errorCount++;
            }
          }
          
          stmt.finalize();
        } else {
          // For categories and job_numbers, use simple insert
          const stmt = db.prepare(`INSERT INTO ${type} (company_id, name) VALUES (?, ?)`);
          
          for (const item of newItems) {
            try {
              stmt.run([companyId, item.name]);
              importCount++;
            } catch (error) {
              console.error(`Error inserting ${item.name}:`, error);
              errors.push({
                row: item.rowNumber,
                name: item.name,
                error: error.message
              });
              errorCount++;
            }
          }
          
          stmt.finalize();
        }
      }

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      // Send response
      const displayName = getDisplayName(type);
      res.json({
        message: `${displayName} import completed`,
        summary: {
          totalRows: items.length + errorCount,
          imported: importCount,
          skipped: skipCount,
          errors: errorCount
        },
        details: {
          duplicates: duplicates.slice(0, 20),
          errors: errors.slice(0, 20),
          warnings: warnings.slice(0, 20)
        }
      });
    })
    .on('error', (err) => {
      console.error('CSV parsing error:', err);
      // Clean up uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: 'Error processing CSV file: ' + err.message });
    });
});

// Helper function for display names
const getDisplayName = (type) => {
  const displayNames = {
    categories: 'Categories',
    job_numbers: 'Job Numbers',
    cost_codes: 'Cost Codes'
  };
  return displayNames[type] || type;
};

module.exports = router;
