import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  CaptionPayload,
  ensureStorage,
  getMomDownloadUrl,
  getMomPdfPath,
  getTranscriptPath,
  readMomMetadata,
  writeMomMetadata,
} from '@/lib/storage';
import { PDFDocument, StandardFonts, type PDFFont } from 'pdf-lib';

export const runtime = 'nodejs';

interface TranscriptionRequest {
  callId: string;
  captions: CaptionPayload[];
}

const GEMINI_MODEL = 'models/gemini-2.5-flash';

export async function POST(request: Request) {
  try {
    const { callId, captions }: TranscriptionRequest = await request.json();

    if (!callId || !Array.isArray(captions)) {
      return NextResponse.json(
        { error: 'callId and captions are required' },
        { status: 400 },
      );
    }

    const apiKey =
      process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is missing' },
        { status: 500 },
      );
    }

    await ensureStorage();

    const timestamp = new Date().toISOString();
    await persistCaptions(callId, captions, timestamp);

    const summaryText = await generateMeetingSummary({
      apiKey,
      callId,
      captions,
      timestamp,
    });

    const pdfBytes = await createSummaryPdf({
      callId,
      generatedAt: timestamp,
      summary: summaryText,
    });

    const pdfPath = getMomPdfPath(callId);
    await fs.writeFile(pdfPath, Buffer.from(pdfBytes));

    const metadata = await readMomMetadata();
    const pdfUrl = getMomDownloadUrl(callId);
    metadata[callId] = {
      callId,
      generatedAt: timestamp,
      pdfUrl,
      title: `Meeting Minutes – ${new Date(timestamp).toLocaleString()}`,
    };
    await writeMomMetadata(metadata);

    return NextResponse.json({ success: true, pdfUrl });
  } catch (error) {
    console.error('Failed to create meeting summary', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Unknown error generating summary',
      },
      { status: 500 },
    );
  }
}

const persistCaptions = async (
  callId: string,
  captions: CaptionPayload[],
  timestamp: string,
) => {
  const payload = {
    callId,
    savedAt: timestamp,
    captions,
  };
  await fs.writeFile(
    getTranscriptPath(callId),
    JSON.stringify(payload, null, 2),
    'utf8',
  );
};

const generateMeetingSummary = async ({
  apiKey,
  callId,
  captions,
  timestamp,
}: {
  apiKey: string;
  callId: string;
  captions: CaptionPayload[];
  timestamp: string;
}) => {
  const formattedTranscript = captions
    .map((caption, index) => {
      const label = caption.speakerName || `Speaker ${index + 1}`;
      const start = caption.startTime
        ? new Date(caption.startTime).toLocaleTimeString()
        : '';
      return `${label}${start ? ` (${start})` : ''}: ${caption.text}`;
    })
    .join('\n');

  const modelClient = new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: GEMINI_MODEL,
  });

  const dateLabel = new Date(timestamp).toLocaleString();

  const prompt = [
    `You are an expert meeting assistant generating concise minutes of meeting.`,
    `Meeting identifier: ${callId}`,
    `Meeting end time: ${dateLabel}`,
    `Provide the response in this structure:`,
    `1. Meeting Overview (2-3 sentences)`,
    `2. Key Decisions (bullet list)`,
    `3. Action Items (bullet list, include assignee names when mentioned, else note "Unassigned")`,
    `4. Discussion Highlights (short bullet list)`,
    `5. Risks / Follow-ups (bullet list, if none say "None noted")`,
    `Use clear headings and plain text bullet markers.`,
    `If the transcript is empty, explain that no data was available.`,
    `Transcript:`,
    formattedTranscript || '[No transcript text available]',
  ].join('\n\n');

  const result = await modelClient.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    safetySettings: [],
  });

  const text = result.response.text();
  if (!text) {
    throw new Error('Gemini returned an empty response');
  }

  return text;
};

const createSummaryPdf = async ({
  callId,
  generatedAt,
  summary,
}: {
  callId: string;
  generatedAt: string;
  summary: string;
}) => {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  let page = pdfDoc.addPage();
  const fontSize = 12;
  const lineHeight = 18;
  const margin = 40;

  const { width, height } = page.getSize();
  let cursorY = height - margin;

  const lines = normalizeSummary(summary, callId, generatedAt);
  const maxLineWidth = width - margin * 2;

  const drawLine = (line: string) => {
    const wrapped = wrapText(line, maxLineWidth, font, fontSize);
    for (const segment of wrapped) {
      if (cursorY <= margin) {
        page = pdfDoc.addPage();
        cursorY = page.getSize().height - margin;
      }
      page.drawText(segment, {
        x: margin,
        y: cursorY,
        size: fontSize,
        font,
      });
      cursorY -= lineHeight;
    }
  };

  lines.forEach((line) => drawLine(line));

  return pdfDoc.save();
};

const normalizeSummary = (summary: string, callId: string, generatedAt: string) => {
  const header = [
    `Meeting Minutes`,
    `Call ID: ${callId}`,
    `Generated: ${new Date(generatedAt).toLocaleString()}`,
    '',
  ];

  const sanitized = summary
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((rawLine) => rawLine.trim())
    .map((line) => {
      if (!line) return '';
      if (line.startsWith('- ')) return `• ${line.slice(2)}`;
      if (line.startsWith('* ')) return `• ${line.slice(2)}`;
      if (line.startsWith('•')) return line;
      if (/^\d+\./.test(line)) return line;
      return line.replace(/\*\*/g, '');
    });

  return [...header, ...sanitized];
};

const wrapText = (
  text: string,
  maxWidth: number,
  font: PDFFont,
  fontSize: number,
) => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach((word) => {
    const tentative = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(tentative, fontSize);
    if (width <= maxWidth) {
      currentLine = tentative;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });

  if (currentLine) lines.push(currentLine);
  if (lines.length === 0) lines.push('');

  return lines;
};
