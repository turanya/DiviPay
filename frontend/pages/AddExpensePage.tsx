import React, { useState, useEffect } from 'react';
import { Group, Expense } from '../types';
import Button from '../components/Button';
import Card from '../components/Card';
import Header from '../components/Header';

interface AddExpensePageProps {
  groups: Group[];
  onAddExpense: (expense: Omit<Expense, 'id'>, groupId: string) => void;  // ADDED: This was missing
}

const AddExpensePage: React.FC<AddExpensePageProps> = ({ groups, onAddExpense }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [paidById, setPaidById] = useState('');
  const [category, setCategory] = useState('Other');

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
        
        // Show success message or navigate back
        alert('Expense added successfully!');
      } catch (error) {
        console.error('Failed to add expense:', error);
        alert('Failed to add expense. Please try again.');
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Header title="Add Expense" />
      
      <Card className="p-6 mt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Group *
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full bg-white/10 border-white/20 border text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#20C997]"
              disabled={groups.length === 0}
              required
            >
              {groups.length === 0 ? (
                <option value="">Create a group first</option>
              ) : (
                <option value="">Select a group</option>
              )}
              {groups.map((group) => (
                <option key={group._id || group.id} value={group._id || group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              What was it for? *
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Midnight Munchies"
              className="w-full bg-white/10 border-white/20 border text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#20C997] placeholder-white/50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Amount (₹) *
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., 3000"
              className="w-full bg-white/10 border-white/20 border text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#20C997] placeholder-white/50"
              required
              min="0.01"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white/10 border-white/20 border text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#20C997]"
            >
              <option value="Food">Food</option>
              <option value="Transportation">Transportation</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Shopping">Shopping</option>
              <option value="Bills">Bills</option>
              <option value="Travel">Travel</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Who paid? *
            </label>
            <select
              value={paidById}
              onChange={(e) => setPaidById(e.target.value)}
              disabled={!selectedGroup}
              className="w-full bg-white/10 border-white/20 border text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#20C997] disabled:opacity-50"
              required
            >
              <option value="">Select who paid</option>
              {selectedGroup?.members?.map((member) => (
                <option key={member.user._id || member.user.id} value={member.user._id || member.user.id}>
                  {member.user.name}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" className="w-full" disabled={!selectedGroup || groups.length === 0}>
            Add Expense & Celebrate
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default AddExpensePage;
