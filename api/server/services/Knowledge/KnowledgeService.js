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

async function chatWithDocuments({ message, fileIds, req }) {
  const searchResults = await searchDocuments({ fileIds, query: message, req });
  const openai = initOpenAI();
  if (!openai) {
    return { error: 'Knowledge Chat API key not configured' };
  }

  let contextText = '';
  for (const result of searchResults) {
    if (result.data && result.data.length > 0) {
      for (const snippet of result.data) {
        contextText += `[From document ${result.fileId}]: ${snippet.text || snippet.content || JSON.stringify(snippet)}\n\n`;
      }
    }
  }

  const systemPrompt = `You are a helpful assistant answering questions based on the provided document excerpts.
Answer the user's question using only the context below. If the context doesn't contain enough information, say so.
Always cite the source document ID when referencing specific information.

Context:
${contextText || 'No relevant context found in the selected documents.'}`;

  try {
    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      stream: false,
    });
    return {
      answer: completion.choices[0]?.message?.content || '',
      sources: searchResults.map((r) => r.fileId),
    };
  } catch (error) {
    logger.error('[Knowledge] Chat completion failed:', error);
    throw new Error(error.message || 'Chat completion failed');
  }
}

module.exports = { uploadDocument, searchDocuments, chatWithDocuments };
