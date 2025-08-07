const express = require('express');
const router = express.Router();
const { google } = require('googleapis');

console.log("📦 Contactus route loaded");

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const SHEET_ID = process.env.GOOGLE_SHEET_ID;


const generateQuotationNumber = () => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${year}${month}${random}`;
};


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


router.post('/popup', async (req, res) => {
  try {
    const { name, phone, email, service } = req.body;

    if (!name || !phone || !service || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const serviceList = Array.isArray(service)
      ? service.join(', ')
      : service;

    const quotationNumber = generateQuotationNumber();

    await appendToSheet('PopUpForm!A2:E', [
      quotationNumber,         
      name.trim(),             
      phone.trim(),
      email.trim(),             
      serviceList.trim(),      
                 
    ]);

    res.status(200).json({
      message: 'Contact saved successfully',
      quotationNumber
    });
  } catch (err) {
    console.error('❌ Google Sheets Error:', err.message);
    res.status(500).json({
      error: 'Error saving contact',
      details: err.message
    });
  }
});

module.exports = router;
