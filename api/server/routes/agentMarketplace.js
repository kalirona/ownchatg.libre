const express = require('express');
const { requireJwtAuth } = require('~/server/middleware');
const ctrl = require('~/server/controllers/AgentMarketplaceController');

const router = express.Router();

router.use(requireJwtAuth);

/* Listings */
router.get('/', ctrl.list);
router.get('/installed', ctrl.getInstalled);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

/* Installation */
router.post('/:id/install', ctrl.install);
router.post('/:id/uninstall', ctrl.uninstall);

/* Reviews */
router.get('/:id/reviews', ctrl.getReviews);
router.post('/:id/reviews', ctrl.createReview);

/* Follows */
router.post('/follow/:userId', ctrl.follow);
router.delete('/follow/:userId', ctrl.unfollow);
router.get('/:userId/followers', ctrl.getFollowers);
router.get('/user/following', ctrl.getFollowing);

/* Revenue */
router.get('/user/revenue', ctrl.getRevenue);

/* Creator */
router.get('/creator/:userId', ctrl.getCreatorProfile);

module.exports = router;
