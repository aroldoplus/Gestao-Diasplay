import React, { useRef } from 'react';
import { Client } from '../types';
import { Button } from './ui/Button';
import { X, Download, Clock, Calendar, Megaphone } from 'lucide-react';
import { motion } from 'motion/react';
import domtoimage from 'dom-to-image';

interface ScheduleViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
}

export const ScheduleViewModal: React.FC<ScheduleViewModalProps> = ({
  isOpen,
  onClose,
  client,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handleDownloadImage = async () => {
    if (!printRef.current) return;
    
    try {
      // Small delay to ensure everything is rendered
      await new Promise(resolve => setTimeout(resolve, 300));

      const dataUrl = await domtoimage.toPng(printRef.current, {
        bgcolor: '#ffffff',
        quality: 1.0,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          margin: '0',
          padding: '40px',
          borderRadius: '0',
          boxShadow: 'none',
          border: 'none',
        },
        width: printRef.current.offsetWidth,
        height: printRef.current.offsetHeight,
      });
      
      const link = document.createElement('a');
      link.href = dataUrl;
      
      const safeName = client.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/gi, '-')
        .toLowerCase();
        
      link.download = `programacao-${safeName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      alert('Erro ao gerar imagem. Tente usar um navegador diferente ou verifique as permissões de download.');
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
        className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border dark:border-slate-700"
      >
        <div className="p-4 border-b dark:border-slate-700 flex items-center justify-between no-print">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Visualizar Programação</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadImage} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-md transition-all active:scale-95">
              <Download className="h-4 w-4" />
              Baixar Imagem
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="dark:text-slate-400">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-8 bg-slate-100 dark:bg-slate-900/50">
          <div 
            className="space-y-8 max-w-xl mx-auto bg-white p-10 rounded-2xl shadow-sm border border-slate-100" 
            ref={printRef}
            data-print-content
          >
            {/* Header */}
            <div className="text-center space-y-2 border-b pb-6 border-slate-100">
              <h1 className="text-3xl font-black text-indigo-600 uppercase tracking-tighter">
                Programação de Chamadas
              </h1>
              <p className="text-slate-500 font-medium uppercase tracking-widest text-xs">
                Rádio Brisamar FM - A sua rádio
              </p>
            </div>

            {/* Client Info Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cliente</span>
                <p className="text-xl font-bold text-slate-900 uppercase">{client.name}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chamadas Diárias</span>
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-indigo-500" />
                  <p className="text-xl font-bold text-slate-900">{client.calls}</p>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Início do Contrato</span>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-500" />
                  <p className="text-lg font-semibold text-slate-700">
                    {client.startDate && !isNaN(new Date(client.startDate).getTime()) ? new Date(client.startDate).toLocaleDateString('pt-BR') : '-'}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fim do Contrato</span>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-red-500" />
                  <p className="text-lg font-semibold text-slate-700">
                    {client.endDate && !isNaN(new Date(client.endDate).getTime()) ? new Date(client.endDate).toLocaleDateString('pt-BR') : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Schedule Grid */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2 border-slate-100">
                <Clock className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 uppercase tracking-tight">Horários das Inserções</h3>
              </div>
              
              {client.schedule && Array.isArray(client.schedule) && client.schedule.length > 0 ? (
                <div className="grid grid-cols-4 gap-3">
                  {[...client.schedule].sort((a, b) => a.localeCompare(b)).map((time, idx) => (
                    <div 
                      key={idx} 
                      className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center"
                    >
                      <span className="text-lg font-black text-indigo-600 tabular-nums">
                        {time}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <p className="text-slate-500 italic">Nenhum horário programado ainda.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-8 text-center border-t border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em]">
                Gerado em {new Date().toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .fixed { position: relative !important; inset: auto !important; }
          .bg-black/50 { display: none !important; }
          .shadow-xl { shadow: none !important; }
          .max-h-[90vh] { max-height: none !important; }
          .overflow-y-auto { overflow: visible !important; }
        }
      `}</style>
    </motion.div>
  );
};
