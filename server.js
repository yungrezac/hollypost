require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Подключаем FFMPEG для создания видео из 1 фото
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const PORT = process.env.PORT || 3001;

// Доверяем прокси Railway
app.set('trust proxy', 1);

// Создаем папку для временных файлов
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// ==========================================
// НАСТРОЙКА SUPABASE
// ==========================================
const supabaseUrl = process.env.SUPABASE_URL || 'https://zagvyrqnayxdbqkcjqud.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_glnqsWdFcmaHOzUrfD5fGA_dt6xiB1f';
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(express.json({ limit: '50mb' })); 

// ==========================================
// ЛЕГАЛЬНЫЕ ДОКУМЕНТЫ (TOS & Privacy)
// ==========================================
app.get('/tiktokVr8r1YMiO490psCs9PIqCeFssNIy7bN8.txt', (req, res) => {
  res.type('text/plain');
  res.send('tiktok-developers-site-verification=Vr8r1YMiO490psCs9PIqCeFssNIy7bN8');
});

app.get('/terms', (req, res) => res.send('<h1>Terms of Service</h1><p>Compliant with TikTok API.</p>'));
app.get('/privacy', (req, res) => res.send('<h1>Privacy Policy</h1><p>Compliant with TikTok API.</p>'));

// ==========================================
// 1. ЭНДПОИНТ АВТОРИЗАЦИИ
// ==========================================
app.post('/api/auth/tiktok', async (req, res) => {
  const { code, redirect_uri } = req.body;
  
  if (!code || !redirect_uri) return res.status(400).json({ error: 'Missing code or redirect_uri' });

  try {
    const params = new URLSearchParams();
    params.append('client_key', process.env.TIKTOK_CLIENT_KEY);
    params.append('client_secret', process.env.TIKTOK_CLIENT_SECRET);
    params.append('code', code);
    params.append('grant_type', 'authorization_code');
    params.append('redirect_uri', redirect_uri);

    const response = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Ошибка авторизации TikTok:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to authenticate with TikTok', details: error.response?.data });
  }
});

// ==========================================
// 2. ИДЕАЛЬНАЯ ПУБЛИКАЦИЯ 1 ФОТО В TIKTOK
// ==========================================
app.post('/api/publish', async (req, res) => {
  const { accessToken, image, caption } = req.body;
  
  if (!accessToken) return res.status(401).json({ error: 'No access token provided' });
  if (!image) return res.status(400).json({ error: 'No image provided' });

  try {
    // 1. Извлекаем данные картинки пользователя
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid image format' });
    }
    
    const ext = matches[1].split('/')[1] || 'jpg';
    const imageBuffer = Buffer.from(matches[2], 'base64');
    const hash = crypto.randomBytes(16).toString('hex');
    
    const imagePath = path.join(uploadDir, `${hash}.${ext}`);
    const videoPath = path.join(uploadDir, `${hash}.mp4`);
    const bucketName = 'hollypost';

    // Сохраняем фото локально
    fs.writeFileSync(imagePath, imageBuffer);

    console.log("Превращаем 1 фото в видео для TikTok...");

    // 2. Конвертируем 1 фото в 4-секундное MP4-видео
    await new Promise((resolve, reject) => {
      ffmpeg()
        .loop(1) // Берем один кадр и зацикливаем
        .input(imagePath)
        .outputOptions([
          '-c:v libx264',
          '-t 4', // 4 секунды (TikTok требует минимум 3 сек для видео)
          '-pix_fmt yuv420p',
          '-vf scale=trunc(iw/2)*2:trunc(ih/2)*2' // TikTok требует четные разрешения сторон
        ])
        .save(videoPath)
        .on('end', resolve)
        .on('error', reject);
    });

    console.log("Видео готово! Загрузка в Supabase...");

    // 3. Загружаем готовое видео в Supabase
    const videoBuffer = fs.readFileSync(videoPath);
    const videoFilename = `${hash}.mp4`;

    const upload = await supabase.storage.from(bucketName).upload(videoFilename, videoBuffer, { 
      contentType: 'video/mp4', 
      upsert: false 
    });

    if (upload.error) throw new Error("Ошибка загрузки в Supabase: " + upload.error.message);

    // Удаляем локальные временные файлы, чтобы не засорять сервер
    fs.unlinkSync(imagePath);
    fs.unlinkSync(videoPath);

    // 4. Получаем публичную ссылку на видео
    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(videoFilename);
    const videoUrl = urlData.publicUrl;

    console.log("Ссылка Supabase готова:", videoUrl);

    // 5. Формируем полезную нагрузку для TikTok (Теперь это легальное ВИДЕО!)
    const payload = {
      post_mode: 'DIRECT_POST',
      post_info: {
        privacy_level: 'SELF_ONLY', // Загружаем "Только для себя" для теста
        disable_comment: false
      },
      source_info: {
        source: 'PULL_FROM_URL',
        video_url: videoUrl // Передаем ссылку на видео!
      },
      media_type: 'VIDEO' // TikTok с радостью принимает 1 видео
    };

    // Передаем текст (защита от спам-фильтра)
    if (caption && caption.trim().length > 0) {
      payload.post_info.title = caption.trim().substring(0, 2000);
    }

    // 6. Отправляем запрос в TikTok
    const tiktokRes = await axios.post('https://open.tiktokapis.com/v2/post/publish/content/init/', payload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({ 
      success: true, 
      message: 'Пост успешно отправлен в TikTok',
      tiktok_response: tiktokRes.data
    });

    // 7. Очистка видео из Supabase через 10 минут
    setTimeout(async () => {
      await supabase.storage.from(bucketName).remove([videoFilename]);
      console.log(`Файл ${videoFilename} очищен из Supabase.`);
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
 
