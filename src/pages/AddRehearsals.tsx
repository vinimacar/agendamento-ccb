import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

export default function AddRehearsals() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleAddRehearsals = async () => {
    setLoading(true);
    setLog([]);
    
    try {
      addLog('Iniciando processo...');
      
      // 1. Adicionar Chaveslândia em Santa Vitória (ensaio local)
      addLog('Buscando Santa Vitória...');
      const santaVitoriaQuery = query(
        collection(db, 'congregations'),
        where('name', '==', 'Santa Vitória')
      );
      const santaVitoriaSnapshot = await getDocs(santaVitoriaQuery);
      
      if (!santaVitoriaSnapshot.empty) {
        const santaVitoriaDoc = santaVitoriaSnapshot.docs[0];
        const santaVitoriaData = santaVitoriaDoc.data();
        
        addLog(`✅ Santa Vitória encontrada: ${santaVitoriaData.name} - ${santaVitoriaData.city}`);
        
        // Verificar se já existe o ensaio Local
        const hasLocal = santaVitoriaData.rehearsals?.some((r) => 
          r.type === 'Local'
        );
        
        if (!hasLocal) {
          const updatedRehearsals = [
            ...(santaVitoriaData.rehearsals || []),
            {
              type: 'Local',
              day: 'Terça-feira',
              time: '19:30',
              repeats: true,
              recurrenceType: 'Semanal',
              months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
            }
          ];
          
          await updateDoc(doc(db, 'congregations', santaVitoriaDoc.id), {
            rehearsals: updatedRehearsals,
            updatedAt: new Date()
          });
          
          addLog('✅ Ensaio Local (Chaveslândia) adicionado em Santa Vitória');
        } else {
          addLog('⚠️ Ensaio Local já existe em Santa Vitória');
        }
      } else {
        addLog('❌ Santa Vitória não encontrada');
      }
      
      // 2. Adicionar ensaios DARPE na Central de Ituiutaba
      addLog('Buscando Central de Ituiutaba...');
      const centralQuery = query(
        collection(db, 'congregations'),
        where('city', '==', 'Ituiutaba')
      );
      const centralSnapshot = await getDocs(centralQuery);
      
      let centralFound = false;
      for (const congregationDoc of centralSnapshot.docs) {
        const congregationData = congregationDoc.data();
        
        if (congregationData.name.toLowerCase().includes('central')) {
          centralFound = true;
          addLog(`✅ Central encontrada: ${congregationData.name} - ${congregationData.city}`);
          
          // Verificar se já existe ensaio DARPE
          const hasDARPE = congregationData.rehearsals?.some((r) => r.type === 'DARPE');
          
          if (!hasDARPE) {
            const updatedRehearsals = [
              ...(congregationData.rehearsals || []),
              {
                type: 'DARPE',
                day: 'Terça-feira',
                time: '19:30',
                repeats: true,
                recurrenceType: 'Semanal',
                months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
              }
            ];
            
            await updateDoc(doc(db, 'congregations', congregationDoc.id), {
              rehearsals: updatedRehearsals,
              updatedAt: new Date()
            });
            
            addLog('✅ Ensaio DARPE adicionado na Central de Ituiutaba');
          } else {
            addLog('⚠️ Ensaio DARPE já existe na Central de Ituiutaba');
          }
          break;
        }
      }
      
      if (!centralFound) {
        addLog('❌ Central de Ituiutaba não encontrada');
      }
      
      addLog('');
      addLog('✅ Processo concluído!');
      
      toast({
        title: 'Ensaios adicionados',
        description: 'Os ensaios foram adicionados com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao adicionar ensaios:', error);
      addLog(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      
      toast({
        title: 'Erro',
        description: 'Erro ao adicionar ensaios. Verifique o console.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Ensaios</CardTitle>
            <CardDescription>
              Adicionar Chaveslândia em Santa Vitória e DARPE na Central de Ituiutaba
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleAddRehearsals} 
              disabled={loading}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Adicionar Ensaios
            </Button>
            
            {log.length > 0 && (
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Log de Execução:</h3>
                <div className="space-y-1 font-mono text-xs">
                  {log.map((line, index) => (
                    <div key={index} className={
                      line.includes('✅') ? 'text-green-600' :
                      line.includes('⚠️') ? 'text-yellow-600' :
                      line.includes('❌') ? 'text-red-600' :
                      'text-gray-600'
                    }>
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
