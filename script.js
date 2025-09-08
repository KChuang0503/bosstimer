class BossTimer {
    constructor() {
        this.activeTimers = new Map();
        this.timerIdCounter = 0;
        
        // 同步相關屬性
        this.syncEnabled = false;
        this.roomId = null;
        this.isHost = false;
        this.websocket = null;
        this.syncInterval = null;
        this.lastSyncTime = 0;
        
        this.initializeElements();
        this.bindEvents();
        this.updateBossOptions();
    }
    
    initializeElements() {
        this.chapterSelect = document.getElementById('chapter');
        this.bossSelect = document.getElementById('boss');
        this.serverSelect = document.getElementById('server');
        this.hoursInput = document.getElementById('hours');
        this.minutesInput = document.getElementById('minutes');
        this.secondsInput = document.getElementById('seconds');
        this.resetBtn = document.getElementById('resetBtn');
        this.addTimerBtn = document.getElementById('addTimerBtn');
        this.status = document.getElementById('status');
        this.timersList = document.getElementById('timersList');
        
        // 音效控制元素
        this.volumeSlider = document.getElementById('volumeSlider');
        this.volumeValue = document.getElementById('volumeValue');
        this.muteBtn = document.getElementById('muteBtn');
        
        // 分享功能元素
        this.shareBtn = document.getElementById('shareBtn');
        this.importBtn = document.getElementById('importBtn');
        this.lightbox = document.getElementById('lightbox');
        this.lightboxTitle = document.getElementById('lightboxTitle');
        this.shareContent = document.getElementById('shareContent');
        this.importContent = document.getElementById('importContent');
        this.shareUrl = document.getElementById('shareUrl');
        this.importUrl = document.getElementById('importUrl');
        this.copyBtn = document.getElementById('copyBtn');
        this.pasteBtn = document.getElementById('pasteBtn');
        this.loadBtn = document.getElementById('loadBtn');
        this.closeLightbox = document.getElementById('closeLightbox');
        this.cancelBtn = document.getElementById('cancelBtn');
        
        // 同步狀態元素
        this.syncStatus = document.getElementById('syncStatus');
        this.syncRole = document.getElementById('syncRole');
        this.roomIdElement = document.getElementById('roomId');
        
        // 音效狀態
        this.volume = 0.8; // 預設音量 80%
        this.isMuted = false;
    }
    
    bindEvents() {
        this.chapterSelect.addEventListener('change', () => this.updateBossOptions());
        
        this.resetBtn.addEventListener('click', () => this.resetAll());
        this.addTimerBtn.addEventListener('click', () => this.addTimer());
        
        // 音效控制事件
        this.volumeSlider.addEventListener('input', (e) => {
            this.volume = e.target.value / 100;
            this.volumeValue.textContent = `${e.target.value}%`;
            this.isMuted = false;
            this.muteBtn.textContent = '🔊';
            this.muteBtn.classList.remove('muted');
        });
        
        this.muteBtn.addEventListener('click', () => {
            this.isMuted = !this.isMuted;
            if (this.isMuted) {
                this.muteBtn.textContent = '🔇';
                this.muteBtn.classList.add('muted');
            } else {
                this.muteBtn.textContent = '🔊';
                this.muteBtn.classList.remove('muted');
            }
        });
        
        // 請求通知權限
        this.requestNotificationPermission();
        
        // 輸入驗證
        [this.hoursInput, this.minutesInput, this.secondsInput].forEach(input => {
            input.addEventListener('input', () => this.validateInput(input));
        });
        
        // 鍵盤快捷鍵
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Escape') {
                this.resetAll();
            }
        });
        
        // 分享功能事件
        this.shareBtn.addEventListener('click', () => this.showShareLightbox());
        this.importBtn.addEventListener('click', () => this.showImportLightbox());
        this.copyBtn.addEventListener('click', () => this.copyShareLink());
        this.pasteBtn.addEventListener('click', () => this.pasteFromClipboard());
        this.loadBtn.addEventListener('click', () => this.loadFromShareLink());
        this.closeLightbox.addEventListener('click', () => this.hideLightbox());
        this.cancelBtn.addEventListener('click', () => this.hideLightbox());
        
        // 點擊lightbox背景關閉
        this.lightbox.addEventListener('click', (e) => {
            if (e.target === this.lightbox) {
                this.hideLightbox();
            }
        });
        
        // 檢查URL參數，如果有分享連結則自動載入
        this.checkForShareLink();
    }
    
    updateBossOptions() {
        const chapter = this.chapterSelect.value;
        const bossOptions = this.bossSelect;
        
        // 清空現有選項
        bossOptions.innerHTML = '';
        
        const chapterMaps = {
            '7': [
                { value: '7-1', text: '扎卡里耶爾交叉路' },
                { value: '7-2', text: '王陵一層' },
                { value: '7-3', text: '王陵二層' },
                { value: '7-4', text: '王陵三層' }
            ],
            '8': [
                { value: '8-1', text: '水路橋地區' },
                { value: '8-2', text: '阿雷魯諾男爵領' },
                { value: '8-3', text: '魔族收監所第一區' },
                { value: '8-4', text: '魔族收監所第三區' },
                { value: '8-5', text: '魔族收監所第四區' },
                { value: '8-6', text: '魔族收監所第五區' }
            ],
            '9': [
                { value: '9-1', text: '女神的古院' },
                { value: '9-2', text: '佩迪米安外城' },
                { value: '9-3', text: '魔法師之塔一層' },
                { value: '9-4', text: '魔法師之塔二層' },
                { value: '9-5', text: '魔法師之塔三層' }
            ],
            '10': [
                { value: '10-1', text: '大教堂懺悔路' },
                { value: '10-2', text: '大教堂正殿' },
                { value: '10-3', text: '大教堂大迴廊' },
                { value: '10-4', text: '大教堂至聖所' }
            ]
        };
        
        const maps = chapterMaps[chapter] || [];
        maps.forEach(map => {
            const option = document.createElement('option');
            option.value = map.value;
            option.textContent = map.text;
            bossOptions.appendChild(option);
        });
    }
    
    
    validateInput(input) {
        const value = parseInt(input.value) || 0;
        const max = input.id === 'hours' ? 23 : 59;
        
        if (value < 0) input.value = 0;
        if (value > max) input.value = max;
        
        // 限制輸入長度
        if (input.value.length > 2) {
            input.value = input.value.slice(0, 2);
        }
    }
    
    getCurrentTimeInput() {
        const hours = parseInt(this.hoursInput.value) || 0;
        const minutes = parseInt(this.minutesInput.value) || 0;
        const seconds = parseInt(this.secondsInput.value) || 0;
        return hours * 3600 + minutes * 60 + seconds;
    }
    
    
    resetAll() {
        // 重置所有輸入到初始狀態
        this.chapterSelect.value = '7';
        this.bossSelect.value = '7-1';
        this.serverSelect.value = '1';
        this.hoursInput.value = '0';
        this.minutesInput.value = '0';
        this.secondsInput.value = '0';
        
        // 更新地圖選項
        this.updateBossOptions();
        
        this.status.textContent = '已重置所有設定';
    }
    
    addTimer() {
        const totalSeconds = this.getCurrentTimeInput();
        if (totalSeconds === 0) {
            this.status.textContent = '請先設定重生時間';
            return;
        }
        
        const chapter = this.chapterSelect.value;
        const boss = this.bossSelect.value;
        const server = this.serverSelect.value;
        const chapterNames = {
            '7': '第七章',
            '8': '第八章', 
            '9': '第九章',
            '10': '第十章'
        };
        const mapName = this.bossSelect.options[this.bossSelect.selectedIndex].text;
        const bossInfo = `${chapterNames[chapter]} - ${mapName} (分流 ${server})`;
        
        // 檢查是否已存在相同的計時器
        const existingTimer = this.findExistingTimer(chapter, boss, server);
        if (existingTimer) {
            this.status.textContent = `已存在 ${bossInfo} 的計時器，無法重複新增`;
            this.showDuplicateWarning(existingTimer);
            return;
        }
        
        const timerId = this.timerIdCounter++;
        
        const timer = {
            id: timerId,
            bossInfo: bossInfo,
            totalSeconds: totalSeconds,
            remainingSeconds: totalSeconds,
            isRunning: true,
            isPaused: false,
            intervalId: null,
            startTime: Date.now(),
            pausedTime: 0,
            lastUpdateTime: Date.now(),
            // 添加識別資訊用於重複檢查
            chapter: chapter,
            boss: boss,
            server: server
        };
        
        timer.intervalId = setInterval(() => {
            this.tickTimer(timer);
        }, 100);
        
        this.activeTimers.set(timerId, timer);
        this.updateTimersList();
        
        this.status.textContent = `已新增 ${bossInfo} 計時器`;
        
        // 調試信息
        console.log(`計時器 ${timerId} 開始:`, {
            totalSeconds: totalSeconds,
            startTime: new Date(timer.startTime).toLocaleTimeString(),
            expectedEndTime: new Date(timer.startTime + totalSeconds * 1000).toLocaleTimeString()
        });
    }
    
    // 檢查是否已存在相同的計時器
    findExistingTimer(chapter, boss, server) {
        for (const timer of this.activeTimers.values()) {
            if (timer.chapter === chapter && timer.boss === boss && timer.server === server) {
                return timer;
            }
        }
        return null;
    }
    
    // 顯示重複計時器警告
    showDuplicateWarning(existingTimer) {
        // 高亮顯示已存在的計時器
        const timerElement = document.getElementById(`timer-${existingTimer.id}`);
        if (timerElement) {
            timerElement.classList.add('duplicate-warning');
            
            // 自動滾動到該計時器位置
            this.scrollToTimer(timerElement);
            
            // 3秒後移除警告樣式
            setTimeout(() => {
                timerElement.classList.remove('duplicate-warning');
            }, 3000);
        }
        
        // 播放警告音效
        this.playWarningSound();
    }
    
    // 滾動到指定計時器位置
    scrollToTimer(timerElement) {
        const timersList = this.timersList;
        
        // 檢查元素是否存在
        if (!timerElement || !timersList) {
            return;
        }
        
        // 使用 requestAnimationFrame 確保 DOM 更新完成後再滾動
        requestAnimationFrame(() => {
            const timerRect = timerElement.getBoundingClientRect();
            const listRect = timersList.getBoundingClientRect();
            
            // 計算計時器相對於列表的位置
            const timerTop = timerRect.top - listRect.top + timersList.scrollTop;
            const timerBottom = timerTop + timerRect.height;
            const listHeight = timersList.clientHeight;
            const currentScrollTop = timersList.scrollTop;
            
            // 檢查計時器是否完全在可見區域內
            const isFullyVisible = timerTop >= currentScrollTop && 
                                 timerBottom <= currentScrollTop + listHeight;
            
            if (!isFullyVisible) {
                // 如果計時器在可見區域上方，滾動到計時器頂部
                if (timerTop < currentScrollTop) {
                    timersList.scrollTo({
                        top: Math.max(0, timerTop - 20), // 留一點邊距，確保不會滾動到負值
                        behavior: 'smooth'
                    });
                }
                // 如果計時器在可見區域下方，滾動到計時器底部
                else if (timerBottom > currentScrollTop + listHeight) {
                    const maxScrollTop = timersList.scrollHeight - listHeight;
                    timersList.scrollTo({
                        top: Math.min(maxScrollTop, timerBottom - listHeight + 20), // 留一點邊距
                        behavior: 'smooth'
                    });
                }
            }
        });
    }
    
    // 播放警告音效
    playWarningSound() {
        if (this.isMuted) return;
        
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // 播放兩聲較短的警告音
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(300, audioContext.currentTime + 0.2);
            
            // 使用較低的音量
            gainNode.gain.setValueAtTime(this.volume * 0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('音頻播放不可用');
        }
    }
    
    tickTimer(timer) {
        if (!timer.isRunning) return;
        
        const now = Date.now();
        const totalElapsed = now - timer.startTime - timer.pausedTime;
        const elapsedSeconds = totalElapsed / 1000;
        const remaining = Math.max(0, timer.totalSeconds - elapsedSeconds);
        const remainingSeconds = Math.ceil(remaining);
        
        // 只有當剩餘秒數發生變化時才更新顯示
        if (remainingSeconds !== timer.remainingSeconds) {
            timer.remainingSeconds = remainingSeconds;
            this.updateTimerDisplay(timer);
            
            // 最後 10 秒警告效果
            if (remainingSeconds <= 10 && remainingSeconds > 0) {
                const timerElement = document.getElementById(`timer-${timer.id}`);
                if (timerElement) {
                    timerElement.classList.add('warning');
                }
            }
            
            if (remainingSeconds === 0) {
                this.finishTimer(timer);
            }
        }
    }
    
    finishTimer(timer) {
        timer.isRunning = false;
        timer.isPaused = false;
        timer.remainingSeconds = 0;
        
        clearInterval(timer.intervalId);
        
        // 調試信息
        const actualEndTime = Date.now();
        const expectedEndTime = timer.startTime + timer.totalSeconds * 1000;
        const timeDifference = actualEndTime - expectedEndTime;
        console.log(`計時器 ${timer.id} 完成:`, {
            expectedEndTime: new Date(expectedEndTime).toLocaleTimeString(),
            actualEndTime: new Date(actualEndTime).toLocaleTimeString(),
            timeDifference: `${timeDifference}ms (${(timeDifference / 1000).toFixed(2)}秒)`,
            pausedTime: `${timer.pausedTime}ms`
        });
        
        const timerElement = document.getElementById(`timer-${timer.id}`);
        if (timerElement) {
            timerElement.classList.remove('warning');
            timerElement.classList.add('finished');
        }
        
        this.updateTimerDisplay(timer);
        
        // 顯示通知和播放音效
        this.showNotification(timer.bossInfo);
        this.playNotificationSound();
        
        // 3 秒後移除完成動畫
        setTimeout(() => {
            if (timerElement) {
                timerElement.classList.remove('finished');
            }
        }, 3000);
    }
    
    updateTimerDisplay(timer) {
        const hours = Math.floor(timer.remainingSeconds / 3600);
        const minutes = Math.floor((timer.remainingSeconds % 3600) / 60);
        const seconds = timer.remainingSeconds % 60;
        
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // 更新列表中的顯示
        const timerElement = document.getElementById(`timer-${timer.id}`);
        if (timerElement) {
            const timeElement = timerElement.querySelector('.timer-item-time');
            if (timeElement) {
                timeElement.textContent = timeString;
            }
            
            // 更新進度條
            const progress = timer.totalSeconds > 0 ? ((timer.totalSeconds - timer.remainingSeconds) / timer.totalSeconds) * 100 : 0;
            const progressElement = timerElement.querySelector('.progress-small');
            if (progressElement) {
                progressElement.style.width = `${progress}%`;
            }
        }
    }
    
    updateTimersList() {
        this.timersList.innerHTML = '';
        
        if (this.activeTimers.size === 0) {
            this.timersList.innerHTML = '<p style="color: #666; text-align: center;">暫無進行中的計時器</p>';
            return;
        }
        
        // 按剩餘時間排序（時間短的在前）
        const sortedTimers = Array.from(this.activeTimers.values()).sort((a, b) => {
            return a.remainingSeconds - b.remainingSeconds;
        });
        
        sortedTimers.forEach(timer => {
            const timerElement = this.createTimerElement(timer);
            this.timersList.appendChild(timerElement);
        });
    }
    
    createTimerElement(timer) {
        const div = document.createElement('div');
        div.id = `timer-${timer.id}`;
        div.className = 'timer-item';
        
        const hours = Math.floor(timer.remainingSeconds / 3600);
        const minutes = Math.floor((timer.remainingSeconds % 3600) / 60);
        const seconds = timer.remainingSeconds % 60;
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // 計算進度百分比
        const progress = timer.totalSeconds > 0 ? ((timer.totalSeconds - timer.remainingSeconds) / timer.totalSeconds) * 100 : 0;
        
        // 狀態指示
        let statusText = '';
        if (timer.isRunning) {
            statusText = '進行中';
        } else if (timer.isPaused) {
            statusText = '已暫停';
        } else if (timer.remainingSeconds === 0) {
            statusText = '已完成';
        }
        
        div.innerHTML = `
            <div class="timer-item-info">
                <div class="timer-item-boss">${timer.bossInfo}</div>
                <div class="timer-item-time">${timeString}</div>
                <div class="timer-item-status">${statusText}</div>
                <div class="timer-item-progress">
                    <div class="progress-bar-small">
                        <div class="progress-small" style="width: ${progress}%"></div>
                    </div>
                </div>
            </div>
            <div class="timer-item-controls">
                <button class="btn btn-pause" onclick="bossTimer.pauseSpecificTimer(${timer.id})" ${!timer.isRunning && !timer.isPaused ? 'disabled' : ''}>
                    ${timer.isRunning ? '暫停' : '繼續'}
                </button>
                <button class="btn btn-reset" onclick="bossTimer.removeTimer(${timer.id})">移除</button>
            </div>
        `;
        
        return div;
    }
    
    pauseSpecificTimer(timerId) {
        const timer = this.activeTimers.get(timerId);
        if (timer) {
            if (timer.isRunning) {
                timer.isRunning = false;
                timer.isPaused = true;
                timer.pauseStartTime = Date.now();
                clearInterval(timer.intervalId);
            } else {
                timer.isRunning = true;
                timer.isPaused = false;
                if (timer.pauseStartTime) {
                    timer.pausedTime += Date.now() - timer.pauseStartTime;
                    timer.pauseStartTime = null;
                }
                timer.intervalId = setInterval(() => {
                    this.tickTimer(timer);
                }, 100);
            }
            this.updateTimersList();
        }
    }
    
    removeTimer(timerId) {
        const timer = this.activeTimers.get(timerId);
        if (timer) {
            clearInterval(timer.intervalId);
            this.activeTimers.delete(timerId);
            this.updateTimersList();
            
            // 如果移除的是主計時器，重置主顯示
            if (this.activeTimers.size === 0) {
                this.timeDisplay.textContent = '00:00:00';
                this.progressBar.style.width = '0%';
                this.timeDisplay.className = 'time-display';
                this.startBtn.disabled = false;
                this.pauseBtn.disabled = true;
                this.status.textContent = '選擇地圖並設定重生時間';
            }
        }
    }
    
    
    requestNotificationPermission() {
        if ('Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        console.log('通知權限已授予');
                    }
                });
            }
        }
    }
    
    showNotification(bossInfo) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification('Boss 重生提醒', {
                body: `${bossInfo} 已重生！`,
                icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTYiIGZpbGw9IiM2NjdFRUEiLz4KPHN2ZyB4PSIxNiIgeT0iMTYiIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+',
                badge: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTYiIGZpbGw9IiM2NjdFRUEiLz4KPC9zdmc+',
                tag: 'boss-timer',
                requireInteraction: true
            });
            
            // 5秒後自動關閉通知
            setTimeout(() => {
                notification.close();
            }, 5000);
        }
    }
    
    playNotificationSound() {
        if (this.isMuted) return;
        
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // 播放三聲提示音
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.3);
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.4);
            
            // 使用設定的音量
            gainNode.gain.setValueAtTime(this.volume * 0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.8);
        } catch (error) {
            console.log('音頻播放不可用');
        }
    }
    
    // 分享功能方法
    showShareLightbox() {
        if (this.activeTimers.size === 0) {
            this.status.textContent = '請先新增計時器再分享';
            return;
        }
        
        try {
            // 收集所有計時器的數據
            const timersData = Array.from(this.activeTimers.values()).map(timer => ({
                chapter: timer.chapter,
                boss: timer.boss,
                server: timer.server,
                totalSeconds: timer.totalSeconds,
                remainingSeconds: timer.remainingSeconds,
                isPaused: timer.isPaused
            }));
            
            // 生成簡短的分享連結
            const compressedData = this.generateShortShareUrl(timersData);
            
            // 生成分享連結
            const baseUrl = window.location.origin + window.location.pathname;
            const shareUrl = `${baseUrl}?t=${compressedData}`;
            
            // 設定lightbox內容
            this.lightboxTitle.textContent = `分享計時器 (${timersData.length} 個)`;
            this.shareUrl.value = shareUrl;
            this.shareContent.style.display = 'block';
            this.importContent.style.display = 'none';
            
            // 顯示lightbox
            this.showLightbox();
            
        } catch (error) {
            console.error('生成分享連結失敗:', error);
            this.status.textContent = '生成分享連結失敗，請重試';
        }
    }
    
    showImportLightbox() {
        this.lightboxTitle.textContent = '匯入分享連結';
        this.importContent.style.display = 'block';
        this.shareContent.style.display = 'none';
        this.importUrl.value = '';
        this.showLightbox();
        
        // 聚焦到輸入框
        setTimeout(() => {
            this.importUrl.focus();
        }, 300);
    }
    
    showLightbox() {
        this.lightbox.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // 防止背景滾動
        
        // 添加動畫效果
        setTimeout(() => {
            this.lightbox.classList.add('show');
        }, 10);
    }
    
    hideLightbox() {
        this.lightbox.classList.remove('show');
        document.body.style.overflow = ''; // 恢復背景滾動
        
        // 等待動畫完成後隱藏
        setTimeout(() => {
            this.lightbox.style.display = 'none';
        }, 300);
    }
    
    copyShareLink() {
        this.shareUrl.select();
        this.shareUrl.setSelectionRange(0, 99999); // 對於移動設備
        
        try {
            document.execCommand('copy');
            this.status.textContent = '分享連結已複製到剪貼板';
            
            // 顯示複製成功動畫
            this.copyBtn.textContent = '✓ 已複製';
            this.copyBtn.style.background = 'linear-gradient(135deg, #48bb78, #38a169)';
            
            setTimeout(() => {
                this.copyBtn.textContent = '複製';
                this.copyBtn.style.background = '';
            }, 2000);
            
        } catch (error) {
            console.error('複製失敗:', error);
            this.status.textContent = '複製失敗，請手動複製連結';
        }
    }
    
    loadFromShareLink() {
        let shareUrl = this.importUrl.value.trim();
        
        // 如果輸入框為空，嘗試從剪貼板讀取
        if (!shareUrl) {
            this.getClipboardText().then(text => {
                if (text && (text.includes('?t=') || text.includes('?share='))) {
                    this.importUrl.value = text;
                    this.processShareLink(text);
                } else {
                    this.status.textContent = '請輸入分享連結或確保剪貼板中有有效的分享連結';
                }
            }).catch(() => {
                this.status.textContent = '請輸入分享連結';
            });
            return;
        }
        
        this.processShareLink(shareUrl);
    }
    
    // 處理分享連結
    processShareLink(shareUrl) {
        try {
            // 從URL中提取分享數據
            const url = new URL(shareUrl);
            let shareData = url.searchParams.get('t') || url.searchParams.get('share');
            
            if (!shareData) {
                this.status.textContent = '無效的分享連結';
                return;
            }
            
            // 解碼數據（支援新舊格式）
            let timersData;
            if (url.searchParams.has('t')) {
                // 新格式：簡短壓縮格式
                timersData = this.parseShortShareUrl(shareData);
            } else {
                // 舊格式：Base64格式
                timersData = this.decodeTimersData(shareData);
            }
            
            if (!timersData || timersData.length === 0) {
                this.status.textContent = '分享連結中沒有計時器數據';
                return;
            }
            
            // 清除現有計時器
            this.clearAllTimers();
            
            // 載入分享的計時器
            let loadedCount = 0;
            timersData.forEach(timerData => {
                try {
                    this.loadSharedTimer(timerData);
                    loadedCount++;
                } catch (error) {
                    console.error('載入計時器失敗:', error);
                }
            });
            
            this.status.textContent = `成功載入 ${loadedCount} 個計時器`;
            this.hideLightbox();
            this.importUrl.value = '';
            
        } catch (error) {
            console.error('載入分享連結失敗:', error);
            this.status.textContent = '載入分享連結失敗，請檢查連結是否正確';
        }
    }
    
    // 從剪貼板貼上
    async pasteFromClipboard() {
        try {
            const text = await this.getClipboardText();
            if (text && (text.includes('?t=') || text.includes('?share='))) {
                this.importUrl.value = text;
                this.status.textContent = '已從剪貼板貼上分享連結';
                
                // 自動聚焦到載入按鈕
                setTimeout(() => {
                    this.loadBtn.focus();
                }, 100);
            } else {
                this.status.textContent = '剪貼板中沒有有效的分享連結';
            }
        } catch (error) {
            console.error('貼上失敗:', error);
            this.status.textContent = '無法讀取剪貼板，請手動貼上連結';
        }
    }
    
    // 從剪貼板讀取文本
    async getClipboardText() {
        try {
            if (navigator.clipboard && navigator.clipboard.readText) {
                return await navigator.clipboard.readText();
            } else {
                // 降級方案：使用舊的API
                return new Promise((resolve, reject) => {
                    const textArea = document.createElement('textarea');
                    textArea.style.position = 'fixed';
                    textArea.style.left = '-999999px';
                    textArea.style.top = '-999999px';
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    
                    try {
                        const successful = document.execCommand('paste');
                        if (successful) {
                            resolve(textArea.value);
                        } else {
                            reject(new Error('無法讀取剪貼板'));
                        }
                    } catch (err) {
                        reject(err);
                    } finally {
                        document.body.removeChild(textArea);
                    }
                });
            }
        } catch (error) {
            throw new Error('無法讀取剪貼板');
        }
    }
    
    checkForShareLink() {
        const urlParams = new URLSearchParams(window.location.search);
        const shareData = urlParams.get('t') || urlParams.get('share');
        
        if (shareData) {
            try {
                let timersData;
                if (urlParams.has('t')) {
                    // 新格式：簡短壓縮格式
                    timersData = this.parseShortShareUrl(shareData);
                } else {
                    // 舊格式：Base64格式
                    timersData = this.decodeTimersData(shareData);
                }
                
                if (timersData && timersData.length > 0) {
                    // 延遲載入，確保頁面完全載入
                    setTimeout(() => {
                        this.loadSharedTimers(timersData);
                    }, 500);
                }
            } catch (error) {
                console.error('自動載入分享連結失敗:', error);
            }
        }
    }
    
    loadSharedTimers(timersData) {
        this.clearAllTimers();
        
        let loadedCount = 0;
        timersData.forEach(timerData => {
            try {
                this.loadSharedTimer(timerData);
                loadedCount++;
            } catch (error) {
                console.error('載入計時器失敗:', error);
            }
        });
        
        this.status.textContent = `已自動載入 ${loadedCount} 個分享的計時器`;
    }
    
    loadSharedTimer(timerData) {
        // 設定選擇器
        this.chapterSelect.value = timerData.chapter;
        this.updateBossOptions();
        this.bossSelect.value = timerData.boss;
        this.serverSelect.value = timerData.server;
        
        // 計算剩餘時間並設定輸入框
        const remainingSeconds = timerData.remainingSeconds || timerData.totalSeconds;
        const hours = Math.floor(remainingSeconds / 3600);
        const minutes = Math.floor((remainingSeconds % 3600) / 60);
        const seconds = remainingSeconds % 60;
        
        this.hoursInput.value = hours;
        this.minutesInput.value = minutes;
        this.secondsInput.value = seconds;
        
        // 新增計時器
        this.addTimer();
        
        // 如果計時器原本是暫停狀態，則暫停它
        if (timerData.isPaused) {
            const lastTimer = Array.from(this.activeTimers.values()).pop();
            if (lastTimer) {
                this.pauseSpecificTimer(lastTimer.id);
            }
        }
    }
    
    clearAllTimers() {
        // 清除所有現有計時器
        this.activeTimers.forEach(timer => {
            clearInterval(timer.intervalId);
        });
        this.activeTimers.clear();
        this.updateTimersList();
    }
    
    encodeTimersData(timersData) {
        try {
            // 壓縮數據結構，只保留必要信息
            const compressedData = timersData.map(timer => ({
                c: timer.chapter,      // chapter
                b: timer.boss,         // boss
                s: timer.server,       // server
                t: timer.totalSeconds, // totalSeconds
                r: timer.remainingSeconds, // remainingSeconds
                p: timer.isPaused ? 1 : 0  // isPaused (1 or 0)
            }));
            
            const jsonString = JSON.stringify(compressedData);
            
            // 使用更簡短的編碼方式
            // 先壓縮JSON，然後使用Base64編碼
            const compressed = this.compressString(jsonString);
            return btoa(compressed);
        } catch (error) {
            throw new Error('編碼數據失敗');
        }
    }
    
    decodeTimersData(encodedData) {
        try {
            const compressed = atob(encodedData);
            const jsonString = this.decompressString(compressed);
            const compressedData = JSON.parse(jsonString);
            
            // 還原完整的數據結構
            return compressedData.map(timer => ({
                chapter: timer.c,
                boss: timer.b,
                server: timer.s,
                totalSeconds: timer.t,
                remainingSeconds: timer.r,
                isPaused: timer.p === 1
            }));
        } catch (error) {
            throw new Error('解碼數據失敗');
        }
    }
    
    // 簡單的字符串壓縮
    compressString(str) {
        // 移除所有空格和換行，並優化JSON格式
        return str.replace(/\s+/g, '');
    }
    
    // 字符串解壓縮
    decompressString(str) {
        return str;
    }
    
    // 超壓縮字符集（64個字符，包含所有URL安全字符）
    ULTRA_COMPRESS_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    
    // 生成超壓縮分享連結（目標24字以內）
    generateShortShareUrl(timersData) {
        try {
            // 使用極簡數據結構，每個計時器用最少的字符表示
            const ultraCompressed = timersData.map(timer => {
                const mapId = this.getMapId(timer.chapter, timer.boss);
                const serverId = parseInt(timer.server);
                
                // 將時間轉換為更短的格式（分鐘為單位，最大999分鐘）
                const totalMinutes = Math.min(Math.floor(timer.totalSeconds / 60), 999);
                const remainingMinutes = Math.min(Math.floor(timer.remainingSeconds / 60), 999);
                
                // 使用單字符分隔符和緊湊格式
                return `${mapId}${serverId}${totalMinutes.toString().padStart(3, '0')}${remainingMinutes.toString().padStart(3, '0')}${timer.isPaused ? '1' : '0'}`;
            });
            
            // 將所有計時器數據合併
            const dataString = ultraCompressed.join('');
            
            // 使用更激進的壓縮
            const compressed = this.ultraCompress(dataString);
            
            // 如果還是太長，使用二進制壓縮
            if (compressed.length > 20) {
                return this.binaryCompress(timersData);
            }
            
            return compressed;
        } catch (error) {
            throw new Error('生成超壓縮連結失敗');
        }
    }
    
    // 生成帶同步功能的分享連結
    generateSyncShareUrl(timersData) {
        try {
            // 生成房間ID（6位隨機字符串）
            this.roomId = this.generateRoomId();
            this.isHost = true;
            
            // 啟動同步服務
            this.startSyncService();
            
            // 生成基本的壓縮數據
            const basicCompressed = this.generateShortShareUrl(timersData);
            
            // 加入房間ID前綴和同步標記
            return `sync_${this.roomId}_${basicCompressed}`;
        } catch (error) {
            throw new Error('生成同步分享連結失敗');
        }
    }
    
    // 生成房間ID
    generateRoomId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    
    // 二進制壓縮（最後手段）
    binaryCompress(timersData) {
        try {
            // 將每個計時器壓縮為固定長度的二進制字符串
            let binaryString = '';
            
            for (const timer of timersData) {
                const mapId = this.getMapId(timer.chapter, timer.boss);
                const serverId = parseInt(timer.server);
                const totalMinutes = Math.min(Math.floor(timer.totalSeconds / 60), 999);
                const remainingMinutes = Math.min(Math.floor(timer.remainingSeconds / 60), 999);
                const isPaused = timer.isPaused ? 1 : 0;
                
                // 每個計時器用28位表示：mapId(4位) + serverId(3位) + totalMinutes(10位) + remainingMinutes(10位) + paused(1位)
                const timerBinary = 
                    mapId.toString(2).padStart(4, '0') +
                    serverId.toString(2).padStart(3, '0') +
                    totalMinutes.toString(2).padStart(10, '0') +
                    remainingMinutes.toString(2).padStart(10, '0') +
                    isPaused.toString(2);
                
                binaryString += timerBinary;
            }
            
            // 將二進制轉換為Base64-like編碼
            return this.binaryToBase64(binaryString);
        } catch (error) {
            throw new Error('二進制壓縮失敗');
        }
    }
    
    // 二進制轉Base64
    binaryToBase64(binaryString) {
        let result = '';
        for (let i = 0; i < binaryString.length; i += 6) {
            const chunk = binaryString.substr(i, 6).padEnd(6, '0');
            const value = parseInt(chunk, 2);
            result += this.ULTRA_COMPRESS_CHARS[value];
        }
        return result;
    }
    
    // Base64轉二進制
    base64ToBinary(base64String) {
        let result = '';
        for (let i = 0; i < base64String.length; i++) {
            const value = this.ULTRA_COMPRESS_CHARS.indexOf(base64String[i]);
            if (value !== -1) {
                result += value.toString(2).padStart(6, '0');
            }
        }
        return result;
    }
    
    // 解析超壓縮分享連結
    parseShortShareUrl(compressedData) {
        try {
            // 檢查是否為同步格式
            if (compressedData.startsWith('sync_')) {
                const parts = compressedData.split('_');
                if (parts.length >= 3) {
                    this.roomId = parts[1];
                    this.isHost = false;
                    compressedData = parts[2];
                    
                    // 啟動同步服務（作為客戶端）
                    this.startSyncService();
                }
            }
            
            // 檢查是否為二進制壓縮格式
            if (this.isBinaryCompressed(compressedData)) {
                return this.parseBinaryCompressed(compressedData);
            }
            
            // 解壓縮數據
            const dataString = this.ultraDecompress(compressedData);
            
            // 解析計時器數據（新格式：無分隔符）
            const timersData = [];
            let i = 0;
            
            while (i < dataString.length) {
                // 每個計時器用固定長度：mapId(1-2位) + serverId(1位) + totalMinutes(3位) + remainingMinutes(3位) + paused(1位)
                const mapIdStr = dataString.substr(i, 2);
                const mapId = parseInt(mapIdStr);
                i += 2;
                
                const serverId = parseInt(dataString[i]);
                i += 1;
                
                const totalMinutes = parseInt(dataString.substr(i, 3));
                i += 3;
                
                const remainingMinutes = parseInt(dataString.substr(i, 3));
                i += 3;
                
                const isPaused = dataString[i] === '1';
                i += 1;
                
                // 解析地圖ID
                const { chapter, boss } = this.parseMapId(mapId);
                
                timersData.push({
                    chapter: chapter.toString(),
                    boss: boss,
                    server: serverId.toString(),
                    totalSeconds: totalMinutes * 60,
                    remainingSeconds: remainingMinutes * 60,
                    isPaused: isPaused
                });
            }
            
            return timersData;
        } catch (error) {
            throw new Error('解析超壓縮連結失敗');
        }
    }
    
    // 檢查是否為二進制壓縮格式
    isBinaryCompressed(data) {
        // 如果數據長度很短且只包含Base64字符，可能是二進制壓縮
        return data.length <= 24 && /^[A-Za-z0-9\-_]+$/.test(data);
    }
    
    // 解析二進制壓縮數據
    parseBinaryCompressed(compressedData) {
        try {
            const binaryString = this.base64ToBinary(compressedData);
            const timersData = [];
            
            // 每個計時器用28位表示
            for (let i = 0; i < binaryString.length; i += 28) {
                const timerBinary = binaryString.substr(i, 28).padEnd(28, '0');
                
                const mapId = parseInt(timerBinary.substr(0, 4), 2);
                const serverId = parseInt(timerBinary.substr(4, 3), 2);
                const totalMinutes = parseInt(timerBinary.substr(7, 10), 2);
                const remainingMinutes = parseInt(timerBinary.substr(17, 10), 2);
                const isPaused = timerBinary.substr(27, 1) === '1';
                
                // 解析地圖ID
                const { chapter, boss } = this.parseMapId(mapId);
                
                timersData.push({
                    chapter: chapter.toString(),
                    boss: boss,
                    server: serverId.toString(),
                    totalSeconds: totalMinutes * 60,
                    remainingSeconds: remainingMinutes * 60,
                    isPaused: isPaused
                });
            }
            
            return timersData;
        } catch (error) {
            throw new Error('解析二進制壓縮失敗');
        }
    }
    
    // 獲取地圖ID（將章節和地圖編碼為單一數字）
    getMapId(chapter, boss) {
        const chapterNum = parseInt(chapter);
        const bossNum = parseInt(boss.split('-')[1]);
        return (chapterNum - 7) * 10 + bossNum; // 7-1=0, 7-2=1, 8-1=10, 8-2=11, etc.
    }
    
    // 解析地圖ID
    parseMapId(mapId) {
        const chapter = Math.floor(mapId / 10) + 7;
        const boss = mapId % 10;
        return { chapter, boss: `${chapter}-${boss}` };
    }
    
    // 超壓縮編碼（使用64字符集）
    ultraCompress(str) {
        let result = '';
        let num = 0;
        let bits = 0;
        
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            num = (num << 8) + char;
            bits += 8;
            
            while (bits >= 6) {
                result += this.ULTRA_COMPRESS_CHARS[(num >> (bits - 6)) & 63];
                bits -= 6;
                num &= (1 << bits) - 1;
            }
        }
        
        if (bits > 0) {
            result += this.ULTRA_COMPRESS_CHARS[(num << (6 - bits)) & 63];
        }
        
        return result;
    }
    
    // 超壓縮解碼
    ultraDecompress(compressed) {
        let result = '';
        let num = 0;
        let bits = 0;
        
        for (let i = 0; i < compressed.length; i++) {
            const char = this.ULTRA_COMPRESS_CHARS.indexOf(compressed[i]);
            if (char === -1) continue;
            
            num = (num << 6) + char;
            bits += 6;
            
            while (bits >= 8) {
                result += String.fromCharCode((num >> (bits - 8)) & 255);
                bits -= 8;
                num &= (1 << bits) - 1;
            }
        }
        
        return result;
    }
    
    // 啟動同步服務
    startSyncService() {
        if (this.syncEnabled || !this.roomId) return;
        
        this.syncEnabled = true;
        
        // 顯示同步狀態指示器
        this.updateSyncStatus();
        
        // 使用WebSocket進行實時同步
        this.connectWebSocket();
        
        // 定期同步（備用方案）
        this.syncInterval = setInterval(() => {
            this.syncTimers();
        }, 5000); // 每5秒同步一次
        
        console.log(`同步服務已啟動 - 房間: ${this.roomId}, 角色: ${this.isHost ? '主機' : '客戶端'}`);
    }
    
    // 更新同步狀態顯示
    updateSyncStatus() {
        if (this.syncEnabled && this.roomId) {
            this.syncStatus.style.display = 'block';
            this.syncRole.textContent = this.isHost ? '主機' : '客戶端';
            this.roomIdElement.textContent = this.roomId;
        } else {
            this.syncStatus.style.display = 'none';
        }
    }
    
    // 連接WebSocket
    connectWebSocket() {
        try {
            // 暫時禁用WebSocket，使用HTTP輪詢
            console.log('使用HTTP輪詢同步模式');
            this.fallbackToHttpSync();
            
        } catch (error) {
            console.error('同步服務初始化失敗:', error);
            this.fallbackToHttpSync();
        }
    }
    
    // 降級到HTTP輪詢同步
    fallbackToHttpSync() {
        console.log('使用簡化同步模式');
        // 暫時禁用同步功能，只顯示狀態
        this.status.textContent = this.isHost ? '已建立同步房間（簡化模式）' : '已加入同步房間（簡化模式）';
    }
    
    // 處理同步消息
    handleSyncMessage(data) {
        try {
            const message = JSON.parse(data);
            
            if (message.type === 'sync' && message.roomId === this.roomId) {
                if (!this.isHost) {
                    // 客戶端接收主機的更新
                    this.updateTimersFromSync(message.timers);
                }
            }
        } catch (error) {
            console.error('處理同步消息失敗:', error);
        }
    }
    
    // 同步計時器
    syncTimers() {
        if (!this.syncEnabled || !this.roomId) return;
        
        // 暫時禁用實際同步，只記錄狀態
        console.log(`同步檢查 - 房間: ${this.roomId}, 角色: ${this.isHost ? '主機' : '客戶端'}`);
    }
    
    // 廣播計時器更新（主機）
    broadcastTimerUpdate() {
        if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) return;
        
        const timersData = Array.from(this.activeTimers.values()).map(timer => ({
            id: timer.id,
            chapter: timer.chapter,
            boss: timer.boss,
            server: timer.server,
            totalSeconds: timer.totalSeconds,
            remainingSeconds: timer.remainingSeconds,
            isPaused: timer.isPaused,
            lastUpdate: Date.now()
        }));
        
        const message = {
            type: 'sync',
            roomId: this.roomId,
            timers: timersData,
            timestamp: Date.now()
        };
        
        this.websocket.send(JSON.stringify(message));
    }
    
    // 請求計時器更新（客戶端）
    requestTimerUpdate() {
        if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) return;
        
        const message = {
            type: 'request',
            roomId: this.roomId,
            timestamp: Date.now()
        };
        
        this.websocket.send(JSON.stringify(message));
    }
    
    // 從同步數據更新計時器
    updateTimersFromSync(timersData) {
        if (!timersData || timersData.length === 0) return;
        
        // 清除現有計時器
        this.clearAllTimers();
        
        // 載入同步的計時器
        timersData.forEach(timerData => {
            try {
                this.loadSharedTimer(timerData);
            } catch (error) {
                console.error('載入同步計時器失敗:', error);
            }
        });
        
        this.status.textContent = `已同步 ${timersData.length} 個計時器`;
    }
    
    // 停止同步服務
    stopSyncService() {
        this.syncEnabled = false;
        
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
        
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        
        this.roomId = null;
        this.isHost = false;
        
        // 隱藏同步狀態指示器
        this.updateSyncStatus();
        
        console.log('同步服務已停止');
    }
}

// 全域變數，供 HTML 中的 onclick 使用
let bossTimer;

// 當頁面載入完成時初始化計時器
document.addEventListener('DOMContentLoaded', () => {
    bossTimer = new BossTimer();
});

// 頁面關閉時停止同步服務
window.addEventListener('beforeunload', () => {
    if (bossTimer) {
        bossTimer.stopSyncService();
    }
});