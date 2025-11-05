import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// --- CONFIGURATION (Unchanged) ---
const firebaseConfig = { /* ... your config ... */ };
const HABITS = [ /* ... your habits ... */ ];
const diaryCollectionId = 'public-diary';
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const main = () => {
    const appContainer = document.getElementById('app-container');
    const accessDeniedMessage = document.getElementById('access-denied-message');

    const urlParams = new URLSearchParams(window.location.search);
    const isMaster = urlParams.get('master') === 'true';

    if (!isMaster) { return; }

    appContainer.classList.remove('hidden');
    accessDeniedMessage.classList.add('hidden');
    
    const dateInput = document.getElementById('diary-date');
    const entryTextarea = document.getElementById('diary-entry');
    const checklistContainer = document.getElementById('checklist-container');
    const themeToggle = document.getElementById('theme-toggle');
    const trackerStatsContainer = document.getElementById('tracker-stats');
    // UPDATED: Now selects all textareas with this class
    const priorityInputs = document.querySelectorAll('#priority-1, #priority-2, #priority-3');
    const gratitudeInputs = document.querySelectorAll('#gratitude-1, #gratitude-2, #gratitude-3');

    let debounceTimeout;
    const triggerAutosave = () => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => { saveEntry(); }, 1500);
    };

    const saveEntry = async () => { /* ... unchanged ... */
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
            console.log(`Autosaved for ${dateStr}`);
            updateHabitTracker();
        } catch (error) {
            console.error("Error autosaving entry: ", error);
        }
    };

    const loadEntryForDate = async (dateStr) => {
        if (!dateStr) return;
        entryTextarea.value = 'Loading...';
        // Reset other fields while loading
        priorityInputs.forEach(input => input.value = '');
        gratitudeInputs.forEach(input => input.value = '');
        
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
            // After loading, resize ALL textareas
            document.querySelectorAll('textarea').forEach(textarea => {
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';
            });
        }
    };

    const renderChecklist = () => { /* ... unchanged ... */ };
    
    const getTodaysDate = () => { /* ... unchanged ... */ };
    
    const updateHabitTracker = async () => { /* ... unchanged ... */ };

    const setupThemeToggle = () => { /* ... unchanged ... */ };

    const setupCollapsibles = () => { /* ... unchanged ... */ };
    
    // --- UPDATED: This function now handles ALL textareas ---
    const setupAutoResizeTextareas = () => {
        document.querySelectorAll('textarea').forEach(textarea => {
            const resize = () => {
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';
            };
            textarea.addEventListener('input', resize);
            // Initial resize on load
            setTimeout(resize, 0); 
        });
    };
    
    // --- INITIALIZE THE APP ---
    dateInput.value = getTodaysDate();
    renderChecklist();
    setupThemeToggle();
    setupCollapsibles();
    setupAutoResizeTextareas(); // Use the new plural function
    loadEntryForDate(dateInput.value);
    updateHabitTracker();

    // Attach Autosave Event Listeners
    dateInput.addEventListener('change', () => loadEntryForDate(dateInput.value));
    entryTextarea.addEventListener('input', triggerAutosave);
    priorityInputs.forEach(input => input.addEventListener('input', triggerAutosave));
    gratitudeInputs.forEach(input => input.addEventListener('input', triggerAutosave));
};

document.addEventListener('DOMContentLoaded', main);

// Make sure to include the full, non-commented code for all functions
// (I have omitted them here for brevity but your file should have the full code)
