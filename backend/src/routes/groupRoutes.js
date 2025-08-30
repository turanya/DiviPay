const express = require('express');
const router = express.Router();
const { 
  createGroup, 
  getUserGroups, 
  getGroupDetails,
  joinGroup,
  removeMember,
  leaveGroup
} = require('../controllers/groupController');
const { validateGroup } = require('../middleware/validation');
const auth = require('../middleware/auth');

// All routes are protected
router.use(auth);

router.post('/', validateGroup, createGroup);
router.get('/', getUserGroups);
router.get('/:groupId', getGroupDetails);
router.post('/:groupId/join', joinGroup);
router.delete('/:groupId/members/:memberId', removeMember);
router.post('/:groupId/leave', leaveGroup);

module.exports = router;
