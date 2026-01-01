const grid = document.getElementById('grid');
const progressText = document.getElementById('progress-text');
const progressBar = document.getElementById('progress-bar');
const percentText = document.getElementById('percent');
const resetBtn = document.getElementById('reset-btn');

// The Workout Schedule Mapping
const workoutSchedule = [
    "Upper", "Lower", "Active", "Upper", "HIIT", "Lower", "Rest", // Week 1
    "Upper", "Lower", "Active", "Upper", "HIIT", "Lower", "Rest", // Week 2
    "Upper", "Lower", "Active", "Upper", "HIIT", "Lower", "Rest", // Week 3
    "Upper", "Lower", "Active", "Upper", "HIIT", "Lower", "Rest", // Week 4
    "Upper", "Finish" // Day 29, 30
];

// Load saved data from LocalStorage
let completedDays = JSON.parse(localStorage.getItem('leanPlanProgress')) || [];

function createGrid() {
    grid.innerHTML = '';
    
    for (let i = 1; i <= 30; i++) {
        const isCompleted = completedDays.includes(i);
        
        const card = document.createElement('div');
        card.classList.add('day-card');
        if (isCompleted) card.classList.add('completed');
        
        card.innerHTML = `
            <span class="day-num">${i}</span>
            <span class="day-type">${workoutSchedule[i-1]}</span>
        `;
        
        card.addEventListener('click', () => toggleDay(i));
        grid.appendChild(card);
    }
    updateStats();
}

function toggleDay(day) {
    if (completedDays.includes(day)) {
        // Remove day if already exists
        completedDays = completedDays.filter(d => d !== day);
    } else {
        // Add day to completed list
        completedDays.push(day);
    }
    
    // Save to LocalStorage
    localStorage.setItem('leanPlanProgress', JSON.stringify(completedDays));
    
    // Refresh UI
    createGrid();
}

function updateStats() {
    const count = completedDays.length;
    const percent = Math.round((count / 30) * 100);
    
    progressText.innerText = `${count}/30`;
    percentText.innerText = percent;
    progressBar.style.width = percent + '%';
}

resetBtn.addEventListener('click', () => {
    if (confirm("Reset all 30 days of progress?")) {
        completedDays = [];
        localStorage.removeItem('leanPlanProgress');
        createGrid();
    }
});

// Initialize the app
createGrid();
