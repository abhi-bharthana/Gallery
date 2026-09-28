// src/components/Vault/FaceScanModal.tsx
import { useEffect, useRef, useState, useCallback } from 'react';
import { loadFaceModels, getFaceEmbedding } from '../../utils/faceAuth';
import { Camera, AlertCircle, Loader2, X, ScanFace, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';

interface FaceScanModalProps {
  onCaptured: (descriptor: number[]) => void;
  onClose: () => void;
  onUsePin?: () => void; // 🔥 NAYA PROP: Seedha PIN par shift hone ke liye
  mode: 'register' | 'verify';
}

export default function FaceScanModal({ onCaptured, onClose, onUsePin, mode }: FaceScanModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState('Loading AI Face Models...');
  const [error, setError] = useState('');

  // 🔥 AUTO-SCAN LOGIC FOR VERIFICATION
  const startAutoScan = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    intervalRef.current = setInterval(async () => {
      if (!videoRef.current) return;
      try {
        const descriptor = await getFaceEmbedding(videoRef.current);
        if (descriptor) {
          if (intervalRef.current) clearInterval(intervalRef.current); // Stop scanning once found
          onCaptured(Array.from(descriptor));
        }
      } catch (err) {
        console.error("Scanning frame error", err);
      }
    }, 800); // Har 800ms mein chup chap check karega
  }, [onCaptured]);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        await loadFaceModels();
        if (!isMounted) return;
        
        setStatusText(mode === 'register' ? 'Starting Camera...' : 'Authenticating...');
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        
        if (!isMounted) {
          mediaStream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        
        setLoading(false);
        setStatusText(mode === 'register' ? 'Position your face in the circle & click Capture' : 'Scanning Face ID...');

        // Verify mode hai toh auto-scan start kar do
        if (mode === 'verify') {
          setTimeout(startAutoScan, 1000); // Camera ready hone ke baad shuru karo
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError('Camera permission denied.');
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      isMounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [mode, startAutoScan]);

  const handleManualCapture = async () => {
    if (!videoRef.current) return;
    setLoading(true);
    setStatusText('Analyzing face geometry...');
    try {
      const descriptor = await getFaceEmbedding(videoRef.current);
      if (descriptor) {
        onCaptured(Array.from(descriptor));
      } else {
        setError('No face detected. Look directly at the camera.');
        setLoading(false);
      }
    } catch (err) {
      setError('Face scanning failed.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className={`bg-[#121214] border border-white/10 rounded-[2.5rem] p-8 w-full ${mode === 'verify' ? 'max-w-sm' : 'max-w-md'} shadow-2xl relative text-center text-white`}
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5 transition-colors">
          <X size={20} />
        </button>

        {mode === 'register' && (
          <h2 className="text-2xl font-bold mb-2">Setup AI Face Lock</h2>
        )}

        {error && (
          <div className="mb-4 mt-2 flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-400 text-sm">
            <AlertCircle size={16} /><span>{error}</span>
          </div>
        )}

        {/* 🔥 DYNAMIC UI SWITCH */}
        {mode === 'register' ? (
          
          /* --- SETUP UI: CIRCULAR CAMERA --- */
          <div className="mt-6 mb-8">
            <div className="relative w-56 h-56 mx-auto rounded-full overflow-hidden border-4 border-purple-500/30 shadow-[0_0_40px_rgba(168,85,247,0.2)] bg-black">
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover -scale-x-100" />
              
              {/* Sci-Fi Scanning Line Animation */}
              {!loading && (
                <motion.div 
                  animate={{ top: ['-10%', '110%', '-10%'] }} 
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} 
                  className="absolute left-0 right-0 h-1.5 bg-purple-400/80 shadow-[0_0_20px_rgba(168,85,247,1)] blur-[1px]" 
                />
              )}

              {loading && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                  <Loader2 size={32} className="animate-spin text-purple-500" />
                </div>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-6">{statusText}</p>
          </div>

        ) : (

          /* --- VERIFY UI: HIDDEN CAMERA, FACE ID ICON --- */
          <div className="flex flex-col items-center justify-center py-8">
            
            {/* HIDDEN VIDEO: Pura gayab hai par background me record kar raha hai */}
            <video ref={videoRef} autoPlay muted playsInline className="absolute opacity-0 pointer-events-none w-1 h-1 -z-10" />
            
            <motion.div 
              animate={{ scale: [1, 1.05, 1] }} 
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} 
              className="p-6 bg-purple-500/10 rounded-[2rem] border border-purple-500/20 text-purple-400 shadow-[0_0_40px_rgba(168,85,247,0.15)] mb-6"
            >
              <ScanFace size={64} strokeWidth={1.2} />
            </motion.div>
            
            <h2 className="text-xl font-bold tracking-wide">Face ID</h2>
            <p className="text-sm text-gray-400 mt-2 animate-pulse">{statusText}</p>
          </div>
        )}

        {/* --- BOTTOM BUTTONS --- */}
        <div className="flex flex-col gap-3">
          {mode === 'register' && (
            <button 
              onClick={handleManualCapture} disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white py-3.5 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Camera size={18} /> Capture Face
            </button>
          )}

          {mode === 'verify' && onUsePin && (
            <button 
              onClick={onUsePin}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3.5 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2"
            >
              <KeyRound size={18} className="text-purple-400" /> Use PIN
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}