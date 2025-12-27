// Script para atualizar eventos antigos com o campo congregationCity
// Execute este script UMA VEZ no console do Firebase ou localmente

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';

// Cole aqui sua configuração do Firebase
const firebaseConfig = {
  // Suas credenciais aqui
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateEventsCities() {
  try {
    console.log('Iniciando atualização de cidades nos eventos...');
    
    // Buscar todos os eventos
    const eventsSnapshot = await getDocs(collection(db, 'events'));
    const congregationsSnapshot = await getDocs(collection(db, 'congregations'));
    
    // Criar mapa de congregações
    const congregationsMap = new Map();
    congregationsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      congregationsMap.set(doc.id, {
        name: data.name,
        city: data.city
      });
    });
    
    let updated = 0;
    let skipped = 0;
    
    // Atualizar eventos
    for (const eventDoc of eventsSnapshot.docs) {
      const eventData = eventDoc.data();
      
      // Se já tem cidade, pular
      if (eventData.congregationCity) {
        skipped++;
        continue;
      }
      
      // Se tem congregationId, buscar a cidade
      if (eventData.congregationId) {
        const congregation = congregationsMap.get(eventData.congregationId);
        
        if (congregation && congregation.city) {
          await updateDoc(doc(db, 'events', eventDoc.id), {
            congregationCity: congregation.city
          });
          console.log(`✓ Evento "${eventData.title}" atualizado com cidade: ${congregation.city}`);
          updated++;
        }
      }
    }
    
    console.log(`\n✅ Atualização concluída!`);
    console.log(`   Eventos atualizados: ${updated}`);
    console.log(`   Eventos já tinham cidade: ${skipped}`);
    
  } catch (error) {
    console.error('❌ Erro ao atualizar eventos:', error);
  }
}

// Para reforços de coletas
async function updateReforcosCities() {
  try {
    console.log('\nIniciando atualização de cidades nos reforços...');
    
    const reforcosSnapshot = await getDocs(collection(db, 'reforco-schedules'));
    const congregationsSnapshot = await getDocs(collection(db, 'congregations'));
    
    const congregationsMap = new Map();
    congregationsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      congregationsMap.set(doc.id, {
        name: data.name,
        city: data.city
      });
    });
    
    let updated = 0;
    let skipped = 0;
    
    for (const reforcoDoc of reforcosSnapshot.docs) {
      const reforcoData = reforcoDoc.data();
      
      if (reforcoData.congregationCity) {
        skipped++;
        continue;
      }
      
      if (reforcoData.congregationId) {
        const congregation = congregationsMap.get(reforcoData.congregationId);
        
        if (congregation && congregation.city) {
          await updateDoc(doc(db, 'reforco-schedules', reforcoDoc.id), {
            congregationCity: congregation.city
          });
          console.log(`✓ Reforço da ${congregation.name} atualizado com cidade: ${congregation.city}`);
          updated++;
        }
      }
    }
    
    console.log(`\n✅ Atualização de reforços concluída!`);
    console.log(`   Reforços atualizados: ${updated}`);
    console.log(`   Reforços já tinham cidade: ${skipped}`);
    
  } catch (error) {
    console.error('❌ Erro ao atualizar reforços:', error);
  }
}

// Executar ambas as atualizações
async function updateAll() {
  await updateEventsCities();
  await updateReforcosCities();
}

updateAll();
