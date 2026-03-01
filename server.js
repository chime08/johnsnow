const express = require('express');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.static('.'));

// Caption endpoint - uses Google Gemini Vision API
app.post('/api/caption', async (req, res) => {
    try {
        const { image } = req.body;
        
        // Remove data URL prefix to get base64 data
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: 'Describe this image in one clear sentence for someone with visual impairment.' },
                        {
                            inline_data: {
                                mime_type: 'image/jpeg',
                                data: base64Data
                            }
                        }
                    ]
                }]
            })
        });
        
        const data = await response.json();
        
        // Log the full response for debugging
        console.log('Gemini Response:', JSON.stringify(data, null, 2));
        
        if (!response.ok) {
            throw new Error(`Gemini API error: ${data.error?.message || 'Unknown error'}`);
        }
        
        if (!data.candidates || !data.candidates[0]) {
            throw new Error('Invalid response from Gemini API');
        }
        
        const caption = data.candidates[0].content.parts[0].text;
        
        res.json({ caption });
    } catch (error) {
        console.error('Caption error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Speech endpoint - uses ElevenLabs API
app.post('/api/speak', async (req, res) => {
    try {
        const { text } = req.body;
        
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': process.env.ELEVENLABS_API_KEY
            },
            body: JSON.stringify({
                text,
                model_id: 'eleven_monolingual_v1',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.5
                }
            })
        });
        
        const audioBuffer = await response.buffer();
        res.set('Content-Type', 'audio/mpeg');
        res.send(audioBuffer);
    } catch (error) {
        console.error('Speech error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
