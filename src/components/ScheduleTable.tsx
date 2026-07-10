import React, { useState, useMemo } from 'react';
import { format, addMonths, eachWeekendOfInterval, endOfMonth, isSaturday, isSunday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, User, CalendarDays, Printer, X } from 'lucide-react';
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
  // Estado para controlar qual mês está sendo impresso
  const [printMonth, setPrintMonth] = useState<{ key: string; name: string; weekends: WeekendSchedule[] } | null>(null);

  // Calcula a escala sequencial contínua a partir de 01/01/2026.
  // Como 2026 começa no ano certo da contagem, fixar em 2026 garante a sequência correta
  // onde 11/07/2026 cai com Roque de Freitas.
  const scheduleData = useMemo(() => {
    const startDate = new Date(2026, 0, 1); // 1 de Janeiro de 2026
    
    // Obter o mês atual e o próximo mês com base na data atual
    const now = new Date();
    const nextMonthDate = addMonths(now, 1);
    
    // Calcular a diferença de meses para saber quantos meses precisamos calcular desde a data âncora
    const yearDiff = nextMonthDate.getFullYear() - startDate.getFullYear();
    const monthDiff = nextMonthDate.getMonth() - startDate.getMonth();
    const totalMonths = (yearDiff * 12) + monthDiff + 1;
    
    const monthsToCalculate = Math.max(2, totalMonths);
    const endDate = endOfMonth(addMonths(startDate, monthsToCalculate - 1));
    
    const allWeekends = eachWeekendOfInterval({ start: startDate, end: endDate });
    
    const weekends: WeekendSchedule[] = [];
    let announcerIndex = 0; // Começa a escala de forma contínua e sequencial

    // Agrupar sábados e domingos em pares mantendo a logística sequencial
    for (let i = 0; i < allWeekends.length; i++) {
      const date = allWeekends[i];
      
      if (isSaturday(date)) {
        const saturday = date;
        let sunday = date;
        
        if (i + 1 < allWeekends.length && isSunday(allWeekends[i+1])) {
           sunday = allWeekends[i+1];
           i++; // Pula o domingo
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
  }, []);

  // Filtra e agrupa apenas o mês atual e o próximo mês
  const scheduleByMonth = useMemo(() => {
    const now = new Date();
    const currentMonthKey = format(now, 'yyyy-MM');
    const nextMonthKey = format(addMonths(now, 1), 'yyyy-MM');

    const grouped: Record<string, WeekendSchedule[]> = {};
    
    scheduleData.forEach(weekend => {
      const monthKey = format(weekend.saturday, 'yyyy-MM');
      
      // Deixa disponível na tela somente o mês atual e o próximo mês disponível
      if (monthKey === currentMonthKey || monthKey === nextMonthKey) {
        if (!grouped[monthKey]) {
          grouped[monthKey] = [];
        }
        grouped[monthKey].push(weekend);
      }
    });
    
    return grouped;
  }, [scheduleData]);

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
          .no-print {
            display: none !important;
          }
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
            Programação automática de folgas dos locutores (Mês Atual e Mês Seguinte).
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
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
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
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
