import React, { useState } from 'react';
import { Program } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Edit2, Save, X, Trash2, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface ProgramRowProps {
  program: Program;
  onUpdate: (updatedProgram: Program) => void;
  onDelete: (id: string) => void;
}

export const ProgramRow: React.FC<ProgramRowProps> = ({ program, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProgram, setEditedProgram] = useState<Program>(program);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleSave = () => {
    onUpdate(editedProgram);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedProgram(program);
    setIsEditing(false);
  };

  const handleChange = (field: keyof Program, value: string) => {
    setEditedProgram((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <motion.tr
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="border-b transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50 dark:border-slate-700 flex flex-col md:table-row"
      >
        <td className="p-2 align-middle font-medium md:table-cell block w-full">
          {isEditing ? (
            <Input
              value={editedProgram.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full uppercase dark:bg-slate-900 dark:text-white dark:border-slate-700"
              autoFocus
            />
          ) : (
            <span className="text-slate-900 dark:text-white uppercase font-bold tracking-wide text-lg md:text-base">
              {program.name}
            </span>
          )}
        </td>
        <td className="p-2 align-middle md:table-cell block w-full flex justify-between md:justify-start items-center border-t md:border-t-0 border-slate-100 dark:border-slate-700">
          <span className="md:hidden text-slate-500 text-xs uppercase font-semibold mr-2 dark:text-slate-400">Horário:</span>
          {isEditing ? (
            <Input
              type="time"
              value={editedProgram.time}
              onChange={(e) => handleChange('time', e.target.value)}
              className="w-32 dark:bg-slate-900 dark:text-white dark:border-slate-700"
            />
          ) : (
            <span className="text-slate-900 font-medium dark:text-slate-100">
              {program.time}
            </span>
          )}
        </td>
        <td className="p-2 align-middle md:table-cell block w-full flex justify-between md:justify-start items-center border-t md:border-t-0 border-slate-100 dark:border-slate-700">
          <span className="md:hidden text-slate-500 text-xs uppercase font-semibold mr-2 dark:text-slate-400">Detalhes:</span>
          {isEditing ? (
            <Input
              value={editedProgram.details}
              onChange={(e) => handleChange('details', e.target.value)}
              className="w-full min-w-[200px] dark:bg-slate-900 dark:text-white dark:border-slate-700"
            />
          ) : (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsDetailsOpen(true)}
              className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-indigo-900/20"
            >
              <Eye className="h-5 w-5" />
              <span className="ml-2 md:hidden">Ver Detalhes</span>
            </Button>
          )}
        </td>
        <td className="p-2 align-middle text-right md:table-cell block w-full border-t md:border-t-0 border-slate-100 dark:border-slate-700">
          <div className="flex justify-end gap-2 w-full">
            {isEditing ? (
              <>
                <Button size="icon" variant="ghost" onClick={handleSave} className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/20">
                  <Save className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={handleCancel} className="h-8 w-8 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)} className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20">
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => onDelete(program.id)} className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-900/20">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </td>
      </motion.tr>

      <AnimatePresence>
        {isDetailsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailsOpen(false)}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl z-50 p-6 dark:bg-slate-800 dark:border dark:border-slate-700"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Eye className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  Detalhes do Programa
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setIsDetailsOpen(false)} className="dark:text-slate-400 dark:hover:text-slate-200">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase dark:text-slate-400">Programa</label>
                  <p className="text-slate-900 font-medium text-lg dark:text-white">{program.name}</p>
                </div>
                
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase dark:text-slate-400">Horário</label>
                  <p className="text-slate-900 dark:text-slate-200">{program.time}</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 dark:bg-slate-900 dark:border-slate-700">
                  <label className="text-xs font-semibold text-slate-500 uppercase dark:text-slate-400 block mb-2">Descrição / Detalhes</label>
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {program.details || "Nenhum detalhe informado."}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button onClick={() => setIsDetailsOpen(false)} className="bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500">
                  Fechar
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
