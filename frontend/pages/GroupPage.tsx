import React, { useState, useEffect } from 'react';
import { Group } from '../types';
import Header from '../components/Header';
import Button from '../components/Button';
import Card from '../components/Card';
import { expensesAPI } from '../lib/api';

interface GroupPageProps {
  group?: Group;
  onBack: () => void;
  onAddExpense: () => void;
  isLoading: boolean;
  error: string | null;
}

interface Expense {
  _id: string;
  description: string;
  amount: number;
  paidBy: {
    _id: string;
    name: string;
    email: string;
  };
  category: string;
  date: string;
  splitBetween: Array<{
    user: {
      _id: string;
      name: string;
    };
    amount: number;
  }>;
}

interface Balance {
  from: string;
  to: string;
  amount: number;
}

export const GroupPage: React.FC<GroupPageProps> = ({ 
  group, 
  onBack, 
  onAddExpense, 
  isLoading, 
  error 
}) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [loadingBalances, setLoadingBalances] = useState(false);

  useEffect(() => {
    if (group) {
      fetchExpenses();
      fetchBalances();
    }
  }, [group]);

  const fetchExpenses = async () => {
    if (!group) return;
    
    try {
      setLoadingExpenses(true);
      const response = await expensesAPI.getGroupExpenses(group._id || group.id);
      setExpenses(response.expenses || []);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setLoadingExpenses(false);
    }
  };

  const fetchBalances = async () => {
    if (!group) return;
    
    try {
      setLoadingBalances(true);
      const response = await expensesAPI.getGroupBalance(group._id || group.id);
      setBalances(response.debts || []);
    } catch (error) {
      console.error('Failed to fetch balances:', error);
    } finally {
      setLoadingBalances(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#20C997] mb-4"></div>
        <p className="text-white/70">Loading group data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-6 mb-6">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={onBack} variant="secondary">
            Back to Groups
          </Button>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white mb-4">Group not found</h2>
        <Button onClick={onBack} variant="secondary">
          Back to Groups
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className="text-white/70 hover:text-white mb-2 transition-colors"
          >
            ← Back to Groups
          </button>
          <Header title={group.name} />
          <p className="text-white/70 mt-1">{group.description}</p>
        </div>
        <Button onClick={onAddExpense}>
          + Add Expense
        </Button>
      </div>

      {/* Group Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="text-white/70 text-sm font-medium">Members</h3>
          <p className="text-2xl font-bold text-white">{group.members?.length || 0}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-white/70 text-sm font-medium">Total Expenses</h3>
          <p className="text-2xl font-bold text-[#20C997]">₹{group.totalExpenses || 0}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-white/70 text-sm font-medium">Your Share</h3>
          <p className="text-2xl font-bold text-white">₹{((group.totalExpenses || 0) / (group.members?.length || 1)).toFixed(2)}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Expenses */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Recent Expenses</h2>
          </div>
          
          {loadingExpenses ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#20C997]"></div>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/70">No expenses recorded yet.</p>
              <Button onClick={onAddExpense} className="mt-4">
                Add First Expense
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.slice(0, 5).map((expense) => (
                <div key={expense._id} className="bg-white/5 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-white">{expense.description}</h4>
                      <p className="text-white/60 text-sm">
                        Paid by {expense.paidBy.name} • {expense.category}
                      </p>
                      <p className="text-white/50 text-xs">
                        {new Date(expense.date).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-[#20C997] font-bold">₹{expense.amount.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Balances */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">Who Owes Whom</h2>
          
          {loadingBalances ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#20C997]"></div>
            </div>
          ) : balances.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-green-400 font-medium">Everyone is settled up!</p>
              <p className="text-white/60 text-sm mt-2">All expenses are balanced.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {balances.map((balance, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-3">
                  <p className="text-white">
                    <span className="text-red-400">{balance.from}</span>
                    <span className="text-white/70"> owes </span>
                    <span className="text-green-400">{balance.to}</span>
                  </p>
                  <p className="text-[#20C997] font-bold">₹{balance.amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Members List */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-white mb-4">Group Members</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {group.members?.map((member) => (
            <div key={member.user._id} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
              <div className="w-10 h-10 bg-[#20C997] rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {member.user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-white">{member.user.name}</p>
                <p className="text-white/60 text-sm">{member.user.email}</p>
              </div>
            </div>
          )) || (
            <p className="text-white/70">No members found.</p>
          )}
        </div>
      </Card>
    </div>
  );
};
