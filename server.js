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
        console.log('Gemini Response Status:', response.status);
        console.log('Gemini Response:', JSON.stringify(data, null, 2));
        
        if (!response.ok) {
            console.error('Gemini API Error Details:', data);
            throw new Error(`Gemini API error: ${data.error?.message || JSON.stringify(data)}`);
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
        console.log('Speech request received for text:', text);
        
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': process.env.ELEVENLABS_API_KEY
            },
            body: JSON.stringify({
                text,
                model_id: 'eleven_turbo_v2_5',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.5
                }
            })
        });
        
        console.log('ElevenLabs response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('ElevenLabs API error:', errorText);
            throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
        }
        
        const audioBuffer = await response.buffer();
        console.log('Audio buffer size:', audioBuffer.length);
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
