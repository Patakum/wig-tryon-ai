'use client';

import { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/src/components/ui/button';

// ─── Constants ────────────────────────────────────────────────────────────────

const MODEL_URI = '/models';
const SCORE_THRESHOLD = 0.5;
const DETECTION_INTERVAL_MS = 250;
const CAMERA_READY_POLL_MS = 300;

const OVAL = {
  widthRatio: 0.28,
  heightRatio: 0.42,
  centerThreshold: 0.6, // normalised ellipse distance²; < 1 means inside
} as const;

const VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  facingMode: 'user',
  width: 640,
  height: 480,
};

// ─── Types ────────────────────────────────────────────────────────────────────

type FaceStatus = 'loading' | 'no-face' | 'align' | 'valid';

// ─── UI copy ──────────────────────────────────────────────────────────────────

const STATUS_MESSAGE: Record<FaceStatus, string> = {
  loading: 'מאתחל מצלמה...',
  'no-face': 'לא זוהו פנים — כוון את הפנים אל המעגל',
  align: 'קרב את הפנים למרכז המעגל',
  valid: '✓ מושלם! לחץ לצילום',
};

const STATUS_COLOR: Record<FaceStatus, string> = {
  loading: '#94a3b8',
  'no-face': '#ef4444',
  align: '#ef4444',
  valid: '#22c55e',
};

const PHOTO_RULES = [
  'פנים גלויות וברורות',
  'תאורה טובה (ללא צללים)',
  'הביטו ישר למצלמה',
  'ללא כובע או משקפי שמש',
] as const;

// ─── Canvas helpers ───────────────────────────────────────────────────────────

function drawOvalOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string,
) {
  const cx = width / 2;
  const cy = height / 2;
  const rx = width * OVAL.widthRatio;
  const ry = height * OVAL.heightRatio;

  // Dim the area outside the oval
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Coloured border ring
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.stroke();
}

function isFaceCentered(
  box: { x: number; y: number; width: number; height: number },
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
): boolean {
  const scaleX = canvas.width / video.videoWidth;
  const scaleY = canvas.height / video.videoHeight;

  // Mirror X to match the CSS-flipped video display
  const faceCx = canvas.width - (box.x + box.width / 2) * scaleX;
  const faceCy = (box.y + box.height / 2) * scaleY;

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const rx = canvas.width * OVAL.widthRatio;
  const ry = canvas.height * OVAL.heightRatio;

  return (
    Math.pow((faceCx - cx) / rx, 2) + Math.pow((faceCy - cy) / ry, 2) <
    OVAL.centerThreshold
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

type FaceCaptureProps = {
  onCapture: (file: File) => void;
};

export default function FaceCapture({ onCapture }: FaceCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<FaceStatus>('loading');
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    let active = true;
    let timeoutId: ReturnType<typeof setTimeout>;
    let faceapi: typeof import('face-api.js') | null = null;

    const runDetection = async () => {
      if (!active) return;

      const video = webcamRef.current?.video;
      const canvas = canvasRef.current;

      if (
        !video ||
        !canvas ||
        video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA
      ) {
        timeoutId = setTimeout(runDetection, CAMERA_READY_POLL_MS);
        return;
      }

      try {
        if (!faceapi) {
          faceapi = await import('face-api.js');
          if (!faceapi.nets.tinyFaceDetector.isLoaded) {
            await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URI);
          }
        }

        const detections = await faceapi.detectAllFaces(
          video,
          new faceapi.TinyFaceDetectorOptions({
            scoreThreshold: SCORE_THRESHOLD,
          }),
        );

        if (!active) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const nextStatus: FaceStatus =
          detections.length === 0
            ? 'no-face'
            : isFaceCentered(detections[0].box, canvas, video)
              ? 'valid'
              : 'align';

        drawOvalOverlay(
          ctx,
          canvas.width,
          canvas.height,
          STATUS_COLOR[nextStatus],
        );
        setStatus(nextStatus);
      } catch {
        // Fail silently — detection errors must not disrupt the user flow
      }

      if (active) timeoutId = setTimeout(runDetection, DETECTION_INTERVAL_MS);
    };

    runDetection();
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const handleCapture = async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) return;

    setCapturing(true);
    const blob = await fetch(imageSrc).then((r) => r.blob());
    onCapture(new File([blob], 'selfie.jpg', { type: 'image/jpeg' }));
    setCapturing(false);
  };

  return (
    <div className="w-full space-y-3">
      {/* Camera feed with oval overlay */}
      <div className="relative overflow-hidden rounded">
        <Webcam
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={VIDEO_CONSTRAINTS}
          className="w-full transform-[scaleX(-1)]"
        />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
      </div>

      {/* Live alignment status */}
      <p
        className={`text-center text-sm font-medium ${
          status === 'valid' ? 'text-green-600' : 'text-destructive'
        }`}
      >
        {STATUS_MESSAGE[status]}
      </p>

      {/* Photo quality rules */}
      <ul className="space-y-1.5 rounded-lg border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
        {PHOTO_RULES.map((rule) => (
          <li key={rule} className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
            {rule}
          </li>
        ))}
      </ul>

      {/* Capture button */}
      <Button
        onClick={handleCapture}
        disabled={status !== 'valid' || capturing}
        size="lg"
        className="w-full"
      >
        {capturing ? 'שומר...' : 'צלם סלפי'}
      </Button>
    </div>
  );
}
