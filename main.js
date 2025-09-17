// ============================================
// BELLEZA & ESTILO - SCRIPT PRINCIPAL CON FIREBASE
// ============================================

// Importar Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getAuth, 
    onAuthStateChanged,
    signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc,
    collection,
    addDoc,
    serverTimestamp,
    arrayUnion
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// ============================================
// CONFIGURACIÓN DE FIREBASE
// ============================================
const firebaseConfig = {
    apiKey: "TU-API-KEY",
    authDomain: "belleza-estilo.firebaseapp.com",
    projectId: "belleza-estilo",
    storageBucket: "belleza-estilo.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456789"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Variables globales
let cart = [];
let cartTotal = 0;
let isMenuOpen = false;
let currentUser = null;

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    initializeUI();
    setupEventListeners();
    setupSmoothScrolling();
    setupIntersectionObserver();
    addFloatingAnimations();
    
    // Escuchar cambios de autenticación
    onAuthStateChanged(auth, handleAuthStateChange);

    // Formularios de registro/login
    setupAuthForms();
});

function initializeUI() {
    console.log('🛍️ Belleza & Estilo - App iniciada con Firebase');
    updateCartDisplay();

    // Animate hero section on load
    setTimeout(() => {
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
            heroContent.style.opacity = '1';
            heroContent.style.transform = 'translateY(0)';
        }
    }, 500);
}

// ============================================
// AUTENTICACIÓN - REGISTRO Y LOGIN
// ============================================
async function registerUser(email, password, name) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Crear documento de usuario en Firestore
        await setDoc(doc(db, 'users', user.uid), {
            name: name,
            email: email,
            createdAt: serverTimestamp(),
            profile: { skinType: '' }
        });

        currentUser = user;
        updateUIForLoggedUser(user);
        showToast(`👤 Bienvenido, ${name}`, 'success');

    } catch (error) {
        console.error('❌ Error registrando usuario:', error);
        showToast(`Error: ${error.message}`, 'error');
    }
}

async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        currentUser = user;
        updateUIForLoggedUser(user);
        showToast(`👋 Bienvenido de nuevo, ${user.displayName || 'Usuario'}`, 'success');

    } catch (error) {
        console.error('❌ Error iniciando sesión:', error);
        showToast(`Error: ${error.message}`, 'error');
    }
}

// Configurar los formularios
function setupAuthForms() {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const name = document.getElementById('registerName').value;
            registerUser(email, password, name);
        });
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            loginUser(email, password);
        });
    }
}

// ============================================
// MANEJO DEL ESTADO DE AUTENTICACIÓN
// ============================================
async function handleAuthStateChange(user) {
    if (user) {
        console.log('👤 Usuario autenticado:', user.email);
        currentUser = user;

        updateUIForLoggedUser(user);
        await loadUserCartFromFirebase();
        await migrateLocalCartToFirebase();
    } else {
        console.log('👤 Usuario no autenticado');
        currentUser = null;

        updateUIForGuestUser();
        loadCartFromStorage();
    }
}

// ============================================
// FUNCIONES UI PARA USUARIOS
// ============================================
function updateUIForLoggedUser(user) {
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn) {
        loginBtn.innerHTML = `👤 Hola, ${user.displayName || 'Usuario'}`;
        loginBtn.href = '#';
        loginBtn.onclick = showUserMenu;
    }
}

function updateUIForGuestUser() {
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn) {
        loginBtn.innerHTML = '🔑 Iniciar Sesión';
        loginBtn.href = 'login.html';
        loginBtn.onclick = null;
    }
}

// ============================================
// CARRITO CON FIREBASE
// ============================================
async function loadUserCartFromFirebase() {
    if (!currentUser) return;
    try {
        const cartDoc = await getDoc(doc(db, 'carts', currentUser.uid));
        if (cartDoc.exists()) {
            const cartData = cartDoc.data();
            cart = cartData.items || [];
            updateCartDisplay();
        }
    } catch (error) {
        console.error('Error cargando carrito desde Firebase:', error);
        loadCartFromStorage();
    }
}

async function saveCartToFirebase() {
    if (!currentUser) {
        saveCartToStorage();
        return;
    }
    try {
        const cartData = {
            items: cart,
            lastUpdated: serverTimestamp(),
            total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        };
        await setDoc(doc(db, 'carts', currentUser.uid), cartData, { merge: true });
    } catch (error) {
        console.error('Error guardando carrito en Firebase:', error);
        saveCartToStorage();
    }
}

async function migrateLocalCartToFirebase() {
    if (!currentUser) return;
    const localCart = localStorage.getItem('bellezaCart');
    if (localCart) {
        const localCartItems = JSON.parse(localCart);
        if (localCartItems.length > 0) {
            const firebaseCart = cart.slice();
            localCartItems.forEach(localItem => {
                const existingIndex = firebaseCart.findIndex(item => item.name === localItem.name);
                if (existingIndex > -1) {
                    firebaseCart[existingIndex].quantity += localItem.quantity;
                } else {
                    firebaseCart.push(localItem);
                }
            });
            cart = firebaseCart;
            await saveCartToFirebase();
            updateCartDisplay();
            localStorage.removeItem('bellezaCart');
            showToast('🛒 Carrito sincronizado', 'success');
        }
    }
}

// ============================================
// LOGOUT
// ============================================
async function handleLogout() {
    try {
        await signOut(auth);
        showToast('👋 Sesión cerrada correctamente', 'success');
        currentUser = null;
        updateUIForGuestUser();
    } catch (error) {
        console.error('Error cerrando sesión:', error);
        showToast('❌ Error al cerrar sesión', 'error');
    }
}

// ============================================
// FUNCIONES DE CARRITO, PERFIL Y OTROS
// ============================================
// Mantén todas tus funciones de carrito, perfil, checkout y toast exactamente como ya las tenías
// Solo asegúrate que usan currentUser.uid y saveCartToFirebase() cuando el usuario está logueado
