@echo off
echo Boss Timer 本地服務器啟動器
echo.

REM 檢查 Python 是否安裝
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未找到 Python，請先安裝 Python 3
    echo 下載地址: https://www.python.org/downloads/
    pause
    exit /b 1
)

REM 檢查必要文件
if not exist "index.html" (
    echo ❌ 未找到 index.html 文件
    pause
    exit /b 1
)

if not exist "firebase-config.js" (
    echo ❌ 未找到 firebase-config.js 文件
    echo 請先複製 firebase-config.example.js 為 firebase-config.js 並填入配置
    pause
    exit /b 1
)

echo ✅ 文件檢查完成
echo.

REM 啟動服務器
python start-server.py

pause
