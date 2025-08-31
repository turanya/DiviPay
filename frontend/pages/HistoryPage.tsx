import React, { useState, useEffect } from 'react';
import { Group, Expense } from '../types';
import Header from '../components/Header';
import Card from '../components/Card';
import Button from '../components/Button';
import { expensesAPI } from '../lib/api';

interface HistoryPageProps {
  groups?: Group[];
  onDeleteExpense?: (expenseId: string) => void;
}

interface ExtendedExpense extends Omit<Expense, 'date'> {
  groupName?: string;
  memberName?: string;
  createdAt?: string;
  date?: string;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ groups = [], onDeleteExpense }) => {
  const [expenses, setExpenses] = useState<ExtendedExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'paid' | 'owe'>('all');

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Always fetch from API for most up-to-date data
        console.log('Fetching user expenses from API...');
        const response = await expensesAPI.getUserExpenses();
        console.log('User expenses response:', response);
        
        if (response?.success && Array.isArray(response.expenses)) {
          // Transform API response to include group and member names
          const transformedExpenses = response.expenses.map((expense: any) => ({
            ...expense,
            groupName: expense.group?.name || 'Unknown Group',
            memberName: expense.paidBy?.name || 'Unknown',
            // Ensure we have proper IDs
            _id: expense._id || expense.id,
            id: expense._id || expense.id
          }));
          setExpenses(transformedExpenses);
        } else {
          console.warn('Invalid response format:', response);
          setExpenses([]);
        }
      } catch (err: any) {
        console.error('Failed to fetch expenses:', err);
        setError('Failed to load expense history. Please try again.');
        setExpenses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, []); // Remove groups dependency to always fetch from API

  const handleDeleteExpense = async (expenseId: string) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    try {
      if (onDeleteExpense) {
        await onDeleteExpense(expenseId);
      } else {
        // If no onDeleteExpense handler is provided, delete directly
        await expensesAPI.delete(expenseId);
      }
      
      // Remove the deleted expense from local state
      setExpenses(prev => prev.filter(expense => expense._id !== expenseId));
    } catch (error) {
      console.error('Failed to delete expense:', error);
      alert('Failed to delete expense. Please try again.');
    }
  };

  // Safe access to current user ID
  const getCurrentUserId = () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user).id : null;
    } catch (err) {
      console.error('Error parsing user from localStorage:', err);
      return null;
    }
  };

  const currentUserId = getCurrentUserId();

  const filteredExpenses = expenses.filter(expense => {
    if (!currentUserId) return true; // Show all if no user ID
    
    switch (filter) {
      case 'paid':
        return expense.paidBy?._id === currentUserId || expense.paidBy?.id === currentUserId;
      case 'owe':
        return expense.splitBetween?.some(split => 
          (split.user._id === currentUserId || split.user.id === currentUserId)
        ) && expense.paidBy?._id !== currentUserId && expense.paidBy?.id !== currentUserId;
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#20C997] mb-4"></div>
          <p className="text-xl">Loading expenses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">{error}</div>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header title="Expense History" />
      
      {/* Filter Buttons */}
      <Card>
        <div className="flex gap-2 mb-4">
          <Button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded ${
              filter === 'all'
                ? 'bg-[#20C997] text-white'
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            All
          </Button>
          <Button
            onClick={() => setFilter('paid')}
            className={`px-4 py-2 rounded ${
              filter === 'paid'
                ? 'bg-[#20C997] text-white'
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            You Paid
          </Button>
          <Button
            onClick={() => setFilter('owe')}
            className={`px-4 py-2 rounded ${
              filter === 'owe'
                ? 'bg-[#20C997] text-white'
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            You Owe
          </Button>
        </div>
      </Card>

      {/* Expenses List */}
      <Card>
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-xl mb-2">No Transactions Yet</div>
            <p className="text-gray-500">Start adding expenses to see your history!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredExpenses.map((expense) => {
              // Safe access to expense properties
              const expenseId = expense._id || expense.id || '';
              const description = expense.description || 'Unknown expense';
              const amount = expense.amount || 0;
              const groupName = expense.groupName || 'Unknown Group';
              const memberName = expense.memberName || 'Unknown';
              
              let displayDate = 'Unknown date';
              try {
                if (expense.date || expense.createdAt) {
                  const dateToUse = expense.date || expense.createdAt;
                  const date = new Date(dateToUse);
                  if (!isNaN(date.getTime())) {
                    displayDate = date.toLocaleDateString();
                  }
                }
              } catch (err) {
                console.error('Error parsing expense date:', err);
              }

              return (
                <div key={expenseId} className="flex justify-between items-center p-4 bg-white/5 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-lg">{description}</div>
                    <div className="text-sm text-gray-400 mt-1">
                      {groupName} - Paid by {memberName}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {displayDate}
                    </div>
                    {/* Show category if available */}
                    {expense.category && (
                      <div className="text-xs text-blue-400 mt-1">
                        {expense.category}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-bold text-[#20C997] text-lg">₹{amount.toFixed(2)}</div>
                    </div>
                    {onDeleteExpense && expense.category !== 'Settlement' && (
                      <button
                        onClick={() => handleDeleteExpense(expenseId)}
                        className="text-red-400 hover:text-red-300 transition-colors p-1"
                        title="Delete expense"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default HistoryPage;
