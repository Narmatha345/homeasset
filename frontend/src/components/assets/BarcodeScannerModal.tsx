import { useEffect, useRef, useState } from "react";
import { CameraOff, ScanLine } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

interface BarcodeScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScan: (text: string) => void;
}

/**
 * Browser-based QR/barcode scanner using @zxing/browser (pure JS, getUserMedia-based — works
 * over HTTPS or localhost, no native app or plugin required). Appliance stickers rarely encode
 * more than an identifier, so a successful scan only ever fills in the Serial Number — never
 * assumed model/manufacturer data — and the user can always fall back to typing it in manually.
 */
export function BarcodeScannerModal({ open, onClose, onScan }: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [error, setError] = useState<string>("");
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setError("");
    setStarting(true);

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("This browser doesn't support camera scanning.");
        setStarting(false);
        return;
      }
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current ?? undefined, (result, err) => {
          if (cancelled) return;
          if (result) {
            controlsRef.current?.stop();
            onScan(result.getText());
          }
          // NotFoundException fires continuously while no code is in view — not a real error.
          void err;
        });
        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
        setStarting(false);
      } catch {
        if (!cancelled) {
          setError("Camera access isn't available. You can enter the details manually.");
          setStarting(false);
        }
      }
    }

    start();
    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [open, onScan]);

  return (
    <Modal open={open} onClose={onClose} title="Scan QR / Barcode" description="Point the camera at the appliance's sticker." size="sm">
      <div className="space-y-4">
        {error ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 py-10 px-4 text-center">
            <CameraOff className="h-8 w-8 text-slate-400" />
            <p className="text-sm text-slate-600">{error}</p>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-lg bg-slate-900 aspect-video">
            <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
            {starting && (
              <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-sm gap-2">
                <ScanLine className="h-4 w-4 animate-pulse" /> Starting camera...
              </div>
            )}
          </div>
        )}
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Enter Manually
          </Button>
        </div>
      </div>
    </Modal>
  );
}
