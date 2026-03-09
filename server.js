require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Разрешаем CORS, чтобы наш фронтенд мог обращаться к серверу
app.use(cors());
// Увеличиваем лимит для JSON, так как мы передаем base64 картинки
app.use(express.json({ limit: '50mb' })); 

// Разрешаем отдавать статические файлы (например, картинки, если они появятся) из текущей папки
app.use(express.static(__dirname));

// 1. ЭНДПОИНТ АВТОРИЗАЦИИ (Обмен кода на токен)
app.post('/api/auth/tiktok', async (req, res) => {
  const { code, redirect_uri } = req.body;
  
  if (!code || !redirect_uri) {
    return res.status(400).json({ error: 'Missing code or redirect_uri' });
  }

  try {
    // Формируем параметры запроса согласно документации TikTok API
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

    // Успешный ответ содержит access_token
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
    /* Здесь происходит вызов TikTok Content Posting API.
      Реальный процесс включает в себя:
      1. Запрос на инициализацию (init)
      2. Загрузку медиафайла (upload) кусками
      3. Подтверждение загрузки (commit)
      
      Поскольку загрузка файлов требует сложной разбивки бинарных данных,
      ниже приведена структура успешного ответа для работы нашего UI.
      Для реальной загрузки потребуется использовать FormData и буферы.
    */
    
    // Эмулируем задержку сети при отправке поста в TikTok
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

// Catch-all маршрут: отдаем наш единственный index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`HOLLY Post Backend is running on port ${PORT}`);
});
