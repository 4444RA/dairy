const grid = document.getElementById('grid');
const modal = document.getElementById('modal-overlay');
const exerciseList = document.getElementById('exercise-list');
const saveBtn = document.getElementById('save-btn');
const closeBtn = document.getElementById('close-btn');

let currentDay = null;
let progressData = JSON.parse(localStorage.getItem('caliDataV2')) || {};

const workoutData = {
    phases: [
        { // Phase 1: Days 1-10
            upper: [
                { name: "Push-ups", target: "3 x 12" },
                { name: "Door Rows", target: "3 x 15" },
                { name: "Pike Pushups", target: "3 x 8" },
                { name: "Floor Pulls", target: "3 x 12" },
                { name: "Plank", target: "3 x 45s" }
            ],
            lower: [
                { name: "Air Squats", target: "3 x 20" },
                { name: "Reverse Lunges", target: "3 x 12/leg" },
                { name: "Glute Bridges", target: "3 x 20" },
                { name: "Leg Raises", target: "3 x 15" },
                { name: "Mtn Climbers", target: "3 x 40s" }
            ]
        },
        { // Phase 2: Days 11-20
            upper: [
                { name: "Slow Push-ups", target: "3 x 10 (3s down)" },
                { name: "Towel Rows", target: "3 x 12" },
                { name: "Chair Dips", target: "3 x 12" },
                { name: "Superman Hold", target: "4 x 30s" },
                { name: "Side Plank", target: "3 x 30s/side" }
            ],
            lower: [
                { name: "Bulgarian Squats", target: "3 x 10/leg" },
                { name: "Wall Sit", target: "3 x 45s" },
                { name: "Calf Raises", target: "3 x 20" },
                { name: "Bicycle Crunch", target: "3 x 30" },
                { name: "Hollow Hold", target: "3 x 20s" }
            ]
        },
        { // Phase 3: Days 21-30
            upper: [
                { name: "Diamond Pushups", target: "4 x 10" },
                { name: "Face Pulls", target: "4 x 15" },
                { name: "Decline Pushup", target: "3 x 12" },
                { name: "Floor Swimmers", target: "3 x 20" },
                { name: "Plank to Pushup", target: "3 x 10" }
            ],
            lower: [
                { name: "Jump Squats", target: "4 x 15" },
                { name: "Lateral Lunges", target: "3 x 12/leg" },
                { name: "Single Leg Bridge", target: "3 x 10/leg" },
                { name: "V-Ups", target: "3 x 15" },
                { name: "Plank Jacks", target: "3 x 45s" }
            ]
        }
    ],
    hiit: [
        { name: "Burpees", target: "10 reps" },
        { name: "High Knees", target: "30 sec" },
        { name: "Push-ups", target: "12 reps" },
        { name: "Air Squats", target: "20 reps" },
        { name: "Mtn Climbers", target: "30 sec" }
    ]
};

function getDayInfo(day) {
    const phaseIdx = Math.floor((day - 1) / 10);
    const weekDay = (day - 1) % 7;
    let type = "rest", label = "Rest / Walking", list = [];

    if (weekDay === 0 || weekDay === 3) {
        type = "upper"; label = "Upper Body"; list = workoutData.phases[phaseIdx].upper;
    } else if (weekDay === 1 || weekDay === 5) {
        type = "lower"; label = "Lower Body"; list = workoutData.phases[phaseIdx].lower;
    } else if (weekDay === 4) {
        type = "hiit"; label = "Full Body HIIT"; list = workoutData.hiit;
    }

    return { type, label, list, phase: phaseIdx + 1 };
}

function renderGrid() {
    grid.innerHTML = '';
    for (let i = 1; i <= 30; i++) {
        const info = getDayInfo(i);
        const card = document.createElement('div');
        card.className = `day-card ${progressData[i] ? 'completed' : ''}`;
        card.innerHTML = `<div style="font-size:0.7rem; color:var(--text-dim)">P${info.phase}</div>
                          <div style="font-weight:bold">Day ${i}</div>
                          <div style="font-size:0.6rem; color:var(--accent)">${info.label}</div>`;
        card.onclick = () => openModal(i);
        grid.appendChild(card);
    }
    updateStats();
}

function openModal(day) {
    currentDay = day;
    const info = getDayInfo(day);
    document.getElementById('modal-title').innerText = `Day ${day}: ${info.label}`;
    document.getElementById('modal-desc').innerText = (info.type === 'hiit') ? "Perform circuit 5 times. Rest 90s between rounds." : `Phase ${info.phase} - Rest 60s between sets.`;
    
    exerciseList.innerHTML = '';
    if (info.type === "rest") {
        exerciseList.innerHTML = `<div class="exercise-row"><span>Light Walking / Yoga</span><span>30m</span><input type="text" data-key="rest" value="${progressData[day]?.rest || ''}"></div>`;
    } else {
        info.list.forEach(ex => {
            const row = document.createElement('div');
            row.className = 'exercise-row';
            row.innerHTML = `
                <span class="ex-name">${ex.name}</span>
                <span class="ex-target">${ex.target}</span>
                <input type="text" placeholder="Done" data-key="${ex.name}" value="${progressData[day]?.[ex.name] || ''}">
            `;
            exerciseList.appendChild(row);
        });
    }
    modal.classList.remove('hidden');
}

saveBtn.onclick = () => {
    const inputs = exerciseList.querySelectorAll('input');
    let dayResults = {};
    inputs.forEach(input => { dayResults[input.dataset.key] = input.value; });
    progressData[currentDay] = dayResults;
    localStorage.setItem('caliDataV2', JSON.stringify(progressData));
    modal.classList.add('hidden');
    renderGrid();
};

closeBtn.onclick = () => modal.classList.add('hidden');

function updateStats() {
    const done = Object.keys(progressData).length;
    document.getElementById('progress-text').innerText = `Days Completed: ${done}/30`;
    document.getElementById('progress-bar').style.width = `${(done/30)*100}%`;
}

document.getElementById('reset-btn').onclick = () => { if(confirm("Clear all data?")) { localStorage.clear(); progressData = {}; renderGrid(); }};

renderGrid();
