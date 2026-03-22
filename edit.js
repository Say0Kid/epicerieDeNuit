import { db } from './firebase-config.js';
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// === CLÉ API POUR L'HEBERGEMENT D'IMAGES GRATUIT IMGBB ===
const IMGBB_API_KEY = 'ee05519e27dc9aaab6a98fc55203bf9a';

// Récupérer l'ID du produit depuis l'URL (ex: edit.html?id=12345)
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');

const form = document.getElementById('edit-product-form');
const loadingMsg = document.getElementById('loading-msg');
const previewImg = document.getElementById('edit-preview');

if (!productId) {
    loadingMsg.textContent = "Erreur : Aucun identifiant produit fourni.";
    loadingMsg.style.color = "red";
} else {
    loadProductData();
}

async function loadProductData() {
    try {
        const docRef = doc(db, "products", productId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Remplir le formulaire
            document.getElementById('edit-id').value = docSnap.id;
            document.getElementById('edit-name').value = data.name;
            document.getElementById('edit-price').value = data.price;
            document.getElementById('edit-cat').value = data.category;
            document.getElementById('edit-image').value = data.image;
            
            // Afficher l'image de prévisualisation
            previewImg.src = data.image;
            previewImg.onerror = () => previewImg.src = 'https://via.placeholder.com/80?text=?';

            // Afficher le formulaire et masquer le chargement
            loadingMsg.style.display = "none";
            form.style.display = "flex";
        } else {
            loadingMsg.textContent = "Erreur : Produit introuvable en base de données.";
            loadingMsg.style.color = "red";
        }
    } catch (error) {
        console.error("Erreur lors de la récupération:", error);
        loadingMsg.textContent = "Erreur lors de la connexion à Firebase.";
        loadingMsg.style.color = "red";
    }
}

let selectedFile = null;
const fileInput = document.getElementById('edit-file-input');
const dropzone = document.getElementById('edit-dropzone');
const dropzoneText = document.getElementById('edit-dropzone-text');
const imageHiddenInput = document.getElementById('edit-image');

// Drag and Drop effects
dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.background = 'rgba(0, 255, 255, 0.2)';
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
        
        // Local preview
        const reader = new FileReader();
        reader.onload = (e) => { previewImg.src = e.target.result; }
        reader.readAsDataURL(selectedFile);
    }
});

// Click Select effect
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        selectedFile = e.target.files[0];
        dropzoneText.textContent = "✅ " + selectedFile.name;
        
        // Local preview
        const reader = new FileReader();
        reader.onload = (e) => { previewImg.src = e.target.result; }
        reader.readAsDataURL(selectedFile);
    }
});

// Sauvegarde des modifications
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btnSave = document.getElementById('btn-save');
    const originalText = btnSave.textContent;
    btnSave.textContent = "SAUVEGARDE EN COURS...";
    btnSave.disabled = true;

    try {
        const id = document.getElementById('edit-id').value;
        let finalImageUrl = imageHiddenInput.value;

        // Upload nouvelle image si modifiée vers ImgBB
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
            } else {
                throw new Error("Erreur d'envoi ImgBB : Vérifiez votre clé API");
            }
        }

        await updateDoc(doc(db, "products", id), {
            name: document.getElementById('edit-name').value,
            price: parseFloat(document.getElementById('edit-price').value),
            category: document.getElementById('edit-cat').value,
            image: finalImageUrl
        });
        
        alert("Produit mis à jour avec succès !");
        window.location.href = "admin.html"; // Retour au panel
    } catch (error) {
        console.error("Erreur lors de la mise à jour:", error);
        alert("Erreur lors de la sauvegarde.");
    } finally {
        btnSave.textContent = originalText;
        btnSave.disabled = false;
    }
});