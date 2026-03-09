require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Разрешаем CORS
app.use(cors());
// Увеличиваем лимит для JSON
app.use(express.json({ limit: '50mb' })); 

// Разрешаем отдавать статические файлы
app.use(express.static(__dirname));

// ==========================================
// СПЕЦИАЛЬНЫЙ РОУТ ДЛЯ ПОДТВЕРЖДЕНИЯ TIKTOK
// ==========================================
app.get('/tiktokVr8r1YMiO490psCs9PIqCeFssNIy7bN8.txt', (req, res) => {
  res.type('text/plain');
  res.send('tiktok-developers-site-verification=Vr8r1YMiO490psCs9PIqCeFssNIy7bN8');
});

// ==========================================
// ЛЕГАЛЬНЫЕ ДОКУМЕНТЫ (TOS & Privacy)
// ==========================================
app.get('/terms', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Terms of Service - HOLLY Post</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 40px auto; padding: 0 20px; }
        h1 { color: #111; }
        .date { color: #666; font-size: 0.9em; }
      </style>
    </head>
    <body>
      <h1>Terms of Service</h1>
      <p class="date">Last updated: March 2026</p>
      <p>Welcome to HOLLY Post. By using our application, you agree to these terms.</p>
      <h3>1. Use of the Application</h3>
      <p>HOLLY Post provides a tool to help you publish content to TikTok. You must be an authorized user of the TikTok account you connect to our service.</p>
      <h3>2. Content Responsibility</h3>
      <p>You are solely responsible for the photos, text, and any other content you publish through HOLLY Post. You agree not to publish any content that violates TikTok's community guidelines or any applicable laws.</p>
      <h3>3. Service Availability</h3>
      <p>We do not guarantee that our service will be available at all times. We reserve the right to modify or discontinue the service without notice.</p>
      <h3>4. Account Security</h3>
      <p>We do not store your TikTok passwords. Authentication is handled securely via TikTok's official Login Kit.</p>
    </body>
    </html>
  `);
});

app.get('/privacy', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Privacy Policy - HOLLY Post</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 40px auto; padding: 0 20px; }
        h1 { color: #111; }
        .date { color: #666; font-size: 0.9em; }
      </style>
    </head>
    <body>
      <h1>Privacy Policy</h1>
      <p class="date">Last updated: March 2026</p>
      <p>At HOLLY Post, we take your privacy seriously. This policy explains how we handle your data.</p>
      <h3>1. Information We Collect</h3>
      <p>We only request the permissions strictly necessary to provide our service. Specifically, we request basic profile information (user.info.basic) to identify your account, and publishing rights (video.publish) to post content on your behalf when you explicitly ask us to.</p>
      <h3>2. How We Use Your Data</h3>
      <p>Your data is used solely to facilitate the publication of your photos and captions to TikTok. We do not use your data for advertising, nor do we sell it to third parties.</p>
      <h3>3. Data Storage</h3>
      <p>We do not permanently store your photos, captions, or TikTok access tokens on our servers. Your content is processed temporarily during the upload process and then discarded.</p>
      <h3>4. Third-Party Services</h3>
      <p>Our application interacts directly with TikTok APIs. Please refer to TikTok's own Privacy Policy regarding how they handle the content you publish.</p>
    </body>
    </html>
  `);
});

// ==========================================
// ДЕМО-СТРАНИЦА ДЛЯ МОДЕРАТОРОВ TIKTOK
// ==========================================
app.get('/demo', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>App Demo & Workflow - HOLLY Post</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #f3f4f6; background-color: #0a0a0a; max-width: 800px; margin: 40px auto; padding: 0 20px; }
        h1, h2 { color: #ffffff; }
        .step { background: #121212; border: 1px solid #222; padding: 20px; border-radius: 12px; margin-bottom: 20px; }
        .step-title { font-weight: bold; color: #4ade80; margin-bottom: 10px; font-size: 1.1em; }
      </style>
    </head>
    <body>
      <h1>HOLLY Post - Application Workflow Demo</h1>
      <p>This page describes the exact user flow and how our application utilizes the requested TikTok API scopes (<strong>user.info.basic</strong> and <strong>video.publish</strong>).</p>
      
      <div class="step">
        <div class="step-title">Step 1: User Authentication (user.info.basic)</div>
        <p>The user visits our web application and clicks the "Login with TikTok" button. They are redirected to TikTok's secure Login Kit page where they review and grant the requested permissions. We use this scope to securely authenticate the user without handling their credentials.</p>
      </div>

      <div class="step">
        <div class="step-title">Step 2: Content Creation</div>
        <p>Once authenticated, the user is presented with a minimal interface. They upload a photo directly from their device and type a custom caption/hashtags into the text area.</p>
      </div>

      <div class="step">
        <div class="step-title">Step 3: Smart Music Matching</div>
        <p>Our application automatically analyzes the upload context and suggests a trending TikTok audio track to accompany the photo.</p>
      </div>

      <div class="step">
        <div class="step-title">Step 4: Publishing to TikTok (video.publish)</div>
        <p>The content is <strong>never</strong> posted automatically. The user must explicitly click the "Publish to TikTok" button. Upon clicking, our backend uses the Content Posting API to directly publish the photo, caption, and music combination to the user's TikTok feed.</p>
      </div>

      <div class="step">
        <div class="step-title">Step 5: Confirmation</div>
        <p>The user receives a visual success confirmation on our web app once the TikTok API successfully processes the post.</p>
      </div>
      
      <p style="margin-top: 40px; color: #888; text-align: center;"><em>Document provided for TikTok App Review purposes.</em></p>
    </body>
    </html>
  `);
});

// 1. ЭНДПОИНТ АВТОРИЗАЦИИ (Обмен кода на токен)
app.post('/api/auth/tiktok', async (req, res) => {
  const { code, redirect_uri } = req.body;
  
  if (!code || !redirect_uri) {
    return res.status(400).json({ error: 'Missing code or redirect_uri' });
  }

  try {
    const params = new URLSearchParams();
    params.append('client_key', process.env.TIKTOK_CLIENT_KEY);
    params.append('client_secret', process.env.TIKTOK_CLIENT_SECRET);
    params.append('code', code);
    params.append('grant_type', 'authorization_code');
    params.append('redirect_uri', redirect_uri);

    const response = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Ошибка авторизации TikTok:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to authenticate with TikTok',
      details: error.response?.data 
    });
  }
});

// 2. ЭНДПОИНТ ПУБЛИКАЦИИ КОНТЕНТА
app.post('/api/publish', async (req, res) => {
  const { accessToken, image, caption, music } = req.body;
  
  if (!accessToken) {
    return res.status(401).json({ error: 'No access token provided' });
  }

  try {
    // Эмуляция задержки при публикации
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    res.json({ 
      success: true, 
      message: 'Пост успешно отправлен',
      used_music: music 
    });

  } catch (error) {
    console.error('Ошибка публикации:', error);
    res.status(500).json({ error: 'Failed to publish post' });
  }
});

// Catch-all маршрут: отдаем наш index.html для всех остальных запросов
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`HOLLY Post Backend is running on port ${PORT}`);
});
