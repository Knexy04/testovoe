const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

let appState = {
  selectedIds: [],
  sortedOrder: []
};

const generateItems = (query, offset, limit) => {
  let items = [];
  const start = query ? Math.max(1, parseInt(query) || 1) : 1;
  
  for (let i = start; i <= 1000000; i++) {
    if (!query || i.toString().includes(query)) {
      items.push(i);
      if (items.length >= offset + limit) break;
    }
  }

  if (appState.sortedOrder.length > 0) {
    const sortedSet = new Set(appState.sortedOrder);
    const orderedItems = appState.sortedOrder.filter(id => items.includes(id));
    const remainingItems = items.filter(id => !sortedSet.has(id));
    items = [...orderedItems, ...remainingItems];
  }

  return items.slice(offset, offset + limit);
};

app.get('/api/items', (req, res) => {
  const { query = '', offset = 0, limit = 20 } = req.query;
  const items = generateItems(query, parseInt(offset), parseInt(limit));
  res.json({ items, hasMore: items.length === parseInt(limit) });
});

app.get('/api/state', (req, res) => {
  res.json(appState);
});

app.post('/api/state', (req, res) => {
  appState = {
    selectedIds: [...new Set(req.body.selectedIds)],
    sortedOrder: [...new Set(req.body.sortedOrder)]
  };
  res.json({ success: true });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});