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
        { name: "Burpees", target: "1 x 45s" }, { name: "High Knees", target: "1 x 45s" }, { name: "Mountain Climbers", target: "1 x 45s" }, { name: "Plank Jacks", target: "1 x 45s" }, { name: "Rest", target: "1 x 60s" }
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
let userSchedule = JSON.parse(localStorage.getItem('janShredSchedule')) || generateDefaultSchedule();

function generateDefaultSchedule() {
    const schedule = [];
    for (let i = 0; i < 30; i++) {
        const weekDay = i % 7;
        if (weekDay === 0 || weekDay === 3) schedule.push("upper");
        else if (weekDay === 1 || weekDay === 5) schedule.push("lower");
        else if (weekDay === 4) schedule.push("hiit");
        else schedule.push("rest");
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
        card.onclick = () => openModal(info.dayNum, index);
        card.addEventListener('dragstart', e => { draggedItemIndex = index; e.dataTransfer.effectAllowed = 'move'; });
        card.addEventListener('dragover', e => { e.preventDefault(); card.classList.add('drag-over'); });
        card.addEventListener('dragleave', () => card.classList.remove('drag-over'));
        card.addEventListener('drop', handleDrop);
        grid.appendChild(card);
    });
    updateStats();
}

let draggedItemIndex = null;
function handleDrop(e) {
    e.preventDefault();
    const fromIdx = draggedItemIndex;
    const toIdx = parseInt(this.dataset.index);
    if (fromIdx !== toIdx) {
        const tempType = userSchedule[fromIdx];
        userSchedule[fromIdx] = userSchedule[toIdx];
        userSchedule[toIdx] = tempType;

        const fromDay = fromIdx + 1, toDay = toIdx + 1;
        const tempProg = progressData[fromDay];
        if (progressData[toDay]) progressData[fromDay] = progressData[toDay]; else delete progressData[fromDay];
        if (tempProg) progressData[toDay] = tempProg; else delete progressData[toDay];

        localStorage.setItem('janShredSchedule', JSON.stringify(userSchedule));
        localStorage.setItem('janShredData', JSON.stringify(progressData));
        renderGrid();
    }
}

function openModal(dayNum, scheduleIndex) {
    currentDay = dayNum;
    const info = getDayInfo(scheduleIndex);
    document.getElementById('modal-title').innerText = `Day ${dayNum}: ${info.label}`;
    document.getElementById('modal-tag').innerText = `PHASE ${info.phase}`;
    
    // Find Last Data
    let lastData = null;
    for(let i = dayNum - 2; i >= 0; i--) {
        if(userSchedule[i] === info.type && progressData[i+1]) { lastData = progressData[i+1]; break; }
    }

    exerciseList.innerHTML = '';
    const listToUse = info.type === "rest" ? [{name: "Walking/Yoga", target: "1 x 30m"}] : info.list;
    
    listToUse.forEach(ex => {
        const row = document.createElement('div');
        row.className = 'exercise-block';
        
        // Determine number of sets from target string (e.g. "3 x 12" -> 3)
        const setMatch = ex.target.match(/^(\d+)/);
        const numSets = setMatch ? parseInt(setMatch[1]) : 1;
        
        const lastValArray = lastData ? lastData[ex.name] : null;
        const currentValArray = progressData[dayNum] ? progressData[dayNum][ex.name] : [];

        let inputsHtml = '';
        for(let s = 0; s < numSets; s++) {
            const val = currentValArray && currentValArray[s] ? currentValArray[s] : '';
            inputsHtml += `<input type="text" placeholder="S${s+1}" data-ex="${ex.name}" data-set="${s}" value="${val}">`;
        }

        row.innerHTML = `
            <div class="ex-info">
                <span class="ex-name">${ex.name}</span>
                <span class="ex-target">${ex.target}</span>
                <small class="ex-last">Last: ${lastValArray ? lastValArray.join(', ') : '-'}</small>
            </div>
            <div class="set-inputs">${inputsHtml}</div>
        `;
        exerciseList.appendChild(row);
    });
    modal.classList.remove('hidden');
}

saveBtn.onclick = () => {
    const blocks = exerciseList.querySelectorAll('.exercise-block');
    let dayResults = {};
    let hasValue = false;

    blocks.forEach(block => {
        const inputs = block.querySelectorAll('input');
        const exName = inputs[0].dataset.ex;
        const sets = [];
        inputs.forEach(input => {
            sets.push(input.value);
            if(input.value) hasValue = true;
        });
        dayResults[exName] = sets;
    });

    if(hasValue) {
        if (!progressData[currentDay]) confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
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
    Object.values(progressData).forEach(day => {
        Object.values(day).forEach(setArray => {
            setArray.forEach(val => {
                const n = parseInt(val);
                if(!isNaN(n)) totalReps += n;
            });
        });
    });
    document.getElementById('total-reps').innerText = totalReps.toLocaleString();

    let streak = 0;
    for(let i = 1; i <= 30; i++) { if(progressData[i]) streak++; else break; }
    document.getElementById('streak-count').innerText = streak;
}

// Habit Logic
document.querySelectorAll('.habit-check').forEach(check => {
    const id = check.id.split('-')[1];
    check.checked = habitData[id];
    check.onchange = () => { habitData[id] = check.checked; localStorage.setItem('janHabitData', JSON.stringify(habitData)); };
});

closeBtn.onclick = () => modal.classList.add('hidden');
document.getElementById('reset-btn').onclick = () => { if(confirm("Reset everything?")) { localStorage.clear(); location.reload(); }};

renderGrid();
