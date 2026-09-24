import { Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-full cursor-pointer text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300">
      <SettingsIcon size={20} />
      <span className="font-medium text-sm">Settings</span>
    </div>
  );
}