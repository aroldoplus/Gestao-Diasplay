import React, { useState, useMemo, useEffect } from 'react';
import { INITIAL_CLIENTS } from './data';
import { Client, Program, Expense } from './types';
import { Search, Plus, Download, ChevronUp, ChevronDown, Users, Trash2, RotateCcw, X, LogOut, Moon, Sun, Radio, ReceiptText, Archive, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ClientRow } from './components/ClientRow';
import { ProgramRow } from './components/ProgramRow';
import { ExpenseRow } from './components/ExpenseRow';
import { ScheduleTable } from './components/ScheduleTable';
import { Login } from './components/Login';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';
import { db } from './lib/firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, query, where, writeBatch, getDocs, getDoc, deleteField } from 'firebase/firestore';

type SortField = 'name' | 'calls' | 'startDate' | 'endDate' | 'contractValue' | 'billingDate';
type SortDirection = 'asc' | 'desc';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [trash, setTrash] = useState<Client[]>([]);
  const [lixeira, setLixeira] = useState<Client[]>([]);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [isRealTrashOpen, setIsRealTrashOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ field: SortField; direction: SortDirection }>({
    field: 'name',
    direction: 'asc',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'clients' | 'bmn' | 'programs' | 'folgas' | 'expenses'>('clients');
  const [callCountFilter, setCallCountFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  
  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedMode = localStorage.getItem('brisamar_dark_mode');
        return savedMode === 'true';
      } catch (e) {
        console.error('LocalStorage access failed', e);
        return false;
      }
    }
    return false;
  });

  // Apply Dark Mode
  useEffect(() => {
    console.log('Dark mode changed:', isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      try {
        localStorage.setItem('brisamar_dark_mode', 'true');
      } catch (e) {
        console.error('LocalStorage write failed', e);
      }
    } else {
      document.documentElement.classList.remove('dark');
      try {
        localStorage.setItem('brisamar_dark_mode', 'false');
      } catch (e) {
        console.error('LocalStorage write failed', e);
      }
    }
  }, [isDarkMode]);
  
  // Add Client Modal State
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientCategory, setNewClientCategory] = useState<'clients' | 'bmn' | 'programs' | 'expenses'>('clients');
  const [newProgramTime, setNewProgramTime] = useState('');
  const [newProgramDetails, setNewProgramDetails] = useState('');
  const [newExpenseDescription, setNewExpenseDescription] = useState('');
  const [newExpenseValue, setNewExpenseValue] = useState('');
  const [newExpenseDate, setNewExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  // Calculate total contract value
  const totalContractValue = useMemo(() => {
    const calculateTotal = (list: Client[]): number => {
      return list.reduce((acc, client) => {
        // Only count active clients (not suspended)
        if (client.suspended) return acc;
        
        let clientTotal = client.contractValue || 0;
        if (client.subClients) {
          clientTotal += calculateTotal(client.subClients);
        }
        return acc + clientTotal;
      }, 0);
    };
    return calculateTotal(clients);
  }, [clients]);

  // Calculate total expenses
  const totalExpenses = useMemo(() => {
    return expenses.reduce((acc, expense) => acc + (expense.value || 0), 0);
  }, [expenses]);

  // Calculate total paid expenses
  const totalPaidExpenses = useMemo(() => {
    return expenses.reduce((acc, expense) => acc + (expense.paid ? (expense.value || 0) : 0), 0);
  }, [expenses]);

  // Check for existing session
  useEffect(() => {
    const session = localStorage.getItem('brisamar_session');
    if (session === 'active') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    localStorage.setItem('brisamar_session', 'active');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('brisamar_session');
    setIsAuthenticated(false);
  };

  // Initial Data Migration and Real-time Sync
  useEffect(() => {
    if (!isAuthenticated) return;

    const initializeData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "clients"));
        if (querySnapshot.empty) {
          console.log("Migrating initial data to Firestore...");
          const batch = writeBatch(db);
          INITIAL_CLIENTS.forEach((client) => {
            const docRef = doc(db, "clients", client.id);
            batch.set(docRef, { ...client, deleted: false });
          });
          await batch.commit();
        } else {
          // Check for new specific clients and add them if missing
          const existingDocs = querySnapshot.docs.map(d => d.data());
          const batch = writeBatch(db);
          let hasUpdates = false;
          
          const newClientNames = ["Dr leandro serafim", "policlinica N.S.C", "Laclimed"];
          
          newClientNames.forEach(name => {
             const exists = existingDocs.some(doc => doc.name === name);
             if (!exists) {
                const clientData = INITIAL_CLIENTS.find(c => c.name === name);
                if (clientData) {
                   const docRef = doc(db, "clients", clientData.id);
                   batch.set(docRef, { ...clientData, deleted: false });
                   hasUpdates = true;
                }
             }
          });
          
          if (hasUpdates) {
            console.log("Adding new clients to existing database...");
            await batch.commit();
          }
        }
      } catch (error) {
        console.error("Error initializing data:", error);
      }
    };

    initializeData();

    const timeoutId = setTimeout(() => {
      setError("O carregamento está demorando muito. Verifique sua conexão com a internet ou as permissões do banco de dados.");
      setLoading(false);
    }, 15000); // 15 seconds timeout

    const unsubscribe = onSnapshot(collection(db, "clients"), (snapshot) => {
      clearTimeout(timeoutId);
      const allDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
      setClients(allDocs.filter(c => !c.deleted && !c.inLixeira));
      setTrash(allDocs.filter(c => c.deleted && !c.inLixeira));
      setLixeira(allDocs.filter(c => c.inLixeira));
      setLoading(false);
      setError(null);
    }, (err) => {
      clearTimeout(timeoutId);
      console.error("Error fetching clients:", err);
      setError(`Erro ao carregar clientes: ${err instanceof Error ? err.message : String(err)}`);
      setLoading(false);
    });

    const unsubscribePrograms = onSnapshot(collection(db, "programs"), (snapshot) => {
      const allPrograms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Program));
      setPrograms(allPrograms.filter(p => !p.deleted));
    }, (err) => {
      console.error("Error fetching programs:", err);
    });

    const unsubscribeExpenses = onSnapshot(collection(db, "expenses"), (snapshot) => {
      const allExpenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
      setExpenses(allExpenses.filter(e => !e.deleted));
    }, (err) => {
      console.error("Error fetching expenses:", err);
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
      unsubscribePrograms();
      unsubscribeExpenses();
    };
  }, [isAuthenticated]);

  // Check for expired contracts
  useEffect(() => {
    if (!isAuthenticated || clients.length === 0) return;

    const checkExpiration = async () => {
      const today = new Date().toISOString().split('T')[0];
      const batch = writeBatch(db);
      let hasUpdates = false;

      clients.forEach(client => {
        // Check root client
        if (!client.suspended && client.endDate < today) {
          const docRef = doc(db, "clients", client.id);
          batch.update(docRef, { suspended: true });
          hasUpdates = true;
        }

        // Check sub-clients
        if (client.subClients) {
          let subClientsChanged = false;
          const updatedSubClients = client.subClients.map(sub => {
            if (!sub.suspended && sub.endDate < today) {
              subClientsChanged = true;
              return { ...sub, suspended: true };
            }
            return sub;
          });

          if (subClientsChanged) {
            const docRef = doc(db, "clients", client.id);
            batch.update(docRef, { subClients: updatedSubClients });
            hasUpdates = true;
          }
        }
      });

      if (hasUpdates) {
        console.log("Suspending expired contracts...");
        await batch.commit();
      }
    };

    checkExpiration();
  }, [clients, isAuthenticated]);

  const handleSort = (field: SortField) => {
    setSortConfig((current) => ({
      field,
      direction: current.field === field && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleUpdateClient = async (updatedClient: Client) => {
    // Check if it's a root client
    const rootClient = clients.find(c => c.id === updatedClient.id);
    if (rootClient) {
      await updateDoc(doc(db, "clients", updatedClient.id), { ...updatedClient });
      return;
    }

    // If not root, it might be a sub-client. We need to find its parent.
    // Since we don't have parent pointers, we iterate to find which root client contains this sub-client.
    // Note: This assumes only 1 level of nesting as per current data structure.
    for (const client of clients) {
      if (client.subClients) {
        const subIndex = client.subClients.findIndex(s => s.id === updatedClient.id);
        if (subIndex !== -1) {
          const newSubClients = [...client.subClients];
          newSubClients[subIndex] = updatedClient;
          await updateDoc(doc(db, "clients", client.id), { subClients: newSubClients });
          return;
        }
      }
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (confirm('Mover este cliente para clientes vencidos?')) {
      // Check if root client
      const rootClient = clients.find(c => c.id === id);
      if (rootClient) {
        await updateDoc(doc(db, "clients", id), { deleted: true });
        return;
      }

      // Check if sub-client
      for (const client of clients) {
        if (client.subClients) {
          const subClient = client.subClients.find(s => s.id === id);
          if (subClient) {
            // Remove from parent
            const newSubClients = client.subClients.filter(s => s.id !== id);
            await updateDoc(doc(db, "clients", client.id), { subClients: newSubClients });
            
            // Create new doc in trash (root level) with parentId
            await setDoc(doc(db, "clients", subClient.id), { ...subClient, deleted: true, parentId: client.id });
            return;
          }
        }
      }
    }
  };

  const handleRestoreClient = async (id: string) => {
    const clientToRestore = trash.find(c => c.id === id);
    if (clientToRestore) {
      if (clientToRestore.parentId) {
        // Try to restore to original parent
        const parentDocRef = doc(db, "clients", clientToRestore.parentId);
        const parentDoc = await getDoc(parentDocRef);
        
        if (parentDoc.exists()) {
           const parentData = parentDoc.data() as Client;
           // Remove deleted and parentId flags before adding back
           const { deleted, parentId, ...rest } = clientToRestore;
           const restoredClient = { ...rest, deleted: false };
           
           const newSubClients = [...(parentData.subClients || []), restoredClient];
           
           // Update parent with restored sub-client
           await updateDoc(parentDocRef, { subClients: newSubClients });
           
           // Delete the temporary trash document
           await deleteDoc(doc(db, "clients", id));
           return;
        }
      }
      
      // Fallback: Restore as root client if parent not found or no parentId
      await updateDoc(doc(db, "clients", id), { deleted: false, parentId: deleteField() });
    }
  };

  const handleMoveToLixeira = async (id: string) => {
    if (confirm('Mover para a lixeira?')) {
      await updateDoc(doc(db, "clients", id), { inLixeira: true });
    }
  };

  const handleRealPermanentDelete = async (id: string) => {
    if (confirm('Tem certeza? Esta ação não pode ser desfeita.')) {
      await deleteDoc(doc(db, "clients", id));
    }
  };

  const handleRestoreFromLixeira = async (id: string) => {
    await updateDoc(doc(db, "clients", id), { inLixeira: false });
  };

  const handleUpdateProgram = async (updatedProgram: Program) => {
    await updateDoc(doc(db, "programs", updatedProgram.id), { ...updatedProgram });
  };

  const handleUpdateExpense = async (updatedExpense: Expense) => {
    await updateDoc(doc(db, "expenses", updatedExpense.id), { ...updatedExpense });
  };

  const handleDeleteProgram = async (id: string) => {
    if (confirm('Tem certeza? Esta ação não pode ser desfeita.')) {
      await updateDoc(doc(db, "programs", id), { deleted: true });
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (confirm('Remover esta despesa?')) {
      await updateDoc(doc(db, "expenses", id), { deleted: true });
    }
  };

  const handleAddClient = () => {
    setNewClientName('');
    setNewProgramTime('');
    setNewProgramDetails('');
    setNewClientCategory(activeTab === 'expenses' ? 'clients' : activeTab); // Default to current tab, but not expenses
    setIsAddClientModalOpen(true);
  };

  const handleAddExpense = () => {
    setNewClientName('');
    setNewExpenseDescription('');
    setNewExpenseValue('');
    setNewExpenseDate(new Date().toISOString().split('T')[0]);
    setIsAddExpenseModalOpen(true);
  };

  const confirmAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newExpenseValue) return;

    const newId = `exp-${Date.now()}`;

    try {
      const newExpense: Expense = {
        id: newId,
        name: newClientName.trim(),
        description: newExpenseDescription,
        value: parseFloat(newExpenseValue) || 0,
        paymentDate: newExpenseDate,
        deleted: false,
        paid: false
      };
      await setDoc(doc(db, "expenses", newId), newExpense);
      setIsAddExpenseModalOpen(false);
    } catch (error) {
      console.error("Error adding expense:", error);
      alert("Erro ao adicionar despesa. Tente novamente.");
    }
  };

  const confirmAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    const newId = `new-${Date.now()}`;

    try {
      if (newClientCategory === 'programs') {
        const newProgram: Program = {
          id: newId,
          name: newClientName.trim(),
          time: newProgramTime,
          details: newProgramDetails,
          deleted: false
        };
        await setDoc(doc(db, "programs", newId), newProgram);
      } else {
        const newClientBase: Client = {
          id: newId,
          name: newClientName.trim(),
          calls: 0,
          startDate: new Date().toISOString().split('T')[0],
          endDate: '2026-12-31',
          deleted: false,
          contractValue: 0,
          billingDate: new Date().toISOString().split('T')[0],
          suspended: false
        };

        if (newClientCategory === 'clients') {
          // Add as regular client
          await setDoc(doc(db, "clients", newId), newClientBase);
        } else {
          // Add to Anunciantes BMN
          const bmnClient = clients.find(c => c.name === "Anunciantes BMN");
          if (bmnClient) {
            const newSubClients = [...(bmnClient.subClients || []), newClientBase];
            await updateDoc(doc(db, "clients", bmnClient.id), { subClients: newSubClients });
          } else {
            alert("Erro: Categoria 'Anunciantes BMN' não encontrada no sistema.");
            return;
          }
        }
      }
      setIsAddClientModalOpen(false);
    } catch (error) {
      console.error("Error adding item:", error);
      alert("Erro ao adicionar item. Tente novamente.");
    }
  };

  const handleExportCSV = () => {
    const headers = ['Nome do Cliente', 'Valor do Contrato', 'Chamadas', 'Data de Cobrança', 'Início do Contrato', 'Data Final'];
    
    const flattenClients = (list: Client[]): Client[] => {
      let flat: Client[] = [];
      list.forEach(client => {
        flat.push(client);
        if (client.subClients) {
          flat = [...flat, ...flattenClients(client.subClients)];
        }
      });
      return flat;
    };

    const allClients = flattenClients(clients);

    const csvContent = [
      headers.join(','),
      ...allClients.map((client) =>
        [
          `"${client.name}"`,
          (client.contractValue || 0).toFixed(2),
          client.calls,
          client.billingDate || '',
          client.startDate,
          client.endDate
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'clientes_contratos.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const filteredAndSortedClients = useMemo(() => {
    let result = [...clients];

    // Filter by Tab
    if (activeTab === 'clients') {
      // Show all except "Anunciantes BMN"
      result = result.filter(c => c.name !== "Anunciantes BMN");
    } else if (activeTab === 'bmn') {
      // Show ONLY "Anunciantes BMN" sub-clients
      const bmnClient = result.find(c => c.name === "Anunciantes BMN");
      result = bmnClient && bmnClient.subClients ? [...bmnClient.subClients] : [];
    } else {
      // Programs tab - handled separately
      return [];
    }

    // Filter by Call Count
    if (callCountFilter === 'low') {
      result = result.filter(c => c.calls <= 3);
    } else if (callCountFilter === 'medium') {
      result = result.filter(c => c.calls > 3 && c.calls <= 6);
    } else if (callCountFilter === 'high') {
      result = result.filter(c => c.calls > 6);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((client) =>
        client.name.toLowerCase().includes(query)
      );
    }

    result.sort((a, b) => {
      const aValue = a[sortConfig.field];
      const bValue = b[sortConfig.field];

      // Handle potential undefined values for sort
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [clients, activeTab, callCountFilter, searchQuery, sortConfig]);

  const filteredPrograms = useMemo(() => {
    let result = [...programs];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((p) =>
        p.name.toLowerCase().includes(query) || 
        p.details.toLowerCase().includes(query)
      );
    }
    // Simple sort by name for programs
    result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [programs, searchQuery]);

  const filteredExpenses = useMemo(() => {
    let result = [...expenses];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((e) =>
        e.name.toLowerCase().includes(query) || 
        e.description.toLowerCase().includes(query)
      );
    }
    // Sort by date descending
    result.sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));
    return result;
  }, [expenses, searchQuery]);

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-slate-500 dark:text-slate-400 animate-pulse">Carregando dados...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-xl border border-red-200 dark:border-red-800 max-w-md text-center space-y-4">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
          <h2 className="text-xl font-bold">Ops! Algo deu errado.</h2>
          <p>{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700 text-white w-full">
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900 p-8 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Gestão de Clientes</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie contratos e chamadas de forma simples e eficiente.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              variant="ghost" 
              size="icon" 
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              title={isDarkMode ? "Modo Claro" : "Modo Escuro"}
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button onClick={() => setIsTrashOpen(true)} variant="outline" className="gap-2 border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700 dark:border-orange-900/50 dark:bg-orange-900/10 dark:hover:bg-orange-900/20" title="Clientes Vencidos">
              <Archive className="h-4 w-4" />
              <span className="hidden md:inline">Clientes Vencidos ({trash.length})</span>
            </Button>
            <Button onClick={() => setIsRealTrashOpen(true)} variant="outline" className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:bg-red-900/10 dark:hover:bg-red-900/20" title="Lixeira">
              <Trash2 className="h-4 w-4" />
              <span className="hidden md:inline">Lixeira ({lixeira.length})</span>
            </Button>
            <Button onClick={handleExportCSV} variant="outline" className="gap-2 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800" title="Exportar CSV">
              <Download className="h-4 w-4" />
              <span className="hidden md:inline">Exportar CSV</span>
            </Button>
            {activeTab === 'expenses' ? (
              <Button onClick={handleAddExpense} className="gap-2 bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-500">
                <Plus className="h-4 w-4" />
                <span className="hidden md:inline">Nova Despesa</span>
                <span className="md:hidden">Nova</span>
              </Button>
            ) : (
              <Button onClick={handleAddClient} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500">
                <Plus className="h-4 w-4" />
                <span className="hidden md:inline">Novo Cliente</span>
                <span className="md:hidden">Novo</span>
              </Button>
            )}
            <Button onClick={handleLogout} variant="ghost" size="icon" className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 ml-2" title="Sair">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-2 mb-4 md:mb-0 md:flex md:items-center md:gap-2 md:border-b md:border-slate-200 md:dark:border-slate-700">
          <button
            onClick={() => setActiveTab('clients')}
            className={`p-3 rounded-lg border text-center text-xs font-medium transition-all relative md:px-6 md:py-3 md:text-sm md:border-0 md:rounded-none ${
              activeTab === 'clients'
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 md:bg-transparent md:text-indigo-600 dark:bg-indigo-900/20 dark:border-indigo-700 dark:text-indigo-300 dark:md:text-indigo-400'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 md:bg-transparent md:border-0 md:text-slate-500 md:hover:text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:md:text-slate-400 dark:md:hover:text-slate-200'
            }`}
          >
            CLIENTES
            {activeTab === 'clients' && (
              <motion.div
                layoutId="activeTab"
                className="hidden md:block absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('bmn')}
            className={`p-3 rounded-lg border text-center text-xs font-medium transition-all relative md:px-6 md:py-3 md:text-sm md:border-0 md:rounded-none ${
              activeTab === 'bmn'
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 md:bg-transparent md:text-indigo-600 dark:bg-indigo-900/20 dark:border-indigo-700 dark:text-indigo-300 dark:md:text-indigo-400'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 md:bg-transparent md:border-0 md:text-slate-500 md:hover:text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:md:text-slate-400 dark:md:hover:text-slate-200'
            }`}
          >
            ANUNCIANTES BMN
            {activeTab === 'bmn' && (
              <motion.div
                layoutId="activeTab"
                className="hidden md:block absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('programs')}
            className={`p-3 rounded-lg border text-center text-xs font-medium transition-all relative md:px-6 md:py-3 md:text-sm md:border-0 md:rounded-none ${
              activeTab === 'programs'
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 md:bg-transparent md:text-indigo-600 dark:bg-indigo-900/20 dark:border-indigo-700 dark:text-indigo-300 dark:md:text-indigo-400'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 md:bg-transparent md:border-0 md:text-slate-500 md:hover:text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:md:text-slate-400 dark:md:hover:text-slate-200'
            }`}
          >
            PROGRAMAS E PROGRAMETES
            {activeTab === 'programs' && (
              <motion.div
                layoutId="activeTab"
                className="hidden md:block absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('folgas')}
            className={`p-3 rounded-lg border text-center text-xs font-medium transition-all relative md:px-6 md:py-3 md:text-sm md:border-0 md:rounded-none ${
              activeTab === 'folgas'
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 md:bg-transparent md:text-indigo-600 dark:bg-indigo-900/20 dark:border-indigo-700 dark:text-indigo-300 dark:md:text-indigo-400'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 md:bg-transparent md:border-0 md:text-slate-500 md:hover:text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:md:text-slate-400 dark:md:hover:text-slate-200'
            }`}
          >
            ESCALA DE FOLGAS
            {activeTab === 'folgas' && (
              <motion.div
                layoutId="activeTab"
                className="hidden md:block absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`p-3 rounded-lg border text-center text-xs font-medium transition-all relative md:px-6 md:py-3 md:text-sm md:border-0 md:rounded-none col-span-2 md:col-span-1 ${
              activeTab === 'expenses'
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 md:bg-transparent md:text-indigo-600 dark:bg-indigo-900/20 dark:border-indigo-700 dark:text-indigo-300 dark:md:text-indigo-400'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 md:bg-transparent md:border-0 md:text-slate-500 md:hover:text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:md:text-slate-400 dark:md:hover:text-slate-200'
            }`}
          >
            DESPESAS
            {activeTab === 'expenses' && (
              <motion.div
                layoutId="activeTab"
                className="hidden md:block absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400"
              />
            )}
          </button>
        </div>

        {activeTab === 'folgas' ? (
          <ScheduleTable />
        ) : (
          <>
            {/* Filters */}
            <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <Input
              placeholder={activeTab === 'programs' ? "Buscar programas..." : "Buscar clientes..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-slate-200 focus-visible:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            {activeTab === 'programs' ? (
              <>
                <Radio className="h-4 w-4" />
                <span>{filteredPrograms.length} programas</span>
              </>
            ) : (
              <>
                <Users className="h-4 w-4" />
                <span>{filteredAndSortedClients.length} clientes</span>
              </>
            )}
          </div>
        </div>

        {/* Legend and Total Value - Only for Clients and Expenses */}
        {activeTab !== 'programs' && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm text-slate-600 bg-white p-4 rounded-lg border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
            {activeTab === 'expenses' ? (
              <div className="flex items-center gap-2">
                <ReceiptText className="h-4 w-4 text-red-500" />
                <span>Lista de despesas e gastos mensais.</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-6">
                <button 
                  onClick={() => setCallCountFilter('all')}
                  className={`flex items-center gap-2 transition-opacity hover:opacity-80 ${callCountFilter === 'all' ? 'opacity-100 ring-2 ring-slate-400 rounded-lg p-1 -m-1 dark:ring-slate-500' : 'opacity-60'}`}
                >
                  <span className="inline-flex items-center justify-center rounded-lg bg-slate-500 px-3 py-1.5 text-sm font-bold text-white shadow-sm ring-1 ring-inset ring-slate-600/10 min-w-[3rem] h-8 dark:bg-slate-600">All</span>
                  <span>Ver todos</span>
                </button>
                <button 
                  onClick={() => setCallCountFilter('low')}
                  className={`flex items-center gap-2 transition-opacity hover:opacity-80 ${callCountFilter === 'low' ? 'opacity-100 ring-2 ring-red-400 rounded-lg p-1 -m-1' : 'opacity-60'}`}
                >
                  <span className="inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-1.5 text-sm font-bold text-white shadow-sm ring-1 ring-inset ring-red-700/10 min-w-[3rem] h-8 dark:bg-red-700"></span>
                  <span>Até 03 chamadas</span>
                </button>
                <button 
                  onClick={() => setCallCountFilter('medium')}
                  className={`flex items-center gap-2 transition-opacity hover:opacity-80 ${callCountFilter === 'medium' ? 'opacity-100 ring-2 ring-amber-400 rounded-lg p-1 -m-1' : 'opacity-60'}`}
                >
                  <span className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-bold text-white shadow-sm ring-1 ring-inset ring-amber-600/10 min-w-[3rem] h-8 dark:bg-amber-600"></span>
                  <span>Até 06 chamadas</span>
                </button>
                <button 
                  onClick={() => setCallCountFilter('high')}
                  className={`flex items-center gap-2 transition-opacity hover:opacity-80 ${callCountFilter === 'high' ? 'opacity-100 ring-2 ring-green-400 rounded-lg p-1 -m-1' : 'opacity-60'}`}
                >
                  <span className="inline-flex items-center justify-center rounded-lg bg-green-600 px-3 py-1.5 text-sm font-bold text-white shadow-sm ring-1 ring-inset ring-green-700/10 min-w-[3rem] h-8 dark:bg-green-700"></span>
                  <span>Acima de 06 chamadas</span>
                </button>
              </div>
            )}
            
            {activeTab === 'expenses' ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-lg border border-red-100 dark:bg-red-900/20 dark:border-red-900/50">
                  <span className="text-red-700 font-medium uppercase text-xs tracking-wider dark:text-red-400">Total Despesas:</span>
                  <span className="text-red-700 font-bold text-lg dark:text-red-400">
                    {totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/50">
                  <span className="text-emerald-700 font-medium uppercase text-xs tracking-wider dark:text-emerald-400">Valores Quitados:</span>
                  <span className="text-emerald-700 font-bold text-lg dark:text-emerald-400">
                    {totalPaidExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/50">
                <span className="text-emerald-700 font-medium uppercase text-xs tracking-wider dark:text-emerald-400">Valor Total:</span>
                <span className="text-emerald-700 font-bold text-lg dark:text-emerald-400">
                  {totalContractValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:bg-slate-800 dark:border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="hidden md:table-header-group border-b border-slate-200 dark:border-slate-700">
                <tr>
                  {activeTab === 'programs' ? (
                    <>
                      <th className="h-12 px-4 align-middle font-medium text-slate-900 dark:text-slate-100 w-[20%]">Nome do Programa</th>
                      <th className="h-12 px-4 align-middle font-medium text-slate-900 dark:text-slate-100 w-[10%]">Horário</th>
                      <th className="h-12 px-4 align-middle font-medium text-slate-900 dark:text-slate-100 w-[60%]">Detalhes</th>
                      <th className="h-12 px-4 align-middle font-medium text-right w-[10%] text-slate-900 dark:text-slate-100">Ações</th>
                    </>
                  ) : activeTab === 'expenses' ? (
                    <>
                      <th className="h-12 px-4 align-middle font-medium text-slate-900 dark:text-slate-100 w-[25%]">Nome da Despesa</th>
                      <th className="h-12 px-4 align-middle font-medium text-slate-900 dark:text-slate-100 w-[35%]">Descrição</th>
                      <th className="h-12 px-4 align-middle font-medium text-slate-900 dark:text-slate-100 w-[15%]">Valor</th>
                      <th className="h-12 px-4 align-middle font-medium text-slate-900 dark:text-slate-100 w-[15%]">Data Pagamento</th>
                      <th className="h-12 px-4 align-middle font-medium text-right w-[10%] text-slate-900 dark:text-slate-100">Ações</th>
                    </>
                  ) : (
                    <>
                      <th className="h-12 px-4 align-middle font-medium hover:text-slate-700 cursor-pointer transition-colors bg-blue-50/80 text-blue-900 dark:bg-blue-900/40 dark:text-blue-100 dark:hover:text-blue-50" onClick={() => handleSort('name')}>
                        <div className="flex items-center gap-1">
                          Nome do Cliente
                          {sortConfig.field === 'name' && (
                            sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                          )}
                        </div>
                      </th>
                      <th className="h-12 px-4 align-middle font-medium hover:text-slate-700 cursor-pointer transition-colors w-32 bg-emerald-50/80 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100 dark:hover:text-emerald-50" onClick={() => handleSort('contractValue')}>
                        <div className="flex items-center gap-1">
                          Valor
                          {sortConfig.field === 'contractValue' && (
                            sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                          )}
                        </div>
                      </th>
                      <th className="h-12 px-4 align-middle font-medium hover:text-slate-700 cursor-pointer transition-colors w-32 bg-indigo-50/80 text-indigo-900 dark:bg-indigo-900/40 dark:text-indigo-100 dark:hover:text-indigo-50" onClick={() => handleSort('calls')}>
                        <div className="flex items-center gap-1">
                          Chamadas
                          {sortConfig.field === 'calls' && (
                            sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                          )}
                        </div>
                      </th>
                      <th className="h-12 px-4 align-middle font-medium hover:text-slate-700 cursor-pointer transition-colors w-32 bg-orange-50/80 text-orange-900 dark:bg-orange-900/40 dark:text-orange-100 dark:hover:text-orange-50" onClick={() => handleSort('billingDate')}>
                        <div className="flex items-center gap-1">
                          Cobrança
                          {sortConfig.field === 'billingDate' && (
                            sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                          )}
                        </div>
                      </th>
                      <th className="h-12 px-4 align-middle font-medium hover:text-slate-700 cursor-pointer transition-colors w-48 bg-purple-50/80 text-purple-900 dark:bg-purple-900/40 dark:text-purple-100 dark:hover:text-purple-50" onClick={() => handleSort('startDate')}>
                        <div className="flex items-center gap-1">
                          Início do Contrato
                          {sortConfig.field === 'startDate' && (
                            sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                          )}
                        </div>
                      </th>
                      <th className="h-12 px-4 align-middle font-medium hover:text-slate-700 cursor-pointer transition-colors w-48 bg-pink-50/80 text-pink-900 dark:bg-pink-900/40 dark:text-pink-100 dark:hover:text-pink-50" onClick={() => handleSort('endDate')}>
                        <div className="flex items-center gap-1">
                          Data Final
                          {sortConfig.field === 'endDate' && (
                            sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                          )}
                        </div>
                      </th>
                      <th className="h-12 px-4 align-middle font-medium text-slate-900 dark:text-slate-100 w-24">Status</th>
                      <th className="h-12 px-4 align-middle font-medium text-slate-900 dark:text-slate-100 w-16">Obs</th>
                      <th className="h-12 px-4 align-middle font-medium text-right w-24 bg-slate-50 text-slate-700 dark:bg-slate-900/80 dark:text-slate-300">Ações</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                <AnimatePresence initial={false}>
                  {activeTab === 'programs' ? (
                    filteredPrograms.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-500 dark:text-slate-400">
                          Nenhum programa encontrado.
                        </td>
                      </tr>
                    ) : (
                      filteredPrograms.map((program) => (
                        <ProgramRow
                          key={program.id}
                          program={program}
                          onUpdate={handleUpdateProgram}
                          onDelete={handleDeleteProgram}
                        />
                      ))
                    )
                  ) : activeTab === 'expenses' ? (
                    filteredExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500 dark:text-slate-400">
                          Nenhuma despesa encontrada.
                        </td>
                      </tr>
                    ) : (
                      filteredExpenses.map((expense) => (
                        <ExpenseRow
                          key={expense.id}
                          expense={expense}
                          onUpdate={handleUpdateExpense}
                          onDelete={handleDeleteExpense}
                        />
                      ))
                    )
                  ) : (
                    filteredAndSortedClients.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400">
                          Nenhum cliente encontrado.
                        </td>
                      </tr>
                    ) : (
                      filteredAndSortedClients.map((client) => (
                        <ClientRow
                          key={client.id}
                          client={client}
                          onUpdate={handleUpdateClient}
                          onDelete={handleDeleteClient}
                          allClients={clients}
                        />
                      ))
                    )
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </>
      )}
      </div>

      {/* Clientes Vencidos Modal */}
      <AnimatePresence>
        {isTrashOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTrashOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-xl shadow-xl z-50 p-6 max-h-[80vh] flex flex-col dark:bg-slate-800 dark:border dark:border-slate-700"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 dark:text-white">
                  <Archive className="h-5 w-5 text-orange-500" />
                  Clientes Vencidos
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setIsTrashOpen(false)} className="dark:text-slate-400 dark:hover:text-slate-200">
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2">
                {trash.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    <Archive className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>Nenhum cliente vencido</p>
                  </div>
                ) : (
                  trash.map(client => (
                    <div key={client.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 dark:bg-slate-900 dark:border-slate-700">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{client.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Vencido / Excluído</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleRestoreClient(client.id)} className="gap-1 text-green-600 hover:text-green-700 hover:bg-green-50 dark:border-slate-700 dark:hover:bg-slate-800">
                          <RotateCcw className="h-3 w-3" />
                          Restaurar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleMoveToLixeira(client.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" title="Mover para Lixeira">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Lixeira Modal */}
      <AnimatePresence>
        {isRealTrashOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRealTrashOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-xl shadow-xl z-50 p-6 max-h-[80vh] flex flex-col dark:bg-slate-800 dark:border dark:border-slate-700"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 dark:text-white">
                  <Trash2 className="h-5 w-5 text-red-500" />
                  Lixeira
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setIsRealTrashOpen(false)} className="dark:text-slate-400 dark:hover:text-slate-200">
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2">
                {lixeira.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    <Trash2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>A lixeira está vazia</p>
                  </div>
                ) : (
                  lixeira.map(client => (
                    <div key={client.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 dark:bg-slate-900 dark:border-slate-700">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{client.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Na lixeira</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleRestoreFromLixeira(client.id)} className="gap-1 text-green-600 hover:text-green-700 hover:bg-green-50 dark:border-slate-700 dark:hover:bg-slate-800">
                          <RotateCcw className="h-3 w-3" />
                          Restaurar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleRealPermanentDelete(client.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" title="Excluir Permanentemente">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Client Modal */}
      <AnimatePresence>
        {isAddClientModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddClientModalOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl z-50 p-6 dark:bg-slate-800 dark:border dark:border-slate-700"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 dark:text-white">
                  <Plus className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  Novo Cliente
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setIsAddClientModalOpen(false)} className="dark:text-slate-400 dark:hover:text-slate-200">
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <form onSubmit={confirmAddClient} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome do Cliente</label>
                  <Input
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Digite o nome do cliente..."
                    className="uppercase dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Categoria</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewClientCategory('clients')}
                      className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                        newClientCategory === 'clients'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-500 dark:ring-indigo-500'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600'
                      }`}
                    >
                      Clientes
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewClientCategory('bmn')}
                      className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                        newClientCategory === 'bmn'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-500 dark:ring-indigo-500'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600'
                      }`}
                    >
                      Anunciantes BMN
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewClientCategory('programs')}
                      className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                        newClientCategory === 'programs'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-500 dark:ring-indigo-500'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600'
                      }`}
                    >
                      Programas
                    </button>
                  </div>
                </div>

                {newClientCategory === 'programs' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Horário</label>
                      <Input
                        type="time"
                        value={newProgramTime}
                        onChange={(e) => setNewProgramTime(e.target.value)}
                        className="dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Detalhes</label>
                      <Input
                        value={newProgramDetails}
                        onChange={(e) => setNewProgramDetails(e.target.value)}
                        placeholder="Detalhes do programa..."
                        className="dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
                      />
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setIsAddClientModalOpen(false)} className="dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700">
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500"
                    disabled={!newClientName.trim()}
                  >
                    Adicionar Cliente
                  </Button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {isAddExpenseModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddExpenseModalOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl z-50 p-6 dark:bg-slate-800 dark:border dark:border-slate-700"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 dark:text-white">
                  <ReceiptText className="h-5 w-5 text-red-600 dark:text-red-400" />
                  Nova Despesa
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setIsAddExpenseModalOpen(false)} className="dark:text-slate-400 dark:hover:text-slate-200">
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <form onSubmit={confirmAddExpense} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome da Despesa</label>
                  <Input
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Ex: Aluguel, Internet..."
                    className="uppercase dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Descrição</label>
                  <Input
                    value={newExpenseDescription}
                    onChange={(e) => setNewExpenseDescription(e.target.value)}
                    placeholder="Detalhes sobre a despesa..."
                    className="dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Valor</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newExpenseValue}
                      onChange={(e) => setNewExpenseValue(e.target.value)}
                      placeholder="0,00"
                      className="dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Data Pagamento</label>
                    <Input
                      type="date"
                      value={newExpenseDate}
                      onChange={(e) => setNewExpenseDate(e.target.value)}
                      className="dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsAddExpenseModalOpen(false)} className="dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700">
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-500"
                    disabled={!newClientName.trim() || !newExpenseValue}
                  >
                    Adicionar Despesa
                  </Button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <footer className="mt-8 text-center text-sm text-slate-500 pb-8">
        Sistema desenvolvido por Aroldo Dias
      </footer>
    </div>
  );
}
