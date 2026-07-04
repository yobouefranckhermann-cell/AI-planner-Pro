import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Ensure database directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

app.use(express.json({ limit: '10mb' }));

// Helper to get filepath for an email
function getFilePathForEmail(email: string): string {
  const sanitized = email.trim().toLowerCase().replace(/[^a-z0-9_@.-]/g, '_');
  return path.join(DATA_DIR, `db_${sanitized || 'default'}.json`);
}

// 1. STATE MANAGEMENT API
app.get('/api/state', (req, res) => {
  const email = (req.query.email as string) || '';
  if (!email) {
    return res.json({ success: false, message: 'Email required for sync' });
  }

  const filePath = getFilePathForEmail(email);
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      return res.json({ success: true, state: data });
    } catch (e) {
      console.error('Error reading state file', e);
      return res.status(500).json({ success: false, message: 'Could not parse stored data' });
    }
  } else {
    return res.json({ success: true, state: null, message: 'No data found, starting fresh' });
  }
});

app.post('/api/state', (req, res) => {
  const email = (req.query.email as string) || '';
  const state = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email required for sync' });
  }

  const filePath = getFilePathForEmail(email);
  try {
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf-8');
    return res.json({ success: true, message: 'State saved successfully' });
  } catch (e) {
    console.error('Error writing state file', e);
    return res.status(500).json({ success: false, message: 'Failed to write state' });
  }
});

// 2. GEMINI ASSISTANT API
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'La clé API Gemini (GEMINI_API_KEY) n\'est pas configurée sur le serveur.' 
      });
    }

    const { messages, userContext } = req.body;
    
    // Initialize GoogleGenAI SDK with named parameter as required
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const userName = userContext?.name || 'Franck';
    const currentTime = userContext?.time || '04:30';
    const currentDate = userContext?.date || 'Vendredi 3 juillet 2026';
    const completedTasks = userContext?.completedTasks || [];
    const pendingTasks = userContext?.pendingTasks || [];
    const currentStreak = userContext?.streak || 0;

    const systemInstruction = `
Tu es l'assistant de vie et coach en discipline d'élite de ${userName}.
Ton objectif ultime est de l'aider à devenir extrêmement discipliné, productif et fort physiquement et mentalement.
Tu parles en français. Tu es direct, encourageant, inspirant, énergique et digne d'un mentor stoïcien (style Marcus Aurelius, David Goggins, ou un grand frère bienveillant mais ferme).

Voici le contexte en temps réel de ${userName} pour aujourd'hui (${currentDate}) :
- Heure actuelle : ${currentTime}
- Tâches complétées aujourd'hui : ${completedTasks.length > 0 ? completedTasks.join(', ') : 'Aucune pour le moment'}
- Tâches restantes pour aujourd'hui : ${pendingTasks.length > 0 ? pendingTasks.join(', ') : 'Aucune, excellent travail !'}
- Série de discipline actuelle (jours consécutifs actifs) : ${currentStreak} 🔥

RÈGLES DE COMPORTEMENT :
1. Salue Franck par son prénom ("Franck").
2. Si Franck vient de se réveiller (vers 4h30) ou si l'heure actuelle correspond au réveil : félicite-le s'il est levé ("Early Waking"). Dis-lui par exemple : "Franck, il est 4h30, l'heure des champions. Pas d'excuses !".
3. Si c'est l'heure de la Prière ou de la Méditation (4h35 - 5h00) : rappelle-lui l'importance de ce moment de connexion spirituelle et de calme intérieur.
4. Si c'est l'heure du Sport (5h05 - 5h30) : pousse-le à transpirer, à se dépasser physiquement. "Franck, c'est l'heure de forger ton corps ! Enfile tes baskets !".
5. Si c'est l'heure de la Douche froide (5h30) : motive-le à affronter le froid. C'est l'épreuve de la volonté.
6. Donne-lui régulièrement des citations motivantes historiques et puissantes (Sénèque, Goggins, etc.) adaptées à ses actions.
7. Sois réactif à ce qu'il a déjà accompli aujourd'hui. S'il a fait du sport ou s'est levé tôt, montre-lui ta fierté !
8. Reste synthétique, percutant et évite le bavardage inutile. Chaque message doit donner envie de se mettre directement au travail.
`;

    // Map conversation messages to the format required by SDK chat or generateContent
    // Since we want to use the standard gemini-3.5-flash text model, let's call generateContent
    // directly, passing the chat history as contents.
    const contents = messages.map((m: any) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    // Generate the content
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.8,
      }
    });

    const aiText = response.text || "Franck, reste fort et discipliné. Je suis là pour t'accompagner.";
    return res.json({ text: aiText });

  } catch (error: any) {
    console.error('Error calling Gemini API:', error);
    return res.status(500).json({ 
      error: 'Erreur lors de l\'interaction avec l\'assistant IA.',
      details: error.message 
    });
  }
});

// 3. VITE MIDDLEWARE / STATIC ASSETS
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Planner Pro server running on port ${PORT}`);
  });
}

startServer();
