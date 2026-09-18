'use client';

import type { ProctoringEvent, ProctoringSeverity } from '@/types/proctoring';
import { Camera, CameraOff, ScanFace } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ProctoringStatus } from './ProctoringStatus';

type Props = {
  active: boolean;
  onEvent: (event: ProctoringEvent) => void;
  onReady?: () => void;
  onError?: () => void;
};
type FaceLandmarkerInstance = {
  detectForVideo: (
    video: HTMLVideoElement,
    timestamp: number,
  ) => { faceLandmarks: Array<Array<{ x: number; y: number; z: number }>> };
  close: () => void;
};

const HOLD_MS = 2500;
const COOLDOWN_MS = 12000;

export function WebcamMonitor({ active, onEvent, onReady, onError }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<FaceLandmarkerInstance | null>(null);
  const timersRef = useRef<Record<string, number>>({});
  const lastLoggedRef = useRef<Record<string, number>>({});
  const baselineRef = useRef<{ x: number; y: number; width: number } | null>(
    null,
  );
  const intervalRef = useRef<number | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'active' | 'error'>(
    'idle',
  );
  const [error, setError] = useState('');
  const [faceCount, setFaceCount] = useState(0);

  const record = useCallback(
    (
      type: string,
      description: string,
      severity: ProctoringSeverity,
      duration?: number,
    ) => {
      const now = Date.now();
      if (now - (lastLoggedRef.current[type] ?? 0) < COOLDOWN_MS) return;
      lastLoggedRef.current[type] = now;
      onEvent({
        id: crypto.randomUUID(),
        examineeId: 'examinee-demo-001',
        examId: 'cert-csp-2026',
        type,
        description,
        severity,
        duration,
        timestamp: new Date(),
        reviewed: false,
      });
    },
    [onEvent],
  );

  const sustain = useCallback(
    (
      key: string,
      condition: boolean,
      description: string,
      severity: ProctoringSeverity,
    ) => {
      const now = Date.now();
      if (!condition) {
        delete timersRef.current[key];
        return;
      }
      timersRef.current[key] ??= now;
      if (now - timersRef.current[key] >= HOLD_MS) {
        record(
          key,
          description,
          severity,
          Math.round((now - timersRef.current[key]) / 1000),
        );
      }
    },
    [record],
  );

  useEffect(() => {
    const visibility = () => {
      if (status === 'active' && document.hidden)
        record(
          'Page focus lost',
          'Exam page lost focus or became hidden.',
          'warning',
        );
    };
    const blur = () => {
      if (status === 'active' && !document.hidden)
        record('Window focus lost', 'Exam window lost focus.', 'warning');
    };
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('blur', blur);
    return () => {
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('blur', blur);
    };
  }, [status, record]);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      if (!active) return;
      setStatus('loading');
      setError('');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        const vision = await import('@mediapipe/tasks-vision');
        // Keep the runtime assets aligned with the installed package version. A
        // version mismatch here allows the camera to open but prevents analysis.
        const files = await vision.FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm',
        );
        const options = {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          },
          runningMode: 'VIDEO' as const,
          numFaces: 3,
          minFaceDetectionConfidence: 0.55,
          minTrackingConfidence: 0.55,
        };
        try {
          detectorRef.current = (await vision.FaceLandmarker.createFromOptions(
            files,
            {
              ...options,
              baseOptions: { ...options.baseOptions, delegate: 'GPU' },
            },
          )) as FaceLandmarkerInstance;
        } catch {
          // WebGL/GPU delegates are unavailable on some browsers and VMs.
          detectorRef.current = (await vision.FaceLandmarker.createFromOptions(
            files,
            {
              ...options,
              baseOptions: { ...options.baseOptions, delegate: 'CPU' },
            },
          )) as FaceLandmarkerInstance;
        }
        setStatus('active');
        onReady?.();
        intervalRef.current = window.setInterval(() => {
          const video = videoRef.current;
          if (!video || video.readyState < 2 || !detectorRef.current) return;
          const faces = detectorRef.current.detectForVideo(
            video,
            performance.now(),
          ).faceLandmarks;
          setFaceCount(faces.length);
          sustain(
            'No face detected',
            faces.length === 0,
            'Your face was not clearly visible for several seconds.',
            'high',
          );
          sustain(
            'Multiple faces detected',
            faces.length > 1,
            'More than one face was visible in the camera frame.',
            'high',
          );
          if (faces.length !== 1) return;
          const face = faces[0];
          const xs = face.map((p) => p.x),
            ys = face.map((p) => p.y);
          const box = {
            x: (Math.min(...xs) + Math.max(...xs)) / 2,
            y: (Math.min(...ys) + Math.max(...ys)) / 2,
            width: Math.max(...xs) - Math.min(...xs),
          };
          baselineRef.current ??= box;
          const base = baselineRef.current;
          const nose = face[1],
            leftEye = face[33],
            rightEye = face[263];
          const eyeMid = (leftEye.x + rightEye.x) / 2;
          const yaw =
            (nose.x - eyeMid) /
            Math.max(0.01, Math.abs(rightEye.x - leftEye.x));
          const pitch =
            (nose.y - (leftEye.y + rightEye.y) / 2) / Math.max(0.01, box.width);
          sustain(
            'Looking left',
            yaw < -0.16,
            'Sustained head position indicated attention to the left.',
            'warning',
          );
          sustain(
            'Looking right',
            yaw > 0.16,
            'Sustained head position indicated attention to the right.',
            'warning',
          );
          sustain(
            'Looking up',
            pitch < 0.22,
            'Sustained head position indicated attention above the screen.',
            'warning',
          );
          sustain(
            'Looking down',
            pitch > 0.38,
            'Sustained head position indicated attention below the screen.',
            'warning',
          );
          sustain(
            'Large posture change',
            Math.abs(box.x - base.x) > 0.18 ||
              Math.abs(box.y - base.y) > 0.16 ||
              box.width < base.width * 0.55,
            'A sustained large change in position was observed.',
            'warning',
          );
        }, 500);
      } catch (cause) {
        const message =
          cause instanceof DOMException && cause.name === 'NotAllowedError'
            ? 'Camera permission was denied. Allow camera access, then try again.'
            : 'Local face analysis could not load. Check your connection, disable content blocking for this page, then retry.';
        setError(message);
        setStatus('error');
        onError?.();
        record('Camera unavailable', message, 'high');
      }
    }
    void start();
    return () => {
      cancelled = true;
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      detectorRef.current?.close();
      detectorRef.current = null;
      streamRef.current = null;
      baselineRef.current = null;
      timersRef.current = {};
      if (!active) setStatus('idle');
    };
  }, [active, onError, onReady, record, sustain]);

  return (
    <section>
      <div className="relative aspect-[4/3] overflow-hidden bg-[#0d202a]">
        <video
          ref={videoRef}
          muted
          playsInline
          className={`h-full w-full scale-x-[-1] object-cover ${status === 'active' ? 'opacity-100' : 'opacity-25'}`}
        />
        {status !== 'active' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
            {status === 'error' ? (
              <CameraOff className="mb-3 h-9 w-9" />
            ) : (
              <Camera className="mb-3 h-9 w-9" />
            )}
            <p className="text-xs">
              {status === 'loading'
                ? 'Preparing secure camera…'
                : status === 'error'
                  ? 'Camera access required'
                  : 'Camera preview'}
            </p>
          </div>
        )}{' '}
        {status === 'active' && (
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-slate-950/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
            Live · {faceCount === 1 ? 'Face in frame' : `${faceCount} faces`}
          </div>
        )}
        <div className="pointer-events-none absolute inset-[12%] rounded-[30%] border border-white/20">
          <span className="absolute -left-px -top-px h-7 w-7 rounded-tl-xl border-l-2 border-t-2 border-green-400" />
          <span className="absolute -bottom-px -right-px h-7 w-7 rounded-br-xl border-b-2 border-r-2 border-green-400" />
        </div>
      </div>
      <div className="p-5">
        <ProctoringStatus
          active={status === 'active'}
          loading={status === 'loading'}
          error={error}
        />
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] leading-4 text-slate-500">
          <ScanFace className="h-4 w-4 shrink-0 text-[#105C2E]" />
          No video is recorded or uploaded. Events are flagged for human review.
        </div>
      </div>
    </section>
  );
}
