# GitHub Pages 部署指南

## 部署步驟

### 1. 準備文件
確保以下文件已準備好：
- ✅ `index.html` - 主應用程式（已包含 Firebase 配置）
- ✅ `script.js` - 應用程式邏輯
- ✅ `style.css` - 樣式文件
- ✅ `README.md` - 項目說明

### 2. 上傳到 GitHub

1. **創建 GitHub 倉庫**：
   - 前往 [GitHub](https://github.com)
   - 點擊 "New repository"
   - 輸入倉庫名稱（例如：`bosstimer`）
   - 選擇 "Public"（GitHub Pages 需要公開倉庫）
   - 不要勾選 "Add a README file"

2. **上傳文件**：
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/你的用戶名/bosstimer.git
   git push -u origin main
   ```

### 3. 啟用 GitHub Pages

1. **進入倉庫設置**：
   - 在 GitHub 倉庫頁面，點擊 "Settings" 標籤
   - 在左側選單中找到 "Pages"

2. **配置 Pages**：
   - Source: 選擇 "Deploy from a branch"
   - Branch: 選擇 "main"
   - Folder: 選擇 "/ (root)"
   - 點擊 "Save"

3. **等待部署**：
   - GitHub 會自動構建和部署您的網站
   - 通常需要 1-2 分鐘
   - 部署完成後會顯示網址

### 4. 訪問您的網站

部署完成後，您的網站將在以下網址可用：
```
https://你的用戶名.github.io/bosstimer/
```

## 重要說明

### Firebase 配置
- Firebase 配置已直接嵌入 `index.html` 中
- 這樣可以避免 GitHub Pages 無法載入外部配置文件的問題
- 配置信息是公開的，這是正常的（Firebase 客戶端配置本來就是公開的）

### 安全考慮
- Firebase API 密鑰在客戶端是公開的，這是正常的
- 真正的安全控制應該在 Firebase 控制台設置規則
- 建議在 Firebase 控制台設置適當的數據庫規則

### 更新網站
每次推送代碼到 GitHub 後，GitHub Pages 會自動重新部署：
```bash
git add .
git commit -m "更新描述"
git push
```

## 故障排除

### 如果網站無法訪問
1. 檢查 GitHub Pages 設置是否正確
2. 確認倉庫是公開的
3. 等待幾分鐘讓部署完成
4. 檢查 Actions 標籤是否有部署錯誤

### 如果 Firebase 無法連接
1. 檢查 Firebase 項目是否啟用
2. 確認數據庫規則允許讀寫
3. 檢查瀏覽器控制台的錯誤信息

### 如果同步功能不工作
1. 確認 Firebase Realtime Database 已啟用
2. 檢查數據庫規則設置
3. 確認所有用戶都能訪問數據庫

## 推薦設置

### Firebase 數據庫規則
在 Firebase 控制台設置以下規則：
```json
{
  "rules": {
    "rooms": {
      ".read": true,
      ".write": true
    }
  }
}
```

### 域名設置（可選）
如果您有自己的域名，可以在 GitHub Pages 設置中配置自定義域名。

## 測試清單

部署完成後，請測試以下功能：
- [ ] 網站可以正常訪問
- [ ] 計時器功能正常
- [ ] 音效播放正常
- [ ] 通知功能正常
- [ ] 同步功能正常（需要多個瀏覽器測試）
- [ ] 分享連結功能正常

## 支援

如果遇到問題，請檢查：
1. GitHub Actions 的部署日誌
2. 瀏覽器開發者工具的 Console
3. Firebase 控制台的數據庫使用情況
