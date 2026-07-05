import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

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

// 1.5. SECURE EMAIL OTP SENDING API
app.post('/api/send-otp', async (req, res) => {
  const { email, code, name } = req.body;
  if (!email || !code) {
    return res.status(400).json({ success: false, message: 'Email et Code requis pour l\'envoi' });
  }

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '465');

  if (!smtpUser || !smtpPass) {
    console.warn('SMTP credentials are not configured in environment variables.');
    return res.json({ 
      success: true, 
      emailed: false, 
      message: 'SMTP_NOT_CONFIGURED' 
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // True for port 465 (SSL)
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    const mailOptions = {
      from: `"Discipline Pro" <${smtpUser}>`,
      to: email.trim().toLowerCase(),
      subject: `🔑 [Discipline Pro] Votre Code de Sécurité : ${code}`,
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #fafafa; color: #1e293b;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 22px; font-weight: 800; color: #10b981; letter-spacing: 2px; font-family: monospace;">DISCIPLINE PRO</span>
          </div>
          <p style="font-size: 15px; color: #334155; line-height: 1.5; font-weight: 600;">Bonjour ${name || 'Franck'},</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.5;">Voici votre code de sécurité à usage unique (OTP) pour vous connecter et synchroniser vos données et progrès sur tous vos téléphones et ordinateurs :</p>
          <div style="text-align: center; margin: 26px 0; padding: 18px; background-color: #0f172a; border-radius: 12px; color: #34d399; font-family: monospace; font-size: 38px; font-weight: bold; letter-spacing: 6px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.15);">
            ${code}
          </div>
          <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-top: 26px; border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center;">
            Ce code est valable pendant 10 minutes pour des raisons de sécurité.<br/>
            Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return res.json({ 
      success: true, 
      emailed: true, 
      message: 'Code envoyé par e-mail avec succès !' 
    });
  } catch (error: any) {
    console.error('Error sending email via Nodemailer:', error);
    const errorMessage = error.message || '';
    const isBadCredentials = errorMessage.includes('535') || 
                            errorMessage.includes('BadCredentials') || 
                            errorMessage.includes('Invalid login') || 
                            errorMessage.includes('Username and Password not accepted');
    return res.status(500).json({ 
      success: false, 
      isBadCredentials: !!isBadCredentials,
      message: `Erreur d'envoi SMTP : ${error.message}` 
    });
  }
});

// 1.6. SECURE SMS OTP SENDING API
app.post('/api/send-sms-otp', async (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ success: false, message: 'Téléphone et Code requis pour l\'envoi' });
  }

  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
  const textbeltKey = process.env.TEXTBELT_API_KEY || 'textbelt';

  const messageBody = `🔑 [Discipline Pro] Votre code de verification unique est : ${code}. Il est valable pendant 10 minutes.`;

  // 1. If Twilio is fully configured in the Secrets, use Twilio!
  if (twilioSid && twilioToken && twilioFrom) {
    try {
      console.log(`Sending SMS via Twilio to ${phone}...`);
      const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          To: phone.trim(),
          From: twilioFrom.trim(),
          Body: messageBody
        })
      });

      const data = await response.json();
      if (response.ok) {
        return res.json({
          success: true,
          provider: 'twilio',
          message: 'Code envoyé par SMS via Twilio avec succès !'
        });
      } else {
        console.error('Twilio error response:', data);
        return res.status(500).json({
          success: false,
          provider: 'twilio',
          message: `Erreur Twilio : ${data.message || 'Inconnue'}`
        });
      }
    } catch (err: any) {
      console.error('Twilio fetch exception:', err);
      return res.status(500).json({
        success: false,
        provider: 'twilio',
        message: `Erreur d'envoi Twilio : ${err.message}`
      });
    }
  }

  // 2. Otherwise, fall back to Textbelt (1 free SMS per day per IP for development testing)
  try {
    console.log(`Sending SMS via Textbelt fallback to ${phone}...`);
    const response = await fetch('https://textbelt.com/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        phone: phone.trim(),
        message: messageBody,
        key: textbeltKey
      })
    });

    const data: any = await response.json();
    if (response.ok && data.success) {
      return res.json({
        success: true,
        provider: 'textbelt',
        message: 'Code envoyé gratuitement par SMS via Textbelt (limite de 1 SMS gratuit par jour) !'
      });
    } else {
      console.warn('Textbelt failed or limit reached:', data);
      return res.json({
        success: false,
        provider: 'textbelt',
        quotaExceeded: data.error && data.error.includes('quota'),
        message: data.error || 'Quota gratuit Textbelt dépassé pour aujourd\'hui.'
      });
    }
  } catch (err: any) {
    console.error('Textbelt fetch exception:', err);
    return res.status(500).json({
      success: false,
      provider: 'textbelt',
      message: `Erreur d'envoi SMS : ${err.message}`
    });
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
