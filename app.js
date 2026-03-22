import { db, auth } from './firebase-config.js';
import { collection, getDocs, addDoc, serverTimestamp, doc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

let cart = JSON.parse(localStorage.getItem('noctushop-cart')) || [];

const productsList = [
    { id: "p1", name: "CRISTALINE (33CL)", price: 1.00, image: "assets/img/cristal.jpg", category: "boissons" },
    { id: "p2", name: "COCA-COLA (35CL)", price: 2.00, image: "assets/img/coca.jpg", category: "boissons" },
    { id: "p3", name: "OASIS (35CL)", price: 2.00, image: "assets/img/oasis.jpg", category: "boissons" },
    { id: "p4", name: "CAPRI-SUN (20CL)", price: 1.00, image: "assets/img/capri.jpg", category: "boissons" },
    { id: "p5", name: "CHIPS LAY'S (25G)", price: 1.00, image: "assets/img/chips.jpg", category: "snacks" },
    { id: "p6", name: "BONBONS HARIBO", price: 3.50, image: "assets/img/bonbon.jpg", category: "snacks" },
    { id: "p7", name: "CHOCO BAR", price: 1.50, image: "assets/img/twix.jpg", category: "snacks" },
    { id: "p8", name: "MAGNUM", price: 2.50, image: "assets/img/magnum.jpg", category: "autres" },
    { id: "p9", name: "CIGARETTE", price: 10.00, image: "assets/img/clop.jpg", category: "autres" }
];

async function loadProducts() {
    let displayList = [...productsList]; // Liste de secours (locale)
    
    // Tente de récupérer les articles dynamiques créés dans le panel Admin (Firebase)
    try {
        const snap = await getDocs(collection(db, "products"));
        if (!snap.empty) {
            displayList = [];
            snap.forEach(doc => displayList.push({ id: doc.id, ...doc.data() }));
        }
    } catch (e) {
        console.warn("Utilisation de la liste constante locale (Firebase non connecté).", e);
    }

    const lists = {
        boissons: document.getElementById('list-boissons'),
        snacks: document.getElementById('list-snacks'),
        autres: document.getElementById('list-autres')
    };

    displayList.forEach(product => {
        const item = document.createElement('div');
        item.className = 'product-item';
        item.innerHTML = `
            <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/40x60/333/fff?text=?'">
            <div class="product-info">
                <h4>${product.name}</h4>
                <p style="color:var(--neon-blue); font-weight:bold; font-size:1.1em; margin-top:5px;">${product.price.toFixed(2)} €</p>
                <div style="display:flex; gap:10px; margin-top:5px; color:#555; font-size:0.8em;">
                    <i class="fas fa-box"></i>
                    <i class="fas fa-candy-cane"></i>
                </div>
            </div>
            <div class="product-actions" style="display:flex; flex-direction:column; gap:10px;">
                <button class="icon-btn" onclick="window.addToCart('${product.id}', '${product.name.replace(/'/g, "\\'")}', ${product.price})"><i class="fas fa-shopping-basket"></i></button>
            </div>
        `;
        
        if (lists[product.category]) {
            lists[product.category].appendChild(item);
        }
    });

}

window.addToCart = (id, name, price) => {
    cart.push({ id, name, price });
    localStorage.setItem('noctushop-cart', JSON.stringify(cart));
    updateCartUI();
};

function updateCartUI() {
    const badge = document.getElementById('cart-badge');
    badge.textContent = cart.length;
    
    // Total calculation
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    console.log(`Panier mis à jour. Total: ${total.toFixed(2)}€`);
    
    // UI du modal
    const cartList = document.getElementById('cart-items-list');
    const totalPriceEl = document.getElementById('cart-total-price');
    if(cartList && totalPriceEl) {
        cartList.innerHTML = '';
        if(cart.length === 0) {
            cartList.innerHTML = '<p style="text-align:center; color:#ccc;">Votre panier est vide.</p>';
        } else {
            cart.forEach((item, index) => {
                const div = document.createElement('div');
                div.style.display = 'flex';
                div.style.justifyContent = 'space-between';
                div.style.alignItems = 'center';
                div.style.padding = '10px 0';
                div.style.borderBottom = '1px solid rgba(255,0,255,0.2)';
                
                div.innerHTML = `
                    <span>${item.name}</span>
                    <span>${item.price.toFixed(2)} €</span>
                    <button onclick="window.removeFromCart(${index})" style="background:none; border:none; color:var(--neon-pink); cursor:pointer;"><i class="fas fa-trash"></i></button>
                `;
                cartList.appendChild(div);
            });
        }
        totalPriceEl.textContent = total.toFixed(2);
    }
}

window.removeFromCart = (index) => {
    cart.splice(index, 1);
    localStorage.setItem('noctushop-cart', JSON.stringify(cart));
    updateCartUI();
};

// Gestion de l'ouverture / fermeture du Modal Panier
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('cart-modal');
    const btnPanierNav = document.getElementById('btn-panier');
    const btnPanierFloat = document.getElementById('floating-cart');
    const closeBtn = document.getElementById('close-cart');
    const orderForm = document.getElementById('order-form');

    // Auto-fill form if user is logged in and has a profile
    onAuthStateChanged(auth, async (user) => {
        if(user && orderForm) {
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);
            if(docSnap.exists()) {
                const data = docSnap.data();
                if(data.name) document.getElementById('order-name').value = data.name;
                if(data.phone) document.getElementById('order-phone').value = data.phone;
                if(data.address) document.getElementById('order-address').value = data.address;
            }
        }
    });

    if(btnPanierNav) btnPanierNav.addEventListener('click', (e) => { e.preventDefault(); modal.style.display = 'block'; });
    if(btnPanierFloat) btnPanierFloat.addEventListener('click', () => { modal.style.display = 'block'; });
    if(closeBtn) closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });

    window.addEventListener('click', (e) => {
        if (e.target == modal) {
            modal.style.display = 'none';
        }
    });

    if(orderForm) {
        orderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if(cart.length === 0) {
                alert("Votre panier est vide !");
                return;
            }
            
            const btnSubmit = document.getElementById('btn-valider-commande');
            btnSubmit.textContent = "ENVOI EN COURS...";
            btnSubmit.disabled = true;

            const nom = document.getElementById('order-name').value;
            const tel = document.getElementById('order-phone').value;
            const adresse = document.getElementById('order-address').value;
            const total = cart.reduce((sum, item) => sum + item.price, 0);

            try {
                // Créer la commande dans Firestore
                const newOrderRef = await addDoc(collection(db, "orders"), {
                    customerName: nom,
                    phone: tel,
                    address: adresse,
                    items: cart,
                    total: total,
                    status: "en_attente",
                    createdAt: serverTimestamp()
                });

                alert("Commande validée avec succès ! Le livreur est en route.");
                
                // Vider le panier
                cart = [];
                localStorage.setItem('noctushop-cart', JSON.stringify(cart));
                updateCartUI();
                modal.style.display = 'none';
                orderForm.reset();

                // Démarrer l'écoute de cette commande précise ("Live Tracker")
                localStorage.setItem('activeOrderId', newOrderRef.id);
                trackActiveOrder(newOrderRef.id);

            } catch (error) {
                console.error("Erreur commande: ", error);
                alert("Erreur lors de la validation de la commande.");
            } finally {
                btnSubmit.textContent = "VALIDER LA COMMANDE";
                btnSubmit.disabled = false;
            }
        });
    }
});

// Variables pour la carte et le scooter
let map;
let scooterMarker;
const avignonCenter = [43.9493, 4.8055]; // Centre d'Avignon
const routeCoords = [
    [43.9493, 4.8055],
    [43.9480, 4.8060],
    [43.9465, 4.8065],
    [43.9450, 4.8070],
    [43.9435, 4.8075]
];

function initMapTracker() {
    // Si la carte n'existe pas dans le DOM (ex: sur une autre page) ou si Leaflet n'est pas chargé
    if (!document.getElementById('map') || typeof L === 'undefined') return;

    // Initialisation de la carte (Leaflet/OpenStreetMap pour ne pas avoir besoin de CB et de clé API payante)
    map = L.map('map', {
        zoomControl: false, // Plus épuré
        dragging: false, // Bloque la navigation
        scrollWheelZoom: false
    }).setView(avignonCenter, 14);

    // Tuiles de carte sombres (CartoDB Dark Matter) pour coller au thème Cyberpunk
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    // Tracé au sol (Pink Neon Line)
    L.polyline(routeCoords, {
        color: '#ff00ff',
        weight: 4,
        opacity: 0.8,
        dashArray: '10, 10',
        lineJoin: 'round'
    }).addTo(map);

    // Icône personnalisée Scooter 🛵
    const scooterIcon = L.divIcon({
        html: '<div style="font-size: 30px; text-shadow: 0 0 10px #00ffff; filter: hue-rotate(180deg);">🛵</div>',
        className: 'custom-scooter-icon',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    });

    // Curseur livreur initial
    scooterMarker = L.marker(avignonCenter, { icon: scooterIcon }).addTo(map);

    // Initialiser le traçage si une commande est en attente/en cours
    const activeOrderId = localStorage.getItem('activeOrderId');
    if(activeOrderId) {
        trackActiveOrder(activeOrderId);
    }
}

// Fonction pour écouter la progression d'une commande et le GPS du livreur
function trackActiveOrder(orderId) {
    const statusEl = document.getElementById('tracker-status');
    const orderDoc = doc(db, "orders", orderId);

    onSnapshot(orderDoc, (docSnap) => {
        if(docSnap.exists()) {
            const data = docSnap.data();

            if(data.status === "en_attente") {
                if(statusEl) {
                    statusEl.textContent = "⏳ Commande en attente d'un livreur...";
                    statusEl.style.color = "var(--neon-yellow)";
                }
            } else if (data.status === "en_cours") {
                if(statusEl) {
                    statusEl.textContent = "🛵 Le livreur est en route !";
                    statusEl.style.color = "var(--neon-pink)";
                }

                // Maj la position du GPS du livreur depuis Firestore
                if(data.driverLocation && scooterMarker) {
                    const latlng = [data.driverLocation.lat, data.driverLocation.lng];
                    scooterMarker.setLatLng(latlng);
                    map.panTo(latlng);
                }
            } else if (data.status === "livree") {
                if(statusEl) {
                    statusEl.textContent = "✅ Commande livrée ! Bon appétit.";
                    statusEl.style.color = "var(--neon-blue)";
                }
                localStorage.removeItem('activeOrderId'); // Libérer
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();
    loadProducts();
    setTimeout(initMapTracker, 500); // Petit délai pour laisser le conteneur #map apparaitre correctement
});

// Update cart badge when clicking
window.addEventListener('storage', () => {
    cart = JSON.parse(localStorage.getItem('noctushop-cart')) || [];
    updateCartUI();
});
import { seedDatabase } from './init-db.js';
seedDatabase();