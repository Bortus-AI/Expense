const express = require('express');
const router = express.Router();
const db = require('../database/init');
const { authenticateToken, getUserCompanies, requireCompanyAccess, requireRole, addUserTracking } = require('../middleware/auth');

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
    db.all(`SELECT * FROM ${tableName} WHERE company_id = ? ORDER BY name ASC`, [companyId], (err, rows) => {
      if (err) {
        console.error(`Error fetching ${tableName}:`, err);
        return res.status(500).json({ error: `Failed to fetch ${tableName}` });
      }
      res.json(rows);
    });
  });

  // Add a new item
  router.post(`/${tableName}`, (req, res) => {
    const { name } = req.body;
    const companyId = req.companyId;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    db.run(`INSERT INTO ${tableName} (company_id, name) VALUES (?, ?)`, [companyId, name], function(err) {
      if (err) {
        console.error(`Error adding ${tableName}:`, err);
        // Check for unique constraint violation
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ error: `${name} already exists in ${tableName}` });
        }
        return res.status(500).json({ error: `Failed to add ${tableName}` });
      }
      res.status(201).json({ id: this.lastID, name, company_id: companyId });
    });
  });

  // Update an item
  router.put(`/${tableName}/:id`, (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const companyId = req.companyId;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

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

module.exports = router;
