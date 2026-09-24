import { Image as ImageIcon, FolderHeart, Star, Trash2, Settings } from 'lucide-react';

export default function Sidebar() {
  const menu = [
    { name: "All Photos", icon: <ImageIcon size={20} />, active: true },
    { name: "Albums", icon: <FolderHeart size={20} /> },
    { name: "Favorites", icon: <Star size={20} /> },
    { name: "Trash", icon: <Trash2 size={20} /> },
  ];

  return (
    <aside className="w-72 h-full bg-white/[0.02] border-r border-white/5 backdrop-blur-xl p-6 flex flex-col gap-8 hidden md:flex relative z-10">
      <div className="text-xl font-black tracking-widest text-white px-4">
        HYPER<span className="text-purple-500">.</span>
      </div>
      
      <ul className="flex flex-col gap-2 flex-1">
        {menu.map((item, idx) => (
          <li 
            key={idx}
            className={`group flex items-center gap-4 px-4 py-3 rounded-full cursor-pointer transition-all duration-300 ease-out will-change-transform
              ${item.active 
                ? 'bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]' 
                : 'text-gray-400 hover:text-white hover:bg-white/5 hover:translate-x-1'
              }`}
          >
            <span className={`${item.active ? 'text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]' : 'group-hover:text-purple-400 transition-colors'}`}>
              {item.icon}
            </span>
            <span className="font-medium text-sm">{item.name}</span>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-4 px-4 py-3 rounded-full cursor-pointer text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300">
        <Settings size={20} />
        <span className="font-medium text-sm">Settings</span>
      </div>
    </aside>
  );
}