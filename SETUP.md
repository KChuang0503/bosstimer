# 設置說明

## 首次設置

### 1. 設置 Firebase 配置

1. 複製示例配置文件：
   ```bash
   cp firebase-config.example.js firebase-config.js
   ```

2. 編輯 `firebase-config.js` 文件，填入您的 Firebase 項目配置：
   ```javascript
   const firebaseConfig = {
       apiKey: "您的API密鑰",
       authDomain: "您的項目ID.firebaseapp.com",
       databaseURL: "https://您的項目ID-default-rtdb.asia-southeast1.firebasedatabase.app",
       projectId: "您的項目ID",
       storageBucket: "您的項目ID.firebasestorage.app",
       messagingSenderId: "您的發送者ID",
       appId: "您的應用ID",
       measurementId: "您的測量ID"
   };
   ```

### 2. 獲取 Firebase 配置

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 選擇您的項目
3. 點擊「Project settings」（齒輪圖標）
4. 滾動到「您的應用程式」部分
5. 點擊「Web」圖標（</>）
6. 複製配置對象

### 3. 設置 Firebase 服務

按照 `FIREBASE_SETUP.md` 的說明設置：
- Realtime Database
- Authentication（匿名登入）

## 部署到 GitHub Pages

### 1. 上傳到 GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. 啟用 GitHub Pages

1. 前往 GitHub 倉庫的 Settings
2. 滾動到 "Pages" 部分
3. 選擇 "Deploy from a branch"
4. 選擇 "main" 分支
5. 選擇 "/ (root)" 資料夾
6. 點擊 "Save"

### 3. 設置環境變數（可選）

如果您使用 GitHub Actions 或其他 CI/CD 工具，可以設置環境變數：

```yaml
env:
  FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
  FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
  # ... 其他配置
```

## 安全注意事項

- ✅ `firebase-config.js` 已添加到 `.gitignore`，不會上傳到 GitHub
- ✅ 只有 `firebase-config.example.js` 會上傳，作為配置模板
- ✅ 真實的 Firebase 配置保持本地安全

## 故障排除

### 配置錯誤
如果看到「配置錯誤」頁面：
1. 確保 `firebase-config.js` 文件存在
2. 檢查配置格式是否正確
3. 確認所有必要的配置項都已填入

### Firebase 連接失敗
1. 檢查 Firebase 項目是否正確設置
2. 確認 Realtime Database 和 Authentication 已啟用
3. 檢查網絡連接

### 同步功能不工作
1. 確認 Firebase 配置正確
2. 檢查瀏覽器控制台是否有錯誤
3. 確認 Firebase 規則設置正確
