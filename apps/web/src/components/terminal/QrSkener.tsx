'use client';

import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface QrSkenerProps {
  onOcitano: (sadrzaj: string) => void;
  onZatvori: () => void;
}

export function QrSkener({ onOcitano, onZatvori }: QrSkenerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number>(0);
  const ocitanoRef = useRef(false);
  const [greska, setGreska] = useState<string | null>(null);

  useEffect(() => {
    let otkazano = false;

    function petlja() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || ocitanoRef.current) {
        frameRef.current = requestAnimationFrame(petlja);
        return;
      }
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx && canvas.width > 0 && canvas.height > 0) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const slika = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const kod = jsQR(slika.data, slika.width, slika.height);
          if (kod?.data) {
            ocitanoRef.current = true;
            onOcitano(kod.data);
            return;
          }
        }
      }
      frameRef.current = requestAnimationFrame(petlja);
    }

    async function pokreni() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (otkazano) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        petlja();
      } catch {
        if (!otkazano) {
          setGreska('Kamera nije dostupna — dozvolite pristup ili koristite NFC/ručni izbor.');
        }
      }
    }

    pokreni();
    return () => {
      otkazano = true;
      cancelAnimationFrame(frameRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-sm aspect-square rounded-3xl overflow-hidden neu-inset">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />
        {greska && (
          <div className="absolute inset-0 flex items-center justify-center p-6 bg-[var(--color-bg)]/95">
            <p className="text-sm text-center status-critical">{greska}</p>
          </div>
        )}
        {!greska && (
          <div className="pointer-events-none absolute inset-6 rounded-2xl border-2 border-white/60" />
        )}
      </div>
      <Button variant="raised" onClick={onZatvori} className="flex items-center gap-2">
        <X size={16} /> Otkaži
      </Button>
    </div>
  );
}
