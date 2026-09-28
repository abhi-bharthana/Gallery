// src/components/Vault/VaultUnlock.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Camera, KeyRound, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import FaceScanModal from './FaceScanModal';
import { verifyFaceMatch } from '../../utils/faceAuth';

interface VaultUnlockProps {
  onUnlocked: () => void;
  onClose: () => void;
}

type AuthPolicy = 'password_only' | 'pin_only' | 'face_or_pin' | 'face_and_pin' | 'face_and_password';

export default function VaultUnlock({ onUnlocked, onClose }: VaultUnlockProps) {
  const [authPolicy, setAuthPolicy] = useState<AuthPolicy>('password_only');
  const [isPolicyLoading, setIsPolicyLoading] = useState(true);

  // States for different inputs
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [recoveryKey, setRecoveryKey] = useState('');
  
  // Step management for multi-factor (e.g. Face THEN Pin)
  const [currentStep, setCurrentStep] = useState<'scan' | 'pin' | 'password' | 'recovery'>('password');
  
  // Global states
  const [isFaceScanning, setIsFaceScanning] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Load Auth Policy when modal opens
  useEffect(() => {
    async function loadPolicy() {
      try {
        const policy = await invoke<string>('get_auth_policy');
        setAuthPolicy(policy as AuthPolicy);
        
        // Smart Routing Based on Policy
        if (policy.includes('face')) {
          handleOpenFaceScan(); // Auto-open camera if face is required or optional
          setCurrentStep('scan');
        } else if (policy === 'pin_only') {
          setCurrentStep('pin');
        } else {
          setCurrentStep('password');
        }
      } catch (err) {
        console.error(err);
        setAuthPolicy('password_only');
        setCurrentStep('password');
      } finally {
        setIsPolicyLoading(false);
      }
    }
    loadPolicy();
  }, []);

  // --- AUTHENTICATION HANDLERS ---

  const handleUnlockWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const isValid = await invoke<boolean>('verify_master_password', { password });
      if (isValid) onUnlocked();
      else setError('Incorrect master password.');
    } catch (err) {
      setError('Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockWithPin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin.length !== 6) { setError('PIN must be 6 digits'); return; }
    
    setLoading(true); setError('');
    try {
      const isValid = await invoke<boolean>('verify_vault_pin', { pin });
      if (isValid) onUnlocked();
      else setError('Incorrect PIN.');
    } catch (err) {
      setError('Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFaceScan = async () => {
    setError(''); setLoading(true);
    try {
      const storedDescriptor = await invoke<number[] | null>('get_vault_face_descriptor');
      setLoading(false);
      if (!storedDescriptor) {
        setError('No face profile found. Please fallback to PIN/Password.');
        setCurrentStep(authPolicy.includes('pin') ? 'pin' : 'password');
        return;
      }
      setIsFaceScanning(true);
    } catch (err) {
      setLoading(false); setError('Failed to load camera.');
    }
  };

  const handleFaceVerify = async (liveDescriptor: number[]) => {
    setIsFaceScanning(false);
    setLoading(true); setError('');

    try {
      const storedDescriptor = await invoke<number[] | null>('get_vault_face_descriptor');
      if (!storedDescriptor) throw new Error("No face profile");

      const isMatch = verifyFaceMatch(storedDescriptor, new Float32Array(liveDescriptor));
      
      if (isMatch) {
        if (authPolicy === 'face_or_pin') {
          onUnlocked(); // Direct unlock!
        } else if (authPolicy === 'face_and_pin') {
          setLoading(false);
          setCurrentStep('pin'); // Move to Step 2
        } else if (authPolicy === 'face_and_password') {
          setLoading(false);
          setCurrentStep('password'); // Move to Step 2
        }
      } else {
        setError('Face mismatch! Access denied.');
        setLoading(false);
        // If face fails, fallback to secondary option if allowed
        if (authPolicy === 'face_or_pin') setCurrentStep('pin');
      }
    } catch (err) {
      setError('Face verification failed.');
      setLoading(false);
    }
  };

  const handleUnlockWithRecoveryKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const isValid = await invoke<boolean>('verify_recovery_key', { recoveryKey });
      if (isValid) {
        alert('Vault recovered! Please reset your policies in settings.');
        onUnlocked();
      } else setError('Invalid recovery key.');
    } catch (err) {
      setError('Recovery failed.');
    } finally {
      setLoading(false);
    }
  };


  // --- RENDER HELPERS ---
  if (isPolicyLoading) return null; // Prevent UI flash

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#121214] border border-white/10 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl relative overflow-hidden text-white"
        >
          {/* Close Button */}
          <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5 transition-colors">
            <X size={20} />
          </button>

          {/* Top Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-purple-500 to-red-500" />

          <div className="flex flex-col items-center text-center mb-8 mt-2">
            <div className="p-4 bg-purple-500/10 rounded-full text-purple-500 border border-purple-500/20 mb-4 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-2xl font-bold tracking-wide">Secure Vault</h2>
            <p className="text-sm text-gray-400 mt-1">
              {currentStep === 'recovery' ? "Enter your Master Recovery Key" : 
               currentStep === 'pin' ? "Enter 6-Digit PIN to unlock" :
               currentStep === 'scan' ? "Authenticating via Face ID..." :
               "Enter Master Password to unlock"}
            </p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center gap-2 bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl text-red-400 text-sm">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <AnimatePresence mode="wait">

            {/* --- PASSWORD VIEW --- */}
            {currentStep === 'password' && (
              <motion.form key="pwd" onSubmit={handleUnlockWithPassword} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="relative">
                  <Unlock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input 
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Master Password"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
                    autoFocus
                  />
                </div>
                <button type="submit" disabled={loading || !password} className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white py-3.5 rounded-2xl font-bold transition-all shadow-lg active:scale-95">
                  {loading ? 'Verifying...' : 'Unlock Vault'}
                </button>
              </motion.form>
            )}

            {/* --- PIN VIEW --- */}
            {currentStep === 'pin' && (
              <motion.form key="pin" onSubmit={handleUnlockWithPin} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <input 
                  type="password" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 text-white tracking-[1em] text-center font-mono focus:outline-none focus:border-purple-500 transition-colors"
                  autoFocus
                />
                <button type="submit" disabled={loading || pin.length !== 6} className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white py-3.5 rounded-2xl font-bold transition-all shadow-lg active:scale-95">
                  {loading ? 'Verifying...' : 'Unlock Vault'}
                </button>
              </motion.form>
            )}

            {/* --- RECOVERY VIEW --- */}
            {currentStep === 'recovery' && (
              <motion.form key="rec" onSubmit={handleUnlockWithRecoveryKey} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="relative">
                  <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input 
                    type="text" value={recoveryKey} onChange={(e) => setRecoveryKey(e.target.value)}
                    placeholder="AUM-XXXX-XXXX-XXXX"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white font-mono uppercase focus:outline-none focus:border-red-500 transition-colors text-sm"
                    autoFocus
                  />
                </div>
                <button type="submit" disabled={loading || !recoveryKey} className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white py-3.5 rounded-2xl font-bold transition-all shadow-lg active:scale-95">
                  {loading ? 'Recovering...' : 'Recover Vault'}
                </button>
              </motion.form>
            )}

            {/* --- SCAN FALLBACK VIEW --- */}
            {currentStep === 'scan' && (
              <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center pb-4">
                <div className="inline-flex p-4 rounded-full bg-white/5 mb-4 animate-pulse">
                  <Camera size={32} className="text-purple-400" />
                </div>
                <p className="text-sm font-semibold text-white">Looking for you...</p>
              </motion.div>
            )}

          </AnimatePresence>

          {/* --- FOOTER OPTIONS --- */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center space-y-3">
            
            {/* Show alternative options based on policy */}
            {authPolicy === 'face_or_pin' && currentStep !== 'pin' && (
               <button onClick={() => setCurrentStep('pin')} className="text-xs font-semibold text-gray-400 hover:text-white transition-colors">Use PIN Instead</button>
            )}

            {authPolicy === 'face_or_pin' && currentStep === 'pin' && (
               <button onClick={() => { setCurrentStep('scan'); handleOpenFaceScan(); }} className="text-xs font-semibold text-gray-400 hover:text-white transition-colors">Retry Face Scan</button>
            )}

            {/* Always show recovery option unless we are already in recovery */}
            {currentStep !== 'recovery' && (
              <button onClick={() => setCurrentStep('recovery')} className="block w-full text-xs text-red-400/80 hover:text-red-400 transition-colors underline underline-offset-4">
                Forgot Everything? Use Recovery Key
              </button>
            )}

            {currentStep === 'recovery' && (
              <button onClick={() => setCurrentStep(authPolicy.includes('pin') ? 'pin' : 'password')} className="block w-full text-xs text-gray-400 hover:text-white transition-colors">
                ← Back to Login
              </button>
            )}
          </div>

        </motion.div>
      </div>

      {/* 🔥 The Hidden Engine: Face Scan Verification Modal 🔥 */}
      {isFaceScanning && (
        <FaceScanModal 
          mode="verify"
          onCaptured={handleFaceVerify}
          onClose={() => {
            setIsFaceScanning(false);
            // If user closes camera manually, fallback appropriately
            if (authPolicy === 'face_or_pin') setCurrentStep('pin');
            else if (authPolicy.includes('password')) setCurrentStep('password');
            else setCurrentStep('pin'); 
          }}
          // 🔥 NAYA: Seedha PIN wale Numpad pe switch karne ke liye
          onUsePin={() => {
            setIsFaceScanning(false);
            setCurrentStep('pin');
          }}
        />
      )}
    </>
  );
}