# Firebase 設置說明

## 1. 創建 Firebase 項目

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 點擊「創建項目」
3. 輸入項目名稱（例如：bosstimer-sync）
4. 選擇是否啟用 Google Analytics（可選）
5. 點擊「創建項目」

## 2. 啟用 Realtime Database

1. 在 Firebase Console 中，點擊左側選單的「Realtime Database」
2. 點擊「創建數據庫」
3. 選擇「測試模式」（用於開發）
4. 選擇數據庫位置（建議選擇離您最近的區域）
5. 點擊「完成」

## 3. 啟用 Authentication

1. 在 Firebase Console 中，點擊左側選單的「Authentication」
2. 點擊「開始使用」
3. 點擊「Sign-in method」標籤
4. 啟用「Anonymous」匿名登入
5. 點擊「保存」

## 4. 獲取 Firebase 配置

1. 在 Firebase Console 中，點擊左側選單的「Project settings」（齒輪圖標）
2. 滾動到「您的應用程式」部分
3. 點擊「Web」圖標（</>）
4. 輸入應用程式暱稱（例如：Boss Timer Web）
5. 點擊「註冊應用程式」
6. 複製 Firebase 配置對象

## 5. 更新應用程式配置

將複製的 Firebase 配置替換 `index.html` 中的 `firebaseConfig` 對象：

```javascript
const firebaseConfig = {
    apiKey: "your-api-key-here",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};
```

## 6. 設置數據庫規則（可選）

為了安全起見，建議設置數據庫規則。在 Realtime Database 的「規則」標籤中，可以設置：

```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": true,
        ".write": "auth != null",
        "timers": {
          ".read": true,
          ".write": "auth != null"
        },
        "users": {
          ".read": true,
          ".write": "auth != null"
        }
      }
    }
  }
}
```

## 7. 測試功能

1. 打開應用程式
2. 添加一個計時器
3. 點擊「🔗 生成分享連結」
4. 複製分享連結並在新標籤頁中打開
5. 兩個頁面應該會同步顯示相同的計時器

## 注意事項

- 確保 Firebase 項目已啟用 Realtime Database 和 Authentication
- 在生產環境中，建議設置適當的數據庫安全規則
- 匿名認證不需要用戶註冊，適合快速測試
- 如果遇到 CORS 錯誤，請檢查 Firebase 配置是否正確
