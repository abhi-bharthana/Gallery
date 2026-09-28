// src/components/Vault/VaultManager.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Camera, Lock, Unlock, FileUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import FaceScanModal from './FaceScanModal';

interface VaultManagerProps {
  onLockVault: () => void;
}

export default function VaultManager({ onLockVault }: VaultManagerProps) {
  const [hasFaceProfile, setHasFaceProfile] = useState(false);
  const [isFaceScanning, setIsFaceScanning] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if face profile is already registered
  useEffect(() => {
    checkFaceStatus();
  }, []);

  const checkFaceStatus = async () => {
    try {
      const descriptor = await invoke<number[] | null>('get_vault_face_descriptor');
      setHasFaceProfile(!!descriptor && descriptor.length > 0);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Face Registration / Update
  const handleFaceRegistered = async (descriptor: number[]) => {
    setIsFaceScanning(false);
    setLoading(true);
    setError('');

    try {
      await invoke('update_vault_face_descriptor', { faceDescriptor: descriptor });
      setHasFaceProfile(true);
      setStatusMessage('AI Face Lock successfully registered/updated!');
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err) {
      console.error(err);
      setError('Failed to save face profile to vault.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 text-white space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-[#121214] border border-white/10 p-6 rounded-[2rem] shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-green-500/10 text-green-400 rounded-2xl border border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-wide">Secure Vault Unlocked</h1>
            <p className="text-sm text-gray-400">Military-grade AES-256 encrypted storage active</p>
          </div>
        </div>

        <button 
          onClick={onLockVault}
          className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 px-5 py-3 rounded-2xl font-bold transition-all"
        >
          <Lock size={18} /> Lock Vault
        </button>
      </div>

      {statusMessage && (
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 p-4 rounded-2xl text-green-400 text-sm">
          <CheckCircle2 size={18} />
          <span>{statusMessage}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-400 text-sm">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Security Settings & Face Lock Control Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#121214] border border-white/10 p-6 rounded-[2rem] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-xl">
                <Camera size={20} />
              </div>
              <h3 className="font-bold text-lg">AI Face Lock Security</h3>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              {hasFaceProfile 
                ? "Your face profile is active. You can re-scan your face anytime to update it." 
                : "No face profile registered yet. Set up AI Face Lock for instant biometric unlocking."}
            </p>
          </div>

          <button 
            onClick={() => setIsFaceScanning(true)}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3.5 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] flex items-center justify-center gap-2"
          >
            <Camera size={18} />
            {hasFaceProfile ? 'Re-scan / Update Face Lock' : 'Register AI Face Lock'}
          </button>
        </div>

        {/* Encrypted Storage Info Card */}
        <div className="bg-[#121214] border border-white/10 p-6 rounded-[2rem] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl">
                <FileUp size={20} />
              </div>
              <h3 className="font-bold text-lg">Hidden Media Storage</h3>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              Photos and videos locked here are encrypted with AES-256 and hidden from standard Windows directories.
            </p>
          </div>

          <div className="text-xs font-mono text-gray-500 bg-black/40 p-3 rounded-xl border border-white/5">
            STORAGE LOCATION: AppData/.auvem_vault/media/
          </div>
        </div>
      </div>

      {/* Face Scan Modal */}
      {isFaceScanning && (
        <FaceScanModal 
          mode="register"
          onCaptured={handleFaceRegistered}
          onClose={() => setIsFaceScanning(false)}
        />
      )}
    </div>
  );
}