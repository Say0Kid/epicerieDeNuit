import { db } from './firebase-config.js';
import { collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

export const initialProducts = [
    { name: "Cristaline", price: 1.00, image: "assets/img/cristal.jpg", category: "boissons" },
    { name: "Coca-Cola", price: 2.00, image: "assets/img/coca.jpg", category: "boissons" },
    { name: "Capri-Sun", price: 1.00, image: "assets/img/capri.jpg", category: "boissons" },
    { name: "Chips", price: 1.00, image: "assets/img/chips.jpg", category: "snacks" },
    { name: "Bonbons", price: 3.50, image: "assets/img/bonbon.jpg", category: "snacks" },
    { name: "Twix", price: 1.50, image: "assets/img/twix.jpg", category: "snacks" },
    { name: "Mars", price: 1.50, image: "assets/img/mars.jpg", category: "snacks" },
    { name: "Magnum", price: 2.50, image: "assets/img/magnum.jpg", category: "autres" },
    { name: "Cornetto", price: 2.50, image: "assets/img/cornet.jpg", category: "autres" },
    { name: "Cigarettes", price: 10.00, image: "assets/img/clop.jpg", category: "autres" }
];

export async function seedDatabase() {
    const productsRef = collection(db, "products");
    const snapshot = await getDocs(productsRef);
    
    if (snapshot.empty) {
        console.log("Database empty, initializing products...");
        for (const product of initialProducts) {
            await addDoc(productsRef, product);
        }
        console.log("Database initialized with products.");
    } else {
        console.log("Database already contains products.");
    }
}
