import React, { useState, useCallback, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Group, Expense, User } from './types';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import GroupsPage from './pages/GroupsPage';
import { GroupPage } from './pages/GroupPage';
import AddExpensePage from './pages/AddExpensePage';
import HistoryPage from './pages/HistoryPage';
import SettlementPage from './pages/SettlementPage';
import MainLayout from './components/MainLayout';
import Confetti from './components/Confetti';
import CreateGroupModal from './components/CreateGroupModal';
import ProfileModal from './components/ProfileModal';
import { authAPI, groupsAPI, expensesAPI } from './lib/api';

type Page = 'dashboard' | 'groups' | 'groupDetail' | 'addExpense' | 'history' | 'settlement';

const App: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [groupLoading, setGroupLoading] = useState(false);
  const [groupError, setGroupError] = useState<string | null>(null);
  const [isCreateGroupModalOpen, setCreateGroupModalOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Helper function to get group ID (handle both _id and id)
  const getGroupId = (group: Group): string => {
    return group._id || group.id || '';
  };

  // Handle URL changes to update selected group
  useEffect(() => {
    const loadGroupData = async () => {
      if (location.pathname.startsWith('/groups/')) {
        const groupId = location.pathname.split('/groups/')[1];
        if (groupId) {
          console.log('Loading group data for ID:', groupId);
          setGroupLoading(true);
          setGroupError(null);

          try {
            // First check if we already have the group in our state
            const existingGroup = groups.find(g => getGroupId(g) === groupId);
            if (existingGroup) {
              console.log('Found group in local state:', existingGroup);
              setSelectedGroupId(groupId);
              setGroupLoading(false);
              return;
            }

            // If not found, try to fetch it from the API
            console.log('Group not in local state, fetching from API...');
            const group = await groupsAPI.getGroupDetails(groupId);
            console.log('Fetched group from API:', group);
            
            if (group) {
              // Add the fetched group to our groups list
              setGroups(prev => {
                const exists = prev.some(g => getGroupId(g) === getGroupId(group));
                return exists ? prev : [...prev, group];
              });
              setSelectedGroupId(groupId);
            } else {
              console.error('Group not found in API response');
              setGroupError('Group not found. It may have been deleted.');
            }
          } catch (error: any) {
            console.error('Error fetching group details:', error);
            if (error.response?.status === 404) {
              setGroupError('Group not found. It may have been deleted.');
            } else if (error.response?.status === 403) {
              setGroupError('You do not have permission to view this group.');
            } else {
              setGroupError('Failed to load group. Please try again later.');
            }
          } finally {
            setGroupLoading(false);
          }
        }
      } else if (location.pathname === '/groups') {
        // Clear selected group when on groups list
        console.log('Clearing selected group (on groups list)');
        setSelectedGroupId(null);
        setGroupLoading(false);
        setGroupError(null);
      }
    };

    if (isLoggedIn) {
      loadGroupData();
    }
  }, [location.pathname, groups.length, isLoggedIn]);

  // Check if user is already logged in on app start
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('authToken');
      const user = localStorage.getItem('user');
      
      if (token && user) {
        try {
          const profile = await authAPI.getProfile();
          setIsLoggedIn(true);
          setCurrentUser(profile.user);
          
          try {
            const response = await groupsAPI.getUserGroups();
            const userGroups = Array.isArray(response?.groups) ? response.groups : [];
            setGroups(userGroups);
            
            const groupId = location.pathname.split('/groups/')[1];
            if (groupId && userGroups.some(g => getGroupId(g) === groupId)) {
              setSelectedGroupId(groupId);
            }
          } catch (error) {
            console.error('Failed to fetch groups:', error);
            setGroups([]);
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          handleLogout();
        }
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, [location.pathname]);

  const handleChangePassword = async (passwordData: { currentPassword?: string, newPassword?: string }) => {
    try {
      await authAPI.changePassword(passwordData);
    } catch (error) {
      console.error('Failed to change password:', error);
      throw error;
    }
  };

  const fetchUserGroups = useCallback(async () => {
    try {
      const response = await groupsAPI.getUserGroups();
      const userGroups = response.groups || [];
      setGroups(userGroups);
      
      const groupId = location.pathname.split('/groups/')[1];
      if (groupId && userGroups.some(g => getGroupId(g) === groupId)) {
        setSelectedGroupId(groupId);
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    }
  }, [location.pathname]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    authAPI.logout().catch(console.error);
    setIsLoggedIn(false);
    setCurrentUser(null);
    navigate('/login');
  }, [navigate]);

  const handleLogin = async () => {
    setIsLoggedIn(true);
    const user = localStorage.getItem('user');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }

    try {
      const response = await groupsAPI.getUserGroups();
      const userGroups = response.groups || [];
      setGroups(userGroups);
      
      const groupId = location.pathname.split('/groups/')[1];
      if (groupId && userGroups.some(g => getGroupId(g) === groupId)) {
        setSelectedGroupId(groupId);
      }
    } catch (error) {
      console.error('Failed to fetch groups after login:', error);
    }

    navigate('/dashboard');
  };

  const handleSelectGroup = (groupId: string) => {
    navigate(`/groups/${groupId}`);
  };

  const handleBackToGroups = () => {
    setSelectedGroupId(null);
    navigate('/groups');
  };

  const handleCreateGroup = useCallback(async (groupName: string, memberNamesStr: string) => {
    if (!groupName.trim()) {
      throw new Error('Group name cannot be empty');
    }

    // Parse member data from the string format "Name (email), Name2 (email2)"
    const memberData = memberNamesStr.split(',').map(memberStr => {
      const trimmed = memberStr.trim();
      const match = trimmed.match(/^(.+?)\s*\((.+?)\)$/);
      if (match) {
        return {
          user: {
            name: match[1].trim(),
            email: match[2].trim()
          },
          role: 'member'
        };
      }
      return null;
    }).filter(Boolean);
    
    try {
      setGroupLoading(true);
      const response = await groupsAPI.create({
        name: groupName.trim(),
        description: memberData.length > 0 ? `Group with ${memberData.map(m => m.user.name).join(', ')}` : undefined,
        members: memberData
      });

      // Optimistic update
      setGroups(prevGroups => [...prevGroups, {
        ...response,
        expenses: [],
        totalExpenses: 0,
        memberCount: memberData.length + 1, // +1 for the creator
        userRole: 'admin',
        isActive: true
      }]);

      setCreateGroupModalOpen(false);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      
      // Navigate to the new group
      if (response._id || response.id) {
        navigate(`/groups/${response._id || response.id}`);
      }
      
      return response;
    } catch (error) {
      console.error('Failed to create group:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create group. Please try again.');
    } finally {
      setGroupLoading(false);
    }
  }, [navigate]);

  const handleAddExpense = useCallback(async (expenseData: Omit<Expense, '_id' | 'date'> & { date: string }) => {
    const groupId = expenseData.group || selectedGroupId || '';
    if (!groupId) {
      throw new Error('No group selected. Please select a group first.');
    }

    // Validate required fields
    if (!expenseData.description || !expenseData.amount || !expenseData.paidBy) {
      throw new Error('Missing required expense information');
    }

    // Create a temporary ID for optimistic update
    const tempId = `temp-${Date.now()}`;
    const tempExpense: Expense = {
      ...expenseData,
      _id: tempId,
      date: new Date().toISOString(),
      group: groupId,
      splitBetween: expenseData.splitBetween || []
    };

    // Optimistic update
    setGroups(prevGroups => 
      prevGroups.map(group => {
        if (group._id === groupId || group.id === groupId) {
          return {
            ...group,
            expenses: [...(group.expenses || []), tempExpense],
            totalExpenses: (group.totalExpenses || 0) + expenseData.amount,
            updatedAt: new Date().toISOString()
          };
        }
        return group;
      })
    );

    try {
      // Make the actual API call
      const response = await expensesAPI.add({
        ...expenseData,
        group: groupId,
      });

      // Update with server response
      setGroups(prevGroups => 
        prevGroups.map(group => {
          if (group._id === groupId || group.id === groupId) {
            // Remove temporary expense and add the server response
            const filteredExpenses = (group.expenses || []).filter(exp => exp._id !== tempId);
            return {
              ...group,
              expenses: [...filteredExpenses, response],
              updatedAt: new Date().toISOString()
            };
          }
          return group;
        })
      );
      
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
      return response;
    } catch (error) {
      // Revert optimistic update on error
      setGroups(prevGroups => 
        prevGroups.map(group => {
          if (group._id === groupId || group.id === groupId) {
            return {
              ...group,
              expenses: (group.expenses || []).filter(exp => exp._id !== tempId),
              totalExpenses: (group.totalExpenses || 0) - expenseData.amount,
              updatedAt: new Date().toISOString()
            };
          }
          return group;
        })
      );
      
      console.error('Failed to add expense:', error);
      throw error; // Let the modal handle the error
    }
  }, [selectedGroupId]);

  const handleDeleteGroup = useCallback(async (groupId: string) => {
    if (window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      try {
        setGroups(prev => prev.filter(group => getGroupId(group) !== groupId));
        console.log('Group deletion not implemented in backend yet');
      } catch (error) {
        console.error('Failed to delete group:', error);
      }
    }
  }, []);

  const handleDeleteExpense = useCallback(async (expenseId: string, groupId?: string) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    try {
      // Optimistic update
      if (groupId) {
        setGroups(prevGroups => 
          prevGroups.map(group => {
            if (group._id === groupId || group.id === groupId) {
              const expense = group.expenses?.find(exp => exp._id === expenseId || exp.id === expenseId);
              const newExpenses = (group.expenses || []).filter(exp => exp._id !== expenseId && exp.id !== expenseId);
              return {
                ...group,
                expenses: newExpenses,
                totalExpenses: expense ? (group.totalExpenses || 0) - expense.amount : group.totalExpenses,
                updatedAt: new Date().toISOString()
              };
            }
            return group;
          })
        );
      }

      await expensesAPI.delete(expenseId);
      
      // Refresh groups to ensure consistency
      await fetchUserGroups();
    } catch (error) {
      console.error('Failed to delete expense:', error);
      alert('Failed to delete expense. Please try again.');
      // Re-fetch groups to revert any optimistic updates
      await fetchUserGroups();
    }
  }, [fetchUserGroups]);

  interface ProtectedRouteProps {
    children: React.ReactNode;
    [key: string]: unknown;
  }

  const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, ...rest }) => {
    if (!isLoggedIn) {
      const loginProps = {
        onLogin: handleLogin,
        onNavigateToLanding: () => navigate('/'),
        onNavigateToRegister: () => navigate('/register'),
        ...(rest as object)
      };
      return <LoginPage {...loginProps} />;
    }
    return <>{children}</>;
  };

  const selectedGroup = groups.find(g => getGroupId(g) === selectedGroupId);

  const appClasses = `min-h-screen w-full font-sans transition-colors duration-300 bg-gradient-to-b from-[#0F2027] via-[#203A43] to-[#2C5364] text-white`;

  if (loading) {
    return (
      <div className={appClasses}>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#20C997] mb-4"></div>
          <p className="text-white/70 ml-4">Loading DiviPay...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={appClasses}>
      {showConfetti && <Confetti />}
      
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage onNavigateToLogin={() => navigate('/login')} onNavigateToRegister={() => navigate('/register')} />} />
        <Route 
          path="/login" 
          element={
            <LoginPage 
              onLogin={handleLogin}
              onNavigateToLanding={() => navigate('/')}
              onNavigateToRegister={() => navigate('/register')}
            />
          } 
        />
        <Route 
          path="/register" 
          element={
            <RegisterPage 
              onLogin={handleLogin}
              onNavigateToLanding={() => navigate('/')}
              onNavigateToLogin={() => navigate('/login')}
            />
          } 
        />

        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <MainLayout 
                currentPage="dashboard" 
                onNavigateToPage={(page) => navigate(`/${page}`)} 
                onOpenProfileModal={() => setProfileModalOpen(true)}
                onLogout={handleLogout}
              >
                <Dashboard groups={groups} />
              </MainLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/groups" 
          element={
            <ProtectedRoute>
              <MainLayout 
                currentPage="groups" 
                onNavigateToPage={(page) => navigate(`/${page}`)} 
                onOpenProfileModal={() => setProfileModalOpen(true)}
                onLogout={handleLogout}
              >
                <GroupsPage 
                  groups={groups}
                  onSelectGroup={handleSelectGroup}
                  onOpenCreateGroupModal={() => setCreateGroupModalOpen(true)}
                  onDeleteGroup={handleDeleteGroup}
                  isLoading={loading}
                />
              </MainLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/groups/:groupId" 
          element={
            <ProtectedRoute>
              <MainLayout 
                currentPage="groups" 
                onNavigateToPage={(page) => navigate(`/${page}`)} 
                onOpenProfileModal={() => setProfileModalOpen(true)}
                onLogout={handleLogout}
              >
                <GroupPage 
                  group={selectedGroup}
                  onBack={handleBackToGroups}
                  onAddExpense={() => navigate('/addExpense')}
                  isLoading={groupLoading}
                  error={groupError}
                />
              </MainLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/addExpense" 
          element={
            <ProtectedRoute>
              <MainLayout 
                currentPage="addExpense" 
                onNavigateToPage={(page) => navigate(`/${page}`)}
                onOpenProfileModal={() => setProfileModalOpen(true)}
                onLogout={handleLogout}>
                <AddExpensePage 
                  groups={groups}
                  onAddExpense={handleAddExpense}
                />
              </MainLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/history" 
          element={
            <ProtectedRoute>
              <MainLayout 
                currentPage="history" 
                onNavigateToPage={(page) => navigate(`/${page}`)}
                onOpenProfileModal={() => setProfileModalOpen(true)}
                onLogout={handleLogout}>
                <HistoryPage 
                  groups={groups}
                  onDeleteExpense={handleDeleteExpense}
                />
              </MainLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/settlement" 
          element={
            <ProtectedRoute>
              <MainLayout 
                currentPage="settlement" 
                onNavigateToPage={(page) => navigate(`/${page}`)}
                onOpenProfileModal={() => setProfileModalOpen(true)}
                onLogout={handleLogout}>
                <SettlementPage groups={groups} />
              </MainLayout>
            </ProtectedRoute>
          } 
        />

        {/* 404 Route */}
        <Route 
          path="*" 
          element={
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
              <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
              <button
                onClick={() => navigate('/')}
                className="bg-[#20C997] hover:bg-[#1ba085] px-6 py-3 rounded-lg transition-colors"
              >
                Go Home
              </button>
            </div>
          } 
        />
      </Routes>

      {/* Modals */}
      {isCreateGroupModalOpen && (
        <CreateGroupModal
          onClose={() => setCreateGroupModalOpen(false)}
          onCreate={handleCreateGroup}
        />
      )}

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        user={currentUser}
        onChangePassword={handleChangePassword}
      />
    </div>
  );
};

export default App;
