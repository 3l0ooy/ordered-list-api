const express = require('express');
const db = require('../db');

const router = express.Router();

router.post('/', (req, res) => {
  const { name } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'name is required' });
  }

  const result = db.prepare('INSERT INTO lists (name) VALUES (?)').run(name.trim());
  const list = db.prepare('SELECT * FROM lists WHERE id = ?').get(result.lastInsertRowid);

  res.status(201).json(list);
});

module.exports = router;