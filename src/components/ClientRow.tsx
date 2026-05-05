import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Client } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Edit2, Save, X, Trash2, ChevronRight, ChevronDown, Ban, CheckCircle, AlertCircle, DollarSign, Clock, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { SchedulingModal } from './SchedulingModal';
import { ScheduleViewModal } from './ScheduleViewModal';

interface ClientRowProps {
  client: Client;
  onUpdate: (updatedClient: Client) => void;
  onDelete: (id: string) => void;
  level?: number;
  allClients: Client[]; // Needed for the select in SchedulingModal
}

export const ClientRow: React.FC<ClientRowProps> = ({ client, onUpdate, onDelete, level = 0, allClients }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editedClient, setEditedClient] = useState<Client>(client);
  const [isObsModalOpen, setIsObsModalOpen] = useState(false);
  const [isSchedulingModalOpen, setIsSchedulingModalOpen] = useState(false);
  const [isViewScheduleModalOpen, setIsViewScheduleModalOpen] = useState(false);
  const [tempObs, setTempObs] = useState(client.observations || '');

  const handleSave = () => {
    onUpdate(editedClient);
    setIsEditing(false);
  };

  const handleSaveSchedule = (clientId: string, schedule: string[]) => {
    // If the saved client is this one, update it
    if (clientId === client.id) {
      onUpdate({ ...client, schedule });
    } else {
      // If it's another client (from the select), we need to find it and update it.
      // This is tricky if we don't have a global update function.
      // But since this button is ON the client row, usually they'll save for this client.
      // For now, let's assume we only update the current client if selected.
      const targetClient = allClients.find(c => c.id === clientId);
      if (targetClient) {
        onUpdate({ ...targetClient, schedule });
      }
    }
  };

  const handleCancel = () => {
    setEditedClient(client);
    setIsEditing(false);
  };

  const handleChange = (field: keyof Client, value: string | number | boolean) => {
    setEditedClient((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSuspended = () => {
    const newSuspendedState = !client.suspended;
    onUpdate({ ...client, suspended: newSuspendedState });
  };

  const togglePaymentStatus = () => {
    const newStatus = client.paymentStatus === 'paid' ? 'unpaid' : 'paid';
    const newDate = newStatus === 'paid' ? new Date().toISOString() : '';
    onUpdate({ ...client, paymentStatus: newStatus, paymentConfirmedDate: newDate });
  };

  const saveObservations = () => {
    onUpdate({ ...client, observations: tempObs });
    setIsObsModalOpen(false);
  };

  const hasSubClients = client.subClients && client.subClients.length > 0;

  const getCallCountColor = (count: number) => {
    if (count <= 3) return "bg-red-600 ring-red-700/10";
    if (count <= 6) return "bg-amber-500 ring-amber-600/10"; // Using amber for better visibility than yellow
    return "bg-green-600 ring-green-700/10";
  };

  const getRowBackground = () => {
    if (client.suspended) return "bg-gray-100 hover:bg-gray-200/50 dark:bg-gray-900/20 dark:hover:bg-gray-900/30";
    if (client.observations && client.observations.trim() !== "") return "bg-amber-50 hover:bg-amber-100/50 dark:bg-amber-900/10 dark:hover:bg-amber-900/20";
    if (level > 0) return "bg-slate-50/30 dark:bg-slate-800/30";
    return "";
  };

  return (
    <>
      <motion.tr
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn(
          "border-b transition-colors hover:bg-slate-50/50 data-[state=selected]:bg-slate-100 dark:hover:bg-slate-800/50 dark:data-[state=selected]:bg-slate-800 flex flex-col md:table-row dark:border-slate-700",
          getRowBackground()
        )}
      >
        <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 font-medium md:table-cell block w-full">
          <div className="flex items-center gap-2" style={{ paddingLeft: level > 0 && window.innerWidth >= 768 ? `${level * 24}px` : '0' }}>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsViewScheduleModalOpen(true)}
              className="h-8 w-8 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400"
              title="Ver Programação"
            >
              <Clock className="h-4 w-4" />
            </Button>
            {hasSubClients && (
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-slate-200 rounded-md transition-colors dark:hover:bg-slate-700"
              >
                {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-500 dark:text-slate-400" />}
              </button>
            )}
            {!hasSubClients && level > 0 && <div className="hidden md:block w-6" />} {/* Spacer for alignment */}
            
            {isEditing ? (
              <div className="flex-1 flex items-center gap-2">
                <Input
                  value={editedClient.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full uppercase dark:bg-slate-900 dark:text-white dark:border-slate-700"
                  autoFocus
                />
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={handleSave} className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/20" title="Salvar">
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={handleCancel} className="h-8 w-8 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200" title="Cancelar">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <span className={cn(
                hasSubClients ? "text-indigo-600 font-bold cursor-pointer hover:underline dark:text-indigo-400" : "text-slate-900 dark:text-white",
                "transition-colors uppercase font-bold tracking-wide text-base md:text-sm",
                client.suspended && "text-red-800 line-through decoration-red-500/50 dark:text-red-400 dark:decoration-red-400/50"
              )}
              onClick={() => hasSubClients && setIsExpanded(!isExpanded)}
              >
                {client.name}
              </span>
            )}
            {client.suspended && <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full ml-2 dark:bg-red-900/30 dark:text-red-300">SUSPENSO</span>}
          </div>
        </td>
        <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 md:table-cell block w-full flex justify-between md:justify-start items-center border-t md:border-t-0 border-slate-100 dark:border-slate-700">
          <span className="md:hidden text-slate-500 text-xs uppercase font-semibold mr-2 dark:text-slate-400">Valor:</span>
          {isEditing ? (
            <Input
              type="number"
              value={editedClient.contractValue || 0}
              onChange={(e) => handleChange('contractValue', parseFloat(e.target.value) || 0)}
              className="w-24 dark:bg-slate-900 dark:text-white dark:border-slate-700"
              step="0.01"
            />
          ) : (
            <span className={cn("text-slate-900 font-medium dark:text-slate-100", client.suspended && "opacity-50")}>
              {(editedClient.contractValue || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          )}
        </td>
        <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 md:table-cell block w-full flex justify-between md:justify-start items-center border-t md:border-t-0 border-slate-100 dark:border-slate-700">
          <span className="md:hidden text-slate-500 text-xs uppercase font-semibold mr-2 dark:text-slate-400">Chamadas:</span>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <Input
                type="number"
                value={editedClient.calls}
                onChange={(e) => handleChange('calls', parseInt(e.target.value) || 0)}
                className="w-24 dark:bg-slate-900 dark:text-white dark:border-slate-700"
              />
            ) : (
              <span className={cn(
                "inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-bold text-white shadow-sm ring-1 ring-inset min-w-[3rem]",
                client.suspended ? "bg-slate-400 ring-slate-500/10 dark:bg-slate-600" : getCallCountColor(client.calls)
              )}>
                {client.calls}
              </span>
            )}
            {!isEditing && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsSchedulingModalOpen(true)}
                className="h-7 px-2 text-[9px] font-bold uppercase tracking-tighter gap-1 border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-900 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
              >
                <Calendar className="h-3 w-3" />
                <span className="hidden sm:inline">Programar</span>
                <span className="sm:hidden">Prog.</span>
              </Button>
            )}
          </div>
        </td>
        <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 md:table-cell block w-full flex justify-between md:justify-start items-center border-t md:border-t-0 border-slate-100 dark:border-slate-700">
          <span className="md:hidden text-slate-500 text-xs uppercase font-semibold mr-2 dark:text-slate-400">Cobrança:</span>
          {isEditing ? (
            <Input
              type="date"
              value={editedClient.billingDate || ''}
              onChange={(e) => handleChange('billingDate', e.target.value)}
              className="w-full dark:bg-slate-900 dark:text-white dark:border-slate-700"
            />
          ) : (
            <span className={cn("text-green-600 font-bold text-sm dark:text-green-400", client.suspended && "opacity-50")}>
              {client.billingDate ? (() => {
                const day = client.billingDate.split('-')[2];
                const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
                return `${day}/${currentMonth}`;
              })() : '-'}
            </span>
          )}
        </td>
        <td className={cn(
          "p-4 align-middle [&:has([role=checkbox])]:pr-0 md:table-cell block w-full flex justify-between md:justify-start items-center border-t md:border-t-0 border-slate-100 dark:border-slate-700",
          client.suspended ? "bg-red-100/50 dark:bg-red-900/20" : "bg-yellow-100 dark:bg-yellow-900/20"
        )}>
          <span className="md:hidden text-slate-500 text-xs uppercase font-semibold mr-2 dark:text-slate-400">Início:</span>
          {isEditing ? (
            <Input
              type="date"
              value={editedClient.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              className="w-full dark:bg-slate-900 dark:text-white dark:border-slate-700"
            />
          ) : (
            <span className={cn("text-slate-800 text-sm font-medium dark:text-slate-200", client.suspended && "opacity-50")}>
              {new Date(client.startDate).toLocaleDateString('pt-BR')}
            </span>
          )}
        </td>
        <td className={cn(
          "p-4 align-middle [&:has([role=checkbox])]:pr-0 md:table-cell block w-full flex justify-between md:justify-start items-center border-t md:border-t-0 border-slate-100 dark:border-slate-700",
          client.suspended ? "bg-red-200/50 dark:bg-red-900/30" : "bg-red-100 dark:bg-red-900/20"
        )}>
          <span className="md:hidden text-slate-500 text-xs uppercase font-semibold mr-2 dark:text-slate-400">Fim:</span>
          {isEditing ? (
            <Input
              type="date"
              value={editedClient.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              className="w-full dark:bg-slate-900 dark:text-white dark:border-slate-700"
            />
          ) : (
            <span className={cn("text-slate-800 text-sm font-medium dark:text-slate-200", client.suspended && "opacity-50")}>
              {new Date(client.endDate).toLocaleDateString('pt-BR')}
            </span>
          )}
        </td>
        <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 md:table-cell block w-full flex justify-between md:justify-start items-center border-t md:border-t-0 border-slate-100 dark:border-slate-700">
          <span className="md:hidden text-slate-500 text-xs uppercase font-semibold mr-2 dark:text-slate-400">Status:</span>
          <div className="flex flex-col items-center gap-1">
            <Button
              size="sm"
              variant={client.paymentStatus === 'paid' ? 'default' : 'outline'}
              onClick={togglePaymentStatus}
              className={cn(
                "gap-1 h-8 text-xs font-bold",
                client.paymentStatus === 'paid' 
                  ? "bg-green-600 hover:bg-green-700 text-white dark:bg-green-600 dark:hover:bg-green-500" 
                  : "text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
              )}
            >
              <DollarSign className="h-3 w-3" />
              {client.paymentStatus === 'paid' ? 'PAGO' : 'NÃO PAGO'}
            </Button>
            {client.paymentStatus === 'paid' && client.paymentConfirmedDate && (
              <span className="text-[10px] font-semibold text-green-700 dark:text-green-400 uppercase tracking-wider">
                EM {new Date(client.paymentConfirmedDate).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
        </td>
        <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 md:table-cell block w-full flex justify-between md:justify-start items-center border-t md:border-t-0 border-slate-100 dark:border-slate-700">
          <span className="md:hidden text-slate-500 text-xs uppercase font-semibold mr-2 dark:text-slate-400">Obs:</span>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsObsModalOpen(true)}
            className={cn(
              "h-8 w-8",
              client.observations ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:text-amber-400" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:text-slate-500"
            )}
          >
            <AlertCircle className="h-4 w-4" />
          </Button>
        </td>
        <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-right md:table-cell block w-full border-t md:border-t-0 border-slate-100 dark:border-slate-700">
          <div className="flex justify-end gap-2 w-full">
            {!isEditing && (
              <>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={toggleSuspended} 
                  className={cn(
                    "h-8 w-8",
                    client.suspended ? "text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/20" : "text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:text-amber-300 dark:hover:bg-amber-900/20"
                  )}
                  title={client.suspended ? "Ativar Cliente" : "Suspender Cliente"}
                >
                  {client.suspended ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)} className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20">
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => onDelete(client.id)} className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-900/20">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </td>
      </motion.tr>
      <AnimatePresence>
        {isExpanded && client.subClients && client.subClients.map((subClient) => (
          <ClientRow
            key={subClient.id}
            client={subClient}
            onUpdate={onUpdate}
            onDelete={onDelete}
            level={level + 1}
            allClients={allClients}
          />
        ))}
      </AnimatePresence>

      {typeof document !== 'undefined' && createPortal(
        <>
          <AnimatePresence>
            {isObsModalOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsObsModalOpen(false)}
                  className="fixed inset-0 bg-black/50 z-[70] backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl z-[71] p-6 dark:bg-slate-800 dark:border dark:border-slate-700"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                      Observações
                    </h3>
                    <Button variant="ghost" size="icon" onClick={() => setIsObsModalOpen(false)} className="dark:text-slate-400 dark:hover:text-slate-200">
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">
                        Observações sobre {client.name}
                      </label>
                      <textarea
                        value={tempObs}
                        onChange={(e) => setTempObs(e.target.value)}
                        className="w-full min-h-[120px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-indigo-800 dark:text-white"
                        placeholder="Digite aqui observações sobre pagamentos, mudanças de endereço, etc..."
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsObsModalOpen(false)} className="dark:border-slate-700 dark:text-slate-300">
                        Cancelar
                      </Button>
                      <Button onClick={saveObservations} className="bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500">
                        Salvar Observações
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isSchedulingModalOpen && (
              <SchedulingModal
                isOpen={isSchedulingModalOpen}
                onClose={() => setIsSchedulingModalOpen(false)}
                clients={allClients}
                initialClientId={client.id}
                onSave={handleSaveSchedule}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isViewScheduleModalOpen && (
              <ScheduleViewModal
                isOpen={isViewScheduleModalOpen}
                onClose={() => setIsViewScheduleModalOpen(false)}
                client={client}
              />
            )}
          </AnimatePresence>
        </>,
        document.body
      )}
    </>
  );
}
