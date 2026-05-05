import React, { useState, useMemo } from 'react';
import { format, addMonths, eachWeekendOfInterval, endOfMonth, isSaturday, isSunday, getDate, getMonth, getYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Plus, User, CalendarDays, EyeOff, Eye, Printer, X } from 'lucide-react';
import { Button } from './ui/Button';

interface WeekendSchedule {
  saturday: Date;
  sunday: Date;
  announcer: string;
}

const ANNOUNCERS = ['Roque de Freitas', 'Aroldo Dias', 'Daniel Miller'];

// Cores para cada locutor (Ajustado para bater com o print: Aroldo Green, Roque Blue, Daniel Amber)
const ANNOUNCER_COLORS: Record<string, string> = {
  'Roque de Freitas': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  'Aroldo Dias': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  'Daniel Miller': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
};

export const ScheduleTable: React.FC = () => {
  // Estado para controlar até qual mês exibir. Inicialmente até Junho de 2026 (6 meses a partir de Jan 2026)
  const [monthsToShow, setMonthsToShow] = useState(6);
  // Estado para controlar meses ocultos/excluídos
  const [hiddenMonths, setHiddenMonths] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hiddenMonths');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Persistir meses ocultos
  React.useEffect(() => {
    localStorage.setItem('hiddenMonths', JSON.stringify(hiddenMonths));
  }, [hiddenMonths]);
  // Estado para controlar qual mês está sendo impresso
  const [printMonth, setPrintMonth] = useState<{ key: string; name: string; weekends: WeekendSchedule[] } | null>(null);

  const scheduleData = useMemo(() => {
    const startDate = new Date(2026, 0, 1); // 1 de Janeiro de 2026
    const endDate = endOfMonth(addMonths(startDate, monthsToShow - 1));
    
    const allWeekends = eachWeekendOfInterval({ start: startDate, end: endDate });
    
    const weekends: WeekendSchedule[] = [];
    let announcerIndex = 0; // Começa com Roque de Freitas (índice 0)

    // Agrupar sábados e domingos em pares
    for (let i = 0; i < allWeekends.length; i++) {
      const date = allWeekends[i];
      
      if (isSaturday(date)) {
        // Encontrou um sábado, verifica se o próximo é domingo
        const saturday = date;
        let sunday = date; // Fallback caso não tenha domingo (fim do intervalo)
        
        if (i + 1 < allWeekends.length && isSunday(allWeekends[i+1])) {
           sunday = allWeekends[i+1];
           i++; // Pula o domingo na iteração
        }
        
        const currentAnnouncer = ANNOUNCERS[announcerIndex % ANNOUNCERS.length];
        
        weekends.push({
          saturday,
          sunday,
          announcer: currentAnnouncer
        });

        announcerIndex++;
      }
    }

    return weekends;
  }, [monthsToShow]);

  // Agrupar por mês do Sábado (para definir em qual card aparece)
  const scheduleByMonth = useMemo(() => {
    const grouped: Record<string, WeekendSchedule[]> = {};
    
    scheduleData.forEach(weekend => {
      // Chave baseada no mês do sábado
      const monthKey = format(weekend.saturday, 'yyyy-MM');
      // Só adiciona se não estiver na lista de ocultos
      if (!hiddenMonths.includes(monthKey)) {
        if (!grouped[monthKey]) {
          grouped[monthKey] = [];
        }
        grouped[monthKey].push(weekend);
      }
    });
    
    return grouped;
  }, [scheduleData, hiddenMonths]);

  const handleAddMonth = () => {
    // Obter meses visíveis ordenados
    const visibleMonths = Object.keys(scheduleByMonth).sort();
    const lastVisibleMonthKey = visibleMonths[visibleMonths.length - 1];

    if (lastVisibleMonthKey) {
      const [year, month] = lastVisibleMonthKey.split('-').map(Number);
      const lastDate = new Date(year, month - 1); // mês no Date é 0-11
      const nextDate = addMonths(lastDate, 1);
      const nextKey = format(nextDate, 'yyyy-MM');

      // Se o próximo mês estiver oculto, apenas removemos da lista de ocultos
      if (hiddenMonths.includes(nextKey)) {
        setHiddenMonths(prev => prev.filter(k => k !== nextKey));
        return;
      }
    }
    
    // Se não houver meses visíveis ou o próximo não estiver oculto, geramos um novo
    setMonthsToShow(prev => prev + 1);
  };

  const handleHideMonth = (monthKey: string) => {
    setHiddenMonths(prev => [...prev, monthKey]);
  };

  const handleShowMonth = (monthKey: string) => {
    setHiddenMonths(prev => prev.filter(k => k !== monthKey));
  };

  const handleHidePastMonths = () => {
    const now = new Date();
    const currentMonthKey = format(now, 'yyyy-MM');
    
    const pastMonths = Object.keys(scheduleByMonth).filter(key => key < currentMonthKey);
    if (pastMonths.length > 0) {
      setHiddenMonths(prev => Array.from(new Set([...prev, ...pastMonths])));
    }
  };

  const hasPastMonthsVisible = useMemo(() => {
    const now = new Date();
    const currentMonthKey = format(now, 'yyyy-MM');
    return Object.keys(scheduleByMonth).some(key => key < currentMonthKey);
  }, [scheduleByMonth]);

  const handlePrintMonth = (key: string, name: string, weekends: WeekendSchedule[]) => {
    setPrintMonth({ key, name, weekends });
  };

  const executePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Estilos para impressão */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-modal-content, #print-modal-content * {
            visibility: visible;
          }
          #print-modal-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white;
            color: black;
          }
          /* Esconder botões na impressão */
          .no-print {
            display: none !important;
          }
          /* Forçar cores de fundo na impressão */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Escala de Folgas
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Programação de folgas dos locutores para finais de semana.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
          {hasPastMonthsVisible && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleHidePastMonths}
              className="text-[10px] font-bold uppercase tracking-tight border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-400"
            >
              <EyeOff className="h-3 w-3 mr-1" />
              Ocultar Passados
            </Button>
          )}
          {hiddenMonths.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ocultos:</span>
              <div className="flex gap-1">
                {hiddenMonths.sort().map(key => {
                  const [y, m] = key.split('-').map(Number);
                  const d = new Date(y, m - 1, 1);
                  const name = format(d, 'MMM', { locale: ptBR });
                  return (
                    <button
                      key={key}
                      onClick={() => handleShowMonth(key)}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 uppercase hover:underline flex items-center gap-0.5"
                      title="Mostrar Mês"
                    >
                      <Eye className="h-3 w-3" />
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div className="flex gap-2">
            {ANNOUNCERS.map(announcer => (
              <div key={announcer} className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${ANNOUNCER_COLORS[announcer]}`}>
                <User className="h-3 w-3" />
                {announcer.split(' ')[0]}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence>
          {Object.entries(scheduleByMonth).map(([key, weekends]: [string, WeekendSchedule[]]) => {
            const [year, month] = key.split('-').map(Number);
            const monthDate = new Date(year, month - 1, 1);
            const monthName = format(monthDate, 'MMMM', { locale: ptBR });

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col group"
              >
                <div className="bg-white dark:bg-slate-800 p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-slate-400" />
                    <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200 capitalize">
                      {monthName}
                    </h3>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handlePrintMonth(key, monthName, weekends)}
                      className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                      title="Imprimir Mês"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleHideMonth(key)}
                      className="h-8 w-8 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                      title="Ocultar Mês"
                    >
                      <EyeOff className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-4 flex-1 space-y-3">
                  {weekends.map((weekend, i) => {
                    const satDay = format(weekend.saturday, 'dd');
                    const sunDay = format(weekend.sunday, 'dd');
                    const monthAbbr = format(weekend.saturday, 'MMM', { locale: ptBR }).toUpperCase().replace('.', '');
                    
                    return (
                      <div key={i} className="flex items-center p-3 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all dark:bg-slate-800 dark:border-slate-700">
                        {/* Date Box */}
                        <div className="flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-lg w-16 h-16 mr-4 shrink-0">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase leading-none mb-1">
                            {monthAbbr}
                          </span>
                          <span className="text-2xl font-bold text-slate-700 dark:text-white leading-none">
                            {satDay}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 mr-4">
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                            Sábado e Domingo
                          </h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {satDay} e {sunDay}
                          </p>
                        </div>

                        {/* Announcer Pill */}
                        <div className={`px-3 py-2 rounded-lg border text-xs font-bold flex items-center gap-2 shrink-0 ${ANNOUNCER_COLORS[weekend.announcer]}`}>
                          <User className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">{weekend.announcer}</span>
                          <span className="sm:hidden">{weekend.announcer.split(' ')[0]}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="flex justify-center mt-8">
        <Button 
          onClick={handleAddMonth} 
          size="lg" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 dark:bg-indigo-600 dark:hover:bg-indigo-500"
        >
          <Plus className="h-5 w-5 mr-2" />
          Gerar mais um MÊS
        </Button>
      </div>

      {/* Print Modal */}
      <AnimatePresence>
        {printMonth && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPrintMonth(null)}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm no-print"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-xl shadow-xl z-50 p-0 overflow-hidden dark:bg-slate-800 dark:border dark:border-slate-700"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700 no-print">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Printer className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  Imprimir Escala
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setPrintMonth(null)} className="dark:text-slate-400 dark:hover:text-slate-200">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="p-6 max-h-[70vh] overflow-y-auto bg-slate-50 dark:bg-slate-900/50">
                {/* Printable Content */}
                <div id="print-modal-content" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
                  <div className="flex justify-center items-center gap-2 mb-6 border-b border-slate-100 pb-4 dark:border-slate-700">
                    <CalendarDays className="h-6 w-6 text-slate-500" />
                    <h2 className="font-bold text-2xl text-slate-800 dark:text-white capitalize">
                      {printMonth.name}
                    </h2>
                  </div>
                  
                  <div className="space-y-4">
                    {printMonth.weekends.map((weekend, i) => {
                      const satDay = format(weekend.saturday, 'dd');
                      const sunDay = format(weekend.sunday, 'dd');
                      const monthAbbr = format(weekend.saturday, 'MMM', { locale: ptBR }).toUpperCase().replace('.', '');
                      
                      return (
                        <div key={i} className="flex items-center p-3 rounded-xl border border-slate-100 bg-white shadow-sm dark:bg-slate-800 dark:border-slate-700">
                          <div className="flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-lg w-16 h-16 mr-4 shrink-0">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase leading-none mb-1">
                              {monthAbbr}
                            </span>
                            <span className="text-2xl font-bold text-slate-700 dark:text-white leading-none">
                              {satDay}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0 mr-4">
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                              Sábado e Domingo
                            </h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {satDay} e {sunDay}
                            </p>
                          </div>

                          <div className={`px-3 py-2 rounded-lg border text-xs font-bold flex items-center gap-2 shrink-0 ${ANNOUNCER_COLORS[weekend.announcer]}`}>
                            <User className="h-3.5 w-3.5" />
                            <span className="inline">{weekend.announcer}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2 bg-white dark:bg-slate-800 no-print">
                <Button variant="outline" onClick={() => setPrintMonth(null)} className="dark:border-slate-700 dark:text-slate-300">
                  Cancelar
                </Button>
                <Button onClick={executePrint} className="bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500">
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
