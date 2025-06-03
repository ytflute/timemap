// /api/config/index.js
const admin = require('firebase-admin');

// 初始化 Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL
    }),
    storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
  });
}

module.exports = async function handler(req, res) {
  // 設置 CORS 標頭
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 如果是 OPTIONS 請求，直接返回
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 只允許 GET 請求
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: `方法 ${req.method} 不被允許` });
    return;
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
