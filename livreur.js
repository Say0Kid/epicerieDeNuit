import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

let currentWatchId = null;

// Vérification de l'authentification et du rôle
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }
    
    // Vérifier rôle livreur
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data().role !== 'livreur') {
        window.location.href = "user.html";
        return;
    }

    document.getElementById('livreur-email').textContent = user.email;
    loadMissions();
});

// Déconnexion
const btnLogout = document.getElementById('btn-logout');
if (btnLogout) {
    btnLogout.addEventListener('click', () => {
        if(currentWatchId) navigator.geolocation.clearWatch(currentWatchId);
        signOut(auth).then(() => {
            window.location.href = "login.html";
        });
    });
}

// Fonction pour récupérer les commandes du secteur
function loadMissions() {
    const listBody = document.getElementById('livreur-orders-list');
    const q = query(
        collection(db, "orders"),
        where("status", "in", ["en_attente", "en_cours"])
    );

    onSnapshot(q, (snap) => {
        listBody.innerHTML = "";
        if(snap.empty) {
            listBody.innerHTML = "<tr><td colspan='6' style='text-align:center;'>Aucune mission disponible.</td></tr>";
            return;
        }

        const ordersData = snap.docs.map(d => ({id: d.id, ...d.data()}));
        ordersData.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());

        ordersData.forEach(o => {
            const timeStr = o.createdAt ? new Date(o.createdAt.toMillis()).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'}) : '--:--';
            
            let statusBadge = '';
            let actionsHTML = '';

            if(o.status === 'en_attente') {
                statusBadge = `<span style="color:var(--neon-yellow);">En attente</span>`;
                actionsHTML = `<button class="btn-edit" onclick="window.takeMission('${o.id}')" style="width:100%;"><i class="fas fa-motorcycle"></i> Accepter</button>`;
            } else if (o.status === 'en_cours') {
                statusBadge = `<span style="color:var(--neon-pink);">En cours</span>`;
                actionsHTML = `<button class="btn-danger" onclick="window.finishMission('${o.id}')" style="width:100%; background:rgba(0,255,0,0.2); border-color:#0f0; color:#0f0;"><i class="fas fa-check"></i> Livrée</button>`;
            }

            listBody.innerHTML += `
                <tr>
                    <td style="color:#aaa;">${timeStr}</td>
                    <td><strong>${o.customerName}</strong><br><a href="tel:${o.phone}" style="color:var(--neon-blue);">${o.phone}</a></td>
                    <td>${o.address}</td>
                    <td style="font-weight:bold; color:var(--neon-yellow);">${Number(o.total || 0).toFixed(2)}€</td>
                    <td>${statusBadge}</td>
                    <td>${actionsHTML}</td>
                </tr>
            `;
        });
    });
}

const gpsStatus = document.getElementById('gps-status');

window.takeMission = async (orderId) => {
    try {
        await updateDoc(doc(db, "orders", orderId), { status: "en_cours" });
        
        // Démarrer la géolocalisation pour cette commande précise
        if(navigator.geolocation) {
            gpsStatus.innerHTML = "<span style='color:var(--neon-yellow);'>Recherche du signal GPS...</span>";
            currentWatchId = navigator.geolocation.watchPosition(
                async (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    gpsStatus.innerHTML = "<span style='color:var(--neon-pink);'>📍 Envoi GPS actif !</span>";
                    
                    // Màj la BDD pour le client
                    try {
                        await updateDoc(doc(db, "orders", orderId), {
                            driverLocation: { lat, lng }
                        });
                    } catch(e) {
                       console.warn("Erreur maj GPS", e); 
                    }
                },
                (err) => {
                    gpsStatus.innerHTML = `<span style='color:red;'>Erreur GPS: Pensez à autoriser la géolocalisation !</span>`;
                    console.error(err);
                },
                { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
            );
        } else {
            alert("La géolocalisation n'est pas supportée par votre navigateur.");
        }
    } catch(e) {
        alert("Erreur lors de la prise en charge.");
        console.error(e);
    }
};

window.finishMission = async (orderId) => {
    if(confirm("Valider cette livraison ? Le client sera informé de la fin de course.")) {
        try {
            await updateDoc(doc(db, "orders", orderId), { status: "livree" });
            if(currentWatchId) {
                navigator.geolocation.clearWatch(currentWatchId);
                currentWatchId = null;
                gpsStatus.innerHTML = "";
            }
        } catch(e) {
            alert("Erreur validation");
            console.error(e);
        }
    }
};