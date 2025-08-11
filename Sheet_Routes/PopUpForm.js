const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const Counter = require('../model/Counter');
const PopupContact = require('../model/PopupContact'); 
console.log("📦 PopUpForm route loaded");

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const SHEET_ID = process.env.GOOGLE_SHEET_ID;


const generateQuotationNumber = async () => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');

  const counter = await Counter.findOneAndUpdate(
    { name: 'quotation' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const number = String(counter.seq).padStart(4, '1000');
  return `${year}${month}${number}`;
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
    const { name, phone, email, service, message } = req.body;

    if (!name || !phone || !email || !service || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const serviceList = Array.isArray(service)
      ? service.join(', ')
      : service;

    const quotationNumber = await generateQuotationNumber(); 


    const newContact = new PopupContact({
      quotationNumber,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      service: serviceList.trim(),
      message: message.trim(),
    });

    await newContact.save();

    await appendToSheet('PopUpForm!A2:F', [
      quotationNumber,
      name.trim(),
      phone.trim(),
      email.trim(),
      serviceList.trim(),
      message.trim()
    ]);

    res.status(200).json({
      message: 'Contact saved successfully',
      quotationNumber
    });

  } catch (err) {
    console.error('❌ Error saving contact:', err.message);
    res.status(500).json({
      error: 'Error saving contact',
      details: err.message
    });
  }
});




module.exports = router;
