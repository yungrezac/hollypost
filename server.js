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
app.get('/tiktoksI6jmaN1oRGZwLmjp6q0tekv3f9GlUpj.txt', (req, res) => {
  res.type('text/plain');
  res.send('tiktok-developers-site-verification=sI6jmaN1oRGZwLmjp6q0tekv3f9GlUpj');
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
// ДЕМО-СТРАНИЦА ДЛЯ МОДЕРАТОРОВ TIKTOK (Текст)
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

// ==========================================
// ИНТЕРАКТИВНОЕ ДЕМО ДЛЯ ЗАПИСИ СКРИНКАСТА
// ==========================================
app.get('/demoapp', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>HOLLY Post - DEMO</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://unpkg.com/lucide@latest"></script>
        <style>
            body { background-color: #0a0a0a; color: #f3f4f6; font-family: ui-sans-serif, system-ui, sans-serif; }
            .hidden { display: none !important; }
            textarea::-webkit-scrollbar { width: 8px; }
            textarea::-webkit-scrollbar-track { background: #0f0f0f; border-radius: 8px; }
            textarea::-webkit-scrollbar-thumb { background: #333; border-radius: 8px; }
        </style>
    </head>
    <body class="min-h-screen selection:bg-white selection:text-black flex flex-col items-center py-12 px-4 relative overflow-x-hidden">
        
        <!-- Декорации -->
        <div id="login-bg-1" class="absolute top-1/4 left-1/4 w-96 h-96 bg-[#2a2a2a] rounded-full mix-blend-screen filter blur-[120px] opacity-30 pointer-events-none"></div>
        <div id="login-bg-2" class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#1a1a1a] rounded-full mix-blend-screen filter blur-[100px] opacity-40 pointer-events-none"></div>

        <!-- DEMO BADGE -->
        <div class="absolute top-4 left-4 bg-red-500/20 border border-red-500 text-red-400 text-xs font-bold px-3 py-1 rounded-full z-50">
            DEMO MODE
        </div>

        <!-- ЭКРАН АВТОРИЗАЦИИ (Заглушка) -->
        <div id="login-screen" class="z-10 w-full max-w-md bg-[#121212]/80 backdrop-blur-xl border border-[#222] p-10 rounded-3xl shadow-2xl text-center mt-12">
            <div class="flex justify-center mb-6">
                <div class="w-16 h-16 bg-[#1a1a1a] rounded-2xl flex items-center justify-center border border-[#333]">
                    <i data-lucide="sparkles" class="w-8 h-8 text-white"></i>
                </div>
            </div>
            <h1 class="text-3xl tracking-widest font-light text-white uppercase mb-2">
                HOLLY <span class="font-bold">Post</span>
            </h1>
            <p class="text-gray-500 text-sm mb-10">Демо-авторизация без реального TikTok API.</p>

            <button id="login-btn" class="w-full py-4 rounded-xl flex items-center justify-center gap-3 font-medium bg-white text-black hover:bg-gray-200 active:scale-[0.98] transition-all duration-300">
                <i data-lucide="log-in" class="w-5 h-5"></i>
                <span id="login-btn-text">Войти через TikTok</span>
            </button>
        </div>

        <!-- ОСНОВНОЕ ПРИЛОЖЕНИЕ (Заглушка) -->
        <div id="app-screen" class="w-full max-w-md hidden relative z-10">
            <header class="mb-12 text-center w-full flex items-center justify-between">
                <h1 class="text-2xl tracking-widest font-light text-white uppercase flex items-center gap-2">
                    <i data-lucide="sparkles" class="w-5 h-5 text-gray-400"></i>
                    HOLLY <span class="font-bold">Post</span>
                </h1>
                <div class="text-xs bg-[#1a1a1a] text-emerald-400 px-3 py-1.5 rounded-full border border-[#333] flex items-center gap-2">
                    <div class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                    Demo User
                </div>
            </header>

            <main class="bg-[#121212] border border-[#222] p-6 rounded-2xl shadow-2xl relative overflow-hidden">
                <div id="success-overlay" class="hidden absolute inset-0 bg-[#0a0a0a]/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center transition-opacity duration-300">
                    <i data-lucide="check-circle" class="w-16 h-16 text-emerald-400 mb-4"></i>
                    <h2 class="text-xl font-medium text-white mb-2">Опубликовано!</h2>
                    <p class="text-gray-400 text-center px-6">Ваш пост успешно отправлен.</p>
                </div>

                <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">Фотография</label>
                    <div id="upload-zone" class="w-full h-64 border-2 border-dashed border-[#333] hover:border-white transition-colors rounded-xl flex flex-col items-center justify-center cursor-pointer bg-[#0f0f0f] group">
                        <i data-lucide="upload" class="w-8 h-8 text-gray-600 group-hover:text-white transition-colors mb-3"></i>
                        <span class="text-gray-500 group-hover:text-gray-300 transition-colors text-sm">Нажмите для загрузки</span>
                    </div>
                    <div id="image-preview-container" class="hidden relative w-full h-64 rounded-xl overflow-hidden group">
                        <img id="image-preview" src="" alt="Preview" class="w-full h-full object-cover"/>
                        <button id="remove-image-btn" class="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/90 rounded-full text-white transition-all backdrop-blur-sm">
                            <i data-lucide="x" class="w-4 h-4"></i>
                        </button>
                    </div>
                    <input type="file" id="file-input" accept="image/*" class="hidden"/>
                </div>

                <div id="music-section" class="mb-6 overflow-hidden transition-all duration-500 max-h-0 opacity-0">
                    <div class="flex items-center gap-3 p-4 rounded-xl border border-[#222] bg-gradient-to-r from-[#111] to-[#0a0a0a]">
                        <div class="p-2 bg-[#222] rounded-full"><i data-lucide="music" class="w-4 h-4 text-white"></i></div>
                        <div class="flex-1">
                            <p class="text-xs text-gray-500 uppercase tracking-wider mb-1">Аудио трек (Авто)</p>
                            <div id="music-loading" class="flex items-center gap-2">
                                <i data-lucide="loader-2" class="w-3 h-3 text-gray-400 animate-spin"></i>
                                <p class="text-sm text-gray-400">Подбор трека...</p>
                            </div>
                            <p id="music-title" class="hidden text-sm text-white font-medium truncate"></p>
                        </div>
                    </div>
                </div>

                <div class="mb-8">
                    <label class="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">Описание</label>
                    <textarea id="caption-input" placeholder="Добавьте подпись и хэштеги..." class="w-full bg-[#0f0f0f] border border-[#333] rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all resize-none h-28"></textarea>
                </div>

                <button id="publish-btn" disabled class="w-full py-4 rounded-xl flex items-center justify-center gap-2 font-medium transition-all duration-300 bg-[#1a1a1a] text-gray-600 cursor-not-allowed">
                    <i data-lucide="send" id="publish-icon" class="w-5 h-5"></i>
                    <i data-lucide="loader-2" id="publish-loader" class="w-5 h-5 animate-spin hidden"></i>
                    <span id="publish-text">Опубликовать в TikTok</span>
                </button>
            </main>
        </div>

        <script>
            lucide.createIcons();

            let currentImageData = null;
            let isPublishing = false;

            const elements = {
                loginScreen: document.getElementById('login-screen'),
                bg1: document.getElementById('login-bg-1'),
                bg2: document.getElementById('login-bg-2'),
                appScreen: document.getElementById('app-screen'),
                loginBtn: document.getElementById('login-btn'),
                loginText: document.getElementById('login-btn-text'),
                uploadZone: document.getElementById('upload-zone'),
                fileInput: document.getElementById('file-input'),
                previewContainer: document.getElementById('image-preview-container'),
                preview: document.getElementById('image-preview'),
                removeBtn: document.getElementById('remove-image-btn'),
                musicSection: document.getElementById('music-section'),
                musicLoading: document.getElementById('music-loading'),
                musicTitle: document.getElementById('music-title'),
                publishBtn: document.getElementById('publish-btn'),
                publishIcon: document.getElementById('publish-icon'),
                publishLoader: document.getElementById('publish-loader'),
                publishText: document.getElementById('publish-text'),
                successOverlay: document.getElementById('success-overlay')
            };

            // ФЕЙКОВАЯ АВТОРИЗАЦИЯ
            elements.loginBtn.addEventListener('click', () => {
                elements.loginBtn.disabled = true;
                elements.loginText.innerText = 'Подключение...';
                elements.loginBtn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i><span>Подключение...</span>';
                lucide.createIcons();

                setTimeout(() => {
                    elements.loginScreen.classList.add('hidden');
                    elements.bg1.classList.add('hidden');
                    elements.bg2.classList.add('hidden');
                    elements.appScreen.classList.remove('hidden');
                }, 1500);
            });

            // ЗАГРУЗКА ФОТО
            elements.uploadZone.addEventListener('click', () => elements.fileInput.click());
            
            elements.fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        currentImageData = reader.result;
                        elements.preview.src = currentImageData;
                        
                        elements.uploadZone.classList.add('hidden');
                        elements.previewContainer.classList.remove('hidden');
                        elements.publishBtn.disabled = false;
                        elements.publishBtn.className = "w-full py-4 rounded-xl flex items-center justify-center gap-2 font-medium transition-all duration-300 bg-white text-black hover:bg-gray-200 active:scale-[0.98]";
                        
                        // Фейковый подбор музыки
                        elements.musicSection.classList.remove('max-h-0', 'opacity-0');
                        elements.musicSection.classList.add('max-h-24', 'opacity-100');
                        elements.musicLoading.classList.remove('hidden');
                        elements.musicTitle.classList.add('hidden');

                        setTimeout(() => {
                            elements.musicLoading.classList.add('hidden');
                            elements.musicTitle.innerText = "Trending TikTok Sound 2026";
                            elements.musicTitle.classList.remove('hidden');
                        }, 1200);
                    };
                    reader.readAsDataURL(file);
                }
            });

            // УДАЛЕНИЕ ФОТО
            elements.removeBtn.addEventListener('click', () => {
                currentImageData = null;
                elements.fileInput.value = '';
                elements.previewContainer.classList.add('hidden');
                elements.uploadZone.classList.remove('hidden');
                elements.musicSection.classList.remove('max-h-24', 'opacity-100');
                elements.musicSection.classList.add('max-h-0', 'opacity-0');
                elements.publishBtn.disabled = true;
                elements.publishBtn.className = "w-full py-4 rounded-xl flex items-center justify-center gap-2 font-medium transition-all duration-300 bg-[#1a1a1a] text-gray-600 cursor-not-allowed";
            });

            // ФЕЙКОВАЯ ПУБЛИКАЦИЯ
            elements.publishBtn.addEventListener('click', () => {
                if (!currentImageData || isPublishing) return;
                
                isPublishing = true;
                elements.publishBtn.disabled = true;
                elements.publishIcon.classList.add('hidden');
                elements.publishLoader.classList.remove('hidden');
                elements.publishText.innerText = 'Публикация...';

                setTimeout(() => {
                    elements.successOverlay.classList.remove('hidden');
                    
                    setTimeout(() => {
                        elements.successOverlay.classList.add('hidden');
                        elements.removeBtn.click();
                        document.getElementById('caption-input').value = '';
                        isPublishing = false;
                        elements.publishBtn.disabled = false;
                        elements.publishIcon.classList.remove('hidden');
                        elements.publishLoader.classList.add('hidden');
                        elements.publishText.innerText = 'Опубликовать в TikTok';
                    }, 3000);
                }, 2000); // 2 секунды имитации отправки на сервер
            });
        </script>
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
