// 王重生時間記錄系統
class BossTimer {
    constructor() {
        this.bossRecords = JSON.parse(localStorage.getItem('bossRecords')) || [];
        this.timers = new Map();
        this.sortBy = 'time-asc';
        this.filterBy = 'all';
        this.isGrouped = false;
        
        // 地圖數據
        this.mapData = {
            'EP1': [
                '夏奧雷伊西邊森林',
                '夏奧雷伊東邊森林', 
                '蓮帕拉沙池塘',
                '夏奧雷伊礦山村莊',
                '水晶礦山'
            ],
            'EP2': [
                '斯拉屋塔斯峽谷',
                '凱利高原',
                '奈普里塔斯懸崖',
                '泰內花園',
                '泰內聖堂地下1層',
                '泰內聖堂上1層',
                '泰內聖堂上2層'
            ],
            'EP3': ['待更新'],
            'EP4': ['待更新'],
            'EP5': ['待更新'],
            'EP6': ['待更新'],
            'EP7': ['待更新'],
            'EP8': ['待更新'],
            'EP9': ['待更新'],
            'EP10': ['待更新']
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderTable();
        this.startAllTimers();
        // 初始化地圖選項
        this.updateMapOptions('EP1');
    }

    setupEventListeners() {
        // 確認添加按鈕
        document.getElementById('confirmAddBtn').addEventListener('click', () => {
            this.addBossRecord();
        });

        // 取消添加按鈕
        document.getElementById('cancelAddBtn').addEventListener('click', () => {
            this.resetForm();
        });

        // 排序選擇器
        document.getElementById('sortBy').addEventListener('change', (e) => {
            this.sortBy = e.target.value;
            this.renderTable();
        });

        // 篩選選擇器
        document.getElementById('filterBy').addEventListener('change', (e) => {
            this.filterBy = e.target.value;
            this.renderTable();
        });

        // 章節選擇器 - 動態更新地圖選項
        document.getElementById('ep').addEventListener('change', (e) => {
            this.updateMapOptions(e.target.value);
        });

        // 分組切換按鈕
        document.getElementById('groupToggle').addEventListener('click', () => {
            this.isGrouped = !this.isGrouped;
            const btn = document.getElementById('groupToggle');
            if (this.isGrouped) {
                btn.classList.add('active');
                btn.innerHTML = '<i class="bx bx-group"></i> 取消分組';
            } else {
                btn.classList.remove('active');
                btn.innerHTML = '<i class="bx bx-group"></i> 分組顯示';
            }
            this.renderTable();
        });

        // 現有的其他事件監聽器
        this.setupExistingListeners();
    }

    setupExistingListeners() {
        // 側邊欄切換
        const allSideMenu = document.querySelectorAll('#sidebar .side-menu.top li a');
        allSideMenu.forEach(item => {
            const li = item.parentElement;
            item.addEventListener('click', function () {
                allSideMenu.forEach(i => {
                    i.parentElement.classList.remove('active');
                })
                li.classList.add('active');
            })
        });

        // 側邊欄切換按鈕
        const menuBar = document.querySelector('#content nav .bx.bx-menu');
        const sidebar = document.getElementById('sidebar');

        if (menuBar && sidebar) {
            menuBar.addEventListener('click', function () {
                sidebar.classList.toggle('hide');
            });
        }

        // 響應式側邊欄
        function adjustSidebar() {
            if (window.innerWidth <= 576) {
                sidebar.classList.add('hide');
                sidebar.classList.remove('show');
            } else {
                sidebar.classList.remove('hide');
                sidebar.classList.add('show');
            }
        }

        window.addEventListener('load', adjustSidebar);
        window.addEventListener('resize', adjustSidebar);

        // 搜尋按鈕
        const searchButton = document.querySelector('#content nav form .form-input button');
        const searchButtonIcon = document.querySelector('#content nav form .form-input button .bx');
        const searchForm = document.querySelector('#content nav form');

        if (searchButton && searchForm) {
            searchButton.addEventListener('click', function (e) {
                if (window.innerWidth < 768) {
                    e.preventDefault();
                    searchForm.classList.toggle('show');
                    if (searchForm.classList.contains('show')) {
                        searchButtonIcon.classList.replace('bx-search', 'bx-x');
                    } else {
                        searchButtonIcon.classList.replace('bx-x', 'bx-search');
                    }
                }
            })
        }

        // 深色模式切換
        const switchMode = document.getElementById('switch-mode');
        if (switchMode) {
            switchMode.addEventListener('change', function () {
                if (this.checked) {
                    document.body.classList.add('dark');
                } else {
                    document.body.classList.remove('dark');
                }
            })
        }

        // 通知和個人資料選單
        const notification = document.querySelector('.notification');
        const profile = document.querySelector('.profile');
        
        if (notification) {
            notification.addEventListener('click', function () {
                document.querySelector('.notification-menu').classList.toggle('show');
                document.querySelector('.profile-menu').classList.remove('show');
            });
        }

        if (profile) {
            profile.addEventListener('click', function () {
                document.querySelector('.profile-menu').classList.toggle('show');
                document.querySelector('.notification-menu').classList.remove('show');
            });
        }

        // 點擊外部關閉選單
        window.addEventListener('click', function (e) {
            if (!e.target.closest('.notification') && !e.target.closest('.profile')) {
                document.querySelector('.notification-menu').classList.remove('show');
                document.querySelector('.profile-menu').classList.remove('show');
            }
        });
    }


    resetForm() {
        document.getElementById('bossHours').value = '0';
        document.getElementById('bossMinutes').value = '0';
        document.getElementById('bossSeconds').value = '0';
    }

    updateMapOptions(selectedEp) {
        const mapSelect = document.getElementById('map');
        mapSelect.innerHTML = '';
        
        const maps = this.mapData[selectedEp] || [];
        maps.forEach(mapName => {
            const option = document.createElement('option');
            option.value = mapName;
            option.textContent = mapName;
            option.setAttribute('data-ep', selectedEp);
            mapSelect.appendChild(option);
        });
    }

    addBossRecord() {
        const ep = document.getElementById('ep').value;
        const map = document.getElementById('map').value;
        const channel = document.getElementById('分流').value;
        const hours = parseInt(document.getElementById('bossHours').value) || 0;
        const minutes = parseInt(document.getElementById('bossMinutes').value) || 0;
        const seconds = parseInt(document.getElementById('bossSeconds').value) || 0;

        if (hours === 0 && minutes === 0 && seconds === 0) {
            alert('請輸入有效的重生時間！');
            return;
        }

        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        const record = {
            id: Date.now(),
            ep: ep,
            map: map,
            channel: channel,
            totalSeconds: totalSeconds,
            remainingSeconds: totalSeconds,
            createdAt: new Date().toISOString()
        };

        this.bossRecords.push(record);
        this.saveToLocalStorage();
        this.renderTable();
        this.startTimer(record.id);
        this.resetForm();
    }

    deleteBossRecord(id) {
        if (confirm('確定要刪除這條記錄嗎？')) {
            this.bossRecords = this.bossRecords.filter(record => record.id !== id);
            this.clearTimer(id);
            this.saveToLocalStorage();
            this.renderTable();
        }
    }

    filterRecords(records) {
        if (this.filterBy === 'all') {
            return records;
        }
        return records.filter(record => record.ep === this.filterBy);
    }

    sortRecords(records) {
        const sorted = [...records];
        
        switch (this.sortBy) {
            case 'time-asc':
                return sorted.sort((a, b) => a.remainingSeconds - b.remainingSeconds);
            case 'time-desc':
                return sorted.sort((a, b) => b.remainingSeconds - a.remainingSeconds);
            case 'ep-asc':
                return sorted.sort((a, b) => {
                    const aNum = parseInt(a.ep.replace('EP', ''));
                    const bNum = parseInt(b.ep.replace('EP', ''));
                    return aNum - bNum;
                });
            case 'ep-desc':
                return sorted.sort((a, b) => {
                    const aNum = parseInt(a.ep.replace('EP', ''));
                    const bNum = parseInt(b.ep.replace('EP', ''));
                    return bNum - aNum;
                });
            default:
                return sorted;
        }
    }

    groupRecords(records) {
        const groups = {};
        
        records.forEach(record => {
            const key = `${record.ep}-${record.map}`;
            if (!groups[key]) {
                groups[key] = {
                    ep: record.ep,
                    map: record.map,
                    records: []
                };
            }
            groups[key].records.push(record);
        });
        
        return groups;
    }

    renderTable() {
        const mainTable = document.getElementById('mainTable');
        const groupedContainer = document.getElementById('groupedContainer');
        const tbody = document.getElementById('bossTableBody');
        
        // 清空內容
        tbody.innerHTML = '';
        groupedContainer.innerHTML = '';

        if (this.bossRecords.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--dark-grey);">暫無記錄</td></tr>';
            mainTable.style.display = 'table';
            groupedContainer.style.display = 'none';
            return;
        }

        // 先篩選，再排序
        const filteredRecords = this.filterRecords(this.bossRecords);
        const sortedRecords = this.sortRecords(filteredRecords);

        if (this.isGrouped) {
            this.renderGroupedTable(groupedContainer, sortedRecords);
            mainTable.style.display = 'none';
            groupedContainer.style.display = 'block';
        } else {
            this.renderNormalTable(tbody, sortedRecords);
            mainTable.style.display = 'table';
            groupedContainer.style.display = 'none';
        }
    }

    renderNormalTable(tbody, records) {
        records.forEach(record => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${record.ep}</td>
                <td>${record.map}</td>
                <td>${record.channel}</td>
                <td class="countdown" id="countdown-${record.id}">${this.formatTime(record.remainingSeconds)}</td>
                <td>
                    <button class="delete-btn" onclick="bossTimer.deleteBossRecord(${record.id})">
                        <i class='bx bx-trash'></i> 刪除
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    renderGroupedTable(container, records) {
        const groups = this.groupRecords(records);
        
        Object.values(groups).forEach(group => {
            // 創建分組標題
            const groupSection = document.createElement('div');
            groupSection.className = 'grouped-section';
            
            const groupHeader = document.createElement('div');
            groupHeader.className = 'group-header';
            groupHeader.innerHTML = `
                <i class='bx bxs-book-open'></i>
                <span>${group.ep} - ${group.map}</span>
                <span style="margin-left: auto; font-size: 14px;">${group.records.length} 個記錄</span>
            `;
            
            // 創建分組表格
            const table = document.createElement('table');
            table.className = 'grouped-table';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>地圖名稱</th>
                        <th>分流</th>
                        <th>倒數計時</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody id="group-${group.ep}-${group.map}">
                </tbody>
            `;
            
            groupSection.appendChild(groupHeader);
            groupSection.appendChild(table);
            container.appendChild(groupSection);
            
            // 添加記錄到分組表格
            const groupTbody = groupSection.querySelector('tbody');
            group.records.forEach(record => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${record.map}</td>
                    <td>${record.channel}</td>
                    <td class="countdown" id="countdown-${record.id}">${this.formatTime(record.remainingSeconds)}</td>
                    <td>
                        <button class="delete-btn" onclick="bossTimer.deleteBossRecord(${record.id})">
                            <i class='bx bx-trash'></i> 刪除
                        </button>
                    </td>
                `;
                groupTbody.appendChild(row);
            });
        });
    }

    startAllTimers() {
        this.bossRecords.forEach(record => {
            this.startTimer(record.id);
        });
    }

    startTimer(id) {
        this.clearTimer(id);
        
        const timer = setInterval(() => {
            const record = this.bossRecords.find(r => r.id === id);
            if (!record) {
                this.clearTimer(id);
                return;
            }

            record.remainingSeconds--;
            
            if (record.remainingSeconds <= 0) {
                record.remainingSeconds = 0;
                this.clearTimer(id);
                this.showNotification(record);
            }

            this.updateCountdownDisplay(id, record.remainingSeconds);
            this.saveToLocalStorage();
        }, 1000);

        this.timers.set(id, timer);
    }

    clearTimer(id) {
        if (this.timers.has(id)) {
            clearInterval(this.timers.get(id));
            this.timers.delete(id);
        }
    }

    updateCountdownDisplay(id, remainingSeconds) {
        const element = document.getElementById(`countdown-${id}`);
        if (element) {
            element.textContent = this.formatTime(remainingSeconds);
            
            // 根據剩餘時間改變顏色
            element.className = 'countdown';
            if (remainingSeconds <= 60) {
                element.classList.add('danger');
            } else if (remainingSeconds <= 300) { // 5分鐘
                element.classList.add('warning');
            }
        }
    }

    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    showNotification(record) {
        // 創建通知元素
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--blue);
            color: var(--light);
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-weight: 600;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = `王重生時間到！${record.ep} - ${record.map} - ${record.channel}`;
        
        document.body.appendChild(notification);
        
        // 3秒後自動移除
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    saveToLocalStorage() {
        localStorage.setItem('bossRecords', JSON.stringify(this.bossRecords));
    }
}

// 添加CSS動畫
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// 初始化王重生計時器
const bossTimer = new BossTimer();