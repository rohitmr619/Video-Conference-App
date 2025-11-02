import { promises as fs } from 'fs';
import path from 'path';

const STORAGE_ROOT = path.join(process.cwd(), 'storage');
const TRANSCRIPTS_DIR = path.join(STORAGE_ROOT, 'transcripts');
const MOM_DIR = path.join(STORAGE_ROOT, 'mom');
const MOM_METADATA_PATH = path.join(MOM_DIR, 'metadata.json');

const ensureDir = async (dirPath: string) => {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    // Silently ignore EEXIST to avoid racing on concurrent mkdir
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
  }
};

export const ensureStorage = async () => {
  await ensureDir(STORAGE_ROOT);
  await ensureDir(TRANSCRIPTS_DIR);
  await ensureDir(MOM_DIR);
  try {
    await fs.access(MOM_METADATA_PATH);
  } catch {
    await fs.writeFile(MOM_METADATA_PATH, JSON.stringify({}, null, 2), 'utf8');
  }
};

export const getTranscriptPath = (callId: string) =>
  path.join(TRANSCRIPTS_DIR, `${callId}.json`);

export const getMomPdfPath = (callId: string) =>
  path.join(MOM_DIR, `${callId}.pdf`);

export const getMomDownloadUrl = (callId: string) =>
  `/api/mom/${encodeURIComponent(callId)}`;

export const readMomMetadata = async (): Promise<Record<string, MomMetadata>> => {
  try {
    const content = await fs.readFile(MOM_METADATA_PATH, 'utf8');
    return JSON.parse(content || '{}');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {};
    }
    throw error;
  }
};

export const writeMomMetadata = async (metadata: Record<string, MomMetadata>) => {
  await fs.writeFile(MOM_METADATA_PATH, JSON.stringify(metadata, null, 2), 'utf8');
};

export interface CaptionPayload {
  text: string;
  speakerName: string;
  startTime?: string;
  endTime?: string;
}

export interface MomMetadata {
  callId: string;
  generatedAt: string;
  pdfUrl: string;
  title: string;
}

