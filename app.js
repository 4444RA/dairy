import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// --- CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyAquYjH9mhBtLvPbFfC_K1xizXNruORXng",
    authDomain: "dairy-2139f.firebaseapp.com",
    projectId: "dairy-2139f",
    storageBucket: "dairy-2139f.appspot.com",
    messagingSenderId: "50167451169",
    appId: "1:50167451169:web:5ea9cffde6db860ff7dd60"
};

const HABITS = [
    { id: 'sunlight', text: 'Got morning sunlight' },
    { id: 'exercise', text: 'Exercised for 20+ minutes' },
    { id: 'noPhoneMorning', text: 'No Phone for the First Hour' },
    { id: 'mindfulness', text: '5+ Minutes of Mindfulness' },
    { id: 'gratitude', text: 'Wrote 3 Gratitude Items' },
    { id: 'priorities', text: 'Set Top 1-3 Priorities' },
    { id: 'tidyUp', text: '10-Minute Evening Tidy-Up' },
    { id: 'noPhoneBed', text: 'No phone 1 hour before bed' }
];
const diaryCollectionId = 'public-diary';
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const main = () => {
    // --- DOM ELEMENTS (with new inputs) ---
    const dateInput = document.getElementById('diary-date');
    const entryTextarea = document.getElementById('diary-entry');
    const saveButton = document.getElementById('save-button');
    const statusMessage = document.getElementById('status-message');
    const checklistContainer = document.getElementById('checklist-container');
    const themeToggle = document.getElementById('theme-toggle');
    const trackerStatsContainer = document.getElementById('tracker-stats');
    // New priority inputs
    const priority1 = document.getElementById('priority-1');
    const priority2 = document.getElementById('priority-2');
    const priority3 = document.getElementById('priority-3');
    // New gratitude inputs
    const gratitude1 = document.getElementById('gratitude-1');
    const gratitude2 = document.getElementById('gratitude-2');
    const gratitude3 = document.getElementById('gratitude-3');


    const getTodaysDate = () => { /* ... unchanged ... */
        const today = new Date();
        const offset = today.getTimezoneOffset();
        return new Date(today.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];
    };

    const renderChecklist = () => { /* ... unchanged ... */
        checklistContainer.innerHTML = '';
        HABITS.forEach(habit => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'habit-item';
            itemDiv.innerHTML = `<label><input type="checkbox" id="habit-${habit.id}"><span>${habit.text}</span></label>`;
            checklistContainer.appendChild(itemDiv);
        });
    };

    // --- UPDATED to load priorities and gratitude ---
    const loadEntryForDate = async (dateStr) => {
        if (!dateStr) return;
        entryTextarea.value = 'Loading...';
        const entryRef = doc(db, 'diaries', diaryCollectionId, 'entries', dateStr);
        try {
            const docSnap = await getDoc(entryRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                entryTextarea.value = data.content || '';

                // Load habits
                const habitsData = data.habits || {};
                HABITS.forEach(habit => {
                    const checkbox = document.getElementById(`habit-${habit.id}`);
                    if (checkbox) checkbox.checked = habitsData[habit.id] || false;
                });

                // Load priorities
                const prioritiesData = data.priorities || [];
                priority1.value = prioritiesData[0] || '';
                priority2.value = prioritiesData[1] || '';
                priority3.value = prioritiesData[2] || '';

                // Load gratitude
                const gratitudeData = data.gratitude || [];
                gratitude1.value = gratitudeData[0] || '';
                gratitude2.value = gratitudeData[1] || '';
                gratitude3.value = gratitudeData[2] || '';

            } else {
                // Clear all fields for a new day
                entryTextarea.value = '';
                priority1.value = ''; priority2.value = ''; priority3.value = '';
                gratitude1.value = ''; gratitude2.value = ''; gratitude3.value = '';
                HABITS.forEach(habit => {
                    const checkbox = document.getElementById(`habit-${habit.id}`);
                    if (checkbox) checkbox.checked = false;
                });
            }
            statusMessage.textContent = '';
        } catch (error) {
            console.error("Error loading entry:", error);
            entryTextarea.value = 'Error loading entry.';
        } finally {
            const resizeEvent = new Event('input');
            entryTextarea.dispatchEvent(resizeEvent);
        }
    };

    // --- UPDATED to save priorities and gratitude ---
    const saveEntry = async () => {
        const dateStr = dateInput.value;
        const content = entryTextarea.value;
        
        const habitsToSave = {};
        HABITS.forEach(habit => {
            const checkbox = document.getElementById(`habit-${habit.id}`);
            if (checkbox) habitsToSave[habit.id] = checkbox.checked;
        });

        // Collect priorities and gratitude into arrays
        const prioritiesToSave = [priority1.value, priority2.value, priority3.value];
        const gratitudeToSave = [gratitude1.value, gratitude2.value, gratitude3.value];

        const entryRef = doc(db, 'diaries', diaryCollectionId, 'entries', dateStr);
        try {
            // Save the complete data object
            await setDoc(entryRef, { 
                content: content, 
                habits: habitsToSave,
                priorities: prioritiesToSave,
                gratitude: gratitudeToSave
            });
            statusMessage.textContent = 'Saved successfully!';
            setTimeout(() => statusMessage.textContent = '', 3000);
            updateHabitTracker();
        } catch (error) {
            console.error("Error saving entry: ", error);
            statusMessage.textContent = 'Error saving entry.';
        }
    };
    
    const updateHabitTracker = async () => { /* ... unchanged ... */
        trackerStatsContainer.innerHTML = 'Calculating...';
        const habitCounts = {};
        HABITS.forEach(h => habitCounts[h.id] = 0);
        const promises = [];
        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const entryRef = doc(db, 'diaries', diaryCollectionId, 'entries', dateStr);
            promises.push(getDoc(entryRef));
        }
        const snapshots = await Promise.all(promises);
        snapshots.forEach(docSnap => {
            if (docSnap.exists()) {
                const habitsData = docSnap.data().habits || {};
                HABITS.forEach(habit => {
                    if (habitsData[habit.id]) habitCounts[habit.id]++;
                });
            }
        });
        trackerStatsContainer.innerHTML = '';
        HABITS.forEach(habit => {
            const count = habitCounts[habit.id];
            const percentage = Math.round((count / 30) * 100);
            trackerStatsContainer.innerHTML += `<div class="tracker-item"><div class="tracker-label"><span>${habit.text}</span><span>${count}/30 days</span></div><div class="tracker-bar-container"><div class="tracker-bar" style="width: ${percentage}%;">${percentage}%</div></div></div>`;
        });
    };

    const setupThemeToggle = () => { /* ... unchanged ... */
        const currentTheme = localStorage.getItem('theme');
        if (currentTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeToggle.checked = true;
        }
        themeToggle.addEventListener('change', () => {
            if (themeToggle.checked) {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
            }
        });
    };

    const setupCollapsibles = () => { /* ... unchanged ... */
        const headers = document.querySelectorAll('.collapsible-header');
        headers.forEach(header => {
            header.addEventListener('click', () => {
                header.classList.toggle('active');
                const content = header.nextElementSibling;
                if (content.style.maxHeight) {
                    content.style.maxHeight = null;
                } else {
                    content.style.maxHeight = content.scrollHeight + 'px';
                }
            });
        });
    };

    const setupAutoResizeTextarea = () => {
        const resizeTextarea = () => {
            entryTextarea.style.height = 'auto';
            entryTextarea.style.height = (entryTextarea.scrollHeight) + 'px';
        };
        entryTextarea.addEventListener('input', resizeTextarea);
        setTimeout(resizeTextarea, 0); 
    };
    
    // --- INITIALIZE THE APP ---
    dateInput.value = getTodaysDate();
    renderChecklist();
    setupThemeToggle();
    setupCollapsibles();
    setupAutoResizeTextarea();
    loadEntryForDate(dateInput.value);
    updateHabitTracker();
    dateInput.addEventListener('change', () => loadEntryForDate(dateInput.value));
    saveButton.addEventListener('click', saveEntry);
};

document.addEventListener('DOMContentLoaded', main);
