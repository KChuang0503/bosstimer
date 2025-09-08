class BossTimer {
    constructor() {
        this.activeTimers = new Map();
        this.timerIdCounter = 0;
        
        // Firebase 相關屬性
        this.database = null;
        this.auth = null;
        this.user = null;
        this.roomId = null;
        this.isHost = false;
        this.syncEnabled = false;
        this.roomRef = null;
        this.timersRef = null;
        this.usersRef = null;
        this.connectedUsers = new Map();
        this.lastSyncTime = 0;
        
        this.initializeElements();
        this.bindEvents();
        this.updateBossOptions();
        this.initializeFirebase();
    }
    
    // 初始化 Firebase
    async initializeFirebase() {
        try {
            // 獲取 Firebase 服務
            this.database = firebase.database();
            this.auth = firebase.auth();
            
            // 匿名登入
            await this.auth.signInAnonymously();
            this.user = this.auth.currentUser;
            
            console.log('Firebase 初始化成功，用戶ID:', this.user.uid);
            
            // 監聽認證狀態變化
            this.auth.onAuthStateChanged((user) => {
                if (user) {
                    this.user = user;
                    console.log('用戶已登入:', user.uid);
                } else {
                    console.log('用戶已登出');
                }
            });
            
        } catch (error) {
            console.error('Firebase 初始化失敗:', error);
            this.status.textContent = 'Firebase 初始化失敗，請重新載入頁面';
        }
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
        
        // 添加調試信息
        this.addDebugInfo();
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
        // 停止所有計時器
        this.activeTimers.forEach(timer => {
            clearInterval(timer.intervalId);
        });
        this.activeTimers.clear();
        
        // 重置所有輸入到初始狀態
        this.chapterSelect.value = '7';
        this.bossSelect.value = '7-1';
        this.serverSelect.value = '1';
        this.hoursInput.value = '0';
        this.minutesInput.value = '0';
        this.secondsInput.value = '0';
        
        // 重置音量設定
        this.volumeSlider.value = '50';
        this.volumeValue.textContent = '50%';
        this.volume = 0.5;
        this.isMuted = false;
        this.muteBtn.textContent = '🔊';
        this.muteBtn.classList.remove('muted');
        
        // 更新地圖選項
        this.updateBossOptions();
        
        // 更新計時器列表顯示
        this.updateTimersList();
        
        // 如果啟用同步，同步到 Firebase
        if (this.syncEnabled) {
            this.syncTimersToFirebase();
        }
        
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
        
        // 如果啟用同步，同步到 Firebase
        if (this.syncEnabled) {
            this.syncTimersToFirebase();
        }
        
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
        
        // 根據同步狀態和用戶角色顯示不同的控制按鈕
        let controlsHtml = '';
        if (timer.isSynced) {
            // 同步計時器：主機有控制按鈕，客戶端只有同步指示器
            if (this.isHost) {
                controlsHtml = `<div class="timer-item-controls">
                    <button class="btn btn-pause" onclick="bossTimer.pauseSpecificTimer(${timer.id})" ${!timer.isRunning && !timer.isPaused ? 'disabled' : ''}>
                        ${timer.isRunning ? '暫停' : '繼續'}
                    </button>
                    <button class="btn btn-reset" onclick="bossTimer.removeTimer(${timer.id})">移除</button>
                    <span class="sync-indicator">🔄 同步中</span>
                </div>`;
            } else {
                controlsHtml = '<div class="timer-item-controls"><span class="sync-indicator">🔄 同步中</span></div>';
            }
        } else {
            // 非同步計時器：正常顯示控制按鈕
            controlsHtml = `<div class="timer-item-controls">
                <button class="btn btn-pause" onclick="bossTimer.pauseSpecificTimer(${timer.id})" ${!timer.isRunning && !timer.isPaused ? 'disabled' : ''}>
                    ${timer.isRunning ? '暫停' : '繼續'}
                </button>
                <button class="btn btn-reset" onclick="bossTimer.removeTimer(${timer.id})">移除</button>
            </div>`;
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
            ${controlsHtml}
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
            
            // 如果啟用同步，同步到 Firebase
            if (this.syncEnabled) {
                this.syncTimersToFirebase();
            }
        }
    }
    
    removeTimer(timerId) {
        const timer = this.activeTimers.get(timerId);
        if (timer) {
            clearInterval(timer.intervalId);
            this.activeTimers.delete(timerId);
            this.updateTimersList();
            
            // 如果啟用同步，同步到 Firebase
            if (this.syncEnabled) {
                this.syncTimersToFirebase();
            }
            
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
    async showShareLightbox() {
        if (this.activeTimers.size === 0) {
            this.status.textContent = '請先新增計時器再分享';
            return;
        }
        
        try {
            // 創建 Firebase 房間
            const roomId = await this.createOrJoinRoom();
            
            // 同步現有計時器到 Firebase
            await this.syncTimersToFirebase();
            
            // 更新lightbox標題
            this.lightboxTitle.textContent = `分享計時器 (${this.activeTimers.size} 個)`;
            
            // 生成分享連結
            let baseUrl;
            try {
                baseUrl = window.location.origin + window.location.pathname;
                if (!baseUrl.startsWith('http')) {
                    baseUrl = window.location.href.split('?')[0];
                }
                if (!baseUrl.endsWith('/') && !baseUrl.includes('.')) {
                    baseUrl += '/';
                }
            } catch (error) {
                console.error('URL生成錯誤:', error);
                baseUrl = window.location.href.split('?')[0];
            }
            
            const shareUrl = `${baseUrl}?room=${roomId}`;
            
            // 設定lightbox內容
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
    async processShareLink(shareUrl) {
        try {
            // 從URL中提取房間ID
            let url;
            try {
                url = new URL(shareUrl);
            } catch (error) {
                if (!shareUrl.startsWith('http')) {
                    shareUrl = window.location.origin + (shareUrl.startsWith('/') ? '' : '/') + shareUrl;
                }
                url = new URL(shareUrl);
            }
            
            const roomId = url.searchParams.get('room');
            
            if (!roomId) {
                this.status.textContent = '無效的分享連結';
                return;
            }
            
            // 加入 Firebase 房間
            await this.createOrJoinRoom(roomId);
            
            this.status.textContent = `已加入房間 ${roomId}`;
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
    
    async checkForShareLink() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const roomId = urlParams.get('room');
            
            console.log('檢查分享連結:', { roomId, url: window.location.href });
            
            if (roomId) {
                try {
                    // 等待 Firebase 初始化完成
                    await this.waitForFirebaseInit();
                    
                    // 加入 Firebase 房間
                    await this.createOrJoinRoom(roomId);
                    
                    // 為客戶端添加中斷同步按鈕
                    this.addClientStopSyncButton();
                    
                    this.status.textContent = `已自動加入房間 ${roomId}`;
                    
                } catch (error) {
                    console.error('加入房間失敗:', error);
                    this.status.textContent = '加入房間失敗，請檢查連結是否正確';
                }
            } else {
                console.log('沒有找到房間參數');
            }
        } catch (error) {
            console.error('檢查分享連結時發生錯誤:', error);
        }
    }
    
    // 等待 Firebase 初始化完成
    async waitForFirebaseInit() {
        return new Promise((resolve) => {
            const checkInit = () => {
                if (this.database && this.user) {
                    resolve();
                } else {
                    setTimeout(checkInit, 100);
                }
            };
            checkInit();
        });
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
    
    // 從同步數據載入計時器（用於實時同步）
    loadSharedTimerFromSync(timerData) {
        const timerId = this.timerIdCounter++;
        
        console.log('創建同步計時器:', timerData);
        
        const timer = {
            id: timerId,
            bossInfo: `${this.getChapterName(timerData.chapter)} - ${this.getBossName(timerData.boss)} (分流 ${timerData.server})`,
            totalSeconds: timerData.totalSeconds,
            remainingSeconds: timerData.remainingSeconds,
            isRunning: !timerData.isPaused,
            isPaused: timerData.isPaused,
            intervalId: null,
            startTime: timerData.startTime || Date.now(),
            pausedTime: timerData.pausedTime || 0,
            lastUpdateTime: Date.now(),
            chapter: timerData.chapter,
            boss: timerData.boss,
            server: timerData.server,
            isSynced: true // 標記為同步計時器
        };
        
        console.log('計時器對象創建完成:', timer);
        
        if (timer.isRunning) {
            timer.intervalId = setInterval(() => {
                this.tickTimer(timer);
            }, 100);
        }
        
        this.activeTimers.set(timerId, timer);
        console.log('計時器已添加到Map，當前數量:', this.activeTimers.size);
        
        // 不在此處調用updateTimersList，讓上層方法統一調用
    }
    
    // 獲取章節名稱
    getChapterName(chapter) {
        const chapterNames = {
            '7': '第七章',
            '8': '第八章', 
            '9': '第九章',
            '10': '第十章'
        };
        return chapterNames[chapter] || `第${chapter}章`;
    }
    
    // 獲取Boss名稱
    getBossName(boss) {
        const bossNames = {
            '7-1': '扎卡里耶爾交叉路',
            '7-2': '王陵一層',
            '7-3': '王陵二層',
            '7-4': '王陵三層',
            '8-1': '水路橋地區',
            '8-2': '阿雷魯諾男爵領',
            '8-3': '魔族收監所第一區',
            '8-4': '魔族收監所第三區',
            '8-5': '魔族收監所第四區',
            '8-6': '魔族收監所第五區',
            '9-1': '女神的古院',
            '9-2': '佩迪米安外城',
            '9-3': '魔法師之塔一層',
            '9-4': '魔法師之塔二層',
            '9-5': '魔法師之塔三層',
            '10-1': '大教堂懺悔路',
            '10-2': '大教堂正殿',
            '10-3': '大教堂大迴廊',
            '10-4': '大教堂至聖所'
        };
        return bossNames[boss] || boss;
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
    
    // 創建或加入房間
    async createOrJoinRoom(roomId = null) {
        try {
            if (!this.user) {
                throw new Error('用戶未登入');
            }
            
            // 如果沒有提供房間ID，創建新房間
            if (!roomId) {
                roomId = this.generateRoomId();
                this.isHost = true;
            } else {
                this.isHost = false;
            }
            
            this.roomId = roomId;
            this.syncEnabled = true;
            
            // 設置 Firebase 引用
            this.roomRef = this.database.ref(`rooms/${roomId}`);
            this.timersRef = this.roomRef.child('timers');
            this.usersRef = this.roomRef.child('users');
            
            // 加入房間
            await this.joinRoom();
            
            // 設置監聽器
            this.setupRoomListeners();
            
            // 更新UI
            this.updateSyncStatus();
            
            console.log(`已${this.isHost ? '創建' : '加入'}房間: ${roomId}, 角色: ${this.isHost ? '主機' : '客戶端'}`);
            
            return roomId;
            
        } catch (error) {
            console.error('創建/加入房間失敗:', error);
            this.status.textContent = '創建/加入房間失敗，請重試';
            throw error;
        }
    }
    
    // 加入房間
    async joinRoom() {
        const userData = {
            uid: this.user.uid,
            name: `用戶${this.user.uid.slice(-4)}`,
            joinedAt: firebase.database.ServerValue.TIMESTAMP,
            isHost: this.isHost,
            lastSeen: firebase.database.ServerValue.TIMESTAMP
        };
        
        // 添加用戶到房間
        await this.usersRef.child(this.user.uid).set(userData);
        
        // 設置用戶在線狀態
        const userOnlineRef = this.usersRef.child(`${this.user.uid}/online`);
        userOnlineRef.set(true);
        
        // 設置斷線處理
        userOnlineRef.onDisconnect().set(false);
        
        // 定期更新 lastSeen
        setInterval(() => {
            this.usersRef.child(`${this.user.uid}/lastSeen`).set(firebase.database.ServerValue.TIMESTAMP);
        }, 30000); // 每30秒更新一次
    }
    
    // 設置房間監聽器
    setupRoomListeners() {
        // 監聽計時器變化
        this.timersRef.on('value', (snapshot) => {
            this.handleTimersUpdate(snapshot.val());
        });
        
        // 監聽用戶變化
        this.usersRef.on('value', (snapshot) => {
            this.handleUsersUpdate(snapshot.val());
        });
        
        // 監聽房間狀態
        this.roomRef.child('status').on('value', (snapshot) => {
            this.handleRoomStatusUpdate(snapshot.val());
        });
    }
    
    // 處理計時器更新
    handleTimersUpdate(timersData) {
        if (!timersData) return;
        
        console.log('收到計時器更新:', timersData);
        
        // 清除現有計時器
        this.clearAllTimers();
        
        // 載入新的計時器數據
        Object.values(timersData).forEach(timerData => {
            try {
                this.loadSharedTimerFromSync(timerData);
            } catch (error) {
                console.error('載入同步計時器失敗:', error);
            }
        });
        
        this.updateTimersList();
        this.status.textContent = `已同步 ${Object.keys(timersData).length} 個計時器`;
    }
    
    // 處理用戶更新
    handleUsersUpdate(usersData) {
        if (!usersData) return;
        
        this.connectedUsers.clear();
        Object.values(usersData).forEach(user => {
            if (user.online) {
                this.connectedUsers.set(user.uid, user);
            }
        });
        
        console.log(`房間內在線用戶: ${this.connectedUsers.size} 人`);
        this.updateUserCount();
    }
    
    // 處理房間狀態更新
    handleRoomStatusUpdate(status) {
        if (status) {
            console.log('房間狀態:', status);
            
            // 如果是主機發出的停止同步指令
            if (status.action === 'stop_sync' && !this.isHost) {
                console.log('收到主機停止同步指令');
                this.stopFirebaseSync();
                this.status.textContent = '主機已停止同步，同步已中斷';
            }
        }
    }
    
    // 更新用戶數量顯示
    updateUserCount() {
        const userCount = this.connectedUsers.size;
        if (this.syncStatus) {
            const userCountElement = this.syncStatus.querySelector('.user-count');
            if (userCountElement) {
                userCountElement.textContent = `在線用戶: ${userCount} 人`;
            }
        }
    }
    
    // 同步計時器到 Firebase
    async syncTimersToFirebase() {
        if (!this.syncEnabled || !this.timersRef) return;
        
        try {
            const timersData = {};
            
            this.activeTimers.forEach((timer, timerId) => {
                // 只同步非同步計時器（避免循環同步）
                if (!timer.isSynced) {
                    timersData[timerId] = {
                        id: timerId,
                        chapter: timer.chapter,
                        boss: timer.boss,
                        server: timer.server,
                        totalSeconds: timer.totalSeconds,
                        remainingSeconds: timer.remainingSeconds,
                        isPaused: timer.isPaused,
                        startTime: timer.startTime,
                        pausedTime: timer.pausedTime,
                        lastUpdate: Date.now(),
                        syncedBy: this.user.uid
                    };
                }
            });
            
            if (Object.keys(timersData).length > 0) {
                // 使用 update 而不是 set，避免覆蓋現有計時器
                await this.timersRef.update(timersData);
                console.log('已同步計時器到 Firebase');
            }
            
        } catch (error) {
            console.error('同步計時器到 Firebase 失敗:', error);
        }
    }
    
    // 更新同步狀態顯示
    updateSyncStatus() {
        if (this.syncEnabled && this.roomId) {
            this.syncStatus.style.display = 'block';
            this.syncRole.textContent = this.isHost ? '主機' : '客戶端';
            this.roomIdElement.textContent = this.roomId;
            
            // 添加用戶數量顯示
            if (!this.syncStatus.querySelector('.user-count')) {
                const userCountElement = document.createElement('div');
                userCountElement.className = 'user-count';
                userCountElement.style.cssText = 'font-size: 0.8rem; margin-top: 0.5rem; opacity: 0.9;';
                this.syncStatus.appendChild(userCountElement);
            }
            
            // 只為主機添加停止同步按鈕
            if (this.isHost && !this.syncStatus.querySelector('.stop-sync-btn')) {
                const stopSyncBtn = document.createElement('button');
                stopSyncBtn.className = 'stop-sync-btn';
                stopSyncBtn.textContent = '停止同步';
                stopSyncBtn.style.cssText = `
                    margin-top: 10px;
                    background: linear-gradient(135deg, #e53e3e, #c53030);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                `;
                
                stopSyncBtn.addEventListener('click', () => {
                    this.stopFirebaseSync();
                    this.status.textContent = '同步已停止';
                });
                
                stopSyncBtn.addEventListener('mouseenter', () => {
                    stopSyncBtn.style.transform = 'translateY(-1px)';
                    stopSyncBtn.style.boxShadow = '0 4px 12px rgba(229, 62, 62, 0.4)';
                });
                
                stopSyncBtn.addEventListener('mouseleave', () => {
                    stopSyncBtn.style.transform = 'translateY(0)';
                    stopSyncBtn.style.boxShadow = 'none';
                });
                
                this.syncStatus.appendChild(stopSyncBtn);
            }
            
            this.updateUserCount();
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
    
    // 停止 Firebase 同步
    async stopFirebaseSync() {
        try {
            this.syncEnabled = false;
            
            // 如果是主機，通知所有客戶端停止同步
            if (this.isHost && this.roomRef) {
                await this.roomRef.child('status').set({
                    action: 'stop_sync',
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                    hostId: this.user.uid
                });
            }
            
            // 移除 Firebase 監聽器
            if (this.timersRef) {
                this.timersRef.off();
            }
            if (this.usersRef) {
                this.usersRef.off();
            }
            if (this.roomRef) {
                this.roomRef.off();
            }
            
            // 從房間中移除用戶
            if (this.usersRef && this.user) {
                await this.usersRef.child(this.user.uid).remove();
            }
            
            // 清除引用
            this.roomRef = null;
            this.timersRef = null;
            this.usersRef = null;
            this.roomId = null;
            this.isHost = false;
            this.connectedUsers.clear();
            
            // 移除客戶端中斷同步按鈕
            const clientStopBtn = document.getElementById('clientStopSyncBtn');
            if (clientStopBtn) {
                clientStopBtn.remove();
            }
            
            // 隱藏同步狀態指示器
            this.updateSyncStatus();
            
            console.log('Firebase 同步已停止');
            
        } catch (error) {
            console.error('停止 Firebase 同步失敗:', error);
        }
    }
    
    // 停止同步服務（向後兼容）
    stopSyncService() {
        this.stopFirebaseSync();
    }
    
    // 啟動基於GitHub Pages的同步系統
    startGitHubPagesSync() {
        if (this.syncEnabled || !this.roomId) return;
        
        this.syncEnabled = true;
        this.updateSyncStatus();
        
        console.log(`啟動GitHub Pages同步 - 房間: ${this.roomId}, 角色: ${this.isHost ? '主機' : '客戶端'}`);
        
        if (this.isHost) {
            // 主機：定期更新同步數據
            this.syncInterval = setInterval(() => {
                this.updateSyncData();
            }, 1000); // 每秒更新一次
        } else {
            // 客戶端：定期檢查同步數據
            this.syncCheckInterval = setInterval(() => {
                this.checkSyncData();
            }, 2000); // 每2秒檢查一次
        }
    }
    
    // 更新同步數據（主機）
    updateSyncData() {
        if (!this.syncEnabled || !this.isHost) return;
        
        try {
            // 只同步非同步計時器（避免重複同步）
            const nonSyncedTimers = Array.from(this.activeTimers.values()).filter(timer => !timer.isSynced);
            
            if (nonSyncedTimers.length === 0) return;
            
            const syncData = {
                roomId: this.roomId,
                timers: nonSyncedTimers.map(timer => ({
                    id: timer.id,
                    chapter: timer.chapter,
                    boss: timer.boss,
                    server: timer.server,
                    totalSeconds: timer.totalSeconds,
                    remainingSeconds: timer.remainingSeconds,
                    isPaused: timer.isPaused,
                    startTime: timer.startTime,
                    pausedTime: timer.pausedTime,
                    lastUpdate: Date.now()
                })),
                timestamp: Date.now()
            };
            
            // 存儲到localStorage
            localStorage.setItem(`${this.syncStorageKey}_${this.roomId}`, JSON.stringify(syncData));
            
            // 更新狀態
            this.status.textContent = `同步中... (${nonSyncedTimers.length} 個計時器)`;
            
            console.log(`主機同步數據: ${nonSyncedTimers.length} 個計時器`);
            
        } catch (error) {
            console.error('更新同步數據失敗:', error);
        }
    }
    
    // 檢查同步數據（客戶端）
    checkSyncData() {
        if (!this.syncEnabled || this.isHost) return;
        
        try {
            const syncDataStr = localStorage.getItem(`${this.syncStorageKey}_${this.roomId}`);
            if (!syncDataStr) return;
            
            const syncData = JSON.parse(syncDataStr);
            
            // 檢查數據是否過期（超過10秒）
            if (Date.now() - syncData.timestamp > 10000) {
                console.log('同步數據已過期');
                return;
            }
            
            // 更新計時器
            this.updateTimersFromSync(syncData.timers);
            
        } catch (error) {
            console.error('檢查同步數據失敗:', error);
        }
    }
    
    // 從同步數據更新計時器
    updateTimersFromSync(timersData) {
        if (!timersData || timersData.length === 0) {
            console.log('沒有計時器數據需要同步');
            return;
        }
        
        console.log('開始同步計時器:', timersData);
        
        // 清除現有計時器
        this.clearAllTimers();
        
        // 載入同步的計時器
        let loadedCount = 0;
        timersData.forEach(timerData => {
            try {
                this.loadSharedTimerFromSync(timerData);
                loadedCount++;
                console.log(`載入計時器 ${loadedCount}:`, timerData);
            } catch (error) {
                console.error('載入同步計時器失敗:', error, timerData);
            }
        });
        
        console.log(`同步完成: 載入 ${loadedCount}/${timersData.length} 個計時器`);
        console.log('當前計時器數量:', this.activeTimers.size);
        
        // 強制更新計時器列表顯示
        this.updateTimersList();
        
        this.status.textContent = `已同步 ${loadedCount} 個計時器`;
    }
    
    // 停止GitHub Pages同步
    stopGitHubPagesSync() {
        this.syncEnabled = false;
        
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        
        if (this.syncCheckInterval) {
            clearInterval(this.syncCheckInterval);
            this.syncCheckInterval = null;
        }
        
        // 清除同步數據
        if (this.roomId) {
            localStorage.removeItem(`${this.syncStorageKey}_${this.roomId}`);
        }
        
        this.roomId = null;
        this.isHost = false;
        this.updateSyncStatus();
        
        console.log('GitHub Pages同步已停止');
    }
    
    // 為客戶端添加中斷同步按鈕
    addClientStopSyncButton() {
        // 移除已存在的客戶端停止同步按鈕
        const existingClientBtn = document.getElementById('clientStopSyncBtn');
        if (existingClientBtn) {
            existingClientBtn.remove();
        }
        
        // 創建中斷同步按鈕
        const stopSyncBtn = document.createElement('button');
        stopSyncBtn.id = 'clientStopSyncBtn';
        stopSyncBtn.className = 'btn btn-stop-sync';
        stopSyncBtn.textContent = '中斷同步';
        stopSyncBtn.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            background: linear-gradient(135deg, #e53e3e, #c53030);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(229, 62, 62, 0.3);
            transition: all 0.3s ease;
        `;
        
        stopSyncBtn.addEventListener('click', () => {
            this.stopFirebaseSync();
            stopSyncBtn.remove();
            this.status.textContent = '同步已中斷，恢復到初始狀態';
            
            // 清除所有計時器
            this.clearAllTimers();
        });
        
        stopSyncBtn.addEventListener('mouseenter', () => {
            stopSyncBtn.style.transform = 'translateY(-2px)';
            stopSyncBtn.style.boxShadow = '0 6px 16px rgba(229, 62, 62, 0.4)';
        });
        
        stopSyncBtn.addEventListener('mouseleave', () => {
            stopSyncBtn.style.transform = 'translateY(0)';
            stopSyncBtn.style.boxShadow = '0 4px 12px rgba(229, 62, 62, 0.3)';
        });
        
        document.body.appendChild(stopSyncBtn);
    }
    
    // 添加調試信息
    addDebugInfo() {
        console.log('=== Boss Timer 調試信息 ===');
        console.log('當前URL:', window.location.href);
        console.log('Origin:', window.location.origin);
        console.log('Pathname:', window.location.pathname);
        console.log('Search:', window.location.search);
        console.log('User Agent:', navigator.userAgent);
        console.log('Protocol:', window.location.protocol);
        console.log('Host:', window.location.host);
        console.log('========================');
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
        bossTimer.stopFirebaseSync();
    }
});