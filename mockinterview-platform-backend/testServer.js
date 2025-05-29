const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from backend' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
