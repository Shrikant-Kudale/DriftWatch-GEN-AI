import type { Request, Response } from 'express';
import { Type } from '@google/genai';
import { getGeminiClient, getGeminiModel, withRetry } from './geminiClient.ts';

export interface Briefings {
  for_administrators: string;
  for_executives: string;
  for_support: string;
}

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { change, approvedEdits } = req.body || {};
    if (!change) {
      return res.status(400).json({ error: 'Missing "change" description in request body.' });
    }

    const ai = getGeminiClient();
    const model = getGeminiModel();

    const editsSummary = (approvedEdits || [])
      .map((e: any) => `- Page ID: ${e.page_id}\n  Reason: ${e.reason}`)
      .join('\n');

    const prompt = `You are a specialized technical communications director.
A product change has been made and verified with documentation updates. Produce three plain-language, tailored briefings for different stakeholder audiences:

1. For administrators: Focus on technical/operational impact, CLI flags, configuration changes, migrations, and what sysadmins must adjust.
2. For executives: High-level business overview, benefits, compliance alignment, disk/storage cost implications, and risk assessment without deep command syntax.
3. For support agents: Practical guidance on what users will ask about, symptoms of issues, common questions (FAQ), deprecated options, and how to help customers.

### PRODUCT CHANGE:
${change}

### APPROVED DOCUMENTATION EDITS:
${editsSummary || 'No specific approved edit details provided; summarize based on the product change.'}
`;

    const response = await withRetry(async () => {
      return await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction:
            'You write crisp, authoritative plain-language release briefings for technical organizations.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              for_administrators: {
                type: Type.STRING,
                description: 'Tailored briefing for system and infrastructure administrators.',
              },
              for_executives: {
                type: Type.STRING,
                description: 'Executive summary focusing on business impact and strategy.',
              },
              for_support: {
                type: Type.STRING,
                description: 'Guidance and talking points for customer support & success teams.',
              },
            },
            required: ['for_administrators', 'for_executives', 'for_support'],
          },
        },
      });
    });

    const rawJson = (response.text || '{}').trim();
    let briefings: Briefings;
    try {
      briefings = JSON.parse(rawJson);
    } catch (e) {
      throw new Error('Gemini briefing response could not be parsed as JSON.');
    }

    return res.status(200).json(briefings);
  } catch (error: any) {
    console.error('Error generating audience briefings:', error);
    const statusCode = error?.status === 429 ? 429 : 500;
    return res.status(statusCode).json({
      error: error?.message || 'Failed to generate audience briefings with Gemini.',
    });
  }
}
