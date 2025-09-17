// ============================================
// BELLEZA & ESTILO - AUTENTICACIÓN (Firebase)
// ============================================

// Variables globales
let isLoginForm = true;
let isProcessing = false;

// Configuración de validación
const validationRules = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    password: { minLength: 6 },
    name: { minLength: 2, maxLength: 50 },
    phone: /^(\+57|57)?[0-9]{10}$/
};

// ============================================
// FIREBASE CONFIG
// ============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// Configuración de tu proyecto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB5ZXCmgrVamwCNu6bA--epYORGXqgD9Ro",
  authDomain: "valen-belleza-estilo.firebaseapp.com",
  projectId: "valen-belleza-estilo",
  storageBucket: "valen-belleza-estilo.appspot.com",
  messagingSenderId: "1006502515028",
  appId: "1:1006502515028:web:TU_APP_ID" // reemplaza TU_APP_ID con tu appId real
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log('✅ Firebase inicializado');

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
    setupEventListeners();
    setupFormAnimations();
    addFloatingElements();
});

async function initializeAuth() {
    console.log('🔐 Sistema de autenticación iniciado');
    
    // Verificar si el usuario ya está logueado
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                console.log('👤 Usuario ya logueado:', userDoc.data().name);
                localStorage.setItem('bellezaCurrentUser', JSON.stringify({ uid: user.uid, ...userDoc.data() }));
            }
        }
    });

    setTimeout(() => {
        const formContainer = document.querySelector('.form-container');
        if (formContainer) {
            formContainer.style.opacity = '1';
            formContainer.style.transform = 'translateY(0)';
        }
    }, 300);
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
    const loginBtn = document.querySelector('.form-front .btn');
    const registerBtn = document.querySelector('.form-back .btn');

    if (loginBtn) loginBtn.addEventListener('click', handleLogin);
    if (registerBtn) registerBtn.addEventListener('click', handleRegister);

    document.querySelectorAll('.social-btn').forEach(btn => btn.addEventListener('click', handleSocialLogin));
    const forgotPasswordLink = document.querySelector('.forgot-password a');
    if (forgotPasswordLink) forgotPasswordLink.addEventListener('click', handleForgotPassword);

    setupRealTimeValidation();
    const toggleCheckbox = document.getElementById('signup_toggle');
    if (toggleCheckbox) toggleCheckbox.addEventListener('change', handleFormToggle);
    setupPasswordToggle();
}

// ============================================
// MANEJO DE LOGIN (Firebase)
// ============================================
async function handleLogin(event) {
    event.preventDefault();
    if (isProcessing) return;

    const email = document.querySelector('.form-front input[type="email"]').value.trim();
    const password = document.querySelector('.form-front input[type="password"]').value;
    const loginBtn = event.target;

    if (!validateLoginForm(email, password)) return;

    setButtonLoading(loginBtn, true, '🔐 Iniciando sesión...');
    isProcessing = true;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) throw new Error('Usuario no encontrado en Firestore');

        // Guardar sesión local
        localStorage.setItem('bellezaCurrentUser', JSON.stringify({ uid: user.uid, ...userDoc.data() }));

        showMessage('✅ ¡Bienvenida de vuelta!', 'success');
        loginBtn.innerHTML = '✨ ¡Bienvenida!';

        setTimeout(() => redirectToMain(), 2000);

    } catch (error) {
        console.error('Error login:', error);
        showMessage('❌ Error al iniciar sesión', 'error');
        setButtonLoading(loginBtn, false, '💄 Ingresar');
    }

    isProcessing = false;
}

// ============================================
// MANEJO DE REGISTRO (Firebase)
// ============================================
async function handleRegister(event) {
    event.preventDefault();
    if (isProcessing) return;

    const formData = {
        name: document.querySelector('.form-back input[placeholder="Nombre completo"]').value.trim(),
        email: document.querySelector('.form-back input[type="email"]').value.trim(),
        phone: document.querySelector('.form-back input[type="tel"]').value.trim(),
        password: document.querySelector('.form-back input[type="password"]').value,
        confirmPassword: document.querySelector('.form-back input[type="password"]:last-of-type').value,
        acceptTerms: document.getElementById('terms').checked,
        acceptNewsletter: document.getElementById('newsletter').checked
    };

    if (!validateRegisterForm(formData)) return;

    const registerBtn = event.target;
    setButtonLoading(registerBtn, true, '✨ Creando cuenta...');
    isProcessing = true;

    try {
        // Crear usuario en Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;

        // Guardar datos adicionales en Firestore
        await setDoc(doc(db, 'users', user.uid), {
            name: formData.name,
            email: formData.email,
            phone: formData.phone || '',
            acceptTerms: formData.acceptTerms,
            acceptNewsletter: formData.acceptNewsletter,
            createdAt: serverTimestamp(),
            loginCount: 1
        });

        // Guardar sesión local
        localStorage.setItem('bellezaCurrentUser', JSON.stringify({ uid: user.uid, ...formData }));

        showMessage('🎉 ¡Cuenta creada exitosamente!', 'success');
        registerBtn.innerHTML = '🎊 ¡Bienvenida!';
        setTimeout(() => redirectToMain(), 2500);

    } catch (error) {
        console.error('Error registro:', error);
        showMessage('❌ Error al crear la cuenta', 'error');
        setButtonLoading(registerBtn, false, '✨ Crear mi cuenta');
    }

    isProcessing = false;
}

// ============================================
// FUNCIONES DE CRUD FIRESTORE
// ============================================
async function updateUserDataFirestore(uid, newData) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, newData);
}

async function deleteUserFirestore(uid) {
    await deleteDoc(doc(db, 'users', uid));
}

// ============================================
// RESTO DE FUNCIONES
// ============================================
// Mantener tus funciones existentes: handleSocialLogin, handleForgotPassword, validateRegisterForm, 
// validateLoginForm, setupRealTimeValidation, validateInput, showInputError, clearInputError,
// setupFormAnimations, handleFormToggle, setupPasswordToggle, addFloatingElements, setButtonLoading,
// showMessage, clearAllMessages, clearAllInputErrors, getCurrentUser, sendWelcomeEmail, redirectToMain
// y estilos dinámicos
