import React, { useState, useEffect } from 'react';
import { Settlement } from '../types';
import Header from '../components/Header';
import Card from '../components/Card';
import Button from '../components/Button';
import { expensesAPI } from '../lib/api';

interface SettlementPageProps {
  groups: any[];
}

const SettlementPage: React.FC<SettlementPageProps> = ({ groups }) => {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settlingIds, setSettlingIds] = useState<Set<string>>(new Set());

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchSettlements();
  }, []);

  const fetchSettlements = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await expensesAPI.getSettlements();
      setSettlements(response.debts || []);
    } catch (error) {
      console.error('Failed to fetch settlements:', error);
      setError('Failed to load settlement data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSettle = async (settlement: Settlement, index: number) => {
    const settlementKey = `${settlement.from.userId}-${settlement.to.userId}-${settlement.amount}`;
    
    if (settlingIds.has(settlementKey)) return;

    try {
      setSettlingIds(prev => new Set(prev).add(settlementKey));
      
      await expensesAPI.markSettlement({
        fromUserId: settlement.from.userId,
        toUserId: settlement.to.userId,
        amount: settlement.amount,
        groupId: settlement.groupId
      });

      // Remove the settled item from the list
      setSettlements(prev => prev.filter((_, i) => i !== index));
      
      // Show success message
      alert('Settlement marked as paid successfully!');
    } catch (error) {
      console.error('Failed to mark settlement:', error);
      alert('Failed to mark settlement as paid. Please try again.');
    } finally {
      setSettlingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(settlementKey);
        return newSet;
      });
    }
  };

  const canMarkAsPaid = (settlement: Settlement) => {
    return currentUser.id === settlement.from.userId || currentUser.id === settlement.to.userId;
  };

  if (loading) {
    return (
      <div>
        <Header title="Who Owes Who" />
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#20C997] mb-4"></div>
          <p className="text-white/70 ml-4">Loading settlements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Header title="Who Owes Who" />
        <div className="text-center py-12">
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-6 mb-6">
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={fetchSettlements}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Who Owes Who" />

      {settlements.length > 0 ? (
        <div className="space-y-4">
          {settlements.map((settlement, index) => {
            const settlementKey = `${settlement.from.userId}-${settlement.to.userId}-${settlement.amount}`;
            const isSettling = settlingIds.has(settlementKey);
            const canSettle = canMarkAsPaid(settlement);
            
            return (
              <Card key={index} className="p-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div className="flex-1">
                    <p className="text-white mb-2">
                      <span className="text-red-400 font-medium">{settlement.from.name}</span>
                      <span className="text-white/70"> owes </span>
                      <span className="text-green-400 font-medium">{settlement.to.name}</span>
                    </p>
                    <p className="text-[#20C997] font-bold text-xl mb-1">₹{settlement.amount.toFixed(2)}</p>
                    <p className="text-white/60 text-sm">in {settlement.groupName}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {canSettle ? (
                      <Button
                        onClick={() => handleSettle(settlement, index)}
                        disabled={isSettling}
                        className="w-full sm:w-auto"
                      >
                        {isSettling ? 'Processing...' : 'Mark as Paid'}
                      </Button>
                    ) : (
                      <div className="text-white/60 text-sm text-center sm:text-right">
                        Only involved parties can mark as paid
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-green-400 mb-2">Everyone is settled up!</h2>
          <p className="text-white/70">No outstanding debts between friends.</p>
        </div>
      )}
    </div>
  );
};

export default SettlementPage;
