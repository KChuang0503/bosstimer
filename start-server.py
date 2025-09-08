#!/usr/bin/env python3
"""
簡單的本地 HTTP 服務器
用於運行 Boss Timer 應用程式
"""

import http.server
import socketserver
import webbrowser
import os
import sys

# 設置端口
PORT = 8000

# 檢查 Python 版本
if sys.version_info[0] < 3:
    print("請使用 Python 3 運行此腳本")
    sys.exit(1)

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # 添加 CORS 標頭
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def start_server():
    # 確保在正確的目錄中
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # 檢查必要文件
    required_files = ['index.html', 'firebase-config.js']
    missing_files = [f for f in required_files if not os.path.exists(f)]
    
    if missing_files:
        print("❌ 缺少必要文件:")
        for file in missing_files:
            print(f"   - {file}")
        print("\n請確保所有文件都存在，特別是 firebase-config.js")
        return
    
    # 啟動服務器
    try:
        with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
            print(f"🚀 Boss Timer 服務器已啟動")
            print(f"📍 地址: http://localhost:{PORT}")
            print(f"📁 目錄: {os.getcwd()}")
            print("\n按 Ctrl+C 停止服務器")
            
            # 自動開啟瀏覽器
            try:
                webbrowser.open(f'http://localhost:{PORT}')
            except:
                pass
            
            # 啟動服務器
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n\n👋 服務器已停止")
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ 端口 {PORT} 已被占用，請嘗試其他端口")
        else:
            print(f"❌ 啟動服務器失敗: {e}")

if __name__ == "__main__":
    start_server()
