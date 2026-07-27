const mongoose = require('mongoose');
const axios = require('axios');
const OpenAI = require('openai');
const { logger } = require('@librechat/data-schemas');
const Workflow = require('~/server/models/Workflow');
const WorkflowExecution = require('~/server/models/WorkflowExecution');
const queueService = require('./WorkflowQueueService');

function initOpenAI() {
  const config = { apiKey: process.env.OPENAI_API_KEY };
  if (process.env.OPENAI_API_URL) { config.baseURL = process.env.OPENAI_API_URL; }
  return new OpenAI(config);
}

async function executeWorkflow(workflowId, userId, triggerInput = {}) {
  const workflow = await Workflow.findById(workflowId).lean();
  if (!workflow) { throw new Error('Workflow not found'); }
  if (!workflow.isActive) { throw new Error('Workflow is not active'); }

  const stepResults = workflow.steps.map((s) => ({
    stepId: s._id,
    type: s.type,
    status: 'pending',
  }));

  const execution = await WorkflowExecution.create({
    workflow: workflowId,
    triggeredBy: userId,
    triggerInput,
    stepResults,
    status: 'running',
    startedAt: new Date(),
  });

  if (queueService.isAvailable) {
    await enqueueNextSteps(execution._id, workflow.steps, triggerInput, 0);
  } else {
    process.nextTick(() => runStepsSync(execution._id, workflow.steps, triggerInput));
  }

  return execution;
}

async function enqueueNextSteps(executionId, steps, input, startIndex) {
  for (let i = startIndex; i < steps.length; i++) {
    const step = steps[i];
    const exec = await WorkflowExecution.findById(executionId);
    if (!exec || exec.status === 'canceled') { break; }

    const stepConfig = step.config || {};
    const retries = stepConfig.retries != null ? stepConfig.retries : 3;
    const delay = stepConfig.delaySeconds || 0;

    await WorkflowExecution.findOneAndUpdate(
      { _id: executionId, 'stepResults.stepId': step._id },
      {
        $set: {
          'stepResults.$.status': 'running',
          'stepResults.$.startedAt': new Date(),
          'stepResults.$.input': input,
        },
      },
    );

    try {
      const output = await processStep(step, input, executionId);
      const newInput = { ...input, ...output, [`step_${i}_output`]: output };

      await WorkflowExecution.findOneAndUpdate(
        { _id: executionId, 'stepResults.stepId': step._id },
        {
          $set: {
            'stepResults.$.status': 'completed',
            'stepResults.$.completedAt': new Date(),
            'stepResults.$.output': output,
          },
        },
      );

      if (step.type === 'approval') {
        await WorkflowExecution.findByIdAndUpdate(executionId, {
          status: 'waiting_approval',
          currentStepIndex: i,
          finalOutput: newInput,
        });
        await sendNotification(executionId, 'approval', step);
        return;
      }

      input = newInput;
    } catch (stepErr) {
      logger.error(`[WorkflowService] Step ${step.type} failed:`, stepErr);
      await WorkflowExecution.findOneAndUpdate(
        { _id: executionId, 'stepResults.stepId': step._id },
        {
          $set: {
            'stepResults.$.status': 'failed',
            'stepResults.$.error': stepErr.message,
            'stepResults.$.completedAt': new Date(),
          },
        },
      );
      if (retries > 0) {
        logger.info(`[WorkflowService] Retrying step ${step.type} (${retries} attempts left)`);
        await WorkflowExecution.findOneAndUpdate(
          { _id: executionId, 'stepResults.stepId': step._id },
          { $set: { 'stepResults.$.status': 'running' } },
        );
        try {
          const retryOutput = await processStep(step, input, executionId);
          const retryInput = { ...input, ...retryOutput, [`step_${i}_output`]: retryOutput };
          await WorkflowExecution.findOneAndUpdate(
            { _id: executionId, 'stepResults.stepId': step._id },
            {
              $set: {
                'stepResults.$.status': 'completed',
                'stepResults.$.completedAt': new Date(),
                'stepResults.$.output': retryOutput,
              },
            },
          );
          input = retryInput;
          continue;
        } catch (retryErr) {
          await WorkflowExecution.findOneAndUpdate(
            { _id: executionId, 'stepResults.stepId': step._id },
            {
              $set: {
                'stepResults.$.status': 'failed',
                'stepResults.$.error': retryErr.message,
              },
            },
          );
          await WorkflowExecution.findByIdAndUpdate(executionId, {
            status: 'failed',
            error: retryErr.message,
            completedAt: new Date(),
          });
          await sendNotification(executionId, 'failed', step);
          return;
        }
      } else {
        await WorkflowExecution.findByIdAndUpdate(executionId, {
          status: 'failed',
          error: stepErr.message,
          completedAt: new Date(),
        });
        await sendNotification(executionId, 'failed', step);
        return;
      }
    }
  }

  await WorkflowExecution.findByIdAndUpdate(executionId, {
    status: 'completed',
    finalOutput: input,
    completedAt: new Date(),
  });
  await sendNotification(executionId, 'completed');
}

async function runStepsSync(executionId, steps, input) {
  let currentInput = { ...input };
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const exec = await WorkflowExecution.findById(executionId);
    if (!exec || exec.status === 'canceled') { break; }

    const stepConfig = step.config || {};
    const retries = stepConfig.retries != null ? stepConfig.retries : 3;

    await WorkflowExecution.findOneAndUpdate(
      { _id: executionId, 'stepResults.stepId': step._id },
      {
        $set: {
          'stepResults.$.status': 'running',
          'stepResults.$.startedAt': new Date(),
          'stepResults.$.input': currentInput,
        },
      },
    );

    try {
      const output = await processStep(step, currentInput, executionId);
      currentInput = { ...currentInput, ...output, [`step_${i}_output`]: output };
      await WorkflowExecution.findOneAndUpdate(
        { _id: executionId, 'stepResults.stepId': step._id },
        {
          $set: {
            'stepResults.$.status': 'completed',
            'stepResults.$.completedAt': new Date(),
            'stepResults.$.output': output,
          },
        },
      );
      if (step.type === 'approval') {
        await WorkflowExecution.findByIdAndUpdate(executionId, {
          status: 'waiting_approval',
          currentStepIndex: i,
          finalOutput: currentInput,
        });
        await sendNotification(executionId, 'approval', step);
        return;
      }
    } catch (stepErr) {
      logger.error(`[WorkflowService] Step ${step.type} failed:`, stepErr);
      await WorkflowExecution.findOneAndUpdate(
        { _id: executionId, 'stepResults.stepId': step._id },
        {
          $set: {
            'stepResults.$.status': 'failed',
            'stepResults.$.error': stepErr.message,
            'stepResults.$.completedAt': new Date(),
          },
        },
      );
      if (retries > 0) {
        logger.info(`[WorkflowService] Retrying step ${step.type}`);
        await WorkflowExecution.findOneAndUpdate(
          { _id: executionId, 'stepResults.stepId': step._id },
          { $set: { 'stepResults.$.status': 'running' } },
        );
        try {
          const retryOutput = await processStep(step, currentInput, executionId);
          currentInput = { ...currentInput, ...retryOutput, [`step_${i}_output`]: retryOutput };
          await WorkflowExecution.findOneAndUpdate(
            { _id: executionId, 'stepResults.stepId': step._id },
            {
              $set: {
                'stepResults.$.status': 'completed',
                'stepResults.$.completedAt': new Date(),
                'stepResults.$.output': retryOutput,
              },
            },
          );
          continue;
        } catch (retryErr) {
          await WorkflowExecution.findByIdAndUpdate(executionId, {
            status: 'failed',
            error: retryErr.message,
            completedAt: new Date(),
          });
          await sendNotification(executionId, 'failed', step);
          return;
        }
      } else {
        await WorkflowExecution.findByIdAndUpdate(executionId, {
          status: 'failed',
          error: stepErr.message,
          completedAt: new Date(),
        });
        await sendNotification(executionId, 'failed', step);
        return;
      }
    }
  }

  await WorkflowExecution.findByIdAndUpdate(executionId, {
    status: 'completed',
    finalOutput: currentInput,
    completedAt: new Date(),
  });
  await sendNotification(executionId, 'completed');
}

async function processStep(step, input, executionId) {
  const fill = (tpl) => fillTemplate(tpl || '', input);

  switch (step.type) {
    case 'trigger':
      return { triggeredAt: new Date().toISOString(), triggerData: input };

    case 'ai_prompt': {
      const { prompt, model: modelCfg, systemPrompt: sysPrompt, temperature } = step.config;
      const openai = initOpenAI();
      const messages = [];
      if (sysPrompt) { messages.push({ role: 'system', content: fill(sysPrompt) }); }
      messages.push({ role: 'user', content: fill(prompt || '') });
      const completion = await openai.chat.completions.create({
        model: modelCfg || 'gpt-4o-mini',
        messages,
        temperature: temperature ?? 0.7,
        max_tokens: step.config.maxTokens || 2048,
      });
      const content = completion.choices[0]?.message?.content || '';
      return {
        aiResponse: content,
        model: modelCfg || 'gpt-4o-mini',
        usage: { promptTokens: completion.usage?.prompt_tokens, completionTokens: completion.usage?.completion_tokens },
      };
    }

    case 'image_generation': {
      const ImageGenService = require('~/server/services/ImageGen/ImageGenService');
      const { prompt: imgPrompt, model: imgModel, size, provider: imgProvider } = step.config;
      const images = await ImageGenService.generateImage({
        provider: imgProvider || 'fal',
        model: imgModel || 'fal-ai/flux-pro',
        prompt: fill(imgPrompt || ''),
        numImages: 1,
        req: await buildMockReq(executionId),
      });
      return { generatedImages: images, imageUrl: images[0]?.filepath || null };
    }

    case 'video_generation': {
      const VideoGenService = require('~/server/services/VideoGen/VideoGenService');
      const { prompt: vidPrompt, model: vidModel, provider: vidProvider, duration } = step.config;
      const videos = await VideoGenService.generateVideo({
        provider: vidProvider || 'luma',
        model: vidModel || 'ray-2',
        prompt: fill(vidPrompt || ''),
        duration: duration || 5,
        req: await buildMockReq(executionId),
      });
      return { generatedVideos: videos, videoUrl: videos[0]?.filepath || null };
    }

    case 'approval':
      return { status: 'pending_approval', message: step.config.message || 'Awaiting approval' };

    case 'publish': {
      const { destination, template } = step.config;
      const content = fill(template || '');
      return { published: true, destination, contentPreview: content.slice(0, 500), fullContent: content };
    }

    case 'condition': {
      const { field, operator, value } = step.config;
      const actual = resolveNestedValue(input, field);
      let passed = false;
      if (operator === 'equals') { passed = String(actual) === String(value); }
      else if (operator === 'not_equals') { passed = String(actual) !== String(value); }
      else if (operator === 'contains') { passed = String(actual).includes(String(value)); }
      else if (operator === 'gt') { passed = Number(actual) > Number(value); }
      else if (operator === 'gte') { passed = Number(actual) >= Number(value); }
      else if (operator === 'lt') { passed = Number(actual) < Number(value); }
      else if (operator === 'lte') { passed = Number(actual) <= Number(value); }
      else if (operator === 'exists') { passed = actual !== undefined && actual !== null; }
      else if (operator === 'is_empty') { passed = actual === undefined || actual === null || actual === ''; }
      return { conditionPassed: passed, conditionFailed: !passed, actualValue: actual };
    }

    case 'delay': {
      const ms = (step.config.seconds || 0) * 1000;
      if (ms > 0) { await new Promise((resolve) => setTimeout(resolve, ms)); }
      return { delayedMs: ms };
    }

    case 'webhook': {
      const { url, method, headers: customHeaders, body: bodyTemplate } = step.config;
      if (!url) { throw new Error('Webhook URL is required'); }
      const webhookUrl = fill(url);
      const webhookMethod = (method || 'POST').toUpperCase();
      const webhookHeaders = { 'Content-Type': 'application/json', ...(customHeaders || {}) };
      let webhookBody = null;
      if (bodyTemplate) {
        try { webhookBody = JSON.parse(fill(bodyTemplate)); } catch { webhookBody = fill(bodyTemplate); }
      }
      const response = await axios({
        method: webhookMethod,
        url: webhookUrl,
        headers: webhookHeaders,
        data: webhookBody,
        timeout: 30000,
        validateStatus: () => true,
      });
      return { webhookUrl, method: webhookMethod, statusCode: response.status, responseData: response.data };
    }

    default:
      return { processed: true };
  }
}

async function buildMockReq(executionId) {
  const exec = await WorkflowExecution.findById(executionId).lean();
  return {
    user: { id: exec?.triggeredBy || 'workflow', tenantId: exec?.tenantId || 'default' },
    config: {},
    headers: {},
  };
}

function fillTemplate(template, vars) {
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
    const value = resolveNestedValue(vars, path);
    return value !== undefined && value !== null ? String(value) : match;
  });
}

function resolveNestedValue(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

async function sendNotification(executionId, eventType, step) {
  try {
    const NotificationService = require('~/server/services/NotificationService');
    const exec = await WorkflowExecution.findById(executionId).lean();
    if (!exec) { return; }
    const workflow = await Workflow.findById(exec.workflow).lean();
    const userId = exec.triggeredBy;

    if (eventType === 'completed') {
      await NotificationService.createNotification({
        userId,
        type: 'system_announcement',
        title: 'Workflow completed',
        body: `Workflow "${workflow?.name || 'Unknown'}" completed successfully.`,
      });
    } else if (eventType === 'failed') {
      await NotificationService.createNotification({
        userId,
        type: 'system_announcement',
        title: 'Workflow failed',
        body: `Workflow "${workflow?.name || 'Unknown'}" failed at step "${step?.label || step?.type || 'unknown'}".`,
      });
    } else if (eventType === 'approval') {
      await NotificationService.createNotification({
        userId,
        type: 'system_announcement',
        title: 'Workflow requires approval',
        body: `Workflow "${workflow?.name || 'Unknown'}" requires your approval to continue.`,
        metadata: { executionId, workflowId: exec.workflow },
      });
    }
  } catch (err) {
    logger.error('[WorkflowService] sendNotification', err);
  }
}

async function approveStep(executionId, userId) {
  const execution = await WorkflowExecution.findById(executionId);
  if (!execution) { throw new Error('Execution not found'); }
  if (execution.status !== 'waiting_approval') { throw new Error('Execution not waiting for approval'); }

  await WorkflowExecution.findByIdAndUpdate(executionId, {
    approvedBy: userId,
    approvedAt: new Date(),
    status: 'running',
  });

  const workflow = await Workflow.findById(execution.workflow).lean();
  const currentInput = execution.finalOutput || execution.triggerInput || {};
  const nextIndex = (execution.currentStepIndex ?? 0) + 1;

  if (queueService.isAvailable) {
    await enqueueNextSteps(execution._id, workflow.steps, currentInput, nextIndex);
  } else {
    process.nextTick(() => runStepsSync(execution._id, workflow.steps, currentInput, nextIndex));
  }

  return true;
}

async function rejectStep(executionId, userId) {
  await WorkflowExecution.findByIdAndUpdate(executionId, {
    status: 'canceled',
    completedAt: new Date(),
  });
  return true;
}

async function cancelExecution(executionId) {
  await WorkflowExecution.findByIdAndUpdate(executionId, {
    status: 'canceled',
    completedAt: new Date(),
  });
}

async function retryExecution(executionId) {
  const execution = await WorkflowExecution.findById(executionId).lean();
  if (!execution) { throw new Error('Execution not found'); }
  if (execution.status !== 'failed') { throw new Error('Only failed executions can be retried'); }

  const workflow = await Workflow.findById(execution.workflow).lean();
  const lastFailedStep = execution.stepResults
    .slice()
    .reverse()
    .find((s) => s.status === 'failed');

  const startIndex = lastFailedStep
    ? execution.stepResults.indexOf(lastFailedStep)
    : 0;

  await WorkflowExecution.findByIdAndUpdate(executionId, {
    status: 'running',
    error: null,
    completedAt: null,
    $set: { 'stepResults.$[].status': 'pending', 'stepResults.$[].error': null },
  });

  const input = execution.finalOutput || execution.triggerInput || {};

  if (queueService.isAvailable) {
    await enqueueNextSteps(executionId, workflow.steps, input, startIndex);
  } else {
    process.nextTick(() => runStepsSync(executionId, workflow.steps, input, startIndex));
  }

  return true;
}

module.exports = {
  executeWorkflow,
  approveStep,
  rejectStep,
  cancelExecution,
  retryExecution,
};
