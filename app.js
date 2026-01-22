document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    renderPlayers();
    initTabs();
    initTimer();
    initNightActions();
    initRestart();
    updateNightSelects();
}

let soundPlayed = false;
let votingList = [];

// --- TABS LOGIC ---
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            btn.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}

// --- PLAYERS LOGIC ---
const ROLES = [
    { value: 'citizen', label: 'Мирный', class: '' },
    { value: 'mafia', label: 'Мафия', class: 'mafia' },
    { value: 'don', label: 'Дон', class: 'don' },
    { value: 'sheriff', label: 'Шериф', class: 'sheriff' },
    { value: 'doc', label: 'Доктор', class: 'doc' }
];

function renderPlayers() {
    const list = document.getElementById('players-list');
    list.innerHTML = '';

    for (let i = 1; i <= 10; i++) {
        const card = document.createElement('div');
        card.className = 'player-card';
        card.id = `player-card-${i}`;
        
        card.innerHTML = `
            <div class="player-header">
                <div class="player-number">${i}</div>
                <div class="player-name">
                    <input type="text" class="player-input" id="p-name-${i}" 
                           placeholder="Игрок ${i}" oninput="updateNightSelects()">
                </div>
            </div>
            
            <div class="player-details">
                <select class="role-select" id="role-${i}" onchange="updateRoleColor(this)">
                    ${ROLES.map(r => `<option value="${r.value}" class="${r.class}">${r.label}</option>`).join('')}
                </select>
                
                <div class="player-controls">
                    <div class="fouls-section">
                        <div class="section-label">Фолы</div>
                        <div class="dots-container">
                            <div class="foul-dot" onclick="toggleDot(this)"></div>
                            <div class="foul-dot" onclick="toggleDot(this)"></div>
                            <div class="foul-dot" onclick="toggleDot(this)"></div>
                            <div class="foul-dot" onclick="toggleDot(this)"></div>
                        </div>
                    </div>
                    
                    <div class="preds-section">
                        <div class="section-label">Преды</div>
                        <div class="dots-container">
                            <div class="pred-dot" onclick="toggleDot(this)"></div>
                            <div class="pred-dot" onclick="toggleDot(this)"></div>
                        </div>
                    </div>
                    
                    <div class="lift-controls">
                        <button class="lift-btn" onclick="toggleLift(${i})" title="Убить">
                            <i class="fas fa-skull"></i>
                        </button>
                        <button class="revive-btn" onclick="revivePlayer(${i})" 
                                style="display:none;" title="Воскресить">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        list.appendChild(card);
    }

    document.getElementById('btn-shuffle').addEventListener('click', shuffleRoles);
}

window.revivePlayer = function(index) {
    if (confirm(`Вернуть игрока ${index} в игру?`)) {
        const card = document.getElementById(`player-card-${index}`);
        if (card) {
            card.classList.remove('dead');
            card.querySelectorAll('input, select, .foul-dot, .pred-dot').forEach(el => {
                el.style.pointerEvents = 'auto';
                el.style.opacity = '1';
            });
            const liftBtn = card.querySelector('.lift-btn');
            const reviveBtn = card.querySelector('.revive-btn');
            if (liftBtn) liftBtn.style.display = 'flex';
            if (reviveBtn) reviveBtn.style.display = 'none';
            updateNightSelects();
            checkWinCondition();
        }
    }
};

window.toggleDot = function(dot) {
    dot.classList.toggle('active');
};

window.toggleLift = function(index) {
    const playerName = document.getElementById(`p-name-${index}`).value || `Игрок ${index}`;
    if (confirm(`Убить игрока "${playerName}"?`)) {
        const card = document.getElementById(`player-card-${index}`);
        if (card) {
            card.classList.add('dead');
            card.querySelectorAll('input, select, .foul-dot, .pred-dot').forEach(el => {
                el.style.pointerEvents = 'none';
                el.style.opacity = '0.5';
            });
            const liftBtn = card.querySelector('.lift-btn');
            const reviveBtn = card.querySelector('.revive-btn');
            if (liftBtn) liftBtn.style.display = 'none';
            if (reviveBtn) reviveBtn.style.display = 'flex';
            updateNightSelects();
            checkWinCondition();
        }
    }
};

function updateRoleColor(select) {
    // Reset all classes
    select.className = 'role-select';
    
    // Add the class based on selected option
    const selectedOption = select.options[select.selectedIndex];
    if (selectedOption.className) {
        select.classList.add(selectedOption.className);
    }
}

function shuffleRoles() {
    let deck = ['don', 'mafia', 'mafia', 'sheriff', 'doc', 'citizen', 'citizen', 'citizen', 'citizen', 'citizen'];
    
    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    // Apply shuffled roles
    for (let i = 1; i <= 10; i++) {
        const select = document.getElementById(`role-${i}`);
        if (select) {
            select.value = deck[i-1] || 'citizen';
            updateRoleColor(select);
        }
    }
    
    // Show notification
    showNotification('Роли перемешаны!');
}

// --- VOTING LOGIC ---
window.toggleCandidate = function(num) {
    const index = votingList.indexOf(num);
    const btn = document.querySelector(`.vote-num-btn:nth-child(${num})`);
    
    if (index === -1) {
        votingList.push(num);
        if (btn) btn.classList.add('selected');
    } else {
        votingList.splice(index, 1);
        if (btn) btn.classList.remove('selected');
    }
    updateVotingDisplay();
};

window.clearVoting = function() {
    if (votingList.length > 0 && confirm('Очистить список голосования?')) {
        votingList = [];
        document.querySelectorAll('.vote-num-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        updateVotingDisplay();
    }
};

function updateVotingDisplay() {
    const display = document.getElementById('voting-order-display');
    
    if (votingList.length === 0) {
        display.innerHTML = '<span class="hint">Нажмите на номера игроков ниже</span>';
        return;
    }
    
    display.innerHTML = '';
    votingList.forEach((num, index) => {
        const chip = document.createElement('div');
        chip.className = 'vote-chip';
        chip.innerHTML = `
            <span>${num}</span>
            <button class="remove-chip" onclick="removeCandidate(${num})">
                <i class="fas fa-times"></i>
            </button>
        `;
        display.appendChild(chip);
    });
}

window.removeCandidate = function(num) {
    const index = votingList.indexOf(num);
    if (index > -1) {
        votingList.splice(index, 1);
        const btn = document.querySelector(`.vote-num-btn:nth-child(${num})`);
        if (btn) btn.classList.remove('selected');
        updateVotingDisplay();
    }
};

// --- NIGHT PHASE LOGIC ---
function updateNightSelects() {
    const selectIds = ['action-mafia', 'action-don', 'action-sheriff', 'action-doc'];
    
    selectIds.forEach(id => {
        const select = document.getElementById(id);
        const currentVal = select.value;
        
        select.innerHTML = '<option value="">- Выберите игрока -</option>';
        
        for (let i = 1; i <= 10; i++) {
            const card = document.getElementById(`player-card-${i}`);
            const isDead = card && card.classList.contains('dead');
            const name = document.getElementById(`p-name-${i}`).value || `Игрок ${i}`;
            
            // Don't add dead players to the dropdown
            if (!isDead) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = `${i}. ${name}`;
                select.appendChild(option);
            }
        }
        
        // Restore previous selection if player is still alive
        if (currentVal) {
            const playerCard = document.getElementById(`player-card-${currentVal}`);
            if (playerCard && !playerCard.classList.contains('dead')) {
                select.value = currentVal;
            }
        }
    });
}

function initNightActions() {
    document.getElementById('btn-process-night').addEventListener('click', processNight);
}

function processNight() {
    const mafTarget = document.getElementById('action-mafia').value;
    const donTarget = document.getElementById('action-don').value;
    const sherTarget = document.getElementById('action-sheriff').value;
    const docTarget = document.getElementById('action-doc').value;
    
    const resultDiv = document.getElementById('night-result');
    const resultText = resultDiv.querySelector('.result-text');
    
    let logs = [];
    
    // Clear previous result
    resultText.innerHTML = '';
    
    // Process doctor first (he acts before mafia)
    if (docTarget) {
        logs.push(`💊 Доктор лечил игрока ${docTarget}`);
    }
    
    // Process mafia kill
    if (mafTarget) {
        if (mafTarget === docTarget) {
            logs.push(`🔫 Мафия стреляла в ${mafTarget}, но 💊 Доктор спас!`);
        } else {
            logs.push(`💀 Игрок ${mafTarget} убит мафией`);
            killPlayer(mafTarget);
        }
    }
    
    // Process other actions
    if (donTarget) {
        logs.push(`👑 Дон проверил игрока ${donTarget}`);
    }
    
    if (sherTarget) {
        logs.push(`⭐ Шериф проверил игрока ${sherTarget}`);
    }
    
    // Display results
    if (logs.length === 0) {
        resultText.textContent = 'Ночью ничего не произошло';
    } else {
        resultText.innerHTML = logs.join('<br>');
    }
    
    // Add to game notes
    const timestamp = new Date().toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    const mainNotes = document.getElementById('game-notes');
    mainNotes.value += `\n--- Ночь (${timestamp}) ---\n` + logs.join('\n') + '\n';
    mainNotes.scrollTop = mainNotes.scrollHeight;
    
    // Clear selections
    selectIds = ['action-mafia', 'action-don', 'action-sheriff', 'action-doc'];
    selectIds.forEach(id => {
        document.getElementById(id).value = '';
    });
    
    checkWinCondition();
}

function killPlayer(index) {
    const card = document.getElementById(`player-card-${index}`);
    if (card) {
        card.classList.add('dead');
        card.querySelectorAll('input, select, .foul-dot, .pred-dot').forEach(el => {
            el.style.pointerEvents = 'none';
            el.style.opacity = '0.5';
        });
        const liftBtn = card.querySelector('.lift-btn');
        const reviveBtn = card.querySelector('.revive-btn');
        if (liftBtn) liftBtn.style.display = 'none';
        if (reviveBtn) reviveBtn.style.display = 'flex';
    }
}

// --- TIMER LOGIC ---
let timerInterval;
let seconds = 60;
let isRunning = false;

function initTimer() {
    const display = document.getElementById('timer');
    const startBtn = document.getElementById('btn-start');
    const pauseBtn = document.getElementById('btn-pause');
    const resetBtn = document.getElementById('btn-reset');
    const set130Btn = document.getElementById('btn-set130');
    const timerBeep = document.getElementById('timer-beep');
    
    function updateDisplay() {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        display.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        // Visual warning for last 10 seconds
        if (seconds <= 10 && seconds > 0) {
            display.classList.add('danger');
            
            // Play sound for last 10 seconds (only once)
            if (!soundPlayed && isRunning && timerBeep) {
                try {
                    timerBeep.currentTime = 0;
                    timerBeep.play().catch(e => console.log("Audio play failed:", e));
                    soundPlayed = true;
                } catch (e) {
                    console.log("Audio error:", e);
                }
            }
        } else {
            display.classList.remove('danger');
            if (seconds > 10) soundPlayed = false;
        }
        
        // Timer ended
        if (seconds === 0) {
            display.textContent = "00:00";
            soundPlayed = false;
            showNotification('Время вышло!');
        }
    }
    
    startBtn.addEventListener('click', () => {
        if (!isRunning && seconds > 0) {
            isRunning = true;
            timerInterval = setInterval(() => {
                if (seconds > 0) {
                    seconds--;
                    updateDisplay();
                } else {
                    isRunning = false;
                    clearInterval(timerInterval);
                }
            }, 1000);
        }
    });
    
    pauseBtn.addEventListener('click', () => {
        if (isRunning) {
            isRunning = false;
            clearInterval(timerInterval);
        }
    });
    
    resetBtn.addEventListener('click', () => {
        isRunning = false;
        clearInterval(timerInterval);
        seconds = 60;
        soundPlayed = false;
        updateDisplay();
    });
    
    set130Btn.addEventListener('click', () => {
        isRunning = false;
        clearInterval(timerInterval);
        seconds = 90;
        soundPlayed = false;
        updateDisplay();
    });
    
    updateDisplay();
}

// --- NOTES LOGIC ---
window.addNote = function(note) {
    const textarea = document.getElementById('game-notes');
    const timestamp = new Date().toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    textarea.value += `[${timestamp}] ${note}\n`;
    textarea.scrollTop = textarea.scrollHeight;
    
    showNotification('Заметка добавлена');
};

window.clearNotes = function() {
    if (confirm('Очистить все заметки?')) {
        document.getElementById('game-notes').value = '';
        showNotification('Заметки очищены');
    }
};

// --- RESTART LOGIC ---
function initRestart() {
    document.getElementById('btn-restart-legacy').addEventListener('click', () => {
        if (confirm('Сбросить всю игру? Все данные будут потеряны.')) {
            location.reload();
        }
    });
}

// --- WIN CONDITION ---
function checkWinCondition() {
    let mafiaCount = 0;
    let civCount = 0;
    
    const cards = document.querySelectorAll('.player-card');
    cards.forEach(card => {
        if (card.classList.contains('dead')) return;
        
        const roleSelect = card.querySelector('.role-select');
        const role = roleSelect.value;
        
        if (role === 'mafia' || role === 'don') {
            mafiaCount++;
        } else {
            civCount++;
        }
    });
    
    // Check win conditions
    if (mafiaCount === 0 && civCount > 0) {
        setTimeout(() => {
            showNotification('🏆 ПОБЕДА МИРНЫХ! Мафия уничтожена.', true);
        }, 500);
    } else if (mafiaCount >= civCount) {
        setTimeout(() => {
            showNotification(`💀 ПОБЕДА МАФИИ! (Мафия: ${mafiaCount} vs Мирные: ${civCount})`, true);
        }, 500);
    }
}

// --- HELPER FUNCTIONS ---
function showNotification(message, isImportant = false) {
    // Remove existing notification
    const existing = document.getElementById('notification');
    if (existing) existing.remove();
    
    // Create notification
    const notification = document.createElement('div');
    notification.id = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${isImportant ? 'var(--accent-red)' : 'var(--accent-blue)'};
        color: white;
        padding: 12px 20px;
        border-radius: 10px;
        z-index: 10000;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideDown 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { top: -100px; opacity: 0; }
        to { top: 20px; opacity: 1; }
    }
    @keyframes slideUp {
        from { top: 20px; opacity: 1; }
        to { top: -100px; opacity: 0; }
    }
`;
document.head.appendChild(style);