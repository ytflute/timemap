export default async function handler(req, res) {
    // 檢查請求方法
    if (req.method !== 'GET') {
        return res.status(405).json({ error: '只允許 GET 請求' });
    }

    try {
        // 設定 Firebase 配置
        const firebaseConfig = {
            apiKey: process.env.FIREBASE_API_KEY,
            authDomain: process.env.FIREBASE_AUTH_DOMAIN,
            projectId: process.env.FIREBASE_PROJECT_ID,
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.FIREBASE_APP_ID
        };

        // 檢查必要的配置是否存在
        if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
            console.error('Firebase 配置不完整');
            return res.status(500).json({ error: 'Firebase 配置不完整' });
        }

        // 返回配置
        res.status(200).json(firebaseConfig);
    } catch (error) {
        console.error('API 錯誤:', error);
        res.status(500).json({ error: '伺服器錯誤' });
    }
} 