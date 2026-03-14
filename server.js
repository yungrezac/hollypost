require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

// Доверяем прокси Railway, чтобы правильно получать HTTPS протокол для ссылок
app.set('trust proxy', 1);

// Создаем папку для временных картинок, если её нет
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Разрешаем CORS
app.use(cors());
// Увеличиваем лимит для JSON (до 50мб, чтобы картинки точно пролезли)
app.use(express.json({ limit: '50mb' })); 

// Разрешаем публичный доступ ТОЛЬКО к папке с временными картинками
app.use('/uploads', express.static(uploadDir));

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
    <head><title>Terms of Service - HOLLY Post</title></head>
    <body style="font-family: sans-serif; max-width: 800px; margin: 40px auto; padding: 20px;">
      <h1>Terms of Service</h1>
      <p>By using HOLLY Post, you agree to comply with TikTok's community guidelines and API terms of service. You are solely responsible for the content you publish.</p>
    </body>
    </html>
  `);
});

app.get('/privacy', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head><title>Privacy Policy - HOLLY Post</title></head>
    <body style="font-family: sans-serif; max-width: 800px; margin: 40px auto; padding: 20px;">
      <h1>Privacy Policy</h1>
      <p>HOLLY Post uses your data only to publish content on your behalf via TikTok's official API. We do not permanently store your photos, passwords, or tokens.</p>
    </body>
    </html>
  `);
});

// ==========================================
// 1. ЭНДПОИНТ АВТОРИЗАЦИИ (Обмен кода на токен)
// ==========================================
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

// ==========================================
// 2. РЕАЛЬНЫЙ ЭНДПОИНТ ПУБЛИКАЦИИ В TIKTOK
// ==========================================
app.post('/api/publish', async (req, res) => {
  const { accessToken, image, caption, music } = req.body;
  
  if (!accessToken) return res.status(401).json({ error: 'No access token provided' });
  if (!image) return res.status(400).json({ error: 'No image provided' });

  try {
    // 1. Извлекаем данные картинки из base64
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid image format' });
    }
    
    // 2. Создаем уникальный файл и сохраняем его
    const ext = matches[1].split('/')[1] || 'jpg';
    const buffer = Buffer.from(matches[2], 'base64');
    const filename = `${crypto.randomBytes(16).toString('hex')}.${ext}`;
    const filepath = path.join(uploadDir, filename);
    
    fs.writeFileSync(filepath, buffer);

    // 3. Формируем 100% правильную публичную ссылку
    const host = req.get('host');
    let protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    
    // Защита от дублирования протоколов в Railway (например 'https,http')
    if (protocol.includes(',')) {
      protocol = protocol.split(',')[0].trim();
    }
    
    const imageUrl1 = `${protocol}://${host}/uploads/${filename}`;
    // Добавляем фиктивный параметр, чтобы TikTok считал ссылки разными
    const imageUrl2 = `${protocol}://${host}/uploads/${filename}?copy=1`;

    // Формируем текст, избегая undefined и превышения лимитов API
    let finalCaption = (caption || 'Мой пост') + (music ? `\n\n🎵 Трек: ${music}` : '');
    finalCaption = finalCaption.substring(0, 2000); // TikTok ограничивает длину текста

    // 4. Отправляем запрос в TikTok Direct Post API
    const payload = {
      post_info: {
        title: finalCaption,
        privacy_level: 'SELF_ONLY' // SELF_ONLY (Приватное) или PUBLIC_TO_EVERYONE
      },
      source_info: {
        source: 'PULL_FROM_URL',
        photo_cover_index: 1,
        // Массив из 2-х ссылок для карусели
        photo_images: [imageUrl1, imageUrl2]
      },
      media_type: 'PHOTO'
    };

    console.log("Отправляем payload в TikTok:", JSON.stringify(payload, null, 2));

    const tiktokRes = await axios.post('https://open.tiktokapis.com/v2/post/publish/content/init/', payload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    // 5. Отвечаем клиенту об успехе
    res.json({ 
      success: true, 
      message: 'Пост успешно отправлен в TikTok',
      tiktok_response: tiktokRes.data
    });

    // 6. Убираем за собой: удаляем временный файл картинки через 5 минут
    setTimeout(() => {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }, 5 * 60 * 1000);

  } catch (error) {
    const statusCode = error.response?.status || 500;
    const errorDetails = error.response?.data || error.message;
    
    console.error('Ошибка публикации TikTok API:', JSON.stringify(errorDetails, null, 2));
    
    res.status(statusCode).json({ 
      error: 'Failed to publish post',
      details: errorDetails
    });
  }
});

// ==========================================
// ГЛАВНЫЕ РОУТЫ СТРАНИЦ
// ==========================================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Отдаем index.html на любой другой запрос (чтобы работали ссылки)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`HOLLY Post Backend is running on port ${PORT}`);
});
