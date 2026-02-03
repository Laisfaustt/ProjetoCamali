import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableNetwork } from 'firebase/firestore';
import { getStorage } from 'firebase/storage'; 

const firebaseConfig = {
  apiKey: "AIzaSyCLACIyBf9Ydi9MIQb4WPMjDs77z4pAjUM",
  authDomain: "camali-9aba9.firebaseapp.com",
  projectId: "camali-9aba9",
  
  // MUDANÇA AQUI: Geralmente projetos novos usam firebasestorage.app
  // Se não funcionar, verifique o passo 3 acima.
  storageBucket: "camali-9aba9.firebasestorage.app", 
  
  messagingSenderId: "314035915831",
  appId: "1:314035915831:web:4e87e99e25577e7819c3b2",
  measurementId: "G-NS18L2GDXK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Inicializa e exporta os serviços
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Garante conexão
enableNetwork(db);