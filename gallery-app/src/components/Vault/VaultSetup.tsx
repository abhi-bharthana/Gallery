// src/components/Vault/VaultSetup.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, Lock, HelpCircle, CheckCircle2, ChevronRight, 
  KeyRound, Copy, Download, Camera, Hash, ShieldCheck
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import FaceScanModal from './FaceScanModal';

const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "In what city were you born?",
  "What is your mother's maiden name?",
  "What was your childhood nickname?",
  "What is the name of your favorite childhood friend?"
];

const AUTH_POLICIES = [
  { id: 'face_or_pin', label: 'Face OR PIN (Recommended)' },
  { id: 'pin_only', label: '6-Digit PIN Only' },
  { id: 'face_and_pin', label: 'Face + PIN (High Security)' },
  { id: 'face_and_password', label: 'Face + Password (Max Security)' },
  { id: 'password_only', label: 'Master Password Only' },
];

export default function VaultSetup({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);
  
  // Credentials
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  
  // Q&A
  const [q1, setQ1] = useState(SECURITY_QUESTIONS[0]);
  const [a1, setA1] = useState('');
  const [q2, setQ2] = useState(SECURITY_QUESTIONS[1]);
  const [a2, setA2] = useState('');
  const [q3, setQ3] = useState(SECURITY_QUESTIONS[2]);
  const [a3, setA3] = useState('');

  // Security & Biometrics
  const [recoveryKey, setRecoveryKey] = useState('');
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);
  const [isFaceScanning, setIsFaceScanning] = useState(false);
  const [authPolicy, setAuthPolicy] = useState(AUTH_POLICIES[0].id);

  useEffect(() => {
    const generateKey = () => {
      const segment = () => Math.random().toString(36).substring(2, 6).toUpperCase();
      return `AUM-${segment()}-${segment()}-${segment()}`;
    };
    setRecoveryKey(generateKey());
  }, []);

  const handleCreateVault = async () => {
    try {
      // 🔥 Backend mein PIN aur Auth Policy bhi bhej rahe hain
      await invoke('setup_secure_vault', { 
        password, 
        q1, a1: a1.toLowerCase(), 
        q2, a2: a2.toLowerCase(), 
        q3, a3: a3.toLowerCase(),
        recoveryKey,
        enableWindowsHello: false,
        faceDescriptor,
        pin,            // 🔥 6-Digit PIN
        authPolicy      // 🔥 Policy Rule
      });
      onComplete();
    } catch (e) {
      console.error("Vault setup failed:", e);
    }
  };

  const downloadKey = () => {
    const element = document.createElement("a");
    const file = new Blob([`Auvem Vault Recovery Key\n\nKEEP THIS SAFE. IF YOU LOSE YOUR PASSWORD, THIS IS YOUR ONLY WAY IN.\n\nKey: ${recoveryKey}`], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "Auvem_Recovery_Key.txt";
    document.body.appendChild(element);
    element.click();
  };

  const isStep1Valid = password && password === confirmPassword && pin.length === 6 && pin === confirmPin;

  return (
    <div className="flex flex-col items-center justify-center max-w-2xl mx-auto h-full text-white/90">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-[#121214] border border-white/10 rounded-[2rem] p-10 w-full shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-red-500" />
        
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-red-500/10 rounded-full text-red-500">
            <ShieldAlert size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-wide">Secure Vault Setup</h2>
            <p className="text-sm text-gray-400">Step {step} of 3: {step === 1 ? 'Primary Credentials' : step === 2 ? 'Security Questions' : 'Policies & Biometrics'}</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          
          {/* --- STEP 1: CREDENTIALS (PASSWORD & PIN) --- */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-medium text-gray-400 ml-1">Master Password (For deep recovery)</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input 
                      type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:border-purple-500 transition-colors"
                      placeholder="Strong Password"
                    />
                  </div>
                </div>

                <div className="space-y-2 col-span-2">
                  <div className="relative">
                    <CheckCircle2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input 
                      type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:border-purple-500 transition-colors"
                      placeholder="Confirm Password"
                    />
                  </div>
                </div>

                <div className="space-y-2 col-span-1 mt-2">
                  <label className="text-sm font-medium text-gray-400 ml-1">6-Digit PIN (Quick Access)</label>
                  <div className="relative">
                    <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input 
                      type="password" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white font-mono tracking-widest focus:border-purple-500 transition-colors"
                      placeholder="000000"
                    />
                  </div>
                </div>

                <div className="space-y-2 col-span-1 mt-2">
                  <label className="text-sm font-medium text-gray-400 ml-1 text-transparent select-none">.</label>
                  <div className="relative">
                    <CheckCircle2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input 
                      type="password" maxLength={6} value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white font-mono tracking-widest focus:border-purple-500 transition-colors"
                      placeholder="Confirm PIN"
                    />
                  </div>
                </div>
              </div>

              <button 
                disabled={!isStep1Valid}
                onClick={() => setStep(2)}
                className="w-full mt-4 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:bg-white/5 disabled:text-gray-500 text-white py-4 rounded-2xl font-bold transition-all"
              >
                Next: Security Questions <ChevronRight size={18} />
              </button>
            </motion.div>
          )}

          {/* --- STEP 2: SECURITY QUESTIONS --- */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <p className="text-sm text-red-400 mb-6 bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                If you forget your password and PIN, these questions are your backup.
              </p>

              {[
                { q: q1, setQ: setQ1, a: a1, setA: setA1 },
                { q: q2, setQ: setQ2, a: a2, setA: setA2 },
                { q: q3, setQ: setQ3, a: a3, setA: setA3 }
              ].map((item, idx) => (
                <div key={idx} className="space-y-3 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                  <select 
                    value={item.q} onChange={(e) => item.setQ(e.target.value)}
                    className="w-full bg-transparent text-sm text-gray-300 focus:outline-none cursor-pointer"
                  >
                    {SECURITY_QUESTIONS.map(q => <option key={q} value={q} className="bg-zinc-900">{q}</option>)}
                  </select>
                  <div className="relative">
                    <HelpCircle size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                    <input 
                      type="text" value={item.a} onChange={(e) => item.setA(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:border-red-500 transition-colors"
                      placeholder="Your answer"
                    />
                  </div>
                </div>
              ))}

              <div className="flex gap-4 mt-4">
                <button onClick={() => setStep(1)} className="px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all">Back</button>
                <button 
                  disabled={!a1 || !a2 || !a3}
                  onClick={() => setStep(3)}
                  className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:bg-white/5 disabled:text-gray-500 text-white py-4 rounded-2xl font-bold transition-all"
                >
                  Next: Final Setup <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {/* --- STEP 3: BIOMETRICS, POLICY & RECOVERY --- */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              
              <div className="bg-white/5 p-5 rounded-2xl border border-white/10 relative">
                <div className="flex items-center gap-2 mb-3 text-yellow-400">
                  <KeyRound size={18} />
                  <h3 className="font-bold text-sm">Master Recovery Key</h3>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                  Ultimate bypass key. <b>It will only be shown once. Download it.</b>
                </p>
                <div className="flex items-center justify-between bg-black/50 p-3.5 rounded-xl font-mono text-lg tracking-wider text-white border border-white/10">
                  {recoveryKey}
                  <div className="flex gap-2">
                    <button onClick={() => navigator.clipboard.writeText(recoveryKey)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"><Copy size={16} /></button>
                    <button onClick={downloadKey} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"><Download size={16} /></button>
                  </div>
                </div>
              </div>

              {/* Security Policy Dropdown */}
              <div className="bg-white/[0.02] border border-white/10 p-5 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck size={18} className="text-purple-400" />
                  <h3 className="font-bold text-sm text-white">Default Unlock Method</h3>
                </div>
                <select 
                  value={authPolicy} onChange={(e) => setAuthPolicy(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 text-sm text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  {AUTH_POLICIES.map(p => <option key={p.id} value={p.id} className="bg-zinc-900">{p.label}</option>)}
                </select>
              </div>

              {/* AI Face Setup */}
              <div className="bg-purple-500/10 border border-purple-500/20 p-5 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/20 rounded-full text-purple-400">
                    <Camera size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">AI Face Lock</h3>
                    <p className="text-xs text-purple-200/70">
                      {faceDescriptor ? "Face registered!" : "Required for Face unlock policies"}
                    </p>
                  </div>
                </div>
                <button 
                  type="button" onClick={() => setIsFaceScanning(true)}
                  className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition-all ${
                    faceDescriptor ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg'
                  }`}
                >
                  {faceDescriptor ? 'Re-scan Face' : 'Setup Face'}
                </button>
              </div>

              <div className="flex gap-4 mt-2">
                <button onClick={() => setStep(2)} className="px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all">Back</button>
                <button 
                  onClick={handleCreateVault}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white py-4 rounded-2xl font-bold transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                >
                  Initialize Secure Vault
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Face Scan Registration Modal */}
      {isFaceScanning && (
        <FaceScanModal 
          mode="register"
          onCaptured={(descriptor) => {
            setFaceDescriptor(descriptor);
            setIsFaceScanning(false);
          }}
          onClose={() => setIsFaceScanning(false)}
        />
      )}
    </div>
  );
}