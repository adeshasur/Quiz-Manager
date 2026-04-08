/**
 * IT Day Quiz Manager - Premium Renderer Logic
 */

// State Management
const state = {
    screen: 'registration',
    teams: [],
    matchups: [],
    currentMatchIndex: 0,
    currentMatch: null, 
    currentTurn: 0, 
    round: 1,
    scores: { t1: 0, t2: 0 },
    currentQuestion: null,
    isAnswered: false,
    timeLeft: 15,
    timerInterval: null
};

// Timer Logic
function startTimer() {
    clearInterval(state.timerInterval);
    state.timeLeft = 15;
    updateTimerUI();

    state.timerInterval = setInterval(() => {
        state.timeLeft--;
        updateTimerUI();

        if (state.timeLeft <= 0) {
            clearInterval(state.timerInterval);
            handleTimeUp();
        }
    }, 1000);
}

function updateTimerUI() {
    const text = document.getElementById('timer-text');
    const bar = document.getElementById('timer-bar');
    if(text) text.innerText = state.timeLeft + 's';
    
    // Circle math: 2*PI*r = 2*3.14*20 = 125.6
    const offset = 125.6 - (state.timeLeft / 15) * 125.6;
    if(bar) bar.style.strokeDashoffset = offset;
    
    // Pulsing danger color
    if (state.timeLeft <= 5 && text) {
        text.classList.add('text-red-500', 'animate-pulse');
        if(bar) bar.style.stroke = '#ef4444';
    } else if (text) {
        text.classList.remove('text-red-500', 'animate-pulse');
        if(bar) bar.style.stroke = 'white';
    }
}

function handleTimeUp() {
    state.isAnswered = true;
    // Show correct answer anyway
    const correct = state.currentQuestion.correct_answer;
    document.querySelectorAll('.answer-btn').forEach(b => {
        const opt = b.getAttribute('data-option');
        if (opt === correct) b.classList.add('correct');
        else b.classList.add('wrong');
    });
    document.getElementById('btn-next-turn').classList.remove('hidden');
}

const screens = {
    registration: document.getElementById('registration-screen'),
    matchups: document.getElementById('matchups-screen'),
    startMatch: document.getElementById('start-match-lobby'),
    quiz: document.getElementById('quiz-screen'),
    results: document.getElementById('results-screen')
};

const matchupsGrid = document.getElementById('matchups-grid');

// Lifecycle: Initialize Registration Inputs
function initRegistration() {
    const teamInputsContainer = document.getElementById('team-inputs');
    teamInputsContainer.innerHTML = '';
    for (let i = 1; i <= 10; i++) {
        const teamDiv = document.createElement('div');
        teamDiv.className = 'premium-card p-6 bg-white/5 border border-white/10 flex flex-col space-y-3';
        teamDiv.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <span class="mono text-[0.6rem] opacity-40 uppercase tracking-widest">SLOT_${i.toString().padStart(2, '0')}</span>
            </div>
            <input type="text" placeholder="TEAM NAME" id="t${i}-name" class="bg-transparent border-b border-white/20 px-0 py-2 text-xl font-black uppercase tracking-tighter focus:border-white focus:outline-none transition-all placeholder:text-white/10">
            <div class="grid grid-cols-2 gap-2 mt-2">
                <input type="text" placeholder="PILOT 01" id="t${i}-m1" class="bg-transparent border-none p-0 text-[0.65rem] mono uppercase opacity-40 focus:opacity-100 placeholder:text-white/20">
                <input type="text" placeholder="PILOT 02" id="t${i}-m2" class="bg-transparent border-none p-0 text-[0.65rem] mono uppercase opacity-40 focus:opacity-100 placeholder:text-white/20">
            </div>
        `;
        teamInputsContainer.appendChild(teamDiv);
    }
}

function showScreen(name) {
    Object.keys(screens).forEach(key => {
        if (key === name) {
            screens[key].classList.remove('hidden');
            screens[key].classList.add('screen-fade');
        } else {
            screens[key].classList.add('hidden');
            screens[key].classList.remove('screen-fade');
        }
    });

    // Update Header Status
    const statusVal = document.getElementById('current-match-display');
    if (name === 'registration') statusVal.innerText = 'INITIALIZING_REG';
    if (name === 'matchups') statusVal.innerText = 'BRACKET_CALC';
    if (name === 'quiz') statusVal.innerText = `BATTLE_ACTIVE_0${state.currentMatchIndex + 1}`;
    
    state.screen = name;
}

// Demo Data Loader
document.getElementById('btn-load-demo').addEventListener('click', () => {
    const demoTeams = [
        { name: "ANANDA COLLEGE", m1: "Amal Perera", m2: "Kamal Silva" },
        { name: "ROYAL COLLEGE", m1: "Sahan Gunawardena", m2: "Nimal Karunadhara" },
        { name: "NALANDA COLLEGE", m1: "Dilshan Perera", m2: "Amila Bandara" },
        { name: "VISAKHA VIDYALAYA", m1: "Nuwanthi Silva", m2: "Kasuni Mendis" },
        { name: "DHARMARAJA COLLEGE", m1: "Pasindu Jayasinghe", m2: "Shehan Kumara" },
        { name: "ST. THOMAS' COL", m1: "Malith Fernando", m2: "Ishara Peiris" },
        { name: "RICHMOND COLL", m1: "Kavindu Rathnayake", m2: "Ashan Wick" },
        { name: "MAHINDA COLL", m1: "Dhanushka Gamage", m2: "Gayashan Abey" },
        { name: "TRINITY COLL", m1: "Sunimal Herath", m2: "Prabath Jaya" },
        { name: "ST. PETER'S COL", m1: "Gihan de Silva", m2: "Heshan Wijer" }
    ];
    demoTeams.forEach((team, i) => {
        const nameInput = document.getElementById(`t${i+1}-name`);
        const m1Input = document.getElementById(`t${i+1}-m1`);
        const m2Input = document.getElementById(`t${i+1}-m2`);
        if(nameInput) nameInput.value = team.name;
        if(m1Input) m1Input.value = team.m1;
        if(m2Input) m2Input.value = team.m2;
    });
});

// Register & Generate
document.getElementById('btn-register').addEventListener('click', async () => {
    const teams = [];
    for (let i = 1; i <= 10; i++) {
        const teamName = document.getElementById(`t${i}-name`).value || `TEAM_${i}`;
        const member1 = document.getElementById(`t${i}-m1`).value || '';
        const member2 = document.getElementById(`t${i}-m2`).value || '';
        teams.push({ teamName, member1, member2 });
    }

    await window.api.registerTeams(teams);
    state.matchups = await window.api.getMatchups();
    renderMatchups();
    showScreen('matchups');
});

// Real-time Score Sync
async function syncScores() {
    if (state.currentMatch) {
        await window.api.updateScore(state.currentMatch.id, state.scores.t1, state.scores.t2);
    }
}

function renderMatchups() {
    matchupsGrid.innerHTML = '';
    state.matchups.forEach((match, idx) => {
        const isComplete = match.team1.score > 0 || match.team2.score > 0;
        const card = document.createElement('div');
        card.className = `premium-card p-10 flex flex-col items-center justify-center space-y-4 relative overflow-hidden ${isComplete ? 'opacity-40 grayscale' : 'bg-white/5'}`;
        card.innerHTML = `
            <div class="absolute top-2 left-2 mono text-[0.5rem] opacity-20">${(idx+1).toString().padStart(2, '0')} // ${isComplete ? 'COMPLETED' : 'PENDING'}</div>
            <div class="text-3xl font-black uppercase italic tracking-tighter">${match.team1.team_name}</div>
            <div class="flex items-center gap-4 text-xs mono opacity-40">
                <span>${match.team1.score} PTS</span>
                <div class="w-8 h-[1px] bg-white/20"></div>
                <span>${match.team2.score} PTS</span>
            </div>
            <div class="text-3xl font-black uppercase italic tracking-tighter text-zinc-500">${match.team2.team_name}</div>
        `;
        matchupsGrid.appendChild(card);
    });
}

// Proceed to first match
document.getElementById('btn-start-quiz').addEventListener('click', async () => {
    // Refresh matchups from DB to get the latest scores properly
    state.matchups = await window.api.getMatchups();
    prepNextAvailableMatch();
});

function prepNextAvailableMatch() {
    // Find the first match that isn't complete (or just use index if following strictly)
    if (state.currentMatchIndex >= state.matchups.length) {
        showScreen('registration');
        return;
    }
    state.currentMatch = state.matchups[state.currentMatchIndex];
    document.getElementById('current-match-t1').innerText = state.currentMatch.team1.team_name;
    document.getElementById('current-match-t2').innerText = state.currentMatch.team2.team_name;
    showScreen('startMatch');
}

document.getElementById('btn-begin-battle').addEventListener('click', () => {
    state.scores = { t1: 0, t2: 0 };
    state.currentTurn = 0; 
    state.round = 1;
    updateScoreboard();
    showScreen('quiz');
    loadNextQuestion();
});

function updateScoreboard() {
    document.getElementById('score-t1-name').innerText = state.currentMatch.team1.team_name;
    document.getElementById('score-t2-name').innerText = state.currentMatch.team2.team_name;
    document.getElementById('score-t1-val').innerText = state.scores.t1;
    document.getElementById('score-t2-val').innerText = state.scores.t2;
    
    // Highlight Active
    if (state.currentTurn === 0) {
        document.getElementById('score-t1-val').classList.remove('text-zinc-500');
        document.getElementById('score-t2-val').classList.add('text-zinc-500');
    } else {
        document.getElementById('score-t1-val').classList.add('text-zinc-500');
        document.getElementById('score-t2-val').classList.remove('text-zinc-500');
    }
}

async function loadNextQuestion() {
    state.isAnswered = false;
    document.getElementById('btn-next-turn').classList.add('hidden');
    
    const btns = document.querySelectorAll('.answer-btn');
    btns.forEach(btn => {
        btn.classList.remove('correct', 'wrong');
        btn.classList.add('border-white/10');
    });

    const currentTeam = state.currentTurn === 0 ? state.currentMatch.team1 : state.currentMatch.team2;
    document.getElementById('current-turn-name').innerText = currentTeam.team_name;
    updateScoreboard();
    
    const question = await window.api.getRandomQuestion();
    if (!question) {
        finishMatch();
        return;
    }
    
    state.currentQuestion = question;
    document.getElementById('question-text').innerText = question.question_text;
    document.getElementById('optA').innerText = question.option_a;
    document.getElementById('optB').innerText = question.option_b;
    document.getElementById('optC').innerText = question.option_c;
    document.getElementById('optD').innerText = question.option_d;

    startTimer();
}

document.querySelectorAll('.answer-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        if (state.isAnswered) return;
        state.isAnswered = true;
        clearInterval(state.timerInterval);
        
        const chosen = btn.getAttribute('data-option');
        const correct = state.currentQuestion.correct_answer;
        
        document.querySelectorAll('.answer-btn').forEach(b => {
             const opt = b.getAttribute('data-option');
             if (opt === correct) b.classList.add('correct');
             else if (opt === chosen) b.classList.add('wrong');
        });

        if (chosen === correct) {
            if (state.currentTurn === 0) state.scores.t1 += 10;
            else state.scores.t2 += 10;
            await syncScores();
        }

        document.getElementById('btn-next-turn').classList.remove('hidden');
    });
});

document.getElementById('btn-next-turn').addEventListener('click', () => {
    state.currentTurn = state.currentTurn === 0 ? 1 : 0;
    if (state.currentTurn === 0) state.round++;
    loadNextQuestion();
});

function finishMatch() {
    const r1 = state.scores.t1;
    const r2 = state.scores.t2;
    let win = ""; let total = "";
    
    if (r1 > r2) { win = state.currentMatch.team1.team_name; total = r1; }
    else if (r2 > r1) { win = state.currentMatch.team2.team_name; total = r2; }
    else { win = "DRAW"; total = `${r1}:${r2}`; }
    
    document.getElementById('winner-name').innerText = win;
    document.getElementById('final-score').innerText = total;
    showScreen('results');
}

document.getElementById('btn-return-home').addEventListener('click', async () => {
    state.currentMatchIndex++;
    state.matchups = await window.api.getMatchups(); // Refresh scores in bracket
    if (state.currentMatchIndex >= state.matchups.length) {
        showScreen('registration');
        state.currentMatchIndex = 0;
    } else {
        renderMatchups();
        showScreen('matchups');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    initRegistration();
    showScreen('registration');
});

// Fit matchups screen to available viewport to avoid scrolling
function fitMatchupsScreen() {
    const app = document.getElementById('app-container');
    const matchups = document.getElementById('matchups-screen');
    if (!app || !matchups) return;

    // Make sure the matchups screen is measurable (temporarily show if hidden)
    const wasHidden = matchups.classList.contains('hidden');
    if (wasHidden) matchups.classList.remove('hidden');

    // Reset transform for natural size measurement
    matchups.style.transform = 'none';
    matchups.style.transformOrigin = 'top center';

    const containerW = app.clientWidth;
    // Use available height inside window minus header area (~160px) and some padding
    const header = document.querySelector('header');
    const headerH = header ? header.getBoundingClientRect().height : 120;
    const availH = window.innerHeight - headerH - 40;

    const contentW = matchups.scrollWidth || matchups.getBoundingClientRect().width;
    const contentH = matchups.scrollHeight || matchups.getBoundingClientRect().height;

    const scaleX = containerW / contentW;
    const scaleY = availH / contentH;
    // Only scale down (never scale up beyond 1)
    const scale = Math.min(1, scaleX, scaleY);

    matchups.style.transform = `scale(${scale})`;
    // Center visually by using auto margins on the parent (matchups-screen is flex-centered)

    if (wasHidden) matchups.classList.add('hidden');
}

// Re-fit on resize and after rendering matchups
window.addEventListener('resize', () => {
    fitMatchupsScreen();
});

// Fit registration screen to available viewport to avoid any scrollbars
function fitRegistrationScreen() {
    const app = document.getElementById('app-container');
    const reg = document.getElementById('registration-screen');
    if (!app || !reg) return;

    const wasHidden = matchups.classList.contains('hidden');
    if (wasHidden) matchups.classList.remove('hidden');

    // Reset transform for natural size measurement
    matchups.style.transform = 'none';
    matchups.style.transformOrigin = 'top center';

    const containerW = app.clientWidth;
    // Use available height inside window minus header area and some padding
    const header = document.querySelector('header');
    const headerH = header ? header.getBoundingClientRect().height : 120;
    const availH = window.innerHeight - headerH - 40;

    const contentW = matchups.scrollWidth || matchups.getBoundingClientRect().width;
    const contentH = matchups.scrollHeight || matchups.getBoundingClientRect().height;

    const scaleX = contentW > 0 ? containerW / contentW : 1;
    const scaleY = contentH > 0 ? availH / contentH : 1;
    // Only scale down (never scale up beyond 1)
    const scale = Math.min(1, scaleX, scaleY);

    matchups.style.transform = `scale(${scale})`;

    if (wasHidden) matchups.classList.add('hidden');
    fitRegistrationScreen();
});

// Call fit after matchups are rendered
const originalRenderMatchups = renderMatchups;
renderMatchups = function() {
    originalRenderMatchups();
    // Small timeout to allow DOM to lay out
    setTimeout(fitMatchupsScreen, 50);
}
// Match Status Persistence
// Real-time Scoring
// Demo Data Loader
// Bug Fix: Sync
// Bug Fix: Bracket
// Polish: Spacing
// Polish: Transitions
// Final Documentation
// Final Optimization
// Final Style
// Project Finalized
// Commit 24: Final Polish
// Commit 25: Ready for IT Day
