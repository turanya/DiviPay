const express = require('express');
const router = express.Router();
const { 
  addExpense, 
  getGroupExpenses, 
  getUserExpenses, 
  calculateGroupBalance,
  updateExpense,
  deleteExpense,
  getOverallSettlements,
  markSettlement
} = require('../controllers/expenseController');
const { validateExpense } = require('../middleware/validation');
const auth = require('../middleware/auth');

// All routes are protected
router.use(auth);

router.post('/', validateExpense, addExpense);
router.get('/user', getUserExpenses);
router.get('/group/:groupId', getGroupExpenses);
router.get('/balance/:groupId', calculateGroupBalance);
router.get('/settlements', getOverallSettlements);
router.post('/settle', markSettlement);
router.put('/:expenseId', updateExpense);
router.delete('/:expenseId', deleteExpense);

module.exports = router;
