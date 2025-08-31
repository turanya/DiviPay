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

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0F2027] via-[#203A43] to-[#2C5364] text-white">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
            <p className="mb-4">We encountered an error. Please refresh the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#20C997] hover:bg-[#1ba085] px-6 py-3 rounded-lg transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

type Page = 'dashboard' | 'groups' | 'groupDetail' | 'addExpense' | 'history' | 'settlement';

const App: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
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

  // Fetch fresh group data
  const fetchGroupData = useCallback(async (groupId: string) => {
    try {
      setGroupLoading(true);
      setGroupError(null);

      // First try to get fresh group details from API
      const groupDetails = await groupsAPI.getGroupDetails(groupId);
      
      if (groupDetails) {
        // Update the group in our local state
        setGroups(prevGroups => {
          const updatedGroups = [...prevGroups];
          const existingGroupIndex = updatedGroups.findIndex(g => getGroupId(g) === groupId);
          
          if (existingGroupIndex >= 0) {
            updatedGroups[existingGroupIndex] = groupDetails;
          } else {
            updatedGroups.push(groupDetails);
          }
          
          return updatedGroups;
        });
        
        setSelectedGroupId(groupId);
        return groupDetails;
      } else {
        setGroupError('Group not found. It may have been deleted.');
        return null;
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
      return null;
    } finally {
      setGroupLoading(false);
    }
  }, []);

  // Handle URL changes to update selected group
  useEffect(() => {
    const loadGroupData = async () => {
      if (location.pathname.startsWith('/groups/')) {
        const groupId = location.pathname.split('/groups/')[1];
        if (groupId && isLoggedIn) {
          console.log('Loading group data for ID:', groupId);
          await fetchGroupData(groupId);
        }
      } else if (location.pathname === '/groups') {
        // Clear selected group when on groups list
        console.log('Clearing selected group (on groups list)');
        setSelectedGroupId(null);
        setGroupLoading(false);
        setGroupError(null);
      }
    };

    loadGroupData();
  }, [location.pathname, isLoggedIn, fetchGroupData]);

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
  }, []);

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
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    }
  }, []);

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
        description: memberData.length > 0 ? `Group with ${memberData.map(m => m?.user.name).join(', ')}` : undefined,
        members: memberData
      });

      // Refresh groups to get the latest data
      await fetchUserGroups();

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
  }, [navigate, fetchUserGroups]);

  const handleAddExpense = useCallback(async (expenseData: Omit<Expense, '_id' | 'date'> & { date: string }) => {
    const groupId = expenseData.group || selectedGroupId || '';
    if (!groupId) {
      throw new Error('No group selected. Please select a group first.');
    }

    // Validate required fields
    if (!expenseData.description || !expenseData.amount || !expenseData.paidBy) {
      throw new Error('Missing required expense information');
    }

    try {
      // Make the actual API call
      const response = await expensesAPI.add({
        ...expenseData,
        group: groupId,
      });

      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);

      // Refresh the group data to show the new expense
      await fetchGroupData(groupId);
      
      // Navigate back to the group page to show the new expense
      navigate(`/groups/${groupId}`);

      return response;
    } catch (error) {
      console.error('Failed to add expense:', error);
      throw error; // Let the modal handle the error
    }
  }, [selectedGroupId, navigate, fetchGroupData]);

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
      await expensesAPI.delete(expenseId);
      
      // Refresh the group data if we have a groupId
      if (groupId) {
        await fetchGroupData(groupId);
      } else {
        // Refresh all groups
        await fetchUserGroups();
      }
    } catch (error) {
      console.error('Failed to delete expense:', error);
      alert('Failed to delete expense. Please try again.');
    }
  }, [fetchGroupData, fetchUserGroups]);

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

    return <ErrorBoundary>{children}</ErrorBoundary>;
  };

  const selectedGroup = groups.find(g => getGroupId(g) === selectedGroupId);

  const appClasses = `min-h-screen w-full font-sans transition-colors duration-300 bg-gradient-to-b from-[#0F2027] via-[#203A43] to-[#2C5364] text-white`;

  if (loading) {
    return (
      <div className={appClasses}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#20C997] mb-4"></div>
            <p className="text-xl">Loading DiviPay...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
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
                  onNavigate={(page: Page) => navigate(`/${page}`)}
                  onOpenProfileModal={() => setProfileModalOpen(true)}
                  onLogout={handleLogout}
                >
                  <Dashboard />
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
                  onNavigate={(page: Page) => navigate(`/${page}`)}
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
                  currentPage="groupDetail"
                  onNavigate={(page: Page) => navigate(`/${page}`)}
                  onOpenProfileModal={() => setProfileModalOpen(true)}
                  onLogout={handleLogout}
                >
                  <GroupPage
                    onRefreshGroup={() => selectedGroupId && fetchGroupData(selectedGroupId)}
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
                  onNavigate={(page: Page) => navigate(`/${page}`)}
                  onOpenProfileModal={() => setProfileModalOpen(true)}
                  onLogout={handleLogout}
                >
                  <AddExpensePage groups={groups} onAddExpense={handleAddExpense} />
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
                  onNavigate={(page: Page) => navigate(`/${page}`)}
                  onOpenProfileModal={() => setProfileModalOpen(true)}
                  onLogout={handleLogout}
                >
                  <HistoryPage />
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
                  onNavigate={(page: Page) => navigate(`/${page}`)}
                  onOpenProfileModal={() => setProfileModalOpen(true)}
                  onLogout={handleLogout}
                >
                  <SettlementPage />
                </MainLayout>
              </ProtectedRoute>
            } 
          />

          {/* 404 Route */}
          <Route 
            path="*" 
            element={
              <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                  <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
                  <button
                    onClick={() => navigate('/')}
                    className="bg-[#20C997] hover:bg-[#1ba085] px-6 py-3 rounded-lg transition-colors"
                  >
                    Go Home
                  </button>
                </div>
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
    </ErrorBoundary>
  );
};

export default App;
