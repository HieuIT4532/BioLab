const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../')));

// API Routes (to be added)
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', version: '2.0.0' });
});

app.listen(PORT, () => {
    console.log(`BioLab v2 running at http://localhost:${PORT}`);
});
