const express = require('express');
const listsRouter = require('./routes/lists');
const itemsRouter = require('./routes/items');

const app = express();
app.use(express.json());

app.use('/lists', listsRouter);
app.use('/lists/:listId/items', itemsRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// catch unexpected errors
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});