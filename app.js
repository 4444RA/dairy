const workoutData = {
    phases: [
        { // PHASE 1: FOUNDATION (Days 1-10)
            upper: [
                { name: "Push-ups", target: "3 x Max" },
                { name: "Superman Hold", target: "3 x 30s" },
                { name: "Chair Dips", target: "3 x 12" },
                { name: "Mtn Climbers", target: "3 x 45s" }
            ],
            lower: [
                { name: "Air Squats", target: "3 x 20" },
                { name: "Reverse Lunges", target: "3 x 12/leg" },
                { name: "Glute Bridges", target: "3 x 20" },
                { name: "Plank Jacks", target: "3 x 45s" }
            ]
        },
        { // PHASE 2: THE GRIND (Days 11-20)
            upper: [
                { name: "Diamond Pushups", target: "3 x 10" },
                { name: "Pike Pushups", target: "3 x 8" },
                { name: "Incline Rows", target: "3 x 12" },
                { name: "Burpees", target: "3 x 10" }
            ],
            lower: [
                { name: "Bulgarian Squats", target: "3 x 10/leg" },
                { name: "Wall Sit", target: "3 x 60s" },
                { name: "Calf Raises", target: "3 x 25" },
                { name: "Jump Squats", target: "3 x 15" }
            ]
        },
        { // PHASE 3: SHRED (Days 21-30)
            upper: [
                { name: "Decline Pushups", target: "4 x 12" },
                { name: "Pseudo Planche Lean", target: "4 x 20s" },
                { name: "Plank to Pushup", target: "3 x 12" },
                { name: "Burpee + Pushup", target: "3 x 10" }
            ],
            lower: [
                { name: "Assisted Pistol Squat", target: "3 x 5/leg" },
                { name: "Cossack Squat", target: "3 x 12" },
                { name: "Single Leg Bridge", target: "3 x 15/leg" },
                { name: "Broad Jumps", target: "3 x 10" }
            ]
        }
    ],
    hiit: [
        { name: "Burpees", target: "45s" },
        { name: "High Knees", target: "45s" },
        { name: "Mountain Climbers", target: "45s" },
        { name: "Plank Jacks", target: "45s" },
        { name: "Rest", target: "60s" }
    ]
};

const grid = document.getElementById('grid');
const modal = document.getElementById('modal-overlay');
const exerciseList = document.getElementById('exercise-list');
const saveBtn = document.getElementById('save-btn');
const closeBtn = document.getElementById('close-btn');

let currentDay = null;
let progressData = JSON.parse(localStorage.getItem('janShredData')) || {};
let habitData = JSON.parse(localStorage.getItem('janHabitData')) || { water: false, steps: false, protein: false };

function getDayInfo(day) {
    const phaseIdx = Math.floor((day - 1) / 10);
    const weekDay = (day - 1) % 7;
    let type = "rest", label = "Active Recovery", icon = "🧘", list = [];

    if (weekDay === 0 || weekDay === 3) {
        type = "upper"; label = "Upper Body"; icon = "💪"; list = workoutData.phases[phaseIdx].upper;
    } else if (weekDay === 1 || weekDay === 5) {
        type = "lower"; label = "Lower Body"; icon = "🦵"; list = workoutData.phases[phaseIdx].lower;
    } else if (weekDay === 4) {
        type = "hiit"; label = "Full Body HIIT"; icon = "🔥"; list = workoutData.hiit;
    }

    return { type, label, icon, list, phase: phaseIdx + 1 };
}

function renderGrid() {
    grid.innerHTML = '';
    for (let i = 1; i <= 30; i++) {
        const info = getDayInfo(i);
        const card = document.createElement('div');
        card.className = `day-card ${progressData[i] ? 'completed' : ''}`;
        card.innerHTML = `
            <div style="font-size:0.6rem; color:var(--text-dim)">PHASE ${info.phase}</div>
            <div style="font-weight:bold; font-size:1.1rem; margin:4px 0">${info.icon} Day ${i}</div>
            <div style="font-size:0.65rem; color:var(--accent); font-weight:800">${info.label.toUpperCase()}</div>
        `;
        card.onclick = () => openModal(i);
        grid.appendChild(card);
    }
    updateStats();
}

function openModal(day) {
    currentDay = day;
    const info = getDayInfo(day);
    document.getElementById('modal-title').innerText = `Day ${day}: ${info.label}`;
    document.getElementById('modal-tag').innerText = `PHASE ${info.phase}`;
    document.getElementById('modal-desc').innerText = info.type === 'rest' ? "Focus on 30 mins of walking or light yoga." : "Perform all exercises. Rest 60s between sets.";
    
    // Find Last Time for comparison
    let lastData = null;
    for(let i = day - 1; i > 0; i--) {
        if(getDayInfo(i).type === info.type && progressData[i]) {
            lastData = progressData[i];
            break;
        }
    }

    exerciseList.innerHTML = '';
    const listToUse = info.type === "rest" ? [{name: "Walking/Yoga", target: "30m"}] : info.list;
    
    listToUse.forEach(ex => {
        const row = document.createElement('div');
        row.className = 'exercise-row';
        const lastVal = lastData ? (lastData[ex.name] || '-') : '-';
        row.innerHTML = `
            <span style="font-weight:bold">${ex.name}</span>
            <span style="color:var(--accent)">${ex.target}</span>
            <span style="color:var(--text-dim); text-align:center">${lastVal}</span>
            <input type="text" placeholder="Reps" data-key="${ex.name}" value="${progressData[day]?.[ex.name] || ''}">
        `;
        exerciseList.appendChild(row);
    });
    modal.classList.remove('hidden');
}

saveBtn.onclick = () => {
    const inputs = exerciseList.querySelectorAll('input');
    let dayResults = {};
    let hasValue = false;
    inputs.forEach(input => { 
        dayResults[input.dataset.key] = input.value; 
        if(input.value) hasValue = true;
    });

    if(hasValue) {
        if (!progressData[currentDay]) {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
        progressData[currentDay] = dayResults;
        localStorage.setItem('janShredData', JSON.stringify(progressData));
    }
    modal.classList.add('hidden');
    renderGrid();
};

function updateStats() {
    const done = Object.keys(progressData).length;
    document.getElementById('progress-percent').innerText = `${Math.round((done/30)*100)}%`;
    document.getElementById('progress-bar').style.width = `${(done/30)*100}%`;
    
    let totalReps = 0;
    Object.values(progressData).forEach(d => Object.values(d).forEach(v => {
        const n = parseInt(v); if(!isNaN(n)) totalReps += n;
    }));
    document.getElementById('total-reps').innerText = totalReps.toLocaleString();

    let streak = 0;
    for(let i = 1; i <= 30; i++) { if(progressData[i]) streak++; else break; }
    document.getElementById('streak-count').innerText = streak;
}

// Habit Logic
document.querySelectorAll('.habit-check').forEach(check => {
    const id = check.id.split('-')[1];
    check.checked = habitData[id];
    check.onchange = () => {
        habitData[id] = check.checked;
        localStorage.setItem('janHabitData', JSON.stringify(habitData));
    };
});

closeBtn.onclick = () => modal.classList.add('hidden');
document.getElementById('reset-btn').onclick = () => { if(confirm("Reset all 30 days?")) { localStorage.clear(); location.reload(); }};

renderGrid();
