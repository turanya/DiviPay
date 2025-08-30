import React, { useState } from 'react';
import Button from './Button';
import Card from './Card';

interface CreateGroupModalProps {
  onClose: () => void;
  onCreate: (groupName: string, memberNames: string) => void;
}

interface Member {
  id: string;
  name: string;
  email: string;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ onClose, onCreate }) => {
  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');

  const addMember = () => {
    if (newMemberName.trim() && newMemberEmail.trim()) {
      const newMember: Member = {
        id: Date.now().toString(),
        name: newMemberName.trim(),
        email: newMemberEmail.trim()
      };
      setMembers([...members, newMember]);
      setNewMemberName('');
      setNewMemberEmail('');
    }
  };

  const removeMember = (id: string) => {
    setMembers(members.filter(member => member.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (groupName.trim()) {
      // Convert members to comma-separated string for compatibility
      const memberNames = members.map(m => `${m.name} (${m.email})`).join(', ');
      onCreate(groupName, memberNames);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6 md:p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-6">
          <h2 className="text-2xl font-bold text-white text-center">Create a New Group</h2>
          
          <div>
            <label htmlFor="groupName" className="block text-sm font-medium text-white/70 mb-2">Group Name</label>
            <input
              id="groupName"
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g., Epic Goa Trip"
              className="w-full bg-white/10 border-white/20 border text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#20C997]"
              required
            />
          </div>

          {/* Add Member Section */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-white/70 mb-2">Add Members</label>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="Member name"
                className="flex-1 bg-white/10 border-white/20 border text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#20C997] text-sm"
              />
              <input
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="Email"
                className="flex-1 bg-white/10 border-white/20 border text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#20C997] text-sm"
              />
              <Button type="button" onClick={addMember} className="px-4 sm:px-6 w-full sm:w-auto">
                Add Member
              </Button>
            </div>

            {/* Members List */}
            {members.length > 0 && (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {members.map((member) => (
                  <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white/5 rounded-lg p-3 gap-2">
                    <span className="text-white text-sm break-all">
                      <span className="font-medium">{member.name}</span>
                      <br className="sm:hidden" />
                      <span className="text-white/70 sm:ml-2">({member.email})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeMember(member.id)}
                      className="text-red-400 hover:text-red-300 text-sm px-3 py-1 rounded bg-red-400/10 hover:bg-red-400/20 transition-colors self-start sm:self-center"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-end items-center gap-3 mt-4">
            <Button type="button" variant="secondary" onClick={onClose} className="w-full sm:w-auto order-2 sm:order-1">
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto order-1 sm:order-2">Create Group</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateGroupModal;