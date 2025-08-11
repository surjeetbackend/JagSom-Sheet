require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Contactus = require('./Sheet_Routes/Contactus');
const PopUpform =require('./Sheet_Routes/PopUpForm');
const mongoose = require('mongoose');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('✅ Server is running');
});

app.use('/api', Contactus);
app.use('/api',PopUpform);
mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log(' MongoDB connected');
    app.listen(5000, () => console.log('🚀 Server running on port 5000'));
  })
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
