import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Group, Expense } from '../types';
import Header from '../components/Header';
import Card from '../components/Card';
import Button from '../components/Button';
import { groupsAPI, expensesAPI } from '../lib/api';

interface GroupPageProps {
  onRefreshGroup?: () => void;
}

interface GroupBalance {
  userId: string;
  name: string;
  email: string;
  totalPaid: number;
  totalOwes: number;
  netBalance: number;
}

interface GroupDebt {
  from: {
    userId: string;
    name: string;
  };
  to: {
    userId: string;
    name: string;
  };
  amount: number;
}

export const GroupPage: React.FC<GroupPageProps> = ({ onRefreshGroup }) => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<GroupBalance[]>([]);
  const [debts, setDebts] = useState<GroupDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'members'>('expenses');

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch (err) {
      console.error('Error parsing user from localStorage:', err);
      return {};
    }
  }, []);

  useEffect(() => {
    if (groupId) {
      fetchGroupData();
    }
  }, [groupId]);

  const fetchGroupData = async () => {
    if (!groupId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch group details
      const groupData = await groupsAPI.getGroupDetails(groupId);
      setGroup(groupData);

      // Fetch group expenses
      const expensesResponse = await expensesAPI.getGroupExpenses(groupId);
      if (expensesResponse?.success && Array.isArray(expensesResponse.expenses)) {
        setExpenses(expensesResponse.expenses);
      }

      // Fetch group balances
      const balanceResponse = await expensesAPI.getGroupBalance(groupId);
      if (balanceResponse?.success) {
        setBalances(balanceResponse.balances || []);
        setDebts(balanceResponse.debts || []);
      }

    } catch (err: any) {
      console.error('Failed to fetch group data:', err);
      setError('Failed to load group data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchGroupData();
    if (onRefreshGroup) {
      onRefreshGroup();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Header title="Loading..." />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#20C997] mx-auto mb-4"></div>
              <div className="text-white text-lg">Loading group data...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Header title="Error" />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-6xl mb-4">😵</div>
            <div className="text-red-400 mb-4 text-lg">
              {error || 'The group may have been deleted or you don\'t have access.'}
            </div>
            <div className="space-x-4">
              <Button onClick={handleRefresh} className="bg-[#20C997] hover:bg-[#1ba085]">
                Try Again
              </Button>
              <Button onClick={() => navigate('/groups')} className="bg-gray-600 hover:bg-gray-500">
                Back to Groups
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalExpenses = group.totalExpenses || 0;
  const memberCount = group.members?.length || 0;
  const avgPerMember = memberCount > 0 ? totalExpenses / memberCount : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Header title={group.name} />
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        
        {/* Group Header Card */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#20C997]/10 to-blue-500/10"></div>
          <div className="relative p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div className="flex items-center space-x-3 mb-4 md:mb-0">
                <div className="text-4xl">👥</div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{group.name}</h1>
                  <p className="text-gray-400">{memberCount} members</p>
                </div>
              </div>
              <Button 
                onClick={handleRefresh} 
                className="bg-[#20C997] hover:bg-[#1ba085] self-start md:self-auto"
              >
                🔄 Refresh
              </Button>
            </div>
            
            {group.description && (
              <div className="bg-white/5 rounded-lg p-4 mb-4">
                <p className="text-gray-300 italic">"{group.description}"</p>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-[#20C997]">₹{totalExpenses.toFixed(2)}</div>
                <div className="text-sm text-gray-400">Total Expenses</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">₹{avgPerMember.toFixed(2)}</div>
                <div className="text-sm text-gray-400">Per Member</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">{expenses.length}</div>
                <div className="text-sm text-gray-400">Transactions</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
          {[
            { key: 'expenses', label: '💰 Expenses', icon: '💰' },
            { key: 'balances', label: '⚖️ Balances', icon: '⚖️' },
            { key: 'members', label: '👤 Members', icon: '👤' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-[#20C997] text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'expenses' && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center">
                <span className="text-2xl mr-2">💰</span>
                Recent Expenses
              </h2>
              <Button 
                onClick={() => navigate('/add-expense')}
                className="bg-[#20C997] hover:bg-[#1ba085]"
              >
                ➕ Add Expense
              </Button>
            </div>

            {expenses.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold text-white mb-2">No expenses recorded yet.</h3>
                <p className="text-gray-400 mb-6">Add your first expense to get started!</p>
                <Button 
                  onClick={() => navigate('/add-expense')}
                  className="bg-[#20C997] hover:bg-[#1ba085]"
                >
                  Add First Expense
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {expenses.slice(0, 10).map((expense, index) => (
                  <div 
                    key={expense._id || expense.id || index}
                    className="bg-gradient-to-r from-white/5 to-white/10 rounded-lg p-4 hover:from-white/10 hover:to-white/15 transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg">
                            {expense.category === 'Food' ? '🍕' :
                             expense.category === 'Transportation' ? '🚗' :
                             expense.category === 'Entertainment' ? '🎬' :
                             expense.category === 'Shopping' ? '🛒' :
                             expense.category === 'Bills' ? '📄' :
                             expense.category === 'Travel' ? '✈️' :
                             expense.category === 'Settlement' ? '🤝' : '💼'}
                          </span>
                          <h3 className="font-semibold text-white">{expense.description}</h3>
                          {expense.category && (
                            <span className="px-2 py-1 bg-white/10 rounded-full text-xs text-gray-300">
                              {expense.category}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-400">
                          Paid by {expense.paidBy?.name || 'Unknown'} • {expense.date ? new Date(expense.date).toLocaleDateString() : 'Unknown date'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-[#20C997]">
                          ₹{expense.amount.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-400">
                          ₹{(expense.amount / (group.members?.length || 1)).toFixed(2)} each
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {expenses.length > 10 && (
                  <div className="text-center pt-4">
                    <Button 
                      onClick={() => navigate('/history')}
                      className="bg-gray-600 hover:bg-gray-500"
                    >
                      View All Expenses
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'balances' && (
          <div className="space-y-6">
            {/* Individual Balances */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <span className="text-2xl mr-2">⚖️</span>
                Member Balances
              </h2>
              
              {balances.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">💫</div>
                  <p className="text-gray-400">No balance data available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {balances.map((balance) => (
                    <div 
                      key={balance.userId}
                      className={`p-4 rounded-lg border-2 ${
                        balance.netBalance > 0.01 ? 'bg-green-900/20 border-green-500/30' :
                        balance.netBalance < -0.01 ? 'bg-red-900/20 border-red-500/30' :
                        'bg-gray-800/50 border-gray-600/30'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-white flex items-center">
                            <span className="text-lg mr-2">
                              {balance.userId === currentUser.id ? '👋' : '👤'}
                            </span>
                            {balance.name}
                            {balance.userId === currentUser.id && (
                              <span className="ml-2 px-2 py-1 bg-[#20C997] text-white text-xs rounded-full">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-400 mt-1">
                            Paid: ₹{balance.totalPaid.toFixed(2)} • Owes: ₹{balance.totalOwes.toFixed(2)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${
                            balance.netBalance > 0.01 ? 'text-green-400' :
                            balance.netBalance < -0.01 ? 'text-red-400' :
                            'text-gray-400'
                          }`}>
                            {balance.netBalance > 0.01 ? '+' : ''}₹{balance.netBalance.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {balance.netBalance > 0.01 ? 'Gets back' :
                             balance.netBalance < -0.01 ? 'Owes' : 'Settled'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Settlement Suggestions */}
            {debts.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                  <span className="text-2xl mr-2">🤝</span>
                  Suggested Settlements
                </h2>
                <div className="space-y-4">
                  {debts.map((debt, index) => (
                    <div 
                      key={index}
                      className="bg-gradient-to-r from-orange-900/20 to-yellow-900/20 border border-orange-500/30 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">💸</span>
                          <div>
                            <div className="text-white">
                              <span className="font-semibold">{debt.from.name}</span>
                              <span className="mx-2 text-gray-400">→</span>
                              <span className="font-semibold">{debt.to.name}</span>
                            </div>
                            <div className="text-sm text-gray-400">Settlement needed</div>
                          </div>
                        </div>
                        <div className="text-xl font-bold text-orange-400">
                          ₹{debt.amount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <div className="text-sm text-blue-300">
                    💡 <strong>Tip:</strong> Go to the Settlements page to mark these payments as completed once settled.
                  </div>
                </div>
              </Card>
            )}

            {debts.length === 0 && balances.length > 0 && (
              <Card className="p-6 text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-xl font-bold text-white mb-2">Everyone is settled up!</h3>
                <p className="text-gray-400">All expenses are balanced.</p>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
              <span className="text-2xl mr-2">👥</span>
              Group Members ({memberCount})
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.members?.map((member, index) => (
                <div 
                  key={member.user._id || member.user.id || index}
                  className="bg-gradient-to-br from-white/5 to-white/10 rounded-lg p-4 hover:from-white/10 hover:to-white/15 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#20C997] to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {member.user.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white flex items-center">
                        {member.user.name}
                        {member.user._id === currentUser.id && (
                          <span className="ml-2 px-2 py-1 bg-[#20C997] text-white text-xs rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">{member.user.email}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Member since {new Date(member.joinedAt || '').toLocaleDateString() || 'Unknown'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {memberCount < 10 && (
              <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg text-center">
                <div className="text-blue-300">
                  💡 <strong>Invite more friends!</strong> Share the group ID or invite link to add more members.
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              onClick={() => navigate('/add-expense')}
              className="bg-[#20C997] hover:bg-[#1ba085] py-3"
            >
              ➕ Add Expense
            </Button>
            <Button 
              onClick={() => navigate('/settlements')}
              className="bg-orange-600 hover:bg-orange-500 py-3"
            >
              🤝 Settlements
            </Button>
            <Button 
              onClick={() => navigate('/history')}
              className="bg-blue-600 hover:bg-blue-500 py-3"
            >
              📊 History
            </Button>
            <Button 
              onClick={handleRefresh}
              className="bg-gray-600 hover:bg-gray-500 py-3"
            >
              🔄 Refresh
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default GroupPage;
