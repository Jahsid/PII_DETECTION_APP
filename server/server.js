const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use(cors());

app.post('/detect-pii', async (req, res) => {
  const { text } = req.body;

  try {
    const response = await axios.post('http://localhost:5001/analyze', {
      text,
      language: 'en'
    });

    res.json(response.data);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error detecting PII');
  }
});

app.listen(5000, () => console.log('Backend running on port 5000'));
