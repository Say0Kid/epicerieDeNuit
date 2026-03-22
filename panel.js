import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// Protéger la page : si non connecté, retour au login
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
    } else {
        const userEmailSpan = document.getElementById('user-email');
        if(userEmailSpan) userEmailSpan.textContent = user.email;
        
        const adminEmailSpan = document.getElementById('admin-email');
        if(adminEmailSpan) adminEmailSpan.textContent = user.email;

        // Charger profil de livraison si on est sur la page user
        const profileForm = document.getElementById('profile-form');
        if(profileForm) {
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);
            if(docSnap.exists()) {
                const data = docSnap.data();
                if(data.name) document.getElementById('profile-name').value = data.name;
                if(data.phone) document.getElementById('profile-phone').value = data.phone;
                if(data.address) document.getElementById('profile-address').value = data.address;
            }

            profileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = document.getElementById('btn-save-profile');
                btn.textContent = "SAUVEGARDE...";
                btn.disabled = true;

                try {
                    await setDoc(docRef, {
                        name: document.getElementById('profile-name').value,
                        phone: document.getElementById('profile-phone').value,
                        address: document.getElementById('profile-address').value
                    }, { merge: true }); // Merge garde le champ 'role' intact

                    const msg = document.getElementById('profile-msg');
                    msg.textContent = "Profil mis à jour ! ✅";
                    msg.style.display = "block";
                    setTimeout(() => msg.style.display = "none", 3000);
                } catch(err) {
                    console.error("Erreur de sauvegarde: ", err);
                    alert("Erreur lors de la sauvegarde du profil.");
                } finally {
                    btn.textContent = "ENREGISTRER";
                    btn.disabled = false;
                }
            });
        }
    }
});

const btnLogout = document.getElementById('btn-logout');
if (btnLogout) {
    btnLogout.addEventListener('click', () => {
        signOut(auth).then(() => {
            window.location.href = "login.html";
        }).catch((error) => {
            console.error("Erreur de déconnexion", error);
        });
    });
}