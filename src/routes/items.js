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

// PATCH /lists/:listId/items/:itemId/move 
router.patch('/:itemId/move', (req, res) => {
  const { listId, itemId } = req.params;
  const { position: newPosition } = req.body;

  // validate input is a positive integer
  if (!Number.isInteger(newPosition) || newPosition < 1) {
    return res.status(400).json({ error: 'position must be a positive integer' });
  }

  const move = db.transaction(() => {
    // fetch the item 
    const item = db.prepare(
      'SELECT * FROM items WHERE id = ? AND list_id = ?'
    ).get(itemId, listId);
    if (!item) return { error: 'not_found' };

    const { count } = db.prepare(
      'SELECT COUNT(*) AS count FROM items WHERE list_id = ?'
    ).get(listId);

    if (newPosition > count) {
      return { error: 'out_of_range' };
    }

    const oldPosition = item.position;
    if (oldPosition === newPosition) return { item }; // no-op

    if (oldPosition < newPosition) {
      // moving down
      db.prepare(
        'UPDATE items SET position = position - 1 WHERE list_id = ? AND position > ? AND position <= ?'
      ).run(listId, oldPosition, newPosition);
    } else {
      // moving up
      db.prepare(
        'UPDATE items SET position = position + 1 WHERE list_id = ? AND position >= ? AND position < ?'
      ).run(listId, newPosition, oldPosition);
    }

    db.prepare('UPDATE items SET position = ? WHERE id = ?').run(newPosition, itemId);

    return {
      item: db.prepare('SELECT * FROM items WHERE id = ?').get(itemId)
    };
  });

  const result = move();
  if (result.error === 'not_found') {
    return res.status(404).json({ error: 'item not found' });
  }
  if (result.error === 'out_of_range') {
    return res.status(400).json({ error: 'position out of range' });
  }

  res.json(result.item);
});
module.exports = router;