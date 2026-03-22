import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const btnLogin = document.getElementById('btn-login');
const btnRegister = document.getElementById('btn-register');
const errorMsg = document.getElementById('error-msg');

function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.style.display = 'block';
}

async function handleRedirect(user) {
    // Vérifier le rôle de l'utilisateur dans Firestore
    try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const role = docSnap.data().role;
            if (role === 'admin') {
                window.location.href = "admin.html";
            } else if (role === 'livreur') {
                window.location.href = "livreur.html";
            } else {
                window.location.href = "user.html";
            }
        } else {
            // Si pas de doc, considérer comme user
            window.location.href = "user.html";
        }
    } catch (e) {
        showError("Erreur lors de la récupération du profil.");
    }
}

if (btnLogin) {
    btnLogin.addEventListener('click', async () => {
        const email = emailInput.value;
        const password = passwordInput.value;
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            await handleRedirect(userCredential.user);
        } catch (error) {
            showError("Identifiants incorrects.");
            console.error(error);
        }
    });
}

if (btnRegister) {
    btnRegister.addEventListener('click', async () => {
        const email = emailInput.value;
        const password = passwordInput.value;
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Créer le document utilisateur avec le rôle "user" par défaut
            await setDoc(doc(db, "users", user.uid), {
                email: email,
                role: "user"
            });
            
            await handleRedirect(user);
        } catch (error) {
            showError("Erreur lors de l'inscription. Mot de passe trop faible ou email déjà utilisé.");
            console.error(error);
        }
    });
}
