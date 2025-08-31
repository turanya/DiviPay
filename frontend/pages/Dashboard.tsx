import React, { useState, useEffect, useMemo } from 'react';
import { Group, Expense } from '../types';
import Header from '../components/Header';
import Card from '../components/Card';
import { groupsAPI, expensesAPI } from '../lib/api';

interface DashboardProps {
  // Remove groups prop dependency since we'll fetch our own data
}

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  color?: string;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color = 'white', delay = 0 }) => (
  <div 
    className={`bg-gradient-to-br from-gray-800/50 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 
    shadow-xl transform hover:scale-105 hover:-translate-y-1 transition-all duration-500 ease-out cursor-default group
    animate-fade-in-up`}
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex flex-col items-center text-center">
      <div className={`text-4xl mb-3 group-hover:scale-110 transition-transform duration-300 filter drop-shadow-lg`}>
        {icon}
      </div>
      <div className="text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">{title}</div>
      <div className={`text-2xl font-bold text-${color === 'white' ? 'white' : color + '-400'} group-hover:text-${color === 'white' ? 'gray-100' : color + '-300'} transition-colors duration-300`}>
        {value}
      </div>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch fresh data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching dashboard data...');
        
        // Fetch user's groups
        const groupsResponse = await groupsAPI.getUserGroups();
        console.log('Groups response:', groupsResponse);
        
        if (groupsResponse?.success && Array.isArray(groupsResponse.groups)) {
          setGroups(groupsResponse.groups);
        } else if (Array.isArray(groupsResponse)) {
          setGroups(groupsResponse);
        } else {
          console.warn('Invalid groups response format:', groupsResponse);
          setGroups([]);
        }
        
      } catch (err: any) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []); // Fetch on component mount

  // Auto-refresh dashboard data periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const groupsResponse = await groupsAPI.getUserGroups();
        if (groupsResponse?.success && Array.isArray(groupsResponse.groups)) {
          setGroups(groupsResponse.groups);
        } else if (Array.isArray(groupsResponse)) {
          setGroups(groupsResponse);
        }
      } catch (err) {
        console.error('Background refresh failed:', err);
      }
    }, 60000); // Refresh every 60 seconds

    return () => clearInterval(interval);
  }, []);

  interface ExtendedExpense extends Omit<Expense, 'date'> {
    date: string;
    groupName: string;
    paidByName: string;
  }

  const recentExpenses = useMemo<ExtendedExpense[]>(() => {
    const allExpenses = groups.flatMap(group =>
      (group.expenses || []).map(expense => {
        const date = expense.date || new Date().toISOString();
        return {
          ...expense,
          date,
          groupName: group.name,
          paidByName: group.members?.find(m =>
            (m.user._id || m.user.id) === (expense.paidBy._id || expense.paidBy.id)
          )?.user.name || 'Unknown'
        };
      })
    );
    
    return allExpenses
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [groups]);

  const totalSpending = useMemo(() => {
    return groups.reduce((sum, group) => sum + (group.totalExpenses || 0), 0);
  }, [groups]);

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch (err) {
      console.error('Error parsing user from localStorage:', err);
      return {};
    }
  }, []);

  const { youOwe, youAreOwed } = useMemo(() => {
    let owe = 0;
    let owed = 0;

    groups.forEach(group => {
      const expenses = group.expenses || [];
      const memberCount = group.members?.length || 1;
      const userShare = (group.totalExpenses || 0) / memberCount;
      
      const userPaid = expenses
        .filter(e => (e.paidBy._id || e.paidBy.id) === currentUser.id)
        .reduce((sum, e) => sum + e.amount, 0);

      const balance = userPaid - userShare;
      if (balance < 0) {
        owe += Math.abs(balance);
      } else {
        owed += balance;
      }
    });

    return { youOwe: owe, youAreOwed: owed };
  }, [groups, currentUser.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Header title="Dashboard" />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-700 border-t-[#20C997] mx-auto mb-4"></div>
                <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-[#20C997]/30 animate-ping mx-auto"></div>
              </div>
              <div className="text-white text-xl font-semibold animate-pulse">Loading your dashboard...</div>
              <div className="text-gray-400 text-sm mt-2">Fetching your latest data</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Header title="Dashboard" />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">😔</div>
            <div className="text-red-400 mb-4 text-lg">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-[#20C997] text-white rounded-xl hover:bg-[#1ba085] transition-colors duration-300 transform hover:scale-105"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Header title="Dashboard" />
      
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="text-5xl mb-4 animate-bounce">👋</div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {currentUser.name || 'User'}!
          </h1>
          <p className="text-gray-400">Here's your expense overview</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <StatCard 
            title="Total Groups" 
            value={groups.length.toString()} 
            icon="👥"
            color="blue"
            delay={0}
          />
          <StatCard 
            title="Total Spending" 
            value={`₹${totalSpending.toFixed(2)}`} 
            icon="💰"
            color="green"
            delay={100}
          />
          <StatCard 
            title="You Owe" 
            value={`₹${youOwe.toFixed(2)}`} 
            icon="📉"
            color={youOwe > 0 ? "red" : "gray"}
            delay={200}
          />
          <StatCard 
            title="You Are Owed" 
            value={`₹${youAreOwed.toFixed(2)}`} 
            icon="📈"
            color={youAreOwed > 0 ? "emerald" : "gray"}
            delay={300}
          />
        </div>

        {/* Recent Activity Section */}
        <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <Card className="p-8 backdrop-blur-sm bg-white/5 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <span className="text-3xl mr-3 animate-pulse">📊</span>
              Recent Activity
              <div className="ml-auto">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
              </div>
            </h2>
            
            {recentExpenses.length > 0 ? (
              <div className="space-y-4">
                {recentExpenses.map((exp, index) => (
                  <div 
                    key={`${exp._id || exp.id}-${index}`} 
                    className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-800/30 to-gray-700/30 rounded-xl hover:from-gray-700/40 hover:to-gray-600/40 transition-all duration-300 transform hover:scale-[1.02] border border-gray-700/30"
                    style={{ animationDelay: `${500 + index * 100}ms` }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#20C997] to-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-xl">
                          {exp.category === 'Food' ? '🍕' : 
                           exp.category === 'Transportation' ? '🚗' : 
                           exp.category === 'Entertainment' ? '🎬' : 
                           exp.category === 'Shopping' ? '🛒' :
                           exp.category === 'Bills' ? '📄' :
                           exp.category === 'Travel' ? '✈️' : '💼'}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-white text-lg">{exp.description}</div>
                        <div className="text-gray-400 text-sm">
                          in {exp.groupName} by {exp.paidByName}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {new Date(exp.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-[#20C997]">
                        ₹{exp.amount.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-400">
                        per expense
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 animate-fade-in">
                <div className="text-6xl mb-4 animate-bounce">🌟</div>
                <h3 className="text-xl font-semibold text-white mb-2">No recent activity</h3>
                <p className="text-gray-400 mb-6">Start creating groups and adding expenses!</p>
                <button 
                  onClick={() => window.location.href = '/groups'}
                  className="px-6 py-3 bg-gradient-to-r from-[#20C997] to-[#17a589] text-white rounded-xl hover:from-[#1ba085] hover:to-[#148f75] transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Get Started
                </button>
              </div>
            )}
          </Card>
        </div>

        {/* Quick Stats */}
        {groups.length > 0 && (
          <div className="mt-8 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
            <Card className="p-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-300 mb-1">💡 Quick Insight</h3>
                  <p className="text-gray-300 text-sm">
                    You're active in <span className="font-bold text-blue-400">{groups.length}</span> group{groups.length !== 1 ? 's' : ''} 
                    {totalSpending > 0 && (
                      <span> with a total spending of <span className="font-bold text-green-400">₹{totalSpending.toFixed(2)}</span></span>
                    )}
                  </p>
                </div>
                <div className="text-3xl animate-pulse">📈</div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
