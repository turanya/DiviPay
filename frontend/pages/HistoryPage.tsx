import React, { useState, useEffect } from 'react';
import { Group, Expense } from '../types';
import Header from '../components/Header';
import Card from '../components/Card';
import Button from '../components/Button';
import { expensesAPI } from '../lib/api';

interface HistoryPageProps {
  groups: Group[];
  onDeleteExpense: (expenseId: string) => void;  // ADDED: This was missing
}

interface ExtendedExpense extends Expense {
  groupName?: string;
  memberName?: string;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ groups, onDeleteExpense }) => {
  const [expenses, setExpenses] = useState<ExtendedExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'paid' | 'owe'>('all');

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await expensesAPI.getUserExpenses();
      const expensesWithDetails = (response.expenses || []).map((expense: Expense) => {
        const group = groups.find(g => (g._id || g.id) === expense.group);
        return {
          ...expense,
          groupName: group?.name || 'Unknown Group',
          memberName: expense.paidBy?.name || 'Unknown'
        };
      });
      setExpenses(expensesWithDetails);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      await onDeleteExpense(expenseId);
      setExpenses(prev => prev.filter(expense => expense._id !== expenseId));
    } catch (error) {
      console.error('Failed to delete expense:', error);
      alert('Failed to delete expense. Please try again.');
    }
  };

  const currentUserId = JSON.parse(localStorage.getItem('user') || '{}').id;
  const filteredExpenses = expenses.filter(expense => {
    switch (filter) {
      case 'paid':
        return expense.paidBy._id === currentUserId;
      case 'owe':
        return expense.splitBetween?.some(split => split.user._id === currentUserId) && expense.paidBy._id !== currentUserId;
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#20C997] mb-4"></div>
        <p className="text-white/70">Loading expenses...</p>
      </div>
    );
  }

  return (
    <div>
      <Header title="All Transactions" />

      {/* Filter Buttons */}
      <div className="flex space-x-4 mb-6">
        <Button 
          variant={filter === 'all' ? 'primary' : 'secondary'}
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button 
          variant={filter === 'paid' ? 'primary' : 'secondary'}
          onClick={() => setFilter('paid')}
        >
          You Paid
        </Button>
        <Button 
          variant={filter === 'owe' ? 'primary' : 'secondary'}
          onClick={() => setFilter('owe')}
        >
          You Owe
        </Button>
      </div>

      {filteredExpenses.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-white mb-4">No Transactions Yet</h2>
          <p className="text-white/70">Start adding expenses to see your history!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredExpenses.map((expense) => (
            <Card key={expense._id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-white">{expense.description}</h3>
                  <p className="text-white/70 text-sm">
                    {expense.groupName} - Paid by {expense.memberName}
                  </p>
                  <p className="text-white/50 text-xs">
                    {new Date(expense.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <p className="text-[#20C997] font-bold text-lg">₹{expense.amount.toFixed(2)}</p>
                  <button
                    onClick={() => handleDeleteExpense(expense._id || '')}
                    className="text-red-400 hover:text-red-300 transition-colors p-1"
                    title="Delete expense"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
