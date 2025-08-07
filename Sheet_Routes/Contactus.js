const express = require('express');
const router = express.Router();
const { google } = require('googleapis');

console.log("📦 Contactus route loaded");

// ✅ Google Auth Setup
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const SHEET_ID = process.env.GOOGLE_SHEET_ID;


const appendToSheet = async (range, values) => {
  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  });
};


router.post('/c', async (req, res) => {
  try {
    const { name, phone, email } = req.body;

    if (!name || !phone || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await appendToSheet('ContactUs!A2:C', [name.trim(), phone.trim(), email.trim()]);
    res.status(200).json({ message: 'Contact saved successfully' });
  } catch (err) {
    console.error(' Google Sheets Error:', err.message);
    res.status(500).json({ error: 'Error saving contact', details: err.message });
  }
});

module.exports = router;
