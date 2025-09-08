// Firebase 配置示例文件
// 複製此文件為 firebase-config.js 並填入您的 Firebase 配置

const firebaseConfig = {
    apiKey: "AIzaSyBgSuT9wfBRUQKJf7ZhEDdhFDwURUHZzq8",
    authDomain: "bosstimer-aa8d5.firebaseapp.com",
    databaseURL: "https://bosstimer-aa8d5-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "bosstimer-aa8d5",
    storageBucket: "bosstimer-aa8d5.firebasestorage.app",
    messagingSenderId: "625660512723",
    appId: "1:625660512723:web:ef61712fb4cd9ef37c4726",
    measurementId: "G-QE2F8PTSBQ"
};

// 導出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = firebaseConfig;
} else {
    window.firebaseConfig = firebaseConfig;
}
