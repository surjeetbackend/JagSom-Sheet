const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const Counter = require('../model/Counter');
const PopupContact = require('../model/PopupContact'); 
console.log("📦 PopUpForm route loaded");
const sendEmail = require("../util/mail");
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
       

const now = new Date(); 

const istDateTime = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true, 
}).formatToParts(now);

let dateParts = {};
istDateTime.forEach(({ type, value }) => {
  dateParts[type] = value;
});

const formattedDate = `${dateParts.day}/${dateParts.month}/${dateParts.year}`;
const formattedTime = `${dateParts.hour}:${dateParts.minute}:${dateParts.second} ${dateParts.dayPeriod}`;


      const emailContent = `
     <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#e6ecf1" style="font-family: Arial, sans-serif;">
  <tr>
    <td align="center" style="padding: 40px 10px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.05); overflow: hidden;">
        
        <tr>
          <td bgcolor="#21467d" align="center" style="padding: 20px;">
            <img src="https://jagsomelectricals.com/assets/JAGSOM%20Logo%20file-DL9ho0io.png" alt="Jagsom Electricals Logo" width="160" style="display: block;">
          </td>
        </tr>

        <tr>
          <td align="center" style="padding: 30px 20px 10px; width:fit-content; margin:0 auto;">
            <img src="https://i.ibb.co/Y7WDFGgH/Done-Aniamtion-icon-1.gif" alt="Verification Success" width="300px" style="display: block; border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
          </td>
        </tr>

        <tr>
          <td align="center" style="padding: 10px 20px;">
            <h2 style="color: #2c3e50; margin: 10px 0;">Quotation Number: <span style="color: #21467d;">${quotationNumber}</span></h2>
          </td>
        </tr>

        <tr>
          <td style="padding: 0 30px;">
            <p style="font-size: 15px; line-height: 1.6; color: #333;">Hello <strong>${name}</strong>,</p>
            <p style="font-size: 15px; line-height: 1.6; color: #333;">Thank you for reaching out to <strong>Jagsom Electrical Pvt Ltd</strong>. We've successfully received your enquiry. Below are the details you provided:</p>
          </td>
        </tr>

        <tr>
          <td style="padding: 20px 30px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background: #f1f6fb; border-radius: 8px; padding: 20px;">
              <tr>
                <td style="padding: 10px; font-size: 14px; color: #333;">
                  <strong>Service:</strong> ${serviceList}<br>
                  <strong>Message:</strong> ${message}<br>
                  <strong>Phone:</strong> ${phone}<br>
                  <strong>Email:</strong> ${email}<br>
                  <strong>Date:</strong> ${formattedDate}<br>
                  <strong>Time:</strong> ${formattedTime}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td align="center" style="padding: 20px 30px;">
            <p style="font-size: 15px; margin: 0 0 10px;">If you have any urgent queries, feel free to call us:</p>
            <p style="font-size: 18px; font-weight: bold; color: #21467d; margin: 0;">📞 8178150910, 7821939453</p>
          </td>
        </tr>

        <tr>
          <td style="padding: 20px 30px;">
            <p style="font-size: 14px; color: #555;">Best regards,</p>
            <p style="font-size: 15px; font-weight: bold; color: #2c3e50; margin: 0;">Jagsom Electrical Pvt Ltd</p>
          </td>
        </tr>

        <tr>
          <td bgcolor="#21467d" align="center" style="padding: 15px; color: #ffffff; font-size: 13px;">
            © 2025 Jagsom Electrical Pvt Ltd. All rights reserved.
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
    `;

    await sendEmail(
      email,
      `Your Enquiry Confirmation - ${quotationNumber}`,
      emailContent
    );

    res.status(200).json({
      message: 'Contact saved & email sent successfully',
      quotationNumber
    });


  } catch (err) {
    console.error('Error saving contact:', err.message);
    res.status(500).json({
      error: 'Error saving contact',
      details: err.message
    });
  }
});




module.exports = router;
