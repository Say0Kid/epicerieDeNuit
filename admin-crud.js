import { db } from './firebase-config.js';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// === CLÉ API POUR L'HEBERGEMENT D'IMAGES GRATUIT IMGBB ===
// Allez sur https://api.imgbb.com/ pour obtenir une clé gratuitement
const IMGBB_API_KEY = 'ee05519e27dc9aaab6a98fc55203bf9a';

const tbody = document.getElementById('admin-prod-list');
const form = document.getElementById('add-product-form');

// Fonction pour supprimer un produit
window.delProd = async (id) => {
    if(confirm("Êtes-vous sûr de vouloir supprimer définitivement ce produit ?")) {
        try {
            await deleteDoc(doc(db, "products", id));
            fetchAdminProducts(); // Rafraichir la liste
        } catch(e) {
            alert("Erreur lors de la suppression. Vérifiez les permissions Firebase.");
            console.error(e);
        }
    }
};

// Redirection vers la nouvelle page d'édition
window.editProd = (id) => {
    window.location.href = `edit.html?id=${id}`;
};

// Fetch et affichage liste
async function fetchAdminProducts() {
    try {
        const snap = await getDocs(collection(db, "products"));
        tbody.innerHTML = "";
        
        if(snap.empty) {
            tbody.innerHTML = "<tr><td colspan='5' style='text-align:center;'>Aucun produit dans la base de données.</td></tr>";
            return;
        }
        
        snap.forEach(d => {
            const p = d.data();
            tbody.innerHTML += `
                <tr>
                    <td><img src="${p.image}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/40x40/333/fff?text=?'"></td>
                    <td style="font-weight:bold;">${p.name}</td>
                    <td>${Number(p.price).toFixed(2)} €</td>
                    <td style="text-transform:capitalize;">${p.category}</td>
                    <td>
                        <button class="btn-edit" onclick="window.editProd('${d.id}')">
                            <i class="fas fa-edit"></i> Modifier
                        </button>
                        <button class="btn-danger" onclick="window.delProd('${d.id}')">
                            <i class="fas fa-trash"></i> Supprimer
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch(e) {
        tbody.innerHTML = `<tr><td colspan='5' style='color:red; text-align:center;'>
            Erreur de lecture Firestore. Assurez-vous que les règles de votre base de données sont ouvertes (Test Mode).
        </td></tr>`;
        console.error(e);
    }
}

if(form) {
    let selectedFile = null;
    const fileInput = document.getElementById('file-input');
    const dropzone = document.getElementById('dropzone');
    const dropzoneText = document.getElementById('dropzone-text');
    const imageHiddenInput = document.getElementById('p-image');

    // Drag and Drop effects
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.style.background = 'rgba(255, 0, 255, 0.2)';
    });
    dropzone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropzone.style.background = 'transparent';
    });
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.background = 'transparent';
        if (e.dataTransfer.files.length > 0) {
            fileInput.files = e.dataTransfer.files;
            selectedFile = e.dataTransfer.files[0];
            dropzoneText.textContent = "✅ " + selectedFile.name;
        }
    });
    // Click Select effect
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            selectedFile = e.target.files[0];
            dropzoneText.textContent = "✅ " + selectedFile.name;
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('p-id').value;
        const name = document.getElementById('p-name').value;
        const price = parseFloat(document.getElementById('p-price').value);
        const category = document.getElementById('p-cat').value;
        
        const btnSubmit = document.getElementById('submit-btn');
        const originalText = btnSubmit.textContent;
        btnSubmit.textContent = "ATTENTE...";
        btnSubmit.disabled = true;

        try {
            let finalImageUrl = imageHiddenInput.value; // URL actuelle ou vide

            // S'il y a un nouveau fichier, on l'upload d'abord sur ImgBB !
            if (selectedFile) {
                dropzoneText.textContent = "⏳ Upload ImgBB en cours...";
                
                const formData = new FormData();
                formData.append("image", selectedFile);
                
                const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                    method: 'POST',
                    body: formData
                });
                
                const dataResponse = await response.json();
                
                if(dataResponse.success) {
                    finalImageUrl = dataResponse.data.url;
                    imageHiddenInput.value = finalImageUrl;
                    dropzoneText.textContent = "✅ " + selectedFile.name;
                } else {
                    throw new Error("Erreur d'envoi ImgBB : Vérifiez votre clé API");
                }
                
            } else if (!finalImageUrl && !id) {
                // Création SANS image
                alert("Erreur : vous devez ajouter une image pour créer un produit.");
                btnSubmit.textContent = originalText;
                btnSubmit.disabled = false;
                return;
            }

            if (id) {
                // UPDATE EXISANT
                await updateDoc(doc(db, "products", id), {
                    name: name,
                    price: price,
                    category: category,
                    image: finalImageUrl
                });
            } else {
                // CREATE NOUVEAU
                await addDoc(collection(db, "products"), {
                    name: name,
                    price: price,
                    category: category,
                    image: finalImageUrl
                });
            }
            
            // RESET
            form.reset();
            selectedFile = null;
            dropzoneText.textContent = "📸 Glissez une image ici ou cliquez";
                
            fetchAdminProducts(); // Rafraichit la table
        } catch (error) {
            alert("Erreur lors de l'enregistrement. Storage/Firestore non autorisé ?");
        } finally {
            btnSubmit.textContent = originalText;
            btnSubmit.disabled = false;
        }
    });
}

// --- GESTION DES ONGLETS ---
const tabProd = document.getElementById('tab-prod');
const tabCmd = document.getElementById('tab-cmd');
const sectProd = document.getElementById('section-produits');
const sectCmd = document.getElementById('section-commandes');

if(tabProd && tabCmd) {
    tabProd.addEventListener('click', () => {
        sectProd.style.display = 'block';
        sectCmd.style.display = 'none';
        tabProd.style.boxShadow = '0 0 10px var(--neon-pink)';
        tabCmd.style.boxShadow = 'none';
    });
    
    tabCmd.addEventListener('click', () => {
        sectProd.style.display = 'none';
        sectCmd.style.display = 'block';
        tabCmd.style.boxShadow = '0 0 10px var(--neon-blue)';
        tabProd.style.boxShadow = 'none';
        fetchAdminOrders(); // Charger les commandes à l'ouverture de l'onglet
    });
}

// --- GESTION DES COMMANDES ---
async function fetchAdminOrders() {
    const ordersTbody = document.getElementById('admin-orders-list');
    if(!ordersTbody) return;

    try {
        const snap = await getDocs(collection(db, "orders"));
        ordersTbody.innerHTML = "";
        
        if (snap.empty) {
            ordersTbody.innerHTML = "<tr><td colspan='7' style='text-align:center;'>Aucune commande pour le moment.</td></tr>";
            return;
        }

        // Trier les commandes (les plus récentes d'abord)
        const ordersData = snap.docs.map(doc => ({id: doc.id, ...doc.data()}));
        ordersData.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());

        ordersData.forEach(o => {
            const tr = document.createElement('tr');
            
            // Format de la date
            const dateStr = o.createdAt ? new Date(o.createdAt.toMillis()).toLocaleString('fr-FR') : "Date inconnue";
            
            // Format des articles
            let articlesStr = o.items ? o.items.map(i => `- ${i.name} (${i.price}€)`).join('<br>') : "Aucun article";

            // Sélecteur de statut avec couleur dynamique
            let statusColor = "white";
            if(o.status === "en_attente") statusColor = "var(--neon-pink)";
            if(o.status === "en_cours") statusColor = "var(--neon-blue)";
            if(o.status === "livree") statusColor = "var(--neon-yellow)";

            tr.innerHTML = `
                <td style="font-size: 0.9em; color:#ccc;">${dateStr}</td>
                <td><strong>${o.customerName || "Inconnu"}</strong><br><span style="color:var(--neon-blue);">${o.phone || ""}</span></td>
                <td><i class="fas fa-map-marker-alt" style="color:var(--neon-pink);"></i> ${o.address || "Aucune"}</td>
                <td style="font-size: 0.85em; text-align:left;">${articlesStr}</td>
                <td style="font-weight:bold; color:var(--neon-yellow);">${Number(o.total || 0).toFixed(2)} €</td>
                <td>
                    <select class="neon-input order-status-select" data-id="${o.id}" style="width:120px; font-size:12px; color:${statusColor}; border-color:${statusColor};">
                        <option value="en_attente" ${o.status === 'en_attente' ? 'selected' : ''} style="color:black;">En attente</option>
                        <option value="en_cours" ${o.status === 'en_cours' ? 'selected' : ''} style="color:black;">En cours / Livreur</option>
                        <option value="livree" ${o.status === 'livree' ? 'selected' : ''} style="color:black;">Livrée</option>
                    </select>
                </td>
                <td>
                    <button class="btn-danger" style="padding: 5px 10px; font-size: 12px; width:auto;" onclick="window.delOrder('${o.id}')">
                        <i class="fas fa-times"></i>
                    </button>
                </td>
            `;
            ordersTbody.appendChild(tr);
        });

        // Ajouter écouteurs pour changement de statut
        document.querySelectorAll('.order-status-select').forEach(select => {
            select.addEventListener('change', async (e) => {
                const newStatus = e.target.value;
                const orderId = e.target.getAttribute('data-id');
                try {
                    await updateDoc(doc(db, "orders", orderId), { status: newStatus });
                    // Mettre à jour la couleur du select
                    if(newStatus === "en_attente") { e.target.style.color = "var(--neon-pink)"; e.target.style.borderColor = "var(--neon-pink)"; }
                    if(newStatus === "en_cours") { e.target.style.color = "var(--neon-blue)"; e.target.style.borderColor = "var(--neon-blue)"; }
                    if(newStatus === "livree") { e.target.style.color = "var(--neon-yellow)"; e.target.style.borderColor = "var(--neon-yellow)"; }
                } catch(err) {
                    console.error("Erreur màj statut:", err);
                    alert("Erreur lors de la mise à jour du statut.");
                }
            });
        });

    } catch(e) {
        ordersTbody.innerHTML = "<tr><td colspan='7' style='color:red;'>Erreur chargement</td></tr>";
        console.error(e);
    }
}

// Fonction pour archiver/supprimer une commande
window.delOrder = async (id) => {
    if(confirm("Supprimer cette commande de l'historique ?")) {
        try {
            await deleteDoc(doc(db, "orders", id));
            fetchAdminOrders();
        } catch(e) {
            console.error(e);
            alert("Erreur lors de la suppression");
        }
    }
}

// Charger la liste au démarrage du script
fetchAdminProducts();
