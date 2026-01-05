const workoutData = {
    phases: [
        { // PHASE 1
            upper: [{ name: "Push-ups", target: "3 x Max" }, { name: "Superman Hold", target: "3 x 30s" }, { name: "Chair Dips", target: "3 x 12" }, { name: "Mtn Climbers", target: "3 x 45s" }],
            lower: [{ name: "Air Squats", target: "3 x 20" }, { name: "Reverse Lunges", target: "3 x 12/leg" }, { name: "Glute Bridges", target: "3 x 20" }, { name: "Plank Jacks", target: "3 x 45s" }]
        },
        { // PHASE 2
            upper: [{ name: "Diamond Pushups", target: "3 x 10" }, { name: "Pike Pushups", target: "3 x 8" }, { name: "Incline Rows", target: "3 x 12" }, { name: "Burpees", target: "3 x 10" }],
            lower: [{ name: "Bulgarian Squats", target: "3 x 10/leg" }, { name: "Wall Sit", target: "3 x 60s" }, { name: "Calf Raises", target: "3 x 25" }, { name: "Jump Squats", target: "3 x 15" }]
        },
        { // PHASE 3
            upper: [{ name: "Decline Pushups", target: "4 x 12" }, { name: "Pseudo Planche Lean", target: "4 x 20s" }, { name: "Plank to Pushup", target: "3 x 12" }, { name: "Burpee + Pushup", target: "3 x 10" }],
            lower: [{ name: "Assisted Pistol Squat", target: "3 x 5/leg" }, { name: "Cossack Squat", target: "3 x 12" }, { name: "Single Leg Bridge", target: "3 x 15/leg" }, { name: "Broad Jumps", target: "3 x 10" }]
        }
    ],
    hiit: [
        { name: "Burpees", target: "45s" }, { name: "High Knees", target: "45s" }, { name: "Mountain Climbers", target: "45s" }, { name: "Plank Jacks", target: "45s" }, { name: "Rest", target: "60s" }
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

// --- DRAG AND DROP STATE ---
let draggedItemIndex = null;
// Initialize schedule from local storage or generate default
let userSchedule = JSON.parse(localStorage.getItem('janShredSchedule')) || generateDefaultSchedule();

function generateDefaultSchedule() {
    const schedule = [];
    for (let i = 1; i <= 30; i++) {
        const weekDay = (i - 1) % 7;
        let type = "rest";
        if (weekDay === 0 || weekDay === 3) type = "upper";
        else if (weekDay === 1 || weekDay === 5) type = "lower";
        else if (weekDay === 4) type = "hiit";
        schedule.push(type);
    }
    return schedule;
}

function getDayInfo(dayIndex) {
    const dayNum = dayIndex + 1;
    const phaseIdx = Math.floor(dayIndex / 10);
    const type = userSchedule[dayIndex];
    
    let label = "Active Recovery", icon = "🧘", list = [];
    if (type === "upper") { label = "Upper Body"; icon = "💪"; list = workoutData.phases[phaseIdx].upper; }
    else if (type === "lower") { label = "Lower Body"; icon = "🦵"; list = workoutData.phases[phaseIdx].lower; }
    else if (type === "hiit") { label = "Full Body HIIT"; icon = "🔥"; list = workoutData.hiit; }

    return { type, label, icon, list, phase: phaseIdx + 1, dayNum };
}

function renderGrid() {
    grid.innerHTML = '';
    userSchedule.forEach((type, index) => {
        const info = getDayInfo(index);
        const card = document.createElement('div');
        card.className = `day-card ${progressData[info.dayNum] ? 'completed' : ''}`;
        card.draggable = true;
        card.dataset.index = index;
        
        card.innerHTML = `
            <div style="font-size:0.6rem; color:var(--text-dim)">PHASE ${info.phase}</div>
            <div style="font-weight:bold; font-size:1.1rem; margin:4px 0">${info.icon} Day ${info.dayNum}</div>
            <div style="font-size:0.65rem; color:var(--accent); font-weight:800">${info.label.toUpperCase()}</div>
        `;

        // Click to open
        card.onclick = () => openModal(info.dayNum, index);

        // Drag Events
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragover', handleDragOver);
        card.addEventListener('drop', handleDrop);
        card.addEventListener('dragend', handleDragEnd);

        grid.appendChild(card);
    });
    updateStats();
}

// --- DRAG HANDLERS ---
function handleDragStart(e) {
    draggedItemIndex = this.dataset.index;
    this.style.opacity = '0.4';
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    this.classList.add('drag-over');
}

function handleDragEnd() {
    this.style.opacity = '1';
    const cards = document.querySelectorAll('.day-card');
    cards.forEach(card => card.classList.remove('drag-over'));
}
function handleDrop(e) {
    e.preventDefault();
    const fromIdx = parseInt(draggedItemIndex);
    const toIdx = parseInt(this.dataset.index);

    if (fromIdx !== toIdx) {
        // 1. Swap the Workout Types in the schedule
        const tempType = userSchedule[fromIdx];
        userSchedule[fromIdx] = userSchedule[toIdx];
        userSchedule[toIdx] = tempType;

        // 2. Swap the Progress Data (the reps/logs)
        const fromDayNum = fromIdx + 1;
        const toDayNum = toIdx + 1;
        
        const tempProgress = progressData[fromDayNum];
        
        // Handle the swap of actual logged data
        if (progressData[toDayNum]) {
            progressData[fromDayNum] = progressData[toDayNum];
        } else {
            delete progressData[fromDayNum];
        }

        if (tempProgress) {
            progressData[toDayNum] = tempProgress;
        } else {
            delete progressData[toDayNum];
        }

        // 3. Save both to LocalStorage
        localStorage.setItem('janShredSchedule', JSON.stringify(userSchedule));
        localStorage.setItem('janShredData', JSON.stringify(progressData));
        
        // 4. Refresh the UI
        renderGrid();
    }
}

function openModal(dayNum, scheduleIndex) {
    currentDay = dayNum;
    const info = getDayInfo(scheduleIndex);
    document.getElementById('modal-title').innerText = `Day ${dayNum}: ${info.label}`;
    document.getElementById('modal-tag').innerText = `PHASE ${info.phase}`;
    document.getElementById('modal-desc').innerText = info.type === 'rest' ? "Focus on 30 mins of walking or light yoga." : "Perform all exercises. Rest 60s between sets.";
    
    // Find last data for the SAME type
    let lastData = null;
    for(let i = dayNum - 2; i >= 0; i--) {
        if(userSchedule[i] === info.type && progressData[i+1]) {
            lastData = progressData[i+1];
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
            <input type="text" placeholder="Reps" data-key="${ex.name}" value="${progressData[dayNum]?.[ex.name] || ''}">
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

document.querySelectorAll('.habit-check').forEach(check => {
    const id = check.id.split('-')[1];
    check.checked = habitData[id];
    check.onchange = () => {
        habitData[id] = check.checked;
        localStorage.setItem('janHabitData', JSON.stringify(habitData));
    };
});

closeBtn.onclick = () => modal.classList.add('hidden');
document.getElementById('reset-btn').onclick = () => { 
    if(confirm("Reset everything?")) { 
        localStorage.clear(); 
        location.reload(); 
    }
};

renderGrid();
