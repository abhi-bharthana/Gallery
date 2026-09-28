// src/components/FolderManager.tsx
import { useState, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderPlus, FolderKanban, Trash2, ShieldCheck, HardDrive, 
  KeyRound, Camera, Lock, CheckCircle2, ShieldAlert
} from 'lucide-react';
import FaceScanModal from './Vault/FaceScanModal'; 

const AUTH_POLICIES = [
  { id: 'password_only', label: 'Master Password Only', desc: 'Standard security using your text password.' },
  { id: 'pin_only', label: '6-Digit PIN Only', desc: 'Quick access using a numeric PIN.' },
  { id: 'face_or_pin', label: 'Face OR PIN (Recommended)', desc: 'Fastest access. Use AI Face Lock or fallback to PIN.' },
  { id: 'face_and_pin', label: 'Face + PIN', desc: 'High security. Requires both Face scan and PIN.' },
  { id: 'face_and_password', label: 'Face + Password', desc: 'Maximum security. Requires Face scan and Master Password.' },
];

export default function FolderManager() {
  const [activeTab, setActiveTab] = useState<'storage' | 'security'>('storage');
  
  // --- STORAGE STATES ---
  const [folders, setFolders] = useState<string[]>([]);

  // --- SECURITY STATES ---
  const [authPolicy, setAuthPolicy] = useState('password_only');
  const [hasFace, setHasFace] = useState(false);
  const [isFaceScanning, setIsFaceScanning] = useState(false);
  
  // 🔥 NAYA: 2-Step PIN Setup States
  const [pinSetupStep, setPinSetupStep] = useState<'hidden' | 'verify' | 'new'>('hidden');
  const [authPassword, setAuthPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  
  const [securityMessage, setSecurityMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('synced_folders');
    if (saved) setFolders(JSON.parse(saved));

    invoke('get_auth_policy').then(res => setAuthPolicy(res as string)).catch(() => {});
    invoke('get_vault_face_descriptor').then(res => setHasFace(!!res)).catch(() => {});
  }, []);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setSecurityMessage({ text, type });
    setTimeout(() => setSecurityMessage(null), 3000);
  };

  const handleAddFolder = async () => {
    const selectedPath = await open({ directory: true, multiple: true, title: 'Select Folders to Sync' });
    if (selectedPath) {
      const newPaths = Array.isArray(selectedPath) ? selectedPath : [selectedPath];
      const updatedFolders = [...new Set([...folders, ...newPaths])];
      setFolders(updatedFolders);
      localStorage.setItem('synced_folders', JSON.stringify(updatedFolders));
    }
  };

  const handleRemoveFolder = (folderToRemove: string) => {
    const updated = folders.filter(f => f !== folderToRemove);
    setFolders(updated);
    localStorage.setItem('synced_folders', JSON.stringify(updated));
  };

  const handlePolicyChange = async (policyId: string) => {
    try {
      await invoke('update_auth_policy', { policy: policyId });
      setAuthPolicy(policyId);
      showMessage('Authentication policy updated.', 'success');
    } catch (e) {
      showMessage('Failed to update policy.', 'error');
    }
  };

  // 🔥 NAYA: Pehle purana/master password verify karo
  const handleVerifyPasswordForPin = async () => {
    try {
      const isValid = await invoke<boolean>('verify_master_password', { password: authPassword });
      if (isValid) {
        setPinSetupStep('new');
        setAuthPassword('');
      } else {
        showMessage('Incorrect Master Password.', 'error');
      }
    } catch (e) {
      showMessage('Verification failed.', 'error');
    }
  };

  const handleSavePin = async () => {
    if (newPin.length !== 6 || isNaN(Number(newPin))) {
      showMessage('PIN must be exactly 6 digits.', 'error');
      return;
    }
    try {
      await invoke('update_vault_pin', { pin: newPin });
      setPinSetupStep('hidden');
      setNewPin('');
      showMessage('Vault PIN successfully updated.', 'success');
    } catch (e) {
      showMessage('Failed to save PIN.', 'error');
    }
  };

  const handleFaceRegistered = async (descriptor: number[]) => {
    setIsFaceScanning(false);
    try {
      await invoke('update_vault_face_descriptor', { faceDescriptor: descriptor });
      setHasFace(true);
      showMessage('AI Face Lock successfully updated!', 'success');
    } catch (err) {
      showMessage('Failed to save face profile.', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-10 bg-[#121214] border border-white/[0.05] rounded-[2.5rem] shadow-2xl relative overflow-hidden min-h-[600px] flex flex-col">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-40 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 flex items-center gap-4 p-6 border-b border-white/[0.05] bg-black/20">
        <button 
          onClick={() => setActiveTab('storage')}
          className={`relative px-6 py-3 rounded-full text-sm font-bold tracking-wide transition-colors flex items-center gap-2 ${activeTab === 'storage' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
        >
          {activeTab === 'storage' && (
            <motion.div layoutId="activeTab" className="absolute inset-0 bg-white/10 rounded-full border border-white/10" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
          )}
          <HardDrive size={18} className="relative z-10" />
          <span className="relative z-10">Storage & Sync</span>
        </button>

        <button 
          onClick={() => setActiveTab('security')}
          className={`relative px-6 py-3 rounded-full text-sm font-bold tracking-wide transition-colors flex items-center gap-2 ${activeTab === 'security' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
        >
          {activeTab === 'security' && (
            <motion.div layoutId="activeTab" className="absolute inset-0 bg-purple-500/20 rounded-full border border-purple-500/30" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
          )}
          <ShieldCheck size={18} className="relative z-10" />
          <span className="relative z-10">Security & Vault</span>
        </button>
      </div>

      <div className="relative z-10 p-8 flex-1 flex flex-col overflow-y-auto">
        <AnimatePresence mode="wait">
          
          {/* ================= STORAGE TAB ================= */}
          {activeTab === 'storage' && (
            <motion.div key="storage" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold tracking-wide text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">Sync Locations</h2>
                  <p className="text-gray-400 text-sm mt-1">Manage folders synced with your gallery.</p>
                </div>
                <button onClick={handleAddFolder} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-full backdrop-blur-md transition-all border border-white/10 shadow-lg">
                  <FolderPlus size={18} />
                  <span className="font-semibold text-sm">Add Folder</span>
                </button>
              </div>

              <ul className="space-y-3">
                <AnimatePresence>
                  {folders.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
                      <FolderKanban size={48} className="text-gray-600 mb-4" />
                      <p className="text-gray-300 font-semibold text-lg">No folders synced yet.</p>
                      <p className="text-gray-500 text-sm mt-1">Add a directory to start viewing your images.</p>
                    </motion.div>
                  ) : (
                    folders.map((folder) => (
                      <motion.li key={folder} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="flex items-center justify-between bg-white/[0.03] border border-white/[0.05] p-4 rounded-2xl hover:border-white/10 transition-colors group">
                        <div className="flex items-center gap-4 overflow-hidden">
                          <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400"><FolderKanban size={20} /></div>
                          <span className="text-gray-300 font-mono text-sm truncate">{folder}</span>
                        </div>
                        <button onClick={() => handleRemoveFolder(folder)} className="p-2.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
                          <Trash2 size={18} />
                        </button>
                      </motion.li>
                    ))
                  )}
                </AnimatePresence>
              </ul>
            </motion.div>
          )}

          {/* ================= SECURITY & VAULT TAB ================= */}
          {activeTab === 'security' && (
            <motion.div key="security" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="flex flex-col h-full space-y-8">
              
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-wide text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">Vault Security</h2>
                  <p className="text-gray-400 text-sm mt-1">Configure how you unlock your hidden Ghost Mode media.</p>
                </div>
                <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full flex items-center gap-2 text-sm font-semibold shadow-[0_0_20px_rgba(34,197,94,0.1)]">
                  <ShieldCheck size={16} /> Vault Active
                </div>
              </div>

              <AnimatePresence>
                {securityMessage && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className={`flex items-center gap-3 p-4 rounded-2xl border ${securityMessage.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    {securityMessage.type === 'success' ? <CheckCircle2 size={18} /> : <ShieldAlert size={18} />}
                    <span className="font-medium text-sm">{securityMessage.text}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6 flex flex-col">
                  <div className="flex items-center gap-3 mb-5">
                    <Lock size={20} className="text-gray-400" />
                    <h3 className="font-bold text-lg text-white">Unlock Policy</h3>
                  </div>
                  <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {AUTH_POLICIES.map((policy) => (
                      <div 
                        key={policy.id} 
                        onClick={() => handlePolicyChange(policy.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${authPolicy === policy.id ? 'bg-purple-500/10 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]' : 'bg-transparent border-white/[0.05] hover:border-white/20'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-semibold text-sm ${authPolicy === policy.id ? 'text-purple-300' : 'text-gray-300'}`}>{policy.label}</span>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${authPolicy === policy.id ? 'border-purple-500' : 'border-gray-600'}`}>
                            {authPolicy === policy.id && <div className="w-2 h-2 bg-purple-500 rounded-full" />}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 leading-relaxed">{policy.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  
                  {/* 🔥 2-STEP PIN Setup Widget */}
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <KeyRound size={20} className="text-gray-400" />
                        <h3 className="font-bold text-lg text-white">6-Digit PIN</h3>
                      </div>
                      <button 
                        onClick={() => {
                          setPinSetupStep(pinSetupStep === 'hidden' ? 'verify' : 'hidden');
                          setAuthPassword(''); setNewPin('');
                        }} 
                        className="text-xs font-bold text-purple-400 hover:text-purple-300 uppercase tracking-wider"
                      >
                        {pinSetupStep === 'hidden' ? 'Change PIN' : 'Cancel'}
                      </button>
                    </div>
                    
                    <AnimatePresence mode="wait">
                      {/* Step 1: Verify Master Password */}
                      {pinSetupStep === 'verify' && (
                        <motion.div key="verify" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
                          <p className="text-xs text-gray-400">Verify your Master Password to proceed.</p>
                          <input 
                            type="password" placeholder="Master Password"
                            value={authPassword} onChange={(e) => setAuthPassword(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                          />
                          <button onClick={handleVerifyPasswordForPin} disabled={!authPassword} className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all">Verify Identity</button>
                        </motion.div>
                      )}

                      {/* Step 2: Set New PIN */}
                      {pinSetupStep === 'new' && (
                        <motion.div key="new" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
                          <p className="text-xs text-gray-400">Enter your new 6-digit PIN.</p>
                          <input 
                            type="password" maxLength={6} placeholder="• • • • • •"
                            value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white tracking-[1em] text-center font-mono focus:outline-none focus:border-purple-500 transition-colors"
                          />
                          <button onClick={handleSavePin} disabled={newPin.length !== 6} className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all">Save New PIN</button>
                        </motion.div>
                      )}

                      {/* Hidden State */}
                      {pinSetupStep === 'hidden' && (
                        <motion.p key="hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-gray-400">Set up a quick numeric PIN as a backup or primary unlock method.</motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Face Setup Widget */}
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Camera size={20} className="text-gray-400" />
                      <h3 className="font-bold text-lg text-white">AI Face Lock</h3>
                    </div>
                    <p className="text-sm text-gray-400 mb-5">
                      {hasFace ? "Face profile is active. You can re-scan anytime to improve accuracy." : "No face profile registered. Set up AI Face Lock for instant biometric unlocking."}
                    </p>
                    <button onClick={() => setIsFaceScanning(true)} className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                      <Camera size={18} className="text-purple-400" />
                      {hasFace ? 'Re-scan Face Profile' : 'Register AI Face'}
                    </button>
                  </div>

                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

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