import React, { useState } from 'react';
import { Group, Expense, User } from '../types';
import Button from './Button';
import Card from './Card';

interface AddExpenseModalProps {
  group: Group;
  onClose: () => void;
  onAdd: (expense: Omit<Expense, '_id' | 'date'> & { date: string }) => Promise<void>;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ group, onClose, onAdd }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paidById, setPaidById] = useState<string>(group.members[0]?.user._id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !description || !paidById) {
      setError('Please fill in all fields');
      return;
    }

    const payingMember = group.members.find(m => m.user._id === paidById);
    if (!payingMember) {
      setError('Invalid payer selected');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onAdd({
        description,
        amount: parseFloat(amount),
        paidBy: payingMember.user,
        group: group._id || '',
        category: 'Other',
        date: new Date().toISOString(),
        splitBetween: group.members.map(member => ({
          user: member.user,
          amount: parseFloat(amount) / group.members.length
        })),
        settled: false
      });
      onClose();
    } catch (err) {
      console.error('Failed to add expense:', err);
      setError('Failed to add expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <Card className="w-full max-w-md p-6 md:p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <h2 className="text-2xl font-bold text-white text-center">Add New Expense</h2>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-white/70 mb-2">Description</label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Dinner at Beach Shack"
              className="w-full bg-white/10 border-white/20 border text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#20C997]"
              required
            />
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-white/70 mb-2">Amount (₹)</label>
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., 3000"
              className="w-full bg-white/10 border-white/20 border text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#20C997]"
              required
              min="0.01"
              step="0.01"
            />
          </div>

          <div>
            <label htmlFor="payer" className="block text-sm font-medium text-white/70 mb-2">Paid by</label>
            <select
              id="payer"
              value={paidById}
              onChange={(e) => setPaidById(e.target.value)}
              className="w-full bg-white/10 border-white/20 border text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#20C997]"
            >
              {group.members.map((member) => (
                <option key={member.user._id} value={member.user._id} className="bg-[#203A43]">
                  {member.user.name}
                </option>
              ))}
            </select>
          </div>
          
          {error && (
            <div className="text-red-400 text-sm mb-4">
              {error}
            </div>
          )}
          <div className="flex justify-end items-center gap-4 mt-4">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !amount || !description || !paidById}
            >
              {isSubmitting ? 'Saving...' : 'Save Expense'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AddExpenseModal;