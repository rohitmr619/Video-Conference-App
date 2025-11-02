'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useCall } from '@stream-io/video-react-sdk';

import type { Call } from '@stream-io/video-react-sdk';
import type { CaptionPayload } from '@/lib/storage';

type ClosedCaptionEvent = {
  closed_caption?: {
    text?: string;
    speaker_id?: string;
    start_time?: string;
    end_time?: string;
    user?: {
      id?: string;
      name?: string;
    };
  };
};

const TranscriptionManager = () => {
  const call = useCall();
  const captionsRef = useRef<CaptionPayload[]>([]);
  const hasFlushedRef = useRef(false);
  const callRef = useRef<Call | null>(null);

  useEffect(() => {
    if (!call) return;
    callRef.current = call;
    captionsRef.current = [];
    hasFlushedRef.current = false;
  }, [call]);

  const flushCaptions = useCallback(
    async (reason: string) => {
      if (hasFlushedRef.current) return;
      const activeCall = callRef.current;
      if (!activeCall) return;

      const payload = captionsRef.current;
      if (!payload.length) {
        return;
      }

      try {
        const response = await fetch('/api/transcripts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callId: activeCall.id,
            captions: payload,
            reason,
          }),
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Failed to persist captions');
        }
        hasFlushedRef.current = true;
      } catch (error) {
        console.error('Failed to persist captions', error);
      }
    },
    [],
  );

  useEffect(() => {
    if (!call) return;

    callRef.current = call;

    const handleCaption = (event: ClosedCaptionEvent) => {
      const caption = event?.closed_caption;
      if (!caption?.text) return;

      const speakerName =
        caption.user?.name ??
        caption.user?.id ??
        caption.speaker_id ??
        'Unknown speaker';

      captionsRef.current.push({
        text: caption.text,
        speakerName,
        startTime: caption.start_time,
        endTime: caption.end_time,
      });
    };

    const handleEnded = () => {
      void flushCaptions('ended');
    };

    const handleCaptionStopped = () => {
      void flushCaptions('captions-stopped');
    };

    call.on('call.closed_caption', handleCaption);
    call.on('call.ended', handleEnded);
    call.on('call.closed_captions_stopped', handleCaptionStopped);

    return () => {
      call.off('call.closed_caption', handleCaption);
      call.off('call.ended', handleEnded);
      call.off('call.closed_captions_stopped', handleCaptionStopped);
      void flushCaptions('component-unmount');
    };
  }, [call, flushCaptions]);

  return null;
};

export default TranscriptionManager;
