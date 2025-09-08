class BossTimer {
    constructor() {
        this.activeTimers = new Map();
        this.timerIdCounter = 0;
        
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
        this.shareUrlContainer = document.getElementById('shareUrlContainer');
        this.importContainer = document.getElementById('importContainer');
        this.shareUrl = document.getElementById('shareUrl');
        this.importUrl = document.getElementById('importUrl');
        this.copyBtn = document.getElementById('copyBtn');
        this.loadBtn = document.getElementById('loadBtn');
        
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
        this.shareBtn.addEventListener('click', () => this.generateShareLink());
        this.importBtn.addEventListener('click', () => this.toggleImportContainer());
        this.copyBtn.addEventListener('click', () => this.copyShareLink());
        this.loadBtn.addEventListener('click', () => this.loadFromShareLink());
        
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
    generateShareLink() {
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
            
            // 編碼數據
            const encodedData = this.encodeTimersData(timersData);
            
            // 生成分享連結
            const baseUrl = window.location.origin + window.location.pathname;
            const shareUrl = `${baseUrl}?share=${encodedData}`;
            
            // 顯示分享連結
            this.shareUrl.value = shareUrl;
            this.shareUrlContainer.style.display = 'block';
            this.importContainer.style.display = 'none';
            
            this.status.textContent = `已生成分享連結，包含 ${timersData.length} 個計時器`;
            
        } catch (error) {
            console.error('生成分享連結失敗:', error);
            this.status.textContent = '生成分享連結失敗，請重試';
        }
    }
    
    toggleImportContainer() {
        const isVisible = this.importContainer.style.display !== 'none';
        this.importContainer.style.display = isVisible ? 'none' : 'block';
        this.shareUrlContainer.style.display = 'none';
        
        if (!isVisible) {
            this.importUrl.focus();
        }
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
        const shareUrl = this.importUrl.value.trim();
        
        if (!shareUrl) {
            this.status.textContent = '請輸入分享連結';
            return;
        }
        
        try {
            // 從URL中提取分享數據
            const url = new URL(shareUrl);
            const shareData = url.searchParams.get('share');
            
            if (!shareData) {
                this.status.textContent = '無效的分享連結';
                return;
            }
            
            // 解碼數據
            const timersData = this.decodeTimersData(shareData);
            
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
            this.importContainer.style.display = 'none';
            this.importUrl.value = '';
            
        } catch (error) {
            console.error('載入分享連結失敗:', error);
            this.status.textContent = '載入分享連結失敗，請檢查連結是否正確';
        }
    }
    
    checkForShareLink() {
        const urlParams = new URLSearchParams(window.location.search);
        const shareData = urlParams.get('share');
        
        if (shareData) {
            try {
                const timersData = this.decodeTimersData(shareData);
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
            const jsonString = JSON.stringify(timersData);
            return btoa(encodeURIComponent(jsonString));
        } catch (error) {
            throw new Error('編碼數據失敗');
        }
    }
    
    decodeTimersData(encodedData) {
        try {
            const jsonString = decodeURIComponent(atob(encodedData));
            return JSON.parse(jsonString);
        } catch (error) {
            throw new Error('解碼數據失敗');
        }
    }
}

// 全域變數，供 HTML 中的 onclick 使用
let bossTimer;

// 當頁面載入完成時初始化計時器
document.addEventListener('DOMContentLoaded', () => {
    bossTimer = new BossTimer();
});