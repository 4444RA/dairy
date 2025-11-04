// --- 1. IMPORT ONLY FIRESTORE FUNCTIONS ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc 
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";


// --- 2. YOUR FIREBASE CONFIGURATION (Stays the same) ---
const firebaseConfig = {
    apiKey: "AIzaSyAquYjH9mhBtLvPbFfC_K1xizXNruORXng",
    authDomain: "dairy-2139f.firebaseapp.com",
    projectId: "dairy-2139f",
    storageBucket: "dairy-2139f.appspot.com",
    messagingSenderId: "50167451169",
    appId: "1:50167451169:web:5ea9cffde6db860ff7dd60"
};

// --- NEW: Define our habits. Easy to add more here! ---
const HABITS = [
    { id: 'sunlight', text: 'Got morning sunlight' },
    { id: 'exercise', text: 'Exercised for 20+ minutes' },
    { id: 'noPhone', text: 'No phone 1 hour before bed' },
    { id: 'read', text: 'Read for 15 minutes' }
];


// --- 3. INITIALIZE FIREBASE AND GET REFERENCE TO FIRESTORE ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


// --- 4. GET DOM ELEMENTS ---
const dateInput = document.getElementById('diary-date');
const entryTextarea = document.getElementById('diary-entry');
const saveButton = document.getElementById('save-button');
const statusMessage = document.getElementById('status-message');
const checklistContainer = document.getElementById('checklist-container'); // NEW


// --- 5. FIRESTORE (DATABASE) LOGIC ---
const diaryCollectionId = 'public-diary';

// NEW: Function to create the checklist HTML
const renderChecklist = () => {
    HABITS.forEach(habit => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'habit-item';

        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `habit-${habit.id}`;
        
        const span = document.createElement('span');
        span.textContent = habit.text;

        label.appendChild(checkbox);
        label.appendChild(span);
        itemDiv.appendChild(label);
        checklistContainer.appendChild(itemDiv);
    });
};

const getTodaysDate = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const todayWithOffset = new Date(today.getTime() - (offset * 60 * 1000));
    return todayWithOffset.toISOString().split('T')[0];
}

const loadEntryForDate = async (dateStr) => {
    if (!dateStr) return;
    entryTextarea.value = 'Loading...';
    const entryRef = doc(db, 'diaries', diaryCollectionId, 'entries', dateStr);
    
    try {
        const docSnap = await getDoc(entryRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            // Load diary text, default to empty string if not present
            entryTextarea.value = data.content || '';

            // Load habits, default to empty object
            const habitsData = data.habits || {};
            HABITS.forEach(habit => {
                const checkbox = document.getElementById(`habit-${habit.id}`);
                // Check the box if the corresponding habit is true, otherwise uncheck it
                checkbox.checked = habitsData[habit.id] || false;
            });

        } else {
            // If no entry exists, clear the textarea and uncheck all boxes
            entryTextarea.value = '';
            HABITS.forEach(habit => {
                document.getElementById(`habit-${habit.id}`).checked = false;
            });
        }
        statusMessage.textContent = '';
    } catch (error) {
        console.error("Error loading entry:", error);
        entryTextarea.value = 'Error loading entry.';
    }
};

const saveEntry = async () => {
    const dateStr = dateInput.value;
    const content = entryTextarea.value;
    
    // NEW: Get the state of all checkboxes
    const habitsToSave = {};
    HABITS.forEach(habit => {
        const checkbox = document.getElementById(`habit-${habit.id}`);
        habitsToSave[habit.id] = checkbox.checked;
    });

    const entryRef = doc(db, 'diaries', diaryCollectionId, 'entries', dateStr);
    
    try {
        // UPDATED: Save both content and the habits object
        await setDoc(entryRef, { 
            content: content,
            habits: habitsToSave 
        });
        statusMessage.textContent = 'Saved successfully!';
        setTimeout(() => statusMessage.textContent = '', 3000);
    } catch (error) {
        console.error("Error saving entry: ", error);
        statusMessage.textContent = 'Error saving entry.';
    }
};

// --- 6. INITIAL PAGE SETUP ---
dateInput.value = getTodaysDate();
renderChecklist(); // Create the checklist on the page
loadEntryForDate(dateInput.value); // Load today's entry

// --- 7. EVENT LISTENERS ---
dateInput.addEventListener('change', () => {
    loadEntryForDate(dateInput.value);
});

saveButton.addEventListener('click', saveEntry);
