const Expense = require('../models/Expense');
const Group = require('../models/Group');
const User = require('../models/User');

// @desc    Add new expense
// @route   POST /api/expenses
// @access  Private
const addExpense = async (req, res) => {
  try {
    const { description, amount, groupId, splitBetween, category, notes } = req.body;
    const paidBy = req.user.id;

    // Verify group exists and user is a member
    const group = await Group.findOne({
      _id: groupId,
      'members.user': paidBy,
      isActive: true
    }).populate('members.user', 'name email');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found or you are not a member'
      });
    }

    // If splitBetween is not provided, split equally among all members
    let finalSplitBetween = [];
    
    if (splitBetween && splitBetween.length > 0) {
      // Validate that all split users are group members
      const memberIds = group.members.map(member => member.user._id.toString());
      const invalidUsers = splitBetween.filter(split => 
        !memberIds.includes(split.user)
      );

      if (invalidUsers.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Some users in split are not group members'
        });
      }

      finalSplitBetween = splitBetween;
    } else {
      // Split equally among all group members
      const amountPerPerson = amount / group.members.length;
      finalSplitBetween = group.members.map(member => ({
        user: member.user._id,
        amount: Number(amountPerPerson.toFixed(2))
      }));
    }

    // Verify split amounts add up to total amount
    const totalSplitAmount = finalSplitBetween.reduce((sum, split) => sum + split.amount, 0);
    if (Math.abs(totalSplitAmount - amount) > 0.01) {
      return res.status(400).json({
        success: false,
        message: 'Split amounts do not add up to total amount'
      });
    }

    // Create expense
    const expense = new Expense({
      description: description.trim(),
      amount,
      paidBy,
      group: groupId,
      splitBetween: finalSplitBetween,
      category: category || 'Other',
      notes: notes?.trim()
    });

    await expense.save();

    // Update group total expenses
    await Group.findByIdAndUpdate(groupId, {
      $inc: { totalExpenses: amount }
    });

    // Populate expense data
    await expense.populate([
      { path: 'paidBy', select: 'name email' },
      { path: 'splitBetween.user', select: 'name email' },
      { path: 'group', select: 'name' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Expense added successfully',
      expense
    });
  } catch (error) {
    console.error('Add expense error:', error);
    
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
      message: 'Server error while adding expense'
    });
  }
};

// @desc    Get expenses for a group
// @route   GET /api/expenses/group/:groupId
// @access  Private
const getGroupExpenses = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 20, category } = req.query;

    // Verify user is a member of the group
    const group = await Group.findOne({
      _id: groupId,
      'members.user': userId,
      isActive: true
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found or access denied'
      });
    }

    // Build query
    const query = { group: groupId };
    if (category && category !== 'All') {
      query.category = category;
    }

    // Get expenses with pagination
    const expenses = await Expense.find(query)
      .populate('paidBy', 'name email profilePicture')
      .populate('splitBetween.user', 'name email')
      .populate('group', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count for pagination
    const totalExpenses = await Expense.countDocuments(query);

    // Calculate summary statistics
    const totalAmount = await Expense.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      success: true,
      expenses,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalExpenses / limit),
        totalExpenses,
        hasNext: page * limit < totalExpenses,
        hasPrev: page > 1
      },
      summary: {
        totalAmount: totalAmount[0]?.total || 0,
        expenseCount: totalExpenses
      }
    });
  } catch (error) {
    console.error('Get group expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching group expenses'
    });
  }
};

// @desc    Get user's expenses across all groups
// @route   GET /api/expenses/user
// @access  Private
const getUserExpenses = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type = 'all' } = req.query;

    let query = {};

    // Filter by expense type
    switch (type) {
      case 'paid':
        query.paidBy = userId;
        break;
      case 'owe':
        query['splitBetween.user'] = userId;
        query.paidBy = { $ne: userId };
        break;
      default:
        query.$or = [
          { paidBy: userId },
          { 'splitBetween.user': userId }
        ];
    }

    const expenses = await Expense.find(query)
      .populate('paidBy', 'name email')
      .populate('group', 'name')
      .populate('splitBetween.user', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalExpenses = await Expense.countDocuments(query);

    // Calculate user's financial summary
    const userSummary = await calculateUserSummary(userId);

    res.json({
      success: true,
      expenses,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalExpenses / limit),
        totalExpenses,
        hasNext: page * limit < totalExpenses,
        hasPrev: page > 1
      },
      summary: userSummary
    });
  } catch (error) {
    console.error('Get user expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user expenses'
    });
  }
};

// @desc    Calculate balances for a group
// @route   GET /api/expenses/balance/:groupId
// @access  Private
const calculateGroupBalance = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    // Verify user is a member of the group
    const group = await Group.findOne({
      _id: groupId,
      'members.user': userId,
      isActive: true
    }).populate('members.user', 'name email');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found or access denied'
      });
    }

    // Get all unsettled expenses for the group
    const expenses = await Expense.find({ 
      group: groupId, 
      settled: false 
    }).populate('paidBy', 'name email');

    // Calculate balances
    const balances = {};
    
    // Initialize balances for all group members
    group.members.forEach(member => {
      const memberId = member.user._id.toString();
      balances[memberId] = {
        userId: memberId,
        name: member.user.name,
        email: member.user.email,
        totalPaid: 0,
        totalOwes: 0,
        netBalance: 0
      };
    });

    // Calculate totals for each member
    expenses.forEach(expense => {
      const paidById = expense.paidBy._id.toString();
      
      // Add to total paid
      if (balances[paidById]) {
        balances[paidById].totalPaid += expense.amount;
      }

      // Add to total owed for each split member
      expense.splitBetween.forEach(split => {
        const splitUserId = split.user.toString();
        if (balances[splitUserId]) {
          balances[splitUserId].totalOwes += split.amount;
        }
      });
    });

    // Calculate net balances
    Object.keys(balances).forEach(memberId => {
      const member = balances[memberId];
      member.netBalance = member.totalPaid - member.totalOwes;
    });

    // Generate simplified debts (who owes whom)
    const debts = generateSimplifiedDebts(balances);

    res.json({
      success: true,
      balances: Object.values(balances),
      debts,
      groupTotal: group.totalExpenses
    });
  } catch (error) {
    console.error('Calculate group balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while calculating balances'
    });
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:expenseId
// @access  Private
const updateExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const userId = req.user.id;
    const { description, amount, category, notes } = req.body;

    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Only the person who created the expense can edit it
    if (expense.paidBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the creator can edit this expense'
      });
    }

    // Update allowed fields
    if (description) expense.description = description.trim();
    if (amount) expense.amount = amount;
    if (category) expense.category = category;
    if (notes !== undefined) expense.notes = notes?.trim();

    await expense.save();

    await expense.populate([
      { path: 'paidBy', select: 'name email' },
      { path: 'splitBetween.user', select: 'name email' },
      { path: 'group', select: 'name' }
    ]);

    res.json({
      success: true,
      message: 'Expense updated successfully',
      expense
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating expense'
    });
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:expenseId
// @access  Private
const deleteExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const userId = req.user.id;

    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Only the person who created the expense can delete it
    if (expense.paidBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the creator can delete this expense'
      });
    }

    // Update group total expenses
    await Group.findByIdAndUpdate(expense.group, {
      $inc: { totalExpenses: -expense.amount }
    });

    await Expense.findByIdAndDelete(expenseId);

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting expense'
    });
  }
};

// Helper function to calculate user's financial summary
const calculateUserSummary = async (userId) => {
  try {
    // Total amount user has paid
    const totalPaidResult = await Expense.aggregate([
      { $match: { paidBy: userId } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Total amount user owes
    const totalOwesResult = await Expense.aggregate([
      { $match: { 'splitBetween.user': userId } },
      { $unwind: '$splitBetween' },
      { $match: { 'splitBetween.user': userId } },
      { $group: { _id: null, total: { $sum: '$splitBetween.amount' } } }
    ]);

    const totalPaid = totalPaidResult[0]?.total || 0;
    const totalOwes = totalOwesResult[0]?.total || 0;
    const netBalance = totalPaid - totalOwes;

    return {
      totalPaid,
      totalOwes,
      netBalance,
      youOwe: netBalance < 0 ? Math.abs(netBalance) : 0,
      youAreOwed: netBalance > 0 ? netBalance : 0
    };
  } catch (error) {
    console.error('Calculate user summary error:', error);
    return {
      totalPaid: 0,
      totalOwes: 0,
      netBalance: 0,
      youOwe: 0,
      youAreOwed: 0
    };
  }
};

// @desc    Get overall settlement data across all groups
// @route   GET /api/expenses/settlements
// @access  Private
const getOverallSettlements = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all groups where user is a member
    const groups = await Group.find({
      'members.user': userId,
      isActive: true
    }).populate('members.user', 'name email');

    const allDebts = [];
    const userBalances = {};

    // Process each group
    for (const group of groups) {
      // Get unsettled expenses for this group
      const expenses = await Expense.find({ 
        group: group._id, 
        settled: false 
      }).populate('paidBy', 'name email');

      // Calculate balances for this group
      const balances = {};
      
      // Initialize balances for all group members
      group.members.forEach(member => {
        const memberId = member.user._id.toString();
        balances[memberId] = {
          userId: memberId,
          name: member.user.name,
          email: member.user.email,
          totalPaid: 0,
          totalOwes: 0,
          netBalance: 0
        };
      });

      // Calculate totals for each member
      expenses.forEach(expense => {
        const paidById = expense.paidBy._id.toString();
        
        // Add to total paid
        if (balances[paidById]) {
          balances[paidById].totalPaid += expense.amount;
        }

        // Add to total owed for each split member
        expense.splitBetween.forEach(split => {
          const splitUserId = split.user.toString();
          if (balances[splitUserId]) {
            balances[splitUserId].totalOwes += split.amount;
          }
        });
      });

      // Calculate net balances
      Object.keys(balances).forEach(memberId => {
        const member = balances[memberId];
        member.netBalance = member.totalPaid - member.totalOwes;
      });

      // Generate simplified debts for this group
      const groupDebts = generateSimplifiedDebts(balances);
      allDebts.push(...groupDebts.map(debt => ({
        ...debt,
        groupId: group._id,
        groupName: group.name
      })));

      // Aggregate user balances across all groups
      Object.values(balances).forEach(balance => {
        if (!userBalances[balance.userId]) {
          userBalances[balance.userId] = {
            userId: balance.userId,
            name: balance.name,
            email: balance.email,
            totalPaid: 0,
            totalOwes: 0,
            netBalance: 0
          };
        }
        userBalances[balance.userId].totalPaid += balance.totalPaid;
        userBalances[balance.userId].totalOwes += balance.totalOwes;
        userBalances[balance.userId].netBalance += balance.netBalance;
      });
    }

    res.json({
      success: true,
      debts: allDebts,
      userBalances: Object.values(userBalances)
    });
  } catch (error) {
    console.error('Get overall settlements error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching settlements'
    });
  }
};

// @desc    Mark settlement as paid
// @route   POST /api/expenses/settle
// @access  Private
const markSettlement = async (req, res) => {
  try {
    const { fromUserId, toUserId, amount, groupId } = req.body;
    const userId = req.user.id;

    // Verify user is involved in this settlement
    if (userId !== fromUserId && userId !== toUserId) {
      return res.status(403).json({
        success: false,
        message: 'You can only mark settlements you are involved in'
      });
    }

    // Verify group exists and user is a member
    const group = await Group.findOne({
      _id: groupId,
      'members.user': userId,
      isActive: true
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found or access denied'
      });
    }

    // For now, we'll create a settlement record as an expense with special category
    const settlement = new Expense({
      description: `Settlement payment`,
      amount: amount,
      paidBy: fromUserId,
      group: groupId,
      splitBetween: [{
        user: toUserId,
        amount: amount
      }],
      category: 'Settlement',
      settled: true
    });

    await settlement.save();

    res.json({
      success: true,
      message: 'Settlement marked as paid',
      settlement
    });
  } catch (error) {
    console.error('Mark settlement error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking settlement'
    });
  }
};

// Helper function to generate simplified debts
const generateSimplifiedDebts = (balances) => {
  const debts = [];
  const creditors = []; // People who are owed money (positive balance)
  const debtors = [];   // People who owe money (negative balance)

  // Separate creditors and debtors
  Object.values(balances).forEach(balance => {
    if (balance.netBalance > 0.01) {
      creditors.push(balance);
    } else if (balance.netBalance < -0.01) {
      debtors.push({ ...balance, netBalance: Math.abs(balance.netBalance) });
    }
  });

  // Sort by amount
  creditors.sort((a, b) => b.netBalance - a.netBalance);
  debtors.sort((a, b) => b.netBalance - a.netBalance);

  // Generate minimum number of transactions
  let i = 0, j = 0;
  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];
    
    const amount = Math.min(creditor.netBalance, debtor.netBalance);
    
    if (amount > 0.01) {
      debts.push({
        from: {
          userId: debtor.userId,
          name: debtor.name
        },
        to: {
          userId: creditor.userId,
          name: creditor.name
        },
        amount: Number(amount.toFixed(2))
      });
    }

    creditor.netBalance -= amount;
    debtor.netBalance -= amount;

    if (creditor.netBalance < 0.01) i++;
    if (debtor.netBalance < 0.01) j++;
  }

  return debts;
};

module.exports = {
  addExpense,
  getGroupExpenses,
  getUserExpenses,
  calculateGroupBalance,
  updateExpense,
  deleteExpense,
  getOverallSettlements,
  markSettlement
};
