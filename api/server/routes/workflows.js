const express = require('express');
const { requireJwtAuth } = require('~/server/middleware');
const ctrl = require('~/server/controllers/WorkflowController');

const router = express.Router();

router.get('/queue/status', requireJwtAuth, ctrl.getQueueInfo);

router.get('/', requireJwtAuth, ctrl.listWorkflows);
router.post('/', requireJwtAuth, ctrl.createWorkflow);
router.get('/:id', requireJwtAuth, ctrl.getWorkflow);
router.put('/:id', requireJwtAuth, ctrl.updateWorkflow);
router.delete('/:id', requireJwtAuth, ctrl.deleteWorkflow);
router.post('/:id/execute', requireJwtAuth, ctrl.executeWorkflow);
router.get('/:id/executions', requireJwtAuth, ctrl.getExecutions);
router.get('/:id/executions/:executionId', requireJwtAuth, ctrl.getExecution);
router.post('/:id/executions/:executionId/approve', requireJwtAuth, ctrl.approveExecution);
router.post('/:id/executions/:executionId/reject', requireJwtAuth, ctrl.rejectExecution);
router.post('/:id/executions/:executionId/cancel', requireJwtAuth, ctrl.cancelExecution);
router.post('/:id/executions/:executionId/retry', requireJwtAuth, ctrl.retryExecution);

module.exports = router;
