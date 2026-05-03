'use client';

import { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Button } from '@/src/components/ui/button';

type FaceStatus = 'loading' | 'no-face' | 'align' | 'valid';

const STATUS_MESSAGE: Record<FaceStatus, string> = {
  loading: 'מאתחל מצלמה...',
  'no-face': 'לא זוהו פנים — כוון את הפנים אל המעגל',
  align: 'קרב את הפנים למרכז המעגל',
  valid: '✓ מושלם! לחץ לצילום',
};

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

      if (!video || !canvas || video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) {
        timeoutId = setTimeout(runDetection, 300);
        return;
      }

      try {
        if (!faceapi) {
          faceapi = await import('face-api.js');
          if (!faceapi.nets.tinyFaceDetector.isLoaded) {
            await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
          }
        }

        const detections = await faceapi.detectAllFaces(
          video,
          new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 }),
        );

        if (!active) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const rx = canvas.width * 0.28;
        const ry = canvas.height * 0.42;

        let faceInCircle = false;
        if (detections.length === 1) {
          const { box } = detections[0];
          const scaleX = canvas.width / video.videoWidth;
          const scaleY = canvas.height / video.videoHeight;
          // Mirror X to match the CSS-flipped video display
          const fcx = canvas.width - (box.x + box.width / 2) * scaleX;
          const fcy = (box.y + box.height / 2) * scaleY;
          faceInCircle =
            Math.pow((fcx - cx) / rx, 2) + Math.pow((fcy - cy) / ry, 2) < 0.6;
        }

        const nextStatus: FaceStatus =
          detections.length === 0 ? 'no-face' : faceInCircle ? 'valid' : 'align';

        const color = nextStatus === 'valid' ? '#22c55e' : '#ef4444';

        // Dim outside the oval
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Colored border on top
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.stroke();

        setStatus(nextStatus);
      } catch {
        // fail silently, keep looping
      }

      if (active) timeoutId = setTimeout(runDetection, 250);
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
    const res = await fetch(imageSrc);
    const blob = await res.blob();
    const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
    onCapture(file);
    setCapturing(false);
  };

  return (
    <div className="w-full space-y-2">
      <div className="relative overflow-hidden rounded">
        <Webcam
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: 'user', width: 640, height: 480 }}
          className="w-full transform-[scaleX(-1)]"
        />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
      </div>

      <p
        className={`text-center text-sm font-medium ${
          status === 'valid' ? 'text-green-600' : 'text-destructive'
        }`}
      >
        {STATUS_MESSAGE[status]}
      </p>

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
