require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Contactus = require('./Sheet_Routes/Contactus');
const PopUpform =require('./Sheet_Routes/PopUpForm');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('✅ Server is running');
});

app.use('/api', Contactus);
app.use('/api',PopUpform);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
