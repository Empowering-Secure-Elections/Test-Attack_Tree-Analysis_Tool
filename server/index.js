const path = require('path');
const express = require('express');
const app = express();

// Uses the port from the enviroment variable. 
// If there is no port enviroment variable it uses port 3000
const PORT = process.env.PORT || 3000;

const buildPath = path.join(__dirname, '../build');
app.use(express.static(buildPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});