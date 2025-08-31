import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Button from '../components/Button';
import Card from '../components/Card';
import { expensesAPI } from '../lib/api';

interface Settlement {
  from?: {
    userId?: string;
    name?: string;
  };
  to?: {
    userId?: string;
    name?: string;
  };
  amount: number;
  groupId?: string;
  groupName?: string;
}

const SettlementPage: React.FC = () => {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingSettlement, setProcessingSettlement] = useState<string | null>(null);

  useEffect(() => {
    fetchSettlements();
  }, []);

  const fetchSettlements = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching settlements...');
      const response = await expensesAPI.getSettlements();
      console.log('Settlements response:', response);

      if (response.success && Array.isArray(response.debts)) {
        setSettlements(response.debts);
      } else {
        setSettlements([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch settlements:', error);
      setError('Failed to load settlements. Please try again.');
      setSettlements([]);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUserId = () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user).id : null;
    } catch (err) {
      console.error('Error parsing user from localStorage:', err);
      return null;
    }
  };

  const handleMarkAsPaid = async (settlement: Settlement) => {
    if (!settlement.from?.userId || !settlement.to?.userId || !settlement.groupId) {
      alert('Invalid settlement data. Please refresh the page and try again.');
      return;
    }

    const settlementKey = `${settlement.from.userId}-${settlement.to.userId}-${settlement.groupId}`;
    const currentUserId = getCurrentUserId();
    
    // Enhanced confirmation message showing who is marking it
    let confirmMessage = `Mark settlement of ₹${settlement.amount.toFixed(2)} from ${settlement.from.name} to ${settlement.to.name} as paid?`;
    
    if (currentUserId !== settlement.from.userId && currentUserId !== settlement.to.userId) {
      confirmMessage += `\n\nNote: You are marking this settlement on behalf of the group members.`;
    }

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setProcessingSettlement(settlementKey);

      const requestData = {
        fromUserId: settlement.from.userId,
        toUserId: settlement.to.userId,
        amount: settlement.amount,
        groupId: settlement.groupId
      };

      console.log('Marking settlement as paid:', requestData);
      const response = await expensesAPI.markSettlement(requestData);

      if (response.success) {
        // Remove the settled debt from the list immediately
        setSettlements(prev => prev.filter(s => {
          const key = `${s.from?.userId}-${s.to?.userId}-${s.groupId}`;
          return key !== settlementKey;
        }));

        alert('Settlement marked as paid successfully!');
        // Refetch settlements to ensure we have the latest data
        await fetchSettlements();
      } else {
        throw new Error(response.message || 'Failed to mark settlement as paid');
      }

    } catch (error: any) {
      console.error('Failed to mark settlement as paid:', error);
      let errorMessage = 'Failed to mark settlement as paid. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(errorMessage);
      // Refetch settlements in case of error to ensure data consistency
      await fetchSettlements();
    } finally {
      setProcessingSettlement(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Header title="Settlements" />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-white">Loading settlements...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Header title="Settlements" />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-red-400 mb-4">{error}</div>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Header title="Settlements" />
      <div className="container mx-auto px-4 py-8">
        
        {/* Refresh Button */}
        <div className="mb-6">
          <Button
            onClick={fetchSettlements}
            disabled={loading}
            className="bg-gray-600 hover:bg-gray-500 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {settlements.length === 0 ? (
          <Card className="text-center p-12">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-white mb-2">All Settled Up!</h2>
            <p className="text-gray-400">No outstanding debts between friends.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Outstanding Settlements</h2>
            
            {settlements.map((settlement, index) => {
              const settlementKey = `${settlement.from?.userId || index}-${settlement.to?.userId || index}-${settlement.groupId || index}`;
              const isProcessing = processingSettlement === settlementKey;

              return (
                <Card key={settlementKey} className="p-6">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="text-white text-lg">
                        {settlement.from?.name ? (
                          <>
                            <span className="font-semibold">{settlement.from.name}</span> owes{' '}
                          </>
                        ) : null}
                        {settlement.to?.name ? (
                          <span className="font-semibold text-[#20C997]">{settlement.to.name}</span>
                        ) : (
                          <span className="text-gray-400">Unknown User</span>
                        )}
                      </div>
                      <div className="text-2xl font-bold text-white mt-1">
                        ₹{settlement.amount.toFixed(2)}
                      </div>
                      {settlement.groupName && (
                        <div className="text-gray-400 text-sm mt-1">
                          in {settlement.groupName}
                        </div>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => handleMarkAsPaid(settlement)}
                      disabled={isProcessing}
                      className="bg-[#20C997] hover:bg-[#1ba085] disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3"
                    >
                      {isProcessing ? 'Processing...' : 'Mark as Paid'}
                    </Button>
                  </div>
                </Card>
              );
            })}

            <Card className="p-6 bg-blue-900/20 border-blue-400/20">
              <h3 className="text-lg font-semibold text-blue-400 mb-3">How it works:</h3>
              <ul className="text-gray-300 space-y-2 text-sm">
                <li>• Any group member can mark settlements as paid</li>
                <li>• Click "Mark as Paid" when a debt has been settled</li>
                <li>• This will remove the settlement from everyone's list</li>
                <li>• Make sure to coordinate with group members before marking as paid</li>
              </ul>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettlementPage;
