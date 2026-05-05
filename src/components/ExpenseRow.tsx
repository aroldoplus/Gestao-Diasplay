import React, { useState } from 'react';
import { Expense } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Edit2, Save, X, Trash2, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface ExpenseRowProps {
  expense: Expense;
  onUpdate: (updatedExpense: Expense) => void;
  onDelete: (id: string) => void;
}

export const ExpenseRow: React.FC<ExpenseRowProps> = ({ expense, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [editedExpense, setEditedExpense] = useState<Expense>(expense);

  const handleSave = () => {
    onUpdate(editedExpense);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedExpense(expense);
    setIsEditing(false);
  };

  const handleChange = (field: keyof Expense, value: string | number | boolean) => {
    setEditedExpense((prev) => ({ ...prev, [field]: value }));
  };

  const togglePaid = () => {
    const updatedExpense = { ...expense, paid: !expense.paid };
    onUpdate(updatedExpense);
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
      <td className="p-4 align-middle font-medium md:table-cell block w-full">
        {isEditing ? (
          <Input
            value={editedExpense.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full uppercase dark:bg-slate-900 dark:text-white dark:border-slate-700"
            autoFocus
          />
        ) : (
          <span className="text-slate-900 dark:text-white uppercase font-bold tracking-wide">
            {expense.name}
          </span>
        )}
      </td>
      <td className="p-4 align-middle md:table-cell block w-full">
        {isEditing ? (
          <Input
            value={editedExpense.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full dark:bg-slate-900 dark:text-white dark:border-slate-700"
          />
        ) : (
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsDescriptionModalOpen(true)}
              className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:text-indigo-300 dark:hover:bg-indigo-900/20"
              title="Ver descrição"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <span className="text-slate-600 dark:text-slate-400 text-sm truncate max-w-[150px]">
              {expense.description}
            </span>
          </div>
        )}
      </td>
      <td className="p-4 align-middle md:table-cell block w-full">
        {isEditing ? (
          <Input
            type="number"
            value={editedExpense.value}
            onChange={(e) => handleChange('value', parseFloat(e.target.value) || 0)}
            className="w-full dark:bg-slate-900 dark:text-white dark:border-slate-700"
            step="0.01"
          />
        ) : (
          <span className="text-red-600 font-bold dark:text-red-400">
            {expense.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        )}
      </td>
      <td className="p-4 align-middle md:table-cell block w-full">
        {isEditing ? (
          <Input
            type="date"
            value={editedExpense.paymentDate}
            onChange={(e) => handleChange('paymentDate', e.target.value)}
            className="w-full dark:bg-slate-900 dark:text-white dark:border-slate-700"
          />
        ) : (
          <span className="text-slate-600 dark:text-slate-400 text-sm">
            {new Date(expense.paymentDate).toLocaleDateString('pt-BR')}
          </span>
        )}
      </td>
      <td className="p-4 align-middle text-right md:table-cell block w-full">
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
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={togglePaid}
                className={cn(
                  "h-4 w-4 rounded-full transition-all duration-300 shadow-sm mr-1",
                  expense.paid 
                    ? "bg-emerald-500 ring-4 ring-emerald-500/20" 
                    : "bg-red-500 ring-4 ring-red-500/20"
                )}
                title={expense.paid ? "Pago" : "Pendente"}
              />
              <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)} className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20">
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => onDelete(expense.id)} className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-900/20">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </td>
    </motion.tr>

      {/* Description Modal */}
      <AnimatePresence>
        {isDescriptionModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDescriptionModalOpen(false)}
              className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl z-[70] p-6 dark:bg-slate-800 dark:border dark:border-slate-700"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Eye className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  Descrição da Despesa
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setIsDescriptionModalOpen(false)} className="dark:text-slate-400 dark:hover:text-slate-200">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {expense.description || "Nenhuma descrição fornecida."}
                </p>
              </div>

              <div className="mt-6 flex justify-end">
                <Button onClick={() => setIsDescriptionModalOpen(false)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Fechar
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
