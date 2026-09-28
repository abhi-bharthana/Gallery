// src/components/Vault/FaceScanModal.tsx
import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, AlertCircle, Loader2, X, ScanFace, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';
import FaceWorker from '../../workers/faceWorker?worker'; // Vite Worker Import

interface FaceScanModalProps {
  onCaptured: (descriptor: number[]) => void;
  onClose: () => void;
  onUsePin?: () => void;
  mode: 'register' | 'verify';
}

const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';

export default function FaceScanModal({ onCaptured, onClose, onUsePin, mode }: FaceScanModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState('Loading AI Face Models in Background...');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false); // Anti-spam lock

  // Video frame nikal kar worker ko bhejna
  const detectFace = useCallback(() => {
    if (!videoRef.current || !workerRef.current || isProcessing) return;
    
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    setIsProcessing(true); // Jab tak worker reply na de, naya frame mat bhejo

    // Memory me canvas banakar frame extract karna
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      // Data background thread (worker) ko bhej diya
      workerRef.current.postMessage({ type: 'DETECT', payload: { imageData } });
    } else {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  // AUTO-SCAN LOGIC FOR VERIFICATION
  const startAutoScan = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      detectFace();
    }, 800);
  }, [detectFace]);

  useEffect(() => {
    let isMounted = true;
    
    // 1. Worker Initialize karo
    workerRef.current = new FaceWorker();
    workerRef.current.postMessage({ type: 'INIT', payload: { modelUrl: MODEL_URL } });

    // 2. Worker ke messages suno
    workerRef.current.onmessage = async (e) => {
      if (!isMounted) return;
      const { type, descriptor, message } = e.data;

      if (type === 'READY') {
        setStatusText(mode === 'register' ? 'Starting Camera...' : 'Authenticating...');
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
          if (!isMounted) {
            mediaStream.getTracks().forEach(track => track.stop());
            return;
          }
          
          streamRef.current = mediaStream;
          if (videoRef.current) videoRef.current.srcObject = mediaStream;
          
          setLoading(false);
          setStatusText(mode === 'register' ? 'Position your face in the circle & click Capture' : 'Scanning Face ID...');

          if (mode === 'verify') {
            setTimeout(startAutoScan, 1000); 
          }
        } catch (err) {
          setError('Camera permission denied.');
          setLoading(false);
        }
      }

      if (type === 'RESULT') {
        setIsProcessing(false); // Naye frame ke liye lock khol do
        if (descriptor) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onCaptured(descriptor); // Face mil gaya!
        } else if (mode === 'register' && statusText === 'Analyzing face geometry...') {
          setError('No face detected. Look directly at the camera.');
          setLoading(false);
          setStatusText('Position your face in the circle & click Capture');
        }
      }

      if (type === 'ERROR') {
        setIsProcessing(false);
        setError(message);
        setLoading(false);
      }
    };

    return () => {
      isMounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
      // RAM free karne ke liye worker ko marna zaroori hai
      workerRef.current?.terminate(); 
    };
  }, [mode, startAutoScan, onCaptured, statusText]);

  const handleManualCapture = () => {
    if (!videoRef.current || isProcessing) return;
    setLoading(true);
    setStatusText('Analyzing face geometry...');
    setError('');
    detectFace(); // Worker ko signal jayega, result 'onmessage' mein catch hoga
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

        {/* DYNAMIC UI SWITCH */}
        {mode === 'register' ? (
          
          /* --- SETUP UI: CIRCULAR CAMERA --- */
          <div className="mt-6 mb-8">
            <div className="relative w-56 h-56 mx-auto rounded-full overflow-hidden border-4 border-purple-500/30 shadow-[0_0_40px_rgba(168,85,247,0.2)] bg-black">
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover -scale-x-100" />
              
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