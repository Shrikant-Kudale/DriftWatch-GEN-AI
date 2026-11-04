import type { Request, Response } from 'express';
import { SAMPLE_DOCS, SAMPLE_CHANGE } from '../src/data/sampleDocs.ts';

export default function handler(req: Request, res: Response) {
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({
    docs: SAMPLE_DOCS,
    sampleChange: SAMPLE_CHANGE,
  });
}
