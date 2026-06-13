const express = require('express');
const db = require('../db');

const router = express.Router({ mergeParams: true });

router.post('/', (req, res) => {
  const { listId } = req.params;
  const { content } = req.body;

  if (!content || typeof content !== 'string' || content.trim() === '') {
    return res.status(400).json({ error: 'content is required' });
  }

  
  const addItem = db.transaction(() => {
    const list = db.prepare('SELECT id FROM lists WHERE id = ?').get(listId);
    if (!list) return null;

    const { max } = db.prepare('SELECT MAX(position) AS max FROM items WHERE list_id = ?').get(listId);
    const nextPosition = (max || 0) + 1;

    const result = db.prepare(
      'INSERT INTO items (list_id, content, position) VALUES (?, ?, ?)'
    ).run(listId, content.trim(), nextPosition);

    return db.prepare('SELECT * FROM items WHERE id = ?').get(result.lastInsertRowid);
  });

  const item = addItem();
  if (!item) {
    return res.status(404).json({ error: 'list not found' });
  }

  res.status(201).json(item);
});
// GET /lists/:listId/items
router.get('/', (req, res) => {
  const { listId } = req.params;

  const list = db.prepare('SELECT id FROM lists WHERE id = ?').get(listId);
  if (!list) {
    return res.status(404).json({ error: 'list not found' });
  }

  const items = db.prepare(
    'SELECT * FROM items WHERE list_id = ? ORDER BY position ASC'
  ).all(listId);

  res.json(items);
});
// GET /lists/:listId/items/:itemId
router.get('/:itemId', (req, res) => {
  const { listId, itemId } = req.params;

  const item = db.prepare(
    'SELECT * FROM items WHERE id = ? AND list_id = ?'
  ).get(itemId, listId);

  if (!item) {
    return res.status(404).json({ error: 'item not found' });
  }

  res.json(item);
});

module.exports = router;