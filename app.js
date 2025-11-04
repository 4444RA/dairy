// --- 1. IMPORT THE NECESSARY FUNCTIONS FROM FIREBASE ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { 
    getAuth, 
    GoogleAuthProvider, 
    onAuthStateChanged, 
    signInWithPopup, 
    signOut 
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc 
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";


// --- 2. YOUR FIREBASE CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyAquYjH9mhBtLvPbFfC_K1xizXNruORXng",
    authDomain: "dairy-2139f.firebaseapp.com",
    projectId: "dairy-2139f",
    storageBucket: "dairy-2139f.appspot.com",
    messagingSenderId: "50167451169",
    appId: "1:50167451169:web:5ea9cffde6db860ff7dd60"
};


// --- 3. INITIALIZE FIREBASE AND GET REFERENCES TO SERVICES ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();


// --- 4. GET DOM ELEMENTS ---
const authButton = document.getElementById('auth-button');
const appContainer = document.getElementById('app-container');
const dateInput = document.getElementById('diary-date');
const entryTextarea = document.getElementById('diary-entry');
const saveButton = document.getElementById('save-button');
const statusMessage = document.getElementById('status-message');

let currentUser = null;


// --- 5. AUTHENTICATION LOGIC ---
onAuthStateChanged(auth, user => {
    if (user) {
        currentUser = user;
        authButton.textContent = 'Logout';
        appContainer.classList.remove('hidden');
        loadEntryForDate(dateInput.value);
    } else {
        currentUser = null;
        authButton.textContent = 'Login with Google';
        appContainer.classList.add('hidden');
    }
});

authButton.addEventListener('click', () => {
    if (currentUser) {
        signOut(auth);
    } else {
        signInWithPopup(auth, provider).catch(error => {
            console.error("Authentication Error:", error);
        });
    }
});


// --- 6. FIRESTORE (DATABASE) LOGIC ---
const getTodaysDate = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const todayWithOffset = new new Date(today.getTime() - (offset * 60 * 1000));
    return todayWithOffset.toISOString().split('T')[0];
}

dateInput.value = getTodaysDate();

const loadEntryForDate = async (dateStr) => {
    if (!currentUser || !dateStr) return;
    entryTextarea.value = 'Loading...';
    const entryRef = doc(db, 'diaries', currentUser.uid, 'entries', dateStr);
    
    try {
        const docSnap = await getDoc(entryRef);
        if (docSnap.exists()) {
            entryTextarea.value = docSnap.data().content;
        } else {
            entryTextarea.value = '';
        }
        statusMessage.textContent = '';
    } catch (error) {
        console.error("Error loading entry:", error);
        entryTextarea.value = 'Error loading entry.';
        statusMessage.textContent = 'Error loading entry.';
    }
};

const saveEntry = async () => {
    const dateStr = dateInput.value;
    const content = entryTextarea.value;
    if (!currentUser || !dateStr) {
        statusMessage.textContent = 'You must be logged in to save.';
        return;
    }
    const entryRef = doc(db, 'diaries', currentUser.uid, 'entries', dateStr);
    try {
        await setDoc(entryRef, { content: content });
        statusMessage.textContent = 'Saved successfully!';
        setTimeout(() => statusMessage.textContent = '', 3000);
    } catch (error) {
        console.error("Error saving entry: ", error);
        statusMessage.textContent = 'Error saving entry.';
    }
};


// --- 7. EVENT LISTENERS ---
dateInput.addEventListener('change', () => {
    loadEntryForDate(dateInput.value);
});

saveButton.addEventListener('click', saveEntry);
