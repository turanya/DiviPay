import React, { useState, useEffect } from 'react';
import { Group, Expense } from '../types';
import Button from '../components/Button';
import Card from '../components/Card';
import Header from '../components/Header';

interface AddExpensePageProps {
  groups: Group[];
  onAddExpense: (expense: Omit<Expense, '_id' | 'id'>, groupId: string) => void;
}

const AddExpensePage: React.FC<AddExpensePageProps> = ({ groups, onAddExpense }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [paidById, setPaidById] = useState('');
  const [category, setCategory] = useState('Other');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedGroup = groups.find(g => (g._id || g.id) === selectedGroupId);

  useEffect(() => {
    if (groups.length > 0 && !selectedGroupId) {
      const firstGroupId = groups[0]._id || groups[0].id;
      setSelectedGroupId(firstGroupId || '');
    }
  }, [groups, selectedGroupId]);

  useEffect(() => {
    if (selectedGroup && selectedGroup.members && selectedGroup.members.length > 0) {
      const firstMemberId = selectedGroup.members[0].user._id || selectedGroup.members[0].user.id;
      setPaidById(firstMemberId || '');
    } else {
      setPaidById('');
    }
  }, [selectedGroupId, selectedGroup]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (amount && description && paidById && selectedGroupId) {
      try {
        setIsSubmitting(true);
        
        const paidByUser = selectedGroup?.members?.find(m =>
          (m.user._id || m.user.id) === paidById
        )?.user;

        await onAddExpense({
          description,
          amount: parseFloat(amount),
          paidBy: {
            _id: paidById,
            name: paidByUser?.name || '',
            email: paidByUser?.email || ''
          },
          category,
          date: new Date().toISOString(),
          group: selectedGroupId,
          splitBetween: selectedGroup?.members?.map(member => ({
            user: {
              _id: member.user._id || member.user.id || '',
              name: member.user.name,
              email: member.user.email
            },
            amount: parseFloat(amount) / (selectedGroup.members?.length || 1)
          })) || [],
          settled: false
        }, selectedGroupId);

        // Reset form
        setAmount('');
        setDescription('');
        setCategory('Other');

        // Show success message
        alert('Expense added successfully!');
      } catch (error) {
        console.error('Failed to add expense:', error);
        alert('Failed to add expense. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Food': return '🍽️';
      case 'Transportation': return '🚗';
      case 'Entertainment': return '🎬';
      case 'Shopping': return '🛒';
      case 'Bills': return '📄';
      case 'Travel': return '✈️';
      default: return '💼';
    }
  };

  const categories = ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Travel', 'Other'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Header title="Add Expense" />
      
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">💰</div>
            <h1 className="text-3xl font-bold text-white mb-2">Add New Expense</h1>
            <p className="text-gray-400">Split bills with your friends easily</p>
          </div>

          {/* Main Form Card */}
          <Card className="p-8 backdrop-blur-sm bg-white/5 border border-white/10">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Group Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-300 flex items-center">
                  <span className="text-lg mr-2">👥</span>
                  Select Group <span className="text-red-400 ml-1">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-600/50 text-white rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-[#20C997] focus:border-transparent appearance-none cursor-pointer transition-all hover:bg-gray-800/70"
                    disabled={groups.length === 0}
                    required
                  >
                    {groups.length === 0 ? (
                      <option value="">Create a group first</option>
                    ) : (
                      <option value="">Choose your group...</option>
                    )}
                    {groups.map((group) => (
                      <option key={group._id || group.id} value={group._id || group.id}>
                        {group.name} ({group.members?.length || 0} members)
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-300 flex items-center">
                  <span className="text-lg mr-2">📝</span>
                  What was it for? <span className="text-red-400 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Dinner at Pizza Palace"
                  className="w-full bg-gray-800/50 border border-gray-600/50 text-white rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-[#20C997] focus:border-transparent placeholder-gray-400 transition-all hover:bg-gray-800/70"
                  required
                />
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-300 flex items-center">
                  <span className="text-lg mr-2">💵</span>
                  Amount <span className="text-red-400 ml-1">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">₹</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="3000"
                    className="w-full bg-gray-800/50 border border-gray-600/50 text-white rounded-xl p-4 pl-10 focus:outline-none focus:ring-2 focus:ring-[#20C997] focus:border-transparent placeholder-gray-400 transition-all hover:bg-gray-800/70"
                    required
                    min="0.01"
                    step="0.01"
                  />
                </div>
                {amount && selectedGroup && (
                  <div className="text-xs text-gray-400 mt-1">
                    ≈ ₹{(parseFloat(amount) / (selectedGroup.members?.length || 1)).toFixed(2)} per person
                  </div>
                )}
              </div>

              {/* Category */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-300 flex items-center">
                  <span className="text-lg mr-2">🏷️</span>
                  Category
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                        category === cat
                          ? 'bg-[#20C997]/20 border-[#20C997] text-[#20C997]'
                          : 'bg-gray-800/30 border-gray-600/30 text-gray-400 hover:border-gray-500/50'
                      }`}
                    >
                      <div className="text-2xl mb-1">{getCategoryIcon(cat)}</div>
                      <div className="text-xs font-medium">{cat}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Who Paid */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-300 flex items-center">
                  <span className="text-lg mr-2">👤</span>
                  Who paid? <span className="text-red-400 ml-1">*</span>
                </label>
                <div className="relative">
                  <select
                    value={paidById}
                    onChange={(e) => setPaidById(e.target.value)}
                    disabled={!selectedGroup}
                    className="w-full bg-gray-800/50 border border-gray-600/50 text-white rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-[#20C997] focus:border-transparent appearance-none cursor-pointer transition-all hover:bg-gray-800/70 disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  >
                    <option value="">Select who paid...</option>
                    {selectedGroup?.members?.map((member) => (
                      <option key={member.user._id || member.user.id} value={member.user._id || member.user.id}>
                        {member.user.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Split Preview */}
              {selectedGroup && amount && (
                <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-600/30">
                  <div className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                    <span className="text-lg mr-2">🎯</span>
                    Split Preview
                  </div>
                  <div className="space-y-2">
                    {selectedGroup.members?.map((member, index) => (
                      <div key={member.user._id || member.user.id || index} className="flex justify-between items-center text-sm">
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-gradient-to-br from-[#20C997] to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">
                            {member.user.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <span className="text-gray-300">{member.user.name}</span>
                        </div>
                        <span className="text-gray-400">₹{(parseFloat(amount || '0') / selectedGroup.members!.length).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || !amount || !description || !paidById || !selectedGroupId}
                  className={`w-full py-4 text-lg font-semibold transition-all duration-300 ${
                    isSubmitting || !amount || !description || !paidById || !selectedGroupId
                      ? 'bg-gray-600 cursor-not-allowed opacity-50'
                      : 'bg-gradient-to-r from-[#20C997] to-[#17a589] hover:from-[#1ba085] hover:to-[#148f75] hover:scale-[1.02] active:scale-[0.98]'
                  } rounded-xl shadow-lg`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Adding Expense...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <span className="text-xl mr-2">✨</span>
                      Add Expense & Split
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </Card>

          {/* Info Card */}
          <Card className="mt-6 p-6 bg-blue-900/10 border border-blue-500/20">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">💡</div>
              <div>
                <h3 className="text-lg font-semibold text-blue-300 mb-2">How it works</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• The expense will be split equally among all group members</li>
                  <li>• Everyone will see this expense in their transaction history</li>
                  <li>• Balances will be automatically calculated and updated</li>
                  <li>• Use the Settlements page to track who owes what</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AddExpensePage;
