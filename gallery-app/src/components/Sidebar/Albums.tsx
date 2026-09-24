import { FolderHeart } from 'lucide-react';

export default function Albums({ active = false }: { active?: boolean }) {
  return (
    <li className={`group flex items-center gap-4 px-4 py-3 rounded-full cursor-pointer transition-all duration-300 ease-out will-change-transform
      ${active ? 'bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]' : 'text-gray-400 hover:text-white hover:bg-white/5 hover:translate-x-1'}`}
    >
      <span className={`${active ? 'text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]' : 'group-hover:text-purple-400 transition-colors'}`}>
        <FolderHeart size={20} />
      </span>
      <span className="font-medium text-sm">Albums</span>
    </li>
  );
}