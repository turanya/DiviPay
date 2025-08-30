const Group = require('../models/Group');
const User = require('../models/User');
const Expense = require('../models/Expense');

// @desc    Create new group
// @route   POST /api/groups
// @access  Private
const createGroup = async (req, res) => {
  try {
    const { name, description, members: additionalMembers } = req.body;
    const userId = req.user.id;

    console.log('Creating group with data:', { name, description, additionalMembers });

    // Start with the creator as admin
    const groupMembers = [{
      user: userId,
      role: 'admin'
    }];

    // Process additional members if provided
    if (additionalMembers && Array.isArray(additionalMembers)) {
      for (const memberData of additionalMembers) {
        if (memberData.user && memberData.user.email) {
          // Try to find existing user by email
          const existingUser = await User.findOne({ email: memberData.user.email.toLowerCase() });
          
          if (existingUser) {
            // Add existing user to group
            groupMembers.push({
              user: existingUser._id,
              role: memberData.role || 'member'
            });
          } else {
            // Create new user account for the member
            const newUser = new User({
              name: memberData.user.name,
              email: memberData.user.email.toLowerCase(),
              password: 'temp123', // Temporary password - user will need to reset
              isActive: false // Mark as inactive until they verify
            });
            
            await newUser.save();
            
            groupMembers.push({
              user: newUser._id,
              role: memberData.role || 'member'
            });

            console.log(`Created new user for group member: ${newUser.email}`);
          }
        }
      }
    }

    // Create new group
    const group = new Group({
      name: name.trim(),
      description: description?.trim(),
      createdBy: userId,
      members: groupMembers
    });

    await group.save();

    // Add group to all members' groups arrays
    const memberUserIds = groupMembers.map(member => member.user);
    await User.updateMany(
      { _id: { $in: memberUserIds } },
      { $push: { groups: group._id } }
    );

    // Populate the group data
    await group.populate([
      { path: 'members.user', select: 'name email' },
      { path: 'createdBy', select: 'name email' }
    ]);

    console.log(`Group created successfully with ${groupMembers.length} members`);

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      group
    });
  } catch (error) {
    console.error('Create group error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating group'
    });
  }
};

// @desc    Get user's groups
// @route   GET /api/groups
// @access  Private
const getUserGroups = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const groups = await Group.find({
      'members.user': userId,
      isActive: true
    })
    .populate('members.user', 'name email profilePicture')
    .populate('createdBy', 'name email')
    .sort({ updatedAt: -1 });

    // Calculate member count for each group
    const groupsWithStats = groups.map(group => ({
      ...group.toJSON(),
      memberCount: group.members.length,
      userRole: group.members.find(member => 
        member.user._id.toString() === userId
      )?.role || 'member'
    }));

    res.json({
      success: true,
      count: groups.length,
      groups: groupsWithStats
    });
  } catch (error) {
    console.error('Get user groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching groups'
    });
  }
};

// @desc    Get single group details
// @route   GET /api/groups/:groupId
// @access  Private
const getGroupDetails = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const group = await Group.findOne({
      _id: groupId,  // Make sure we're searching by _id
      'members.user': userId,
      isActive: true
    })
    .populate('members.user', 'name email profilePicture')
    .populate('createdBy', 'name email');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found or access denied'
      });
    }

    // Get recent expenses for this group
    const recentExpenses = await Expense.find({ group: groupId })
      .populate('paidBy', 'name email')
      .populate('splitBetween.user', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    const groupData = {
      ...group.toJSON(),
      id: group._id.toString(), // ADD THIS: Create id field for frontend compatibility
      memberCount: group.members.length,
      userRole: group.members.find(member => 
        member.user._id.toString() === userId
      )?.role || 'member',
      recentExpenses
    };

    res.json({
      success: true,
      group: groupData // Return group object
    });
  } catch (error) {
    console.error('Get group details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching group details'
    });
  }
};

// @desc    Join group by invite code/link
// @route   POST /api/groups/:groupId/join
// @access  Private
const joinGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const group = await Group.findOne({
      _id: groupId,
      isActive: true
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is already a member
    const isMember = group.members.some(member => 
      member.user.toString() === userId
    );

    if (isMember) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this group'
      });
    }

    // Add user to group
    group.members.push({
      user: userId,
      role: 'member'
    });
    await group.save();

    // Add group to user's groups
    await User.findByIdAndUpdate(userId, {
      $push: { groups: groupId }
    });

    // Populate the updated group
    await group.populate([
      { path: 'members.user', select: 'name email' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.json({
      success: true,
      message: 'Successfully joined the group',
      group
    });
  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while joining group'
    });
  }
};

// @desc    Remove member from group
// @route   DELETE /api/groups/:groupId/members/:memberId
// @access  Private (Admin only)
const removeMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = req.user.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is admin
    const userMember = group.members.find(member => 
      member.user.toString() === userId
    );

    if (!userMember || userMember.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only group admins can remove members'
      });
    }

    // Cannot remove the group creator
    if (memberId === group.createdBy.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove group creator'
      });
    }

    // Remove member from group
    group.members = group.members.filter(member => 
      member.user.toString() !== memberId
    );
    await group.save();

    // Remove group from user's groups
    await User.findByIdAndUpdate(memberId, {
      $pull: { groups: groupId }
    });

    res.json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing member'
    });
  }
};

// @desc    Leave group
// @route   POST /api/groups/:groupId/leave
// @access  Private
const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is the creator
    if (group.createdBy.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Group creator cannot leave. Transfer ownership first or delete the group.'
      });
    }

    // Check if user has unsettled expenses
    const unsettledExpenses = await Expense.find({
      group: groupId,
      $or: [
        { paidBy: userId },
        { 'splitBetween.user': userId }
      ],
      settled: false
    });

    if (unsettledExpenses.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot leave group with unsettled expenses. Please settle all debts first.'
      });
    }

    // Remove user from group
    group.members = group.members.filter(member => 
      member.user.toString() !== userId
    );
    await group.save();

    // Remove group from user's groups
    await User.findByIdAndUpdate(userId, {
      $pull: { groups: groupId }
    });

    res.json({
      success: true,
      message: 'Successfully left the group'
    });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while leaving group'
    });
  }
};

module.exports = {
  createGroup,
  getUserGroups,
  getGroupDetails,
  joinGroup,
  removeMember,
  leaveGroup
};
