// /api/generateImage/index.js
import OpenAI from 'openai';
import { cert, initializeApp, getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getAuth } from 'firebase-admin/auth';

// 初始化 Firebase Admin
let firebaseAdmin;
try {
    if (getApps().length === 0) {
        const adminConfig = {
            credential: cert(JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS)),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET
        };
        firebaseAdmin = initializeApp(adminConfig);
        console.log('Firebase Admin 初始化成功');
    } else {
        firebaseAdmin = getApps()[0];
        console.log('使用現有的 Firebase Admin 實例');
    }
} catch (error) {
    console.error('Firebase Admin 初始化失敗:', error);
}

export default async function handler(req, res) {
    // 設置 CORS 標頭
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // 處理 OPTIONS 請求
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 只允許 POST 請求
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        res.status(405).json({ error: `方法 ${req.method} 不被允許` });
        return;
    }

    try {
        // 檢查 Firebase Admin 是否正確初始化
        if (!firebaseAdmin) {
            throw new Error('Firebase Admin 未正確初始化');
        }

        // 驗證用戶身份
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new Error('未提供有效的認證令牌');
        }
        const idToken = authHeader.split('Bearer ')[1];
        
        try {
            await getAuth().verifyIdToken(idToken);
        } catch (authError) {
            console.error('驗證令牌失敗:', authError);
            res.status(401).json({ error: '認證失敗：' + authError.message });
            return;
        }

        const { city, country, isUniverseTheme } = req.body;

        if ((!city || !country) && !isUniverseTheme) {
            res.status(400).json({ error: '缺少必要參數' });
            return;
        }

        // 檢查 OpenAI API Key
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('未設置 OpenAI API Key');
        }

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        // 根據是否為宇宙主題選擇不同的提示
        let prompt;
        if (isUniverseTheme) {
            prompt = `Top view of a futuristic cosmic breakfast in deep space. \
The food is presented on a high-tech floating table or platform, with ethereal lighting and cosmic atmosphere. \
Various otherworldly dishes and space-inspired beverages are artfully arranged, \
featuring floating elements, glowing ingredients, and advanced utensils. \
The scene includes subtle space elements like stars or nebulae in the background. \
No people, only food. Styled like a professional food photography shot with a sci-fi twist.`;
        } else {
            prompt = `Top view of a traditional local breakfast commonly eaten in ${city}, ${country}. \
The food is presented on a table setting, with realistic textures and lighting, \
showcasing the variety of dishes, ingredients, and beverages typical of the region. \
No people, only food. Styled like a professional food photography shot.`;
        }

        let imageUrl;
        try {
            const response = await openai.images.generate({
                model: "dall-e-3",
                prompt: prompt,
                n: 1,
                size: "1024x1024",
                quality: "standard",
                style: "natural"
            });
            imageUrl = response.data[0].url;
        } catch (openaiError) {
            console.error('OpenAI 圖片生成失敗:', openaiError);
            throw new Error('圖片生成失敗：' + openaiError.message);
        }

        // 下載圖片並上傳到 Firebase Storage
        try {
            const imageResponse = await fetch(imageUrl);
            if (!imageResponse.ok) throw new Error('圖片下載失敗');
            const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

            const bucket = getStorage().bucket();
            const fileName = `breakfast-images/${Date.now()}-${city || 'universe'}.png`;
            const file = bucket.file(fileName);

            await file.save(imageBuffer, {
                metadata: {
                    contentType: 'image/png',
                    metadata: {
                        city,
                        country,
                        generatedAt: new Date().toISOString(),
                        isUniverseTheme: isUniverseTheme || false
                    }
                }
            });

            // 獲取可訪問的 URL
            const [signedUrl] = await file.getSignedUrl({
                action: 'read',
                expires: Date.now() + 7 * 24 * 60 * 60 * 1000 // URL 有效期 7 天
            });

            res.status(200).json({
                imageUrl: signedUrl
            });
        } catch (storageError) {
            console.error('Firebase Storage 操作失敗:', storageError);
            throw new Error('圖片儲存失敗：' + storageError.message);
        }

    } catch (error) {
        console.error('生成圖片時發生錯誤:', error);
        res.status(500).json({ 
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
<<<<<<< HEAD
} 
=======
} 
>>>>>>> 40714b7 (更新文件結構和配置)
