const CACHE_NAME = 'cool-cache-v2'; // ورژن را تغییر دادیم تا کش جدید ساخته شود
const OFFLINE_URL = '/offline.html'; // آدرس فایل آفلاین

const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    OFFLINE_URL,           // حتما فایل آفلاین باید کش شود
    '/assets/style.css',   // فایل‌های خود را اینجا دقیق وارد کنید
    '/src/main.js'
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        console.log('[SW] Caching assets');
        // اگر یکی از فایل‌ها وجود نداشته باشد، کل پروسه کش شکست می‌خورد
        // پس از صحت آدرس فایل‌ها در لیست بالا مطمئن شوید
        await cache.addAll(PRECACHE_ASSETS);
    })());
});

self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
    event.respondWith((async () => {
        try {
            // 1. اول سعی کن از کش بخونی
            const cache = await caches.open(CACHE_NAME);
            const cachedResponse = await cache.match(event.request);

            if (cachedResponse) {
                return cachedResponse;
            }

            // 2. اگر تو کش نبود، برو سراغ شبکه (Network)
            const networkResponse = await fetch(event.request);
            return networkResponse;

        } catch (error) {
            // 3. اگر شبکه قطع بود (ارور داد) و فایل در کش هم نبود:
            console.log('[SW] Network request failed. Offline mode.');

            // چک می‌کنیم اگر کاربر قصد باز کردن یک "صفحه HTML" را داشته
            // (یعنی درخواستش از نوع navigate بوده)
            if (event.request.mode === 'navigate') {
                const cache = await caches.open(CACHE_NAME);
                const offlineFallback = await cache.match(OFFLINE_URL);
                return offlineFallback;
            }
            
            // اگر عکس یا فایل دیگری درخواست شده بود و آفلاین بودیم، چیزی برنمی‌گردانیم (یا می‌توان عکس پیش‌فرض گذاشت)
        }
    })());
});
