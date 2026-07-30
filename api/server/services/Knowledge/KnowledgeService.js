const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const OpenAI = require('openai');
const axios = require('axios');
const { logger } = require('@librechat/data-schemas');
const { logAxiosError, generateShortLivedToken } = require('@librechat/api');
const { FileSources, FileContext } = require('librechat-data-provider');
const { getFileStrategy } = require('~/server/utils/getFileStrategy');
const { getStrategyFunctions } = require('~/server/services/Files/strategies');
const { uploadVectors } = require('~/server/services/Files/VectorDB/crud');
const db = require('~/models');

const DEFAULT_K = 5;
const CHAT_MODEL = process.env.KNOWLEDGE_CHAT_MODEL || 'gpt-4o-mini';
const CHAT_ENDPOINT = process.env.KNOWLEDGE_CHAT_ENDPOINT || process.env.OPENAI_API_URL || '';
const CHAT_API_KEY = process.env.KNOWLEDGE_CHAT_API_KEY || process.env.OPENAI_API_KEY || '';

const QUICK_ACTION_PROMPTS = {
  summarize: 'Summarize the following document content concisively, covering all key points:\n\n',
  faq: 'Generate a list of frequently asked questions (FAQ) with answers based on the following content:\n\n',
  'extract-tables': 'Extract any tables, structured data, or numerical data from the following content. Format them as markdown tables:\n\n',
  sop: 'Create a Standard Operating Procedure (SOP) based on the following content. Include steps, prerequisites, and safety notes:\n\n',
  translate: 'Translate the following content to English (if not English), or translate to the language specified. Maintain all technical terms:\n\n',
  blog: 'Rewrite the following content as an engaging blog post with headlines, subheadings, and a call to action:\n\n',
  quiz: 'Generate a quiz with 10 multiple-choice questions based on the following content. Include answer key:\n\n',
  flashcards: 'Create study flashcards (question → answer pairs) from the following content:\n\n',
};

function initOpenAI() {
  if (!CHAT_API_KEY) {
    return null;
  }
  const config = { apiKey: CHAT_API_KEY };
  if (CHAT_ENDPOINT) {
    config.baseURL = CHAT_ENDPOINT;
  }
  return new OpenAI(config);
}

async function uploadDocument(req, file) {
  const file_id = crypto.randomUUID();
  const appConfig = req.config;
  const source = getFileStrategy(appConfig, { isImage: false });

  let storageResult;
  try {
    const fns = getStrategyFunctions(source);
    storageResult = await fns.handleFileUpload({
      req,
      file,
      file_id,
      basePath: 'knowledge',
    });
  } catch (err) {
    logger.error('[Knowledge] Storage upload failed:', err);
    throw new Error('Failed to upload file to storage');
  }

  let embeddingResult = { embedded: false };
  if (process.env.RAG_API_URL) {
    try {
      embeddingResult = await uploadVectors({
        req,
        file,
        file_id,
      });
    } catch (err) {
      logger.error('[Knowledge] Vector embedding failed:', err);
    }
  }

  const fileRecord = await db.createFile(
    {
      user: req.user.id,
      file_id,
      filepath: storageResult.filepath || FileSources.local,
      filename: file.originalname,
      context: FileContext.agents,
      type: file.mimetype,
      bytes: file.size,
      embedded: embeddingResult.embedded,
      embeddingStatus: embeddingResult.embedded ? 'ready' : 'pending',
      source,
      tenantId: req.user.tenantId,
      storageKey: storageResult.storageKey,
      storageRegion: storageResult.storageRegion,
      width: storageResult.width,
      height: storageResult.height,
    },
    true,
  );

  return fileRecord;
}

async function reindexDocument(req, file) {
  if (!process.env.RAG_API_URL) {
    throw new Error('RAG_API_URL not configured for reindexing');
  }
  try {
    const result = await uploadVectors({ req, file, file_id: file.file_id, force: true });
    const updated = await db.updateFile(file._id, { embedded: true, embeddingStatus: 'ready' });
    return updated;
  } catch (err) {
    logger.error('[Knowledge] Reindex failed:', err);
    await db.updateFile(file._id, { embeddingStatus: 'failed' });
    throw new Error('Reindexing failed: ' + err.message);
  }
}

async function searchDocuments({ fileIds, query, k = DEFAULT_K, req }) {
  if (!process.env.RAG_API_URL) {
    throw new Error('RAG_API_URL not configured');
  }
  if (!fileIds || fileIds.length === 0) {
    return [];
  }
  const jwtToken = generateShortLivedToken(req.user.id);
  if (!jwtToken) {
    throw new Error('Authentication failed for RAG API');
  }

  const queryPromises = fileIds.map((fileId) =>
    axios
      .post(
        `${process.env.RAG_API_URL}/query`,
        { file_id: fileId, query, k },
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
            'Content-Type': 'application/json',
          },
        },
      )
      .then((res) => ({ fileId, data: res.data }))
      .catch((error) => {
        logAxiosError({ error, message: `[Knowledge] RAG query failed for ${fileId}` });
        return null;
      }),
  );

  const results = await Promise.all(queryPromises);
  return results.filter((r) => r !== null);
}

async function chatWithDocuments({ message, fileIds, action, req }) {
  const searchResults = await searchDocuments({ fileIds, query: message, req });
  const openai = initOpenAI();
  if (!openai) {
    return { error: 'Knowledge Chat API key not configured' };
  }

  const contextText = [];
  const sources = [];
  const fileMap = {};

  const fileDocs = await db.getFiles({ file_id: { $in: fileIds } });
  for (const f of fileDocs) {
    fileMap[f.file_id] = f.filename;
  }

  for (const result of searchResults) {
    if (result.data && result.data.length > 0) {
      for (const snippet of result.data) {
        const text = snippet.text || snippet.content || JSON.stringify(snippet);
        const page = snippet.page || null;
        const filename = fileMap[result.fileId] || result.fileId;
        contextText.push(`[From ${filename}${page ? ` (page ${page})` : ''}]: ${text}`);
        sources.push({
          fileId: result.fileId,
          filename,
          page: page || undefined,
          excerpt: text.slice(0, 200),
        });
      }
    }
  }

  const actionPrompt = action ? QUICK_ACTION_PROMPTS[action] || '' : '';
  const systemPrompt = `You are a helpful AI assistant answering questions based on the provided document excerpts.
Answer the user's question using only the context below. If the context doesn't contain enough information, say so.
Always cite the source document name and page number when referencing specific information.

${actionPrompt}

Context:
${contextText.join('\n\n') || 'No relevant context found in the selected documents.'}`;

  try {
    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      stream: false,
    });

    await db.updateFiles(
      { file_id: { $in: fileIds } },
      { $set: { lastUsedAt: new Date() }, $inc: { questionsAsked: 1, referencedCount: 1 } },
    );

    return {
      answer: completion.choices[0]?.message?.content || '',
      sources,
    };
  } catch (error) {
    logger.error('[Knowledge] Chat completion failed:', error);
    throw new Error(error.message || 'Chat completion failed');
  }
}

async function runQuickAction({ fileIds, action, req }) {
  const openai = initOpenAI();
  if (!openai) {
    throw new Error('Knowledge Chat API key not configured');
  }

  const searchResults = await searchDocuments({ fileIds, query: `Content of documents for ${action}`, k: 10, req });
  const contextText = [];
  const sources = [];
  const fileMap = {};

  const fileDocs = await db.getFiles({ file_id: { $in: fileIds } });
  for (const f of fileDocs) {
    fileMap[f.file_id] = f.filename;
  }

  for (const result of searchResults) {
    if (result.data && result.data.length > 0) {
      for (const snippet of result.data) {
        const text = snippet.text || snippet.content || JSON.stringify(snippet);
        const page = snippet.page || null;
        const filename = fileMap[result.fileId] || result.fileId;
        contextText.push(`[From ${filename}${page ? ` (page ${page})` : ''}]: ${text}`);
        sources.push({
          fileId: result.fileId,
          filename,
          page: page || undefined,
          excerpt: text.slice(0, 200),
        });
      }
    }
  }

  const actionPrompt = QUICK_ACTION_PROMPTS[action];
  const systemPrompt = `${actionPrompt}${contextText.join('\n\n') || 'No content found in the selected documents.'}`;

  try {
    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { system: 'You are a document analysis AI assistant. Follow the instruction below using only the provided content.' },
        { role: 'user', content: systemPrompt },
      ],
      stream: false,
    });

    return {
      answer: completion.choices[0]?.message?.content || '',
      sources,
    };
  } catch (error) {
    logger.error('[Knowledge] Quick action failed:', error);
    throw new Error(error.message || 'Quick action failed');
  }
}

module.exports = { uploadDocument, reindexDocument, searchDocuments, chatWithDocuments, runQuickAction };
