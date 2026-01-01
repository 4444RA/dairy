const grid = document.getElementById('grid');
const modal = document.getElementById('modal-overlay');
const exerciseList = document.getElementById('exercise-list');
const saveBtn = document.getElementById('save-btn');
const closeBtn = document.getElementById('close-btn');

let currentDay = null;

// Define Exercises per Phase
const workouts = {
    upper: [
        ["Push-ups", "Doorframe Rows", "Pike Push-ups", "Floor Pulls", "Plank"], // Phase 1
        ["Slow Push-ups", "Towel Rows", "Chair Dips", "Superman Holds", "Side Plank"], // Phase 2
        ["Diamond Push-ups", "Towel Face-Pulls", "Decline Push-ups", "Floor Swimmers", "Plank to Pushup"] // Phase 3
    ],
    lower: [
        ["Air Squats", "Reverse Lunges", "Glute Bridges", "Leg Raises", "Mountain Climbers"], // Phase 1
        ["Bulgarian Split Squats", "Wall Sit", "Calf Raises", "Bicycle Crunches", "Hollow Body"], // Phase 2
        ["Jump Squats", "Lateral Lunges", "Single-Leg Glute Bridge", "V-Ups", "Plank Jacks"] // Phase 3
    ],
    hiit: ["Burpees", "High Knees", "Pushups", "Squats", "Mountain Climbers"]
};

// Map Day to Workout Type
function getWorkoutForDay(day) {
    const phase = Math.floor((day - 1) / 10); // 0, 1, or 2
    const weekDay = (day - 1) % 7;
    
    if (weekDay === 0 || weekDay === 3) return { name: "Upper Body", type: 'upper', phase };
    if (weekDay === 1 || weekDay === 5) return { name: "Lower Body", type: 'lower', phase };
    if (weekDay === 4) return { name: "Full Body HIIT", type: 'hiit', phase };
    if (weekDay === 2) return { name: "Active Recovery", type: 'rest', phase };
    return { name: "Rest", type: 'rest', phase };
}

// Load Data
let progressData = JSON.parse(localStorage.getItem('caliProgress')) || {};

function renderGrid() {
    grid.innerHTML = '';
    for (let i = 1; i <= 30; i++) {
        const workout = getWorkoutForDay(i);
        const card = document.createElement('div');
        card.className = `day-card ${progressData[i] ? 'completed' : ''}`;
        card.innerHTML = `<span class="day-num">${i}</span><span class="day-type">${workout.name}</span>`;
        card.onclick = () => openModal(i);
        grid.appendChild(card);
    }
    updateStats();
}

function openModal(day) {
    currentDay = day;
    const workout = getWorkoutForDay(day);
    document.getElementById('modal-title').innerText = `Day ${day}: ${workout.name}`;
    exerciseList.innerHTML = '';

    if (workout.type === 'rest') {
        exerciseList.innerHTML = `<p>Rest day or light walking. Log your steps or how you feel below:</p>`;
        addInput("Notes/Steps", day, "notes");
    } else {
        const list = (workout.type === 'hiit') ? workouts.hiit : workouts[workout.type][workout.phase];
        list.forEach(ex => addInput(ex, day, ex));
    }

    modal.classList.remove('hidden');
}

function addInput(label, day, key) {
    const val = (progressData[day] && progressData[day][key]) ? progressData[day][key] : "";
    const div = document.createElement('div');
    div.className = 'exercise-item';
    div.innerHTML = `<label>${label}</label><input type="text" placeholder="Reps / Sets / Time" data-key="${key}" value="${val}">`;
    exerciseList.appendChild(div);
}

saveBtn.onclick = () => {
    const inputs = exerciseList.querySelectorAll('input');
    const dayData = {};
    inputs.forEach(input => { dayData[input.dataset.key] = input.value; });
    
    progressData[currentDay] = dayData;
    localStorage.setItem('caliProgress', JSON.stringify(progressData));
    modal.classList.add('hidden');
    renderGrid();
};

closeBtn.onclick = () => modal.classList.add('hidden');

function updateStats() {
    const completedCount = Object.keys(progressData).length;
    document.getElementById('progress-text').innerText = `${completedCount}/30`;
    document.getElementById('progress-bar').style.width = `${(completedCount/30)*100}%`;
}

document.getElementById('reset-btn').onclick = () => {
    if(confirm("Delete all history?")) {
        progressData = {};
        localStorage.clear();
        renderGrid();
    }
};

renderGrid();
