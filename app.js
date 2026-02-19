// --- CONFIGURATION & DATA ---
const workoutProgram = {
    phases: [
        { // Phase 1: Foundation (Days 1-10)
            upper: [{name:"Push-ups", target:"3 x Max"}, {name:"Pole Rows", target:"3 x 10"}, {name:"Chair Dips", target:"3 x 12"}, {name:"Mtn Climbers", target:"3 x 45s"}],
            lower: [{name:"Air Squats", target:"3 x 20"}, {name:"Reverse Lunges", target:"3 x 12/leg"}, {name:"Glute Bridges", target:"3 x 20"}, {name:"Plank Jacks", target:"3 x 45s"}]
        },
        { // Phase 2: The Grind (Days 11-20)
            upper: [{name:"Diamond Pushups", target:"3 x 10"}, {name:"Wide Rows", target:"3 x 12"}, {name:"Pike Pushups", target:"3 x 8"}, {name:"Burpees", target:"3 x 10"}],
            lower: [{name:"Bulgarian Squats", target:"3 x 10/leg"}, {name:"Wall Sit", target:"3 x 60s"}, {name:"Calf Raises", target:"3 x 25"}, {name:"Jump Squats", target:"3 x 15"}]
        },
        { // Phase 3: Shred (Days 21-30)
            upper: [{name:"Decline Pushups", target:"4 x 12"}, {name:"Close Rows", target:"3 x 8"}, {name:"Plank to Pushup", target:"3 x 12"}, {name:"Burpee + Pushup", target:"3 x 10"}],
            lower: [{name:"Assisted Pistol", target:"3 x 5/leg"}, {name:"Cossack Squat", target:"3 x 12"}, {name:"Single Leg Bridge", target:"3 x 15/leg"}, {name:"Broad Jumps", target:"3 x 10"}]
        }
    ],
    hiit: [ {name:"Burpees", target:"45s"}, {name:"High Knees", target:"45s"}, {name:"Mtn Climbers", target:"45s"}, {name:"Plank Jacks", target:"45s"}, {name:"Rest", target:"60s"} ]
};

// State
let logs = JSON.parse(localStorage.getItem('shred_logs')) || {}; 
let settings = JSON.parse(localStorage.getItem('shred_settings')) || { startDate: new Date().toISOString().split('T')[0] };

const today = new Date();
let selectedDateStr = null;

// --- INITIALIZATION ---
function init() {
    renderCalendar();
    updateStats();
    
    // Set default date in settings modal
    document.getElementById('start-date-input').value = settings.startDate;
}

// --- LOGIC: MAP CALENDAR TO PROGRAM ---
function getProgramDayInfo(dateStr) {
    const start = new Date(settings.startDate);
    const current = new Date(dateStr);
    
    // Difference in days
    const diffTime = current - start;
    const dayIndex = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // 0 = start date, 1 = day after...

    if (dayIndex < 0) return { type: "pre", label: "Wait", list: [] };
    
    // Pattern: 30 Day Cycle logic
    const programDay = (dayIndex % 30) + 1; // 1 to 30
    
    // Weekly Schedule Logic (Based on program day, not calendar day)
    // Day 1,4 = Upper | Day 2,6 = Lower | Day 5 = HIIT | Day 3,7 = Rest/Active
    const cycleDay = programDay % 7; 
    
    let type = "rest";
    if (cycleDay === 1 || cycleDay === 4) type = "upper";
    else if (cycleDay === 2 || cycleDay === 6) type = "lower";
    else if (cycleDay === 5) type = "hiit";
    
    // Determine Phase
    const phaseIdx = Math.floor((programDay - 1) / 10);
    const phaseData = workoutProgram.phases[phaseIdx] || workoutProgram.phases[2]; // Fallback to phase 3 if over
    
    let label = "Recovery", list = [];
    if (type === "upper") { label = "Upper Body"; list = phaseData.upper; }
    else if (type === "lower") { label = "Lower Body"; list = phaseData.lower; }
    else if (type === "hiit") { label = "HIIT Burn"; list = workoutProgram.hiit; }
    
    return { type, label, list, programDay, phase: phaseIdx + 1 };
}

// --- RENDERING ---
function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';

    const year = today.getFullYear();
    const month = today.getMonth(); // 0-indexed
    
    // First day of month
    const firstDay = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    document.getElementById('current-month-display').innerText = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Empty slots for previous month
    for(let i=0; i<firstDay; i++) {
        const d = document.createElement('div');
        d.className = 'cal-day empty';
        grid.appendChild(d);
    }

    // Days
    for(let i=1; i<=daysInMonth; i++) {
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
        const isToday = (i === today.getDate());
        const info = getProgramDayInfo(dateStr);
        const isLogged = logs[dateStr];

        const el = document.createElement('div');
        el.className = `cal-day ${isToday ? 'today' : ''} ${isLogged ? 'completed' : ''} ${info.type === 'rest' ? 'rest' : ''}`;
        el.onclick = () => openLogModal(dateStr);
        
        let icon = "";
        if(info.type === 'upper') icon = "💪";
        else if(info.type === 'lower') icon = "🦵";
        else if(info.type === 'hiit') icon = "🔥";
        else icon = "🧘";

        el.innerHTML = `
            <div class="day-num">${i}</div>
            <div class="day-workout">${info.type !== 'pre' ? icon + ' P'+info.programDay : '-'}</div>
            <div class="day-check">${isLogged ? '✅' : ''}</div>
        `;
        grid.appendChild(el);
    }
}

function updateStats() {
    const logKeys = Object.keys(logs).sort();
    document.getElementById('completed-val').innerText = logKeys.length;

    // Current Program Day (based on today vs start date)
    const info = getProgramDayInfo(today.toISOString().split('T')[0]);
    document.getElementById('program-day-val').innerText = info.programDay > 0 ? info.programDay : '-';
    
    // Streak Calc
    let streak = 0;
    const checkDate = new Date();
    while(true) {
        const dStr = checkDate.toISOString().split('T')[0];
        if(logs[dStr]) streak++;
        else if (dStr !== today.toISOString().split('T')[0]) break; // Allow gap for today if not done yet
        checkDate.setDate(checkDate.getDate() - 1);
    }
    document.getElementById('streak-val').innerText = streak;
}

// --- MODAL & LOGGING ---
function openLogModal(dateStr) {
    selectedDateStr = dateStr;
    const info = getProgramDayInfo(dateStr);
    const data = logs[dateStr] || {};

    const modal = document.getElementById('workout-modal');
    document.getElementById('modal-date-title').innerText = new Date(dateStr).toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric'});
    document.getElementById('modal-program-day').innerText = info.type === 'pre' ? 'Pre-Start' : `Day ${info.programDay} • Phase ${info.phase}`;
    document.getElementById('workout-type-title').innerText = info.label;

    // Fill Habits & Notes
    document.getElementById('habit-water').checked = data.habits?.water || false;
    document.getElementById('habit-steps').checked = data.habits?.steps || false;
    document.getElementById('habit-protein').checked = data.habits?.protein || false;
    document.getElementById('energy-rating').value = data.details?.energy || 7;
    document.getElementById('workout-notes').value = data.details?.notes || "";

    // Generate Exercises
    const listContainer = document.getElementById('exercise-list');
    listContainer.innerHTML = '';
    
    if (info.type === 'pre') {
        listContainer.innerHTML = "<p style='color:gray; text-align:center'>Program hasn't started yet.</p>";
    } else if (info.type === 'rest') {
        listContainer.innerHTML = "<p style='text-align:center'>Active Recovery: Stretch, Walk, or Yoga.</p>";
    } else {
        info.list.forEach(ex => {
            const savedSets = data.exercises?.[ex.name] || [];
            
            // Parse target to guess number of inputs
            const setsMatch = ex.target.match(/^(\d+)/);
            const numSets = setsMatch ? parseInt(setsMatch[1]) : 3;

            let inputs = '';
            for(let i=0; i<numSets; i++) {
                inputs += `<input type="text" placeholder="Set ${i+1}" value="${savedSets[i] || ''}" data-ex="${ex.name}">`;
            }

            const div = document.createElement('div');
            div.className = 'exercise-block';
            div.innerHTML = `
                <div class="ex-header">
                    <strong>${ex.name}</strong>
                    <span style="color:var(--accent); font-size:0.8rem">${ex.target}</span>
                </div>
                <div class="set-inputs">${inputs}</div>
            `;
            listContainer.appendChild(div);
        });
    }

    modal.classList.remove('hidden');
}

document.getElementById('save-log-btn').onclick = () => {
    const inputs = document.querySelectorAll('#exercise-list input');
    const exercises = {};
    let hasData = false;

    inputs.forEach(inp => {
        const name = inp.dataset.ex;
        if(!exercises[name]) exercises[name] = [];
        exercises[name].push(inp.value);
        if(inp.value) hasData = true;
    });

    const habits = {
        water: document.getElementById('habit-water').checked,
        steps: document.getElementById('habit-steps').checked,
        protein: document.getElementById('habit-protein').checked
    };
    
    // Only save if something was entered
    if (hasData || habits.water || habits.steps || habits.protein) {
        logs[selectedDateStr] = {
            exercises,
            habits,
            details: {
                energy: document.getElementById('energy-rating').value,
                notes: document.getElementById('workout-notes').value
            }
        };
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } else {
        delete logs[selectedDateStr]; // Remove log if empty
    }

    localStorage.setItem('shred_logs', JSON.stringify(logs));
    document.getElementById('workout-modal').classList.add('hidden');
    renderCalendar();
    updateStats();
};

document.getElementById('close-log-btn').onclick = () => document.getElementById('workout-modal').classList.add('hidden');

// --- SETTINGS ---
const settingsModal = document.getElementById('settings-modal');
document.getElementById('settings-btn').onclick = () => settingsModal.classList.remove('hidden');
document.getElementById('close-settings-btn').onclick = () => settingsModal.classList.add('hidden');

document.getElementById('save-settings-btn').onclick = () => {
    const newDate = document.getElementById('start-date-input').value;
    if(newDate) {
        settings.startDate = newDate;
        localStorage.setItem('shred_settings', JSON.stringify(settings));
        location.reload(); // Refresh to recalc calendar
    }
};

// --- BACKUPS (Keep existing logic) ---
document.getElementById('export-btn').onclick = () => {
    const data = { logs, settings };
    const blob = new Blob([JSON.stringify(data)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `shred-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
};

document.getElementById('import-btn').onclick = () => document.getElementById('file-input').click();
document.getElementById('file-input').onchange = (e) => {
    const reader = new FileReader();
    reader.onload = (event) => {
        const data = JSON.parse(event.target.result);
        localStorage.setItem('shred_logs', JSON.stringify(data.logs));
        localStorage.setItem('shred_settings', JSON.stringify(data.settings));
        location.reload();
    };
    reader.readAsText(e.target.files[0]);
};

// Start
init();
