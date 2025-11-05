import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// --- CONFIGURATION (Unchanged) ---
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
    const appContainer = document.getElementById('app-container');
    const accessDeniedMessage = document.getElementById('access-denied-message');

    // --- MASTER VIEW LOGIC ---
    const urlParams = new URLSearchParams(window.location.search);
    const isMaster = urlParams.get('master') === 'true';

    if (!isMaster) {
        // If not a master user, do nothing else. The app remains hidden.
        return; 
    }

    // If we get here, it's a master user. Reveal the app and hide the message.
    appContainer.classList.remove('hidden');
    accessDeniedMessage.classList.add('hidden');
    
    // --- DOM ELEMENTS (now safe to access) ---
    const dateInput = document.getElementById('diary-date');
    const entryTextarea = document.getElementById('diary-entry');
    const checklistContainer = document.getElementById('checklist-container');
    const themeToggle = document.getElementById('theme-toggle');
    const trackerStatsContainer = document.getElementById('tracker-stats');
    const priorityInputs = document.querySelectorAll('#priority-1, #priority-2, #priority-3');
    const gratitudeInputs = document.querySelectorAll('#gratitude-1, #gratitude-2, #gratitude-3');

    // --- AUTOSAVE LOGIC ---
    let debounceTimeout;
    const triggerAutosave = () => {
        clearTimeout(debounceTimeout); // Reset the timer
        debounceTimeout = setTimeout(() => {
            saveEntry();
        }, 1500); // Save 1.5 seconds after the user stops typing
    };

    const saveEntry = async () => {
        const dateStr = dateInput.value;
        const content = entryTextarea.value;
        const habitsToSave = {};
        HABITS.forEach(habit => {
            const checkbox = document.getElementById(`habit-${habit.id}`);
            if (checkbox) habitsToSave[habit.id] = checkbox.checked;
        });
        const prioritiesToSave = Array.from(priorityInputs).map(input => input.value);
        const gratitudeToSave = Array.from(gratitudeInputs).map(input => input.value);
        const entryRef = doc(db, 'diaries', diaryCollectionId, 'entries', dateStr);
        try {
            await setDoc(entryRef, { content, habits: habitsToSave, priorities: prioritiesToSave, gratitude: gratitudeToSave });
            console.log(`Autosaved for ${dateStr}`); // Log to console instead of showing a message
            updateHabitTracker();
        } catch (error) {
            console.error("Error autosaving entry: ", error);
        }
    };

    const loadEntryForDate = async (dateStr) => {
        if (!dateStr) return;
        entryTextarea.value = 'Loading...';
        const entryRef = doc(db, 'diaries', diaryCollectionId, 'entries', dateStr);
        try {
            const docSnap = await getDoc(entryRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                entryTextarea.value = data.content || '';
                const habitsData = data.habits || {};
                HABITS.forEach(habit => {
                    const checkbox = document.getElementById(`habit-${habit.id}`);
                    if (checkbox) checkbox.checked = habitsData[habit.id] || false;
                });
                const prioritiesData = data.priorities || [];
                priorityInputs.forEach((input, index) => input.value = prioritiesData[index] || '');
                const gratitudeData = data.gratitude || [];
                gratitudeInputs.forEach((input, index) => input.value = gratitudeData[index] || '');
            } else {
                entryTextarea.value = '';
                priorityInputs.forEach(input => input.value = '');
                gratitudeInputs.forEach(input => input.value = '');
                HABITS.forEach(habit => {
                    const checkbox = document.getElementById(`habit-${habit.id}`);
                    if (checkbox) checkbox.checked = false;
                });
            }
        } catch (error) {
            console.error("Error loading entry:", error);
            entryTextarea.value = 'Error loading entry.';
        } finally {
            const resizeEvent = new Event('input');
            entryTextarea.dispatchEvent(resizeEvent);
        }
    };

    const renderChecklist = () => {
        checklistContainer.innerHTML = '';
        HABITS.forEach(habit => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'habit-item';
            itemDiv.innerHTML = `<label><input type="checkbox" id="habit-${habit.id}" class="autosave-trigger"><span>${habit.text}</span></label>`;
            checklistContainer.appendChild(itemDiv);
        });
        // Attach event listeners to newly created checkboxes
        document.querySelectorAll('.autosave-trigger').forEach(el => el.addEventListener('change', triggerAutosave));
    };
    
    // --- Other functions (unchanged) ---
    const updateHabitTracker = async () => { /* ... same as before ... */ };
    const setupThemeToggle = () => { /* ... same as before ... */ };
    const setupCollapsibles = () => { /* ... same as before ... */ };
    const setupAutoResizeTextarea = () => { /* ... same as before ... */ };
    const getTodaysDate = () => { /* ... same as before ... */ };
    
    // --- INITIALIZE THE APP ---
    dateInput.value = getTodaysDate();
    renderChecklist();
    setupThemeToggle();
    setupCollapsibles();
    setupAutoResizeTextarea();
    loadEntryForDate(dateInput.value);
    updateHabitTracker();

    // Attach Autosave Event Listeners
    dateInput.addEventListener('change', () => loadEntryForDate(dateInput.value)); // Changing date loads, doesn't save
    entryTextarea.addEventListener('input', triggerAutosave);
    priorityInputs.forEach(input => input.addEventListener('input', triggerAutosave));
    gratitudeInputs.forEach(input => input.addEventListener('input', triggerAutosave));
};

document.addEventListener('DOMContentLoaded', main);
