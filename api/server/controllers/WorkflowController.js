const { logger } = require('@librechat/data-schemas');
const workflowService = require('~/server/services/WorkflowService');
const queueService = require('~/server/services/WorkflowQueueService');
const Workflow = require('~/server/models/Workflow');
const WorkflowExecution = require('~/server/models/WorkflowExecution');

async function listWorkflows(req, res) {
  try {
    const query = { createdBy: req.user.id };
    if (req.query.orgId) { query.organization = req.query.orgId; }
    if (req.query.template === 'true') { query.isTemplate = true; }
    const workflows = await Workflow.find(query).sort({ createdAt: -1 }).lean();
    res.json({ workflows });
  } catch (error) {
    logger.error('[WorkflowController] listWorkflows', error);
    res.status(500).json({ message: 'Error listing workflows' });
  }
}

async function getWorkflow(req, res) {
  try {
    const workflow = await Workflow.findById(req.params.id).lean();
    if (!workflow) { return res.status(404).json({ message: 'Workflow not found' }); }
    res.json({ workflow });
  } catch (error) {
    logger.error('[WorkflowController] getWorkflow', error);
    res.status(500).json({ message: 'Error fetching workflow' });
  }
}

async function createWorkflow(req, res) {
  try {
    const workflow = await Workflow.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json({ workflow });
  } catch (error) {
    logger.error('[WorkflowController] createWorkflow', error);
    res.status(500).json({ message: 'Error creating workflow' });
  }
}

async function updateWorkflow(req, res) {
  try {
    const workflow = await Workflow.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      req.body,
      { new: true },
    );
    if (!workflow) { return res.status(404).json({ message: 'Workflow not found or not authorized' }); }
    res.json({ workflow });
  } catch (error) {
    logger.error('[WorkflowController] updateWorkflow', error);
    res.status(500).json({ message: 'Error updating workflow' });
  }
}

async function deleteWorkflow(req, res) {
  try {
    const workflow = await Workflow.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
    if (!workflow) { return res.status(404).json({ message: 'Workflow not found or not authorized' }); }
    res.json({ success: true });
  } catch (error) {
    logger.error('[WorkflowController] deleteWorkflow', error);
    res.status(500).json({ message: 'Error deleting workflow' });
  }
}

async function executeWorkflow(req, res) {
  try {
    const execution = await workflowService.executeWorkflow(req.params.id, req.user.id, req.body.input || {});
    res.status(202).json({ execution });
  } catch (error) {
    logger.error('[WorkflowController] executeWorkflow', error);
    if (error.message?.includes('not found') || error.message?.includes('not active')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error executing workflow' });
  }
}

async function getExecutions(req, res) {
  try {
    const query = { workflow: req.params.id };
    if (req.query.status) { query.status = req.query.status; }
    const executions = await WorkflowExecution.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json({ executions });
  } catch (error) {
    logger.error('[WorkflowController] getExecutions', error);
    res.status(500).json({ message: 'Error listing executions' });
  }
}

async function getExecution(req, res) {
  try {
    const execution = await WorkflowExecution.findById(req.params.executionId).lean();
    if (!execution) { return res.status(404).json({ message: 'Execution not found' }); }
    res.json({ execution });
  } catch (error) {
    logger.error('[WorkflowController] getExecution', error);
    res.status(500).json({ message: 'Error fetching execution' });
  }
}

async function approveExecution(req, res) {
  try {
    await workflowService.approveStep(req.params.executionId, req.user.id);
    res.json({ success: true });
  } catch (error) {
    logger.error('[WorkflowController] approveExecution', error);
    res.status(400).json({ message: error.message });
  }
}

async function rejectExecution(req, res) {
  try {
    await workflowService.rejectStep(req.params.executionId, req.user.id);
    res.json({ success: true });
  } catch (error) {
    logger.error('[WorkflowController] rejectExecution', error);
    res.status(400).json({ message: error.message });
  }
}

async function cancelExecution(req, res) {
  try {
    await workflowService.cancelExecution(req.params.executionId);
    res.json({ success: true });
  } catch (error) {
    logger.error('[WorkflowController] cancelExecution', error);
    res.status(500).json({ message: error.message });
  }
}

async function retryExecution(req, res) {
  try {
    await workflowService.retryExecution(req.params.executionId);
    res.json({ success: true });
  } catch (error) {
    logger.error('[WorkflowController] retryExecution', error);
    res.status(400).json({ message: error.message });
  }
}

async function getQueueInfo(req, res) {
  try {
    const status = await queueService.getQueueStatus();
    res.json(status);
  } catch (error) {
    logger.error('[WorkflowController] getQueueInfo', error);
    res.status(500).json({ message: 'Error fetching queue info' });
  }
}

module.exports = {
  listWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  executeWorkflow,
  getExecutions,
  getExecution,
  approveExecution,
  rejectExecution,
  cancelExecution,
  retryExecution,
  getQueueInfo,
};
