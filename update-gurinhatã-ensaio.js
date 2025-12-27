// Script para atualizar o ensaio de Gurinhatã de Regional para Geral
// Execute com: node update-gurinhatã-ensaio.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';

// Configuração do Firebase (mesma do src/lib/firebase.ts)
const firebaseConfig = {
  apiKey: "AIzaSyAjHOCcTHo_KgvJFaUCLyBOyFYuH8kCPnw",
  authDomain: "agendaccb-b3889.firebaseapp.com",
  projectId: "agendaccb-b3889",
  storageBucket: "agendaccb-b3889.firebasestorage.app",
  messagingSenderId: "603867060556",
  appId: "1:603867060556:web:5f0b62cc59b1d681fb4fd4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateGurinhatãEnsaio() {
  try {
    console.log('Buscando congregação de Gurinhatã...');
    
    // Buscar congregação de Gurinhatã
    const congregationsRef = collection(db, 'congregations');
    const q = query(congregationsRef, where('city', '==', 'Gurinhatã'));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('❌ Congregação de Gurinhatã não encontrada.');
      console.log('Listando todas as congregações para verificar o nome correto...');
      
      const allCongregations = await getDocs(collection(db, 'congregations'));
      allCongregations.forEach(doc => {
        const data = doc.data();
        console.log(`- ${data.name} (Cidade: ${data.city})`);
      });
      return;
    }
    
    let updated = false;
    
    for (const congregationDoc of querySnapshot.docs) {
      const congregationData = congregationDoc.data();
      console.log(`\nCongregação encontrada: ${congregationData.name} (ID: ${congregationDoc.id})`);
      
      if (!congregationData.rehearsals || congregationData.rehearsals.length === 0) {
        console.log('⚠️ Esta congregação não tem ensaios cadastrados.');
        continue;
      }
      
      // Procurar pelo ensaio agendado para 24/05/2026
      const updatedRehearsals = congregationData.rehearsals.map(rehearsal => {
        // Verificar se é o ensaio de 24/05/2026
        if (rehearsal.recurrenceType === 'Agendado' && rehearsal.date) {
          const rehearsalDate = rehearsal.date.toDate ? rehearsal.date.toDate() : new Date(rehearsal.date);
          const targetDate = new Date(2026, 4, 24); // 24/05/2026 (mês é 0-indexed)
          
          // Comparar datas
          if (rehearsalDate.getFullYear() === targetDate.getFullYear() &&
              rehearsalDate.getMonth() === targetDate.getMonth() &&
              rehearsalDate.getDate() === targetDate.getDate()) {
            
            console.log(`\n📅 Ensaio encontrado: ${rehearsal.date.toDate ? rehearsal.date.toDate().toLocaleDateString('pt-BR') : new Date(rehearsal.date).toLocaleDateString('pt-BR')}`);
            console.log(`   Tipo atual: ${rehearsal.type}`);
            
            if (rehearsal.type !== 'Geral') {
              console.log(`   ➡️ Alterando tipo de "${rehearsal.type}" para "Geral"`);
              updated = true;
              return { ...rehearsal, type: 'Geral' };
            } else {
              console.log('   ✅ Tipo já está correto (Geral)');
            }
          }
        }
        return rehearsal;
      });
      
      if (updated) {
        // Atualizar documento no Firestore
        const docRef = doc(db, 'congregations', congregationDoc.id);
        await updateDoc(docRef, {
          rehearsals: updatedRehearsals,
          updatedAt: new Date()
        });
        
        console.log('\n✅ Ensaio atualizado com sucesso!');
      } else {
        console.log('\n⚠️ Ensaio agendado para 24/05/2026 não encontrado.');
        console.log('Ensaios cadastrados:');
        congregationData.rehearsals.forEach((r, idx) => {
          if (r.recurrenceType === 'Agendado' && r.date) {
            const date = r.date.toDate ? r.date.toDate() : new Date(r.date);
            console.log(`  ${idx + 1}. ${date.toLocaleDateString('pt-BR')} - ${r.type} - ${r.time}`);
          } else {
            console.log(`  ${idx + 1}. ${r.recurrenceType} - ${r.type} - ${r.day || 'N/A'} - ${r.time}`);
          }
        });
      }
    }
    
    if (!updated) {
      console.log('\n💡 Dica: Se o ensaio não existe, você pode cadastrá-lo na aba "Congregações > Ensaios" do sistema.');
    }
    
  } catch (error) {
    console.error('❌ Erro ao atualizar ensaio:', error);
  }
}

updateGurinhatãEnsaio()
  .then(() => {
    console.log('\n✨ Script finalizado.');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
