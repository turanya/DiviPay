import React, { useMemo } from 'react';
import { Group } from '../types';
import Header from '../components/Header';
import Card from '../components/Card';

interface DashboardProps {
  groups: Group[];
}

interface StatCardProps {
  title: string;
  value: string;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, color = 'text-white' }) => (
  <Card className="p-6">
    <h3 className="text-white/70 text-sm font-medium mb-2">{title}</h3>
    <p className={`text-3xl font-bold ${color}`}>{value}</p>
  </Card>
);

const Dashboard: React.FC<DashboardProps> = ({ groups }) => {
  const recentExpenses = useMemo(() => {
    const allExpenses = groups.flatMap(group => 
      (group.expenses || []).map(expense => ({
        ...expense,
        groupName: group.name,
        paidByName: group.members?.find(m => 
          (m.user._id || m.user.id) === expense.paidBy._id
        )?.user.name || 'Unknown'
      }))
    );
    
    return allExpenses
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [groups]);

  const totalSpending = useMemo(() => {
    return groups.reduce((sum, group) => sum + (group.totalExpenses || 0), 0);
  }, [groups]);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  
  const { youOwe, youAreOwed } = useMemo(() => {
    let owe = 0;
    let owed = 0;
    
    groups.forEach(group => {
      const expenses = group.expenses || [];
      const memberCount = group.members?.length || 1;
      const userShare = (group.totalExpenses || 0) / memberCount;
      const userPaid = expenses
        .filter(e => e.paidBy._id === currentUser.id)
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

  return (
    <div>
      <Header title="Dashboard" />
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title="Total Group Spending" 
          value={`₹${totalSpending.toLocaleString()}`}
        />
        <StatCard 
          title="You Owe" 
          value={`₹${youOwe.toFixed(2)}`}
          color="text-red-400"
        />
        <StatCard 
          title="You're Owed" 
          value={`₹${youAreOwed.toFixed(2)}`}
          color="text-green-400"
        />
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
        {recentExpenses.length > 0 ? (
          <div className="space-y-3">
            {recentExpenses.map((exp, index) => (
              <div key={`${exp._id || exp.id}-${index}`} className="bg-white/5 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-white">{exp.description}</h4>
                    <p className="text-white/60 text-sm">
                      in {exp.groupName} by {exp.paidByName}
                    </p>
                    <p className="text-white/50 text-xs">
                      {new Date(exp.date).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-[#20C997] font-bold">₹{exp.amount.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-white/70">No recent activity.</p>
            <p className="text-white/50 text-sm mt-2">Start creating groups and adding expenses!</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
