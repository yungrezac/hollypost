require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3001;

// Доверяем прокси Railway
app.set('trust proxy', 1);

// ==========================================
// НАСТРОЙКА SUPABASE
// Вставлены ваши ключи для прямого доступа
// ==========================================
const supabaseUrl = process.env.SUPABASE_URL || 'https://zagvyrqnayxdbqkcjqud.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_glnqsWdFcmaHOzUrfD5fGA_dt6xiB1f';
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
// Увеличиваем лимит для JSON
app.use(express.json({ limit: '50mb' })); 

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
// 1. ЭНДПОИНТ АВТОРИЗАЦИИ
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
// 2. ЭНДПОИНТ ПУБЛИКАЦИИ В TIKTOK
// ==========================================
app.post('/api/publish', async (req, res) => {
  const { accessToken, image, caption } = req.body; // Убрали music, так как TikTok запрещает авто-текст
  
  if (!accessToken) return res.status(401).json({ error: 'No access token provided' });
  if (!image) return res.status(400).json({ error: 'No image provided' });

  try {
    // 1. Извлекаем данные картинки из base64
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid image format' });
    }
    
    // 2. Готовим буфер и уникальные имена
    const ext = matches[1].split('/')[1] || 'jpg';
    const buffer = Buffer.from(matches[2], 'base64');
    const hash = crypto.randomBytes(16).toString('hex');
    
    // Создаем два РАЗНЫХ файла в бакете 'hollypost'
    const filename1 = `${hash}-1.${ext}`;
    const filename2 = `${hash}-2.${ext}`;
    const bucketName = 'hollypost';

    console.log("Загрузка файлов в Supabase...");

    // 3. Загружаем оба файла в Supabase Storage
    const upload1 = await supabase.storage.from(bucketName).upload(filename1, buffer, {
      contentType: `image/${ext}`,
      upsert: false
    });
    const upload2 = await supabase.storage.from(bucketName).upload(filename2, buffer, {
      contentType: `image/${ext}`,
      upsert: false
    });

    if (upload1.error) throw new Error("Ошибка загрузки файла 1 в Supabase: " + upload1.error.message);
    if (upload2.error) throw new Error("Ошибка загрузки файла 2 в Supabase: " + upload2.error.message);

    // 4. Получаем публичные ссылки (CDN)
    const { data: urlData1 } = supabase.storage.from(bucketName).getPublicUrl(filename1);
    const { data: urlData2 } = supabase.storage.from(bucketName).getPublicUrl(filename2);

    const imageUrl1 = urlData1.publicUrl;
    const imageUrl2 = urlData2.publicUrl;

    console.log("Ссылки Supabase готовы:", imageUrl1, imageUrl2);

    // 5. Формируем текст (СТРОГО ТОЛЬКО ПОЛЬЗОВАТЕЛЬСКИЙ ТЕКСТ)
    // Любой авто-добавленный текст или хэштеги TikTok блокирует ошибкой "review our integration guidelines"
    let finalCaption = caption ? caption.substring(0, 2000) : '';

    // 6. Отправляем запрос в TikTok
    const payload = {
      post_mode: 'DIRECT_POST',
      post_info: {
        title: finalCaption,
        privacy_level: 'SELF_ONLY' // Загружаем "Только для себя", пока тестируем
      },
      source_info: {
        source: 'PULL_FROM_URL',
        photo_cover_index: 1,
        // Передаем две уникальные ссылки от Supabase
        photo_images: [imageUrl1, imageUrl2] 
      },
      media_type: 'PHOTO'
    };

    const tiktokRes = await axios.post('https://open.tiktokapis.com/v2/post/publish/content/init/', payload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    // 7. Отвечаем клиенту об успехе
    res.json({ 
      success: true, 
      message: 'Пост успешно отправлен в TikTok',
      tiktok_response: tiktokRes.data
    });

    // 8. Удаляем картинки из Supabase через 10 минут
    setTimeout(async () => {
      await supabase.storage.from(bucketName).remove([filename1, filename2]);
      console.log(`Файлы очищены из Supabase.`);
    }, 10 * 60 * 1000);

  } catch (error) {
    const statusCode = error.response?.status || 500;
    const errorDetails = error.response?.data || error.message;
    console.error('Ошибка публикации:', JSON.stringify(errorDetails, null, 2));
    res.status(statusCode).json({ error: 'Failed to publish post', details: errorDetails });
  }
});

// ==========================================
// ГЛАВНЫЕ РОУТЫ СТРАНИЦ
// ==========================================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`HOLLY Post Backend is running on port ${PORT}`);
});
