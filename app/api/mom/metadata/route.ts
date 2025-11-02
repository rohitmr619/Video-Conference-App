import { NextResponse } from 'next/server';
import { ensureStorage, readMomMetadata } from '@/lib/storage';

export const runtime = 'nodejs';

export async function GET() {
  await ensureStorage();
  const metadata = await readMomMetadata();
  return NextResponse.json(metadata);
}

