import type { Request, Response } from 'express';
import { getApiKey, getGeminiModel, getGeminiEmbedModel } from './geminiClient.ts';

export default function handler(req: Request, res: Response) {
  const apiKey = getApiKey();
  const isConfigured = Boolean(apiKey);

  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({
    status: isConfigured ? 'ready' : 'missing_key',
    geminiConfigured: isConfigured,
    model: getGeminiModel(),
    embedModel: getGeminiEmbedModel(),
    keyPrefix: isConfigured ? `${apiKey?.slice(0, 4)}...${apiKey?.slice(-3)}` : null,
    environment: process.env.VERCEL ? 'vercel' : 'local_dev',
  });
}
