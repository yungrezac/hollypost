require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

// Подключаем FFMPEG для создания видео из 1 фото
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const PORT = process.env.PORT || 3001;

// Доверяем прокси Railway
app.set('trust proxy', 1);

// Создаем папку для временных файлов, если её нет
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

app.use(cors());
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
// 2. ИДЕАЛЬНАЯ ПУБЛИКАЦИЯ 1 ФОТО В TIKTOK (ЧЕРЕЗ КОНВЕРТАЦИЮ В ВИДЕО И ПРЯМУЮ ЗАГРУЗКУ)
// ==========================================
app.post('/api/publish', async (req, res) => {
  const { accessToken, image, caption } = req.body;
  
  if (!accessToken) return res.status(401).json({ error: 'No access token provided' });
  if (!image) return res.status(400).json({ error: 'No image provided' });

  // ВЫНОСИМ ПЕРЕМЕННЫЕ СЮДА, чтобы блок catch мог их увидеть и правильно удалить файлы при ошибке
  let imagePath = null;
  let videoPath = null;

  try {
    // 1. Извлекаем данные картинки пользователя
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid image format' });
    }
    
    const ext = matches[1].split('/')[1] || 'jpg';
    const imageBuffer = Buffer.from(matches[2], 'base64');
    const hash = crypto.randomBytes(16).toString('hex');
    
    imagePath = path.join(uploadDir, `${hash}.${ext}`);
    videoPath = path.join(uploadDir, `${hash}.mp4`);

    // Сохраняем фото локально на сервере для ffmpeg
    fs.writeFileSync(imagePath, imageBuffer);

    console.log("Превращаем 1 фото в видео для TikTok...");

    // 2. Конвертируем 1 фото в 4-секундное MP4-видео с защитой памяти (Railway)
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(imagePath)
        .inputOptions(['-loop 1']) // Зацикливаем картинку
        .outputOptions([
          '-c:v libx264',
          '-t 4', // Длительность: 4 секунды (TikTok требует минимум 3 сек)
          '-pix_fmt yuv420p',
          '-r 30', // Стабильная частота кадров
          '-preset ultrafast', // ОЧЕНЬ ВАЖНО: Режим минимального потребления оперативной памяти
          '-threads 1', // Ограничиваем нагрузку 1 потоком (спасает Railway от краша)
          "-vf scale=trunc(iw/2)*2:trunc(ih/2)*2" // Делаем стороны четными (требование кодека h.264)
        ])
        .save(videoPath)
        .on('end', resolve)
        .on('error', (err) => {
          console.error("Ошибка FFMPEG:", err);
          reject(err);
        });
    });

    console.log("Видео готово! Инициализация загрузки в TikTok...");

    // 3. Читаем готовое видео и узнаем его размер
    const videoBuffer = fs.readFileSync(videoPath);
    const videoSize = videoBuffer.length;

    // 4. Формируем запрос к TikTok для старта ЗАГРУЗКИ ВИДЕО (ИСПРАВЛЕННЫЙ ПЕЙЛОАД И URL)
    const initPayload = {
      post_mode: 'DIRECT_POST',
      post_info: {
        privacy_level: 'SELF_ONLY', // Загружаем "Только для себя" для теста
        disable_comment: false
      },
      source_info: {
        source: 'FILE_UPLOAD', // TikTok ТРЕБУЕТ этот параметр для прямой загрузки видео
        video_size: videoSize,
        chunk_size: videoSize,
        total_chunk_count: 1
      }
      // ВАЖНО: Мы убрали media_type: 'VIDEO', так как мы теперь обращаемся к специальному video endpoint
    };

    // Строгое соблюдение правил TikTok: передаем текст только если пользователь его ввел
    if (caption && caption.trim().length > 0) {
      initPayload.post_info.title = caption.trim().substring(0, 2000);
    }

    // ИСПРАВЛЕНИЕ: Отправляем запрос на /video/init/ вместо /content/init/
    const initRes = await axios.post('https://open.tiktokapis.com/v2/post/publish/video/init/', initPayload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    // 5. Получаем уникальную ссылку от TikTok для заливки самого видео
    const uploadUrl = initRes.data.data.upload_url;
    
    console.log("TikTok дал ссылку для загрузки. Отправляем байты видео...");

    // 6. Загружаем байты видео напрямую на сервер TikTok
    await axios.put(uploadUrl, videoBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': videoSize,
        'Content-Range': `bytes 0-${videoSize - 1}/${videoSize}`
      }
    });

    console.log("Видео успешно отправлено в TikTok!");

    // Убираем за собой: удаляем локальные временные файлы с сервера
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);

    // 7. Отвечаем клиенту об успехе
    res.json({ 
      success: true, 
      message: 'Пост успешно отправлен в TikTok'
    });

  } catch (error) {
    // В случае ошибки гарантированно чистим файлы с диска Railway
    if (imagePath && fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    if (videoPath && fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
    
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

// Отдаем index.html на любой другой запрос (чтобы работали роуты)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`HOLLY Post Backend is running on port ${PORT}`);
});
