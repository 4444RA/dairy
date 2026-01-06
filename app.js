const workoutData = {
    phases: [
        { // PHASE 1: FOUNDATION
            upper: [
                { name: "Push-ups", target: "3 x Max" },
                { name: "Incline Rows (on Pole)", target: "3 x 10" }, // ADDED PULL
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
        { // PHASE 2: THE GRIND
            upper: [
                { name: "Diamond Pushups", target: "3 x 10" },
                { name: "Wide Grip Rows (Pole)", target: "3 x 12" }, // ADDED PULL
                { name: "Pike Pushups", target: "3 x 8" },
                { name: "Burpees", target: "3 x 10" }
            ],
            lower: [
                { name: "Bulgarian Squats", target: "3 x 10/leg" },
                { name: "Wall Sit", target: "3 x 60s" },
                { name: "Calf Raises", target: "3 x 25" },
                { name: "Jump Squats", target: "3 x 15" }
            ]
        },
        { // PHASE 3: SHRED
            upper: [
                { name: "Decline Pushups", target: "4 x 12" },
                { name: "Chin-ups (or Low Row)", target: "3 x 8" }, // ADDED PULL
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
        { name: "Burpees", target: "3 x 45s" },
        { name: "High Knees", target: "3 x 45s" },
        { name: "Mountain Climbers", target: "3 x 45s" },
        { name: "Plank Jacks", target: "3 x 45s" },
        { name: "Rest", target: "3 x 60s" }
    ]
};

let progressData = JSON.parse(localStorage.getItem('janShredData')) || {};
let userSchedule = JSON.parse(localStorage.getItem('janShredSchedule')) || generateDefaultSchedule();
let currentDay = null;
let draggedItemIndex = null;

const grid = document.getElementById('grid');
const modal = document.getElementById('modal-overlay');
const exerciseList = document.getElementById('exercise-list');
const saveBtn = document.getElementById('save-btn');
const closeBtn = document.getElementById('close-btn');

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

function getDayInfo(index) {
    const type = userSchedule[index];
    const phaseIdx = Math.floor(index / 10);
    let label = "Recovery", icon = "🧘", list = [];
    if (type === "upper") { label = "Upper Body"; icon = "💪"; list = workoutData.phases[phaseIdx].upper; }
    else if (type === "lower") { label = "Lower Body"; icon = "🦵"; list = workoutData.phases[phaseIdx].lower; }
    else if (type === "hiit") { label = "HIIT"; icon = "🔥"; list = workoutData.hiit; }
    return { type, label, icon, list, phase: phaseIdx + 1, dayNum: index + 1 };
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
        card.ondragstart = () => { draggedItemIndex = index; };
        card.ondragover = (e) => { e.preventDefault(); card.classList.add('drag-over'); };
        card.ondragleave = () => card.classList.remove('drag-over');
        card.ondrop = handleDrop;
        grid.appendChild(card);
    });
    updateStats();
}

function handleDrop(e) {
    e.preventDefault();
    const fromIdx = draggedItemIndex;
    const toIdx = parseInt(this.dataset.index);
    if (fromIdx === toIdx) return;

    // Swap Schedule
    [userSchedule[fromIdx], userSchedule[toIdx]] = [userSchedule[toIdx], userSchedule[fromIdx]];
    
    // Swap Data
    const fromDay = fromIdx + 1, toDay = toIdx + 1;
    const tempProg = progressData[fromDay];
    if (progressData[toDay]) progressData[fromDay] = progressData[toDay]; else delete progressData[fromDay];
    if (tempProg) progressData[toDay] = tempProg; else delete progressData[toDay];

    localStorage.setItem('janShredSchedule', JSON.stringify(userSchedule));
    localStorage.setItem('janShredData', JSON.stringify(progressData));
    renderGrid();
}

function openModal(dayNum, index) {
    currentDay = dayNum;
    const info = getDayInfo(index);
    const dayData = progressData[dayNum] || { exercises: {}, habits: { water: false, steps: false, protein: false } };
    
    document.getElementById('modal-title').innerText = `Day ${dayNum}: ${info.label}`;
    document.getElementById('modal-tag').innerText = `PHASE ${info.phase}`;
    
    // Set Habits
    document.getElementById('modal-habit-water').checked = dayData.habits?.water || false;
    document.getElementById('modal-habit-steps').checked = dayData.habits?.steps || false;
    document.getElementById('modal-habit-protein').checked = dayData.habits?.protein || false;

    // Find Last
    let lastData = null;
    for(let i = index - 1; i >= 0; i--) {
        if(userSchedule[i] === info.type && progressData[i+1]) { lastData = progressData[i+1].exercises; break; }
    }

    exerciseList.innerHTML = '';
    const list = info.type === "rest" ? [{name: "Walking/Yoga", target: "1 x 30m"}] : info.list;
    list.forEach(ex => {
        const numSets = parseInt(ex.target.match(/^(\d+)/)[1]);
        const currentSets = dayData.exercises?.[ex.name] || [];
        let inputsHtml = '';
        for(let s = 0; s < numSets; s++) {
            inputsHtml += `<input type="text" data-ex="${ex.name}" value="${currentSets[s] || ''}" placeholder="S${s+1}">`;
        }
        const block = document.createElement('div');
        block.className = 'exercise-block';
        block.innerHTML = `
            <div class="ex-info">
                <span class="ex-name">${ex.name}</span>
                <span class="ex-target">${ex.target}</span>
                <span class="ex-last">Last: ${lastData?.[ex.name] ? lastData[ex.name].join(', ') : '-'}</span>
            </div>
            <div class="set-inputs">${inputsHtml}</div>
        `;
        exerciseList.appendChild(block);
    });
    modal.classList.remove('hidden');
}

saveBtn.onclick = () => {
    let exercises = {}, hasVal = false;
    exerciseList.querySelectorAll('.exercise-block').forEach(block => {
        const inputs = block.querySelectorAll('input');
        const name = inputs[0].dataset.ex;
        const sets = Array.from(inputs).map(i => i.value);
        exercises[name] = sets;
        if (sets.some(s => s !== "")) hasVal = true;
    });

    const habits = {
        water: document.getElementById('modal-habit-water').checked,
        steps: document.getElementById('modal-habit-steps').checked,
        protein: document.getElementById('modal-habit-protein').checked
    };
    if (habits.water || habits.steps || habits.protein) hasVal = true;

    if (hasVal) {
        if(!progressData[currentDay]) confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        progressData[currentDay] = { exercises, habits };
    } else {
        delete progressData[currentDay];
    }

    localStorage.setItem('janShredData', JSON.stringify(progressData));
    modal.classList.add('hidden');
    renderGrid();
};

function updateStats() {
    const percent = Math.round((Object.keys(progressData).length / 30) * 100);
    document.getElementById('progress-percent').innerText = `${percent}%`;
    document.getElementById('progress-bar').style.width = `${percent}%`;
}

closeBtn.onclick = () => modal.classList.add('hidden');
document.getElementById('reset-btn').onclick = () => { if(confirm("Reset everything?")) { localStorage.clear(); location.reload(); }};
renderGrid();


// --- EXPORT DATA ---
document.getElementById('export-btn').onclick = () => {
    // Combine logs and custom schedule into one object
    const backupData = {
        logs: JSON.parse(localStorage.getItem('janShredData')),
        schedule: JSON.parse(localStorage.getItem('janShredSchedule'))
    };

    const dataStr = JSON.stringify(backupData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `january-shred-backup-${new Date().toISOString().slice(0,10)}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
};

// --- IMPORT DATA ---
const fileInput = document.getElementById('file-input');
const importBtn = document.getElementById('import-btn');

importBtn.onclick = () => fileInput.click(); // Trigger hidden input

fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const importedData = JSON.parse(event.target.result);
            
            if (importedData.logs && importedData.schedule) {
                if (confirm("This will overwrite your current progress. Continue?")) {
                    localStorage.setItem('janShredData', JSON.stringify(importedData.logs));
                    localStorage.setItem('janShredSchedule', JSON.stringify(importedData.schedule));
                    location.reload(); // Refresh to show imported data
                }
            } else {
                alert("Invalid backup file.");
            }
        } catch (err) {
            alert("Error reading file.");
        }
    };
    reader.readAsText(file);
};
