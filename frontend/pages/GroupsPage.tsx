import React from 'react';
import { Group } from '../types';
import Header from '../components/Header';
import Button from '../components/Button';
import Card from '../components/Card';

interface GroupsPageProps {
  groups: Group[] | undefined;
  onSelectGroup: (groupId: string) => void;
  onOpenCreateGroupModal: () => void;
  onDeleteGroup: (groupId: string) => void;
  isLoading?: boolean;
}

const PlusIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
  </svg>
);

const TrashIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${className}`} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
  </svg>
);

const GroupCard: React.FC<{ group: Group, onClick: () => void, onDelete: () => void }> = ({ group, onClick, onDelete }) => {
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  const handleCardClick = () => {
    console.log('Group clicked:', group);
    onClick();
  };
  
  return (
    <Card onClick={handleCardClick} className="p-6 group relative cursor-pointer hover:bg-white/20 transition-colors">
      <h3 className="text-xl font-bold text-white truncate">{group.name}</h3>
      <p className="text-white/60 mt-2">{group.members?.length || 0} members</p>
      <button
        onClick={handleDeleteClick}
        className="absolute top-3 right-3 p-2 rounded-full bg-white/10 text-red-400 opacity-0 group-hover:opacity-100 transition-all"
        aria-label={`Delete ${group.name} group`}
      >
        <TrashIcon />
      </button>
    </Card>
  );
};

const GroupsPage: React.FC<GroupsPageProps> = ({ 
  groups, 
  onSelectGroup, 
  onOpenCreateGroupModal, 
  onDeleteGroup,
  isLoading = false
}) => {
  const handleGroupSelect = (group: Group) => {
    console.log('=== GROUP DEBUG ===');
    console.log('Full group object:', group);
    console.log('Group _id:', group._id);
    console.log('Group id:', group.id);
    console.log('Group name:', group.name);
    console.log('==================');
    
    // FIXED: Use _id consistently (MongoDB's primary key)
    const groupId = group._id || group.id;
    if (groupId) {
      onSelectGroup(groupId);
    } else {
      console.error('Group ID not found:', group);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#20C997] mb-4"></div>
        <p className="text-white/70">Loading groups...</p>
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-white mb-4">No Groups Yet</h2>
        <p className="text-white/70 mb-6">Create your first group to get started!</p>
        <Button onClick={onOpenCreateGroupModal}>
          <PlusIcon /> Create Group
        </Button>
      </div>
    );
  }

  return (
    <>
      <Header title="Your Groups" />
      <div className="absolute top-6 right-6">
        <Button onClick={onOpenCreateGroupModal}>
          <PlusIcon /> Create Group
        </Button>
      </div>
      <main className="mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <GroupCard 
              key={group._id || group.id} 
              group={group} 
              onClick={() => handleGroupSelect(group)} 
              onDelete={() => onDeleteGroup(group._id || group.id)} 
            />
          ))}
        </div>
      </main>
    </>
  );
};

export default GroupsPage;
