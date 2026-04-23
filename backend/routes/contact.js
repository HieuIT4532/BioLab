const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const DATA_FILE = path.join(__dirname, '..', 'data', 'contacts.json');

// Ensure data directory and file exist
function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
}

// GET all contacts
router.get('/', (req, res) => {
  ensureDataFile();
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  res.json({ success: true, count: data.length, contacts: data });
});

// POST new contact
router.post('/', (req, res) => {
  const { fullname, email, phone, organization, message } = req.body;

  if (!fullname || !email) {
    return res.status(400).json({ success: false, error: 'Họ tên và email là bắt buộc.' });
  }

  ensureDataFile();
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

  const newContact = {
    id: Date.now(),
    fullname,
    email,
    phone: phone || '',
    organization: organization || '',
    message: message || '',
    timestamp: new Date().toISOString()
  };

  data.push(newContact);
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');

  console.log(`📝 New contact: ${fullname} (${email})`);
  res.status(201).json({ success: true, contact: newContact });
});

module.exports = router;
