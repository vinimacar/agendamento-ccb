import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCaWW7-M5Qg3kz6JFnJIhz4xZB6R3KVW4Q",
  authDomain: "agendaccb.firebaseapp.com",
  projectId: "agendaccb",
  storageBucket: "agendaccb.firebasestorage.app",
  messagingSenderId: "460664684893",
  appId: "1:460664684893:web:95cbf4caa0a73aa01fa59f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addRehearsals() {
  try {
    console.log('Buscando congregações...');
    
    // 1. Adicionar Chaveslândia em Santa Vitória (ensaio local)
    const santaVitoriaQuery = query(
      collection(db, 'congregations'),
      where('name', '==', 'Santa Vitória')
    );
    const santaVitoriaSnapshot = await getDocs(santaVitoriaQuery);
    
    if (!santaVitoriaSnapshot.empty) {
      const santaVitoriaDoc = santaVitoriaSnapshot.docs[0];
      const santaVitoriaData = santaVitoriaDoc.data();
      
      console.log('Santa Vitória encontrada:', santaVitoriaData.name);
      
      // Verificar se já existe o ensaio de Chaveslândia
      const chaveslandiaExists = santaVitoriaData.rehearsals?.some(r => 
        r.type === 'Local' && r.day?.toLowerCase().includes('chavelândia')
      );
      
      if (!chaveslandiaExists) {
        const updatedRehearsals = [
          ...(santaVitoriaData.rehearsals || []),
          {
            type: 'Local',
            day: 'Terça-feira',  // Baseado na imagem anexada
            time: '19:30',
            repeats: true
          }
        ];
        
        await updateDoc(doc(db, 'congregations', santaVitoriaDoc.id), {
          rehearsals: updatedRehearsals,
          updatedAt: new Date()
        });
        
        console.log('✅ Ensaio Local de Chaveslândia adicionado em Santa Vitória');
      } else {
        console.log('⚠️ Ensaio de Chaveslândia já existe em Santa Vitória');
      }
    } else {
      console.log('❌ Santa Vitória não encontrada');
    }
    
    // 2. Adicionar ensaios DARPE na Central de Ituiutaba
    const centralQuery = query(
      collection(db, 'congregations'),
      where('name', '==', 'Central'),
      where('city', '==', 'Ituiutaba')
    );
    const centralSnapshot = await getDocs(centralQuery);
    
    if (!centralSnapshot.empty) {
      const centralDoc = centralSnapshot.docs[0];
      const centralData = centralDoc.data();
      
      console.log('Central de Ituiutaba encontrada:', centralData.name);
      
      // Verificar se já existe ensaio DARPE
      const darpeExists = centralData.rehearsals?.some(r => r.type === 'DARPE');
      
      if (!darpeExists) {
        const updatedRehearsals = [
          ...(centralData.rehearsals || []),
          {
            type: 'DARPE',
            day: 'Terça-feira',  // Baseado na imagem anexada
            time: '19:30',
            repeats: true
          }
        ];
        
        await updateDoc(doc(db, 'congregations', centralDoc.id), {
          rehearsals: updatedRehearsals,
          updatedAt: new Date()
        });
        
        console.log('✅ Ensaio DARPE adicionado na Central de Ituiutaba');
      } else {
        console.log('⚠️ Ensaio DARPE já existe na Central de Ituiutaba');
      }
    } else {
      console.log('❌ Central de Ituiutaba não encontrada');
    }
    
    console.log('\n✅ Script concluído com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao adicionar ensaios:', error);
    process.exit(1);
  }
}

addRehearsals();
