# 貢獻指南

感謝您對 Boss Timer 專案的關注！我們歡迎任何形式的貢獻，包括但不限於：

- 🐛 回報 Bug
- ✨ 提出新功能建議
- 📝 改進文件
- 🔧 提交程式碼修正
- 🎨 改善使用者介面

## 如何貢獻

### 回報問題

如果您發現了 Bug 或有功能建議，請：

1. 檢查 [Issues](https://github.com/your-username/bosstimer/issues) 確認問題尚未被回報
2. 建立新的 Issue，並包含：
   - 清楚的問題描述
   - 重現步驟
   - 預期行為 vs 實際行為
   - 瀏覽器版本和作業系統資訊
   - 截圖（如適用）

### 提交程式碼

1. **Fork 專案**
   ```bash
   git clone https://github.com/your-username/bosstimer.git
   cd bosstimer
   ```

2. **建立功能分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **進行修改**
   - 遵循現有的程式碼風格
   - 確保程式碼可讀性
   - 添加必要的註解

4. **測試修改**
   - 在主要瀏覽器中測試功能
   - 確保沒有破壞現有功能
   - 檢查響應式設計

5. **提交變更**
   ```bash
   git add .
   git commit -m "feat: 添加新功能描述"
   git push origin feature/your-feature-name
   ```

6. **建立 Pull Request**
   - 提供清楚的 PR 描述
   - 連結相關的 Issue
   - 請求程式碼審查

## 程式碼規範

### JavaScript
- 使用 ES6+ 語法
- 變數命名使用 camelCase
- 函數命名使用動詞開頭
- 添加適當的註解

### CSS
- 使用有意義的類別名稱
- 遵循 BEM 命名規範（如適用）
- 保持樣式的一致性
- 使用 CSS 變數提高可維護性

### HTML
- 使用語義化標籤
- 確保無障礙性
- 保持結構清晰

## 專案結構

```
bosstimer/
├── index.html          # 主頁面
├── script.js           # 主要 JavaScript 邏輯
├── style.css           # 樣式表
├── README.md           # 專案說明
├── LICENSE             # 授權條款
├── .gitignore          # Git 忽略檔案
└── CONTRIBUTING.md     # 本檔案
```

## 開發環境設定

1. **克隆專案**
   ```bash
   git clone https://github.com/your-username/bosstimer.git
   cd bosstimer
   ```

2. **開啟專案**
   - 使用任何文字編輯器或 IDE
   - 建議使用支援 HTML/CSS/JS 的編輯器

3. **本地測試**
   - 用瀏覽器開啟 `index.html`
   - 測試所有功能是否正常運作

## 提交訊息規範

使用以下格式的提交訊息：

```
type: 簡短描述

詳細描述（可選）

相關 Issue: #123
```

### 類型說明
- `feat`: 新功能
- `fix`: Bug 修正
- `docs`: 文件更新
- `style`: 程式碼格式調整
- `refactor`: 程式碼重構
- `test`: 測試相關
- `chore`: 建置過程或輔助工具的變動

## 審查流程

1. **自動檢查**
   - 程式碼格式檢查
   - 基本語法檢查

2. **人工審查**
   - 程式碼品質檢查
   - 功能測試
   - 文件完整性檢查

3. **合併**
   - 通過審查後合併到主分支
   - 更新版本號（如需要）

## 行為準則

請遵守以下行為準則：

- 保持友善和尊重
- 歡迎不同背景的貢獻者
- 專注於對專案有益的討論
- 接受建設性的批評
- 尊重不同的觀點和經驗

## 聯絡方式

如有任何問題，請透過以下方式聯繫：

- GitHub Issues
- 電子郵件：[your-email@example.com]

## 授權

透過貢獻程式碼，您同意您的貢獻將在 MIT 授權條款下發布。

---

再次感謝您的貢獻！🎉
