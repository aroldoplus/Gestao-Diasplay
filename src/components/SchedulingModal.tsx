import React, { useState, useEffect, useMemo } from 'react';
import { Client } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { X, Save, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface SchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  initialClientId?: string;
  onSave: (clientId: string, schedule: string[]) => void;
}

export const SchedulingModal: React.FC<SchedulingModalProps> = ({
  isOpen,
  onClose,
  clients,
  initialClientId,
  onSave,
}) => {
  const [selectedClientId, setSelectedClientId] = useState(initialClientId || '');
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (initialClientId) {
      setSelectedClientId(initialClientId);
    }
  }, [initialClientId]);

  useEffect(() => {
    // Generate times from 05:00 to 23:00 every 20 minutes
    const slots: string[] = [];
    for (let hour = 5; hour <= 23; hour++) {
      for (let min = 0; min < 60; min += 20) {
        if (hour === 23 && min > 0) break;
        const h = hour.toString().padStart(2, '0');
        const m = min.toString().padStart(2, '0');
        slots.push(`${h}:${m}`);
      }
    }
    setTimeSlots(slots);
  }, []);

  const findClient = (id: string, list: Client[]): Client | undefined => {
    for (const client of list) {
      if (client.id === id) return client;
      if (client.subClients) {
        const found = findClient(id, client.subClients);
        if (found) return found;
      }
    }
    return undefined;
  };

  const currentClient = useMemo(() => {
    if (!selectedClientId || !Array.isArray(clients)) return undefined;
    return findClient(selectedClientId, clients);
  }, [selectedClientId, clients]);

  useEffect(() => {
    if (selectedClientId && Array.isArray(clients)) {
      const client = findClient(selectedClientId, clients);
      if (client && client.schedule && Array.isArray(client.schedule)) {
        setSelectedTimes(new Set(client.schedule));
      } else {
        setSelectedTimes(new Set());
      }
    } else {
      setSelectedTimes(new Set());
    }
  }, [selectedClientId, clients]);

  const toggleTime = (time: string) => {
    const newSet = new Set(selectedTimes);
    if (newSet.has(time)) {
      newSet.delete(time);
    } else {
      const limit = currentClient?.calls || 0;
      if (newSet.size < limit) {
        newSet.add(time);
      } else {
        alert(`Atenção: O limite de ${limit} chamadas diárias para este contrato já foi atingido. Remova um horário antes de adicionar outro, ou aumente o número de chamadas no contrato.`);
        return;
      }
    }
    setSelectedTimes(newSet);
  };

  const handleTimeEdit = (index: number, newTime: string) => {
    const newSlots = [...timeSlots];
    const oldTime = newSlots[index];
    newSlots[index] = newTime;
    setTimeSlots(newSlots);

    if (selectedTimes.has(oldTime)) {
      const newSet = new Set(selectedTimes);
      newSet.delete(oldTime);
      newSet.add(newTime);
      setSelectedTimes(newSet);
    }
  };

  const handleSave = () => {
    if (selectedClientId) {
      onSave(selectedClientId, Array.from(selectedTimes));
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border dark:border-slate-700"
      >
        <div className="p-6 border-b dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Programar Chamadas
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="dark:text-slate-400">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">Contrato Selecionado</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                {currentClient?.name || 'Carregando...'}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-lg border border-indigo-100 dark:border-indigo-800 flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Limite de Chamadas</p>
                <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 leading-none">{currentClient?.calls || 0}</p>
              </div>
              <div className="h-8 w-[1px] bg-indigo-100 dark:bg-indigo-800" />
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Selecionados</p>
                <p className={cn(
                  "text-lg font-black leading-none",
                  selectedTimes.size === (currentClient?.calls || 0) ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"
                )}>
                  {selectedTimes.size}
                </p>
              </div>
            </div>
          </div>

          {selectedClientId && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {timeSlots.map((time, index) => (
                <div
                  key={index}
                  className={`
                    relative group flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer
                    ${selectedTimes.has(time) 
                      ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800' 
                      : 'bg-white border-slate-200 hover:border-indigo-200 dark:bg-slate-900 dark:border-slate-700'}
                  `}
                  onClick={() => toggleTime(time)}
                >
                  <input
                    type="checkbox"
                    checked={selectedTimes.has(time)}
                    onChange={() => toggleTime(time)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4 rounded cursor-pointer border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    value={time}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleTimeEdit(index, e.target.value)}
                    className="w-full bg-transparent text-sm font-medium focus:outline-none dark:text-slate-200"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
          <Button variant="outline" onClick={onClose} className="dark:border-slate-700 dark:text-slate-300">
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!selectedClientId}
            className="bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500"
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar no contrato
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};
