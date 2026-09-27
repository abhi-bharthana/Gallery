// src/components/VideoPlayer/BottomControls.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward, Settings2, PictureInPicture2, Subtitles, AudioLines } from 'lucide-react';

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const ControlPill = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`h-[42px] bg-[#1a1a1a]/70 hover:bg-[#1a1a1a]/90 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors border border-white/5 shadow-md ${className}`}>
    {children}
  </div>
);

export default function BottomControls(props: any) {
  return (
    <AnimatePresence>
      {props.showControls && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.2 }}
          className="absolute bottom-4 left-0 right-0 z-20 px-4 flex flex-col gap-3 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full px-1">
            <div 
              data-scrub-track onMouseDown={props.handleScrubStart} onMouseMove={props.handleTrackHover} onMouseLeave={() => props.setHoverPct(null)}
              className="w-full relative h-[4px] hover:h-[6px] bg-white/20 cursor-pointer group/slider transition-all duration-150 ease-in-out rounded-full"
            >
              <div className="absolute inset-y-0 left-0 bg-white/40 rounded-full" style={{ width: `${props.buffered}%` }} />
              <div className="absolute inset-y-0 left-0 bg-[#FF0000] rounded-full" style={{ width: `${props.progress}%` }}>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-[#FF0000] rounded-full scale-0 group-hover/slider:scale-100 transition-transform duration-100 translate-x-1/2"></div>
              </div>
              {props.hoverPct !== null && props.duration > 0 && (
                <div className="absolute bottom-6 -translate-x-1/2 px-2 py-1 bg-black/90 text-[12px] font-medium text-white rounded-md shadow-md pointer-events-none whitespace-nowrap" style={{ left: `${props.hoverPct}%` }}>
                  {props.formatTime((props.hoverPct / 100) * props.duration)}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2.5">
              <ControlPill className="w-[42px] cursor-pointer">
                <button onClick={props.togglePlay} className="w-full h-full flex items-center justify-center">
                  {props.isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                </button>
              </ControlPill>

              {(props.hasPrev || props.hasNext) && (
                <ControlPill className="px-3 gap-3">
                  <button onClick={(e) => { e.stopPropagation(); props.onPrev?.(); }} className={`hover:text-white transition-colors ${props.hasPrev ? 'text-white' : 'text-white/30 cursor-not-allowed'}`} disabled={!props.hasPrev}><SkipBack size={18} fill="currentColor" /></button>
                  <button onClick={(e) => { e.stopPropagation(); props.onNext?.(); }} className={`hover:text-white transition-colors ${props.hasNext ? 'text-white' : 'text-white/30 cursor-not-allowed'}`} disabled={!props.hasNext}><SkipForward size={18} fill="currentColor" /></button>
                </ControlPill>
              )}

              <ControlPill className="px-3 cursor-pointer group/vol">
                <div className="flex items-center h-full">
                  <button onClick={() => props.setIsMuted(!props.isMuted)} className="hover:scale-110 transition-transform">
                    {props.isMuted || props.volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                  <div className="w-0 group-hover/vol:w-16 overflow-hidden transition-all duration-300 ease-in-out flex items-center">
                    <input 
                      type="range" min="0" max="1" step="0.05" value={props.isMuted ? 0 : props.volume}
                      onChange={(e) => props.changeVolume(parseFloat(e.target.value))}
                      className="w-14 h-1 bg-white/30 appearance-none outline-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-110 accent-white ml-2"
                    />
                  </div>
                </div>
              </ControlPill>

              <ControlPill className="px-4 text-[13.5px] font-medium tracking-wide">
                <span>{props.formatTime(props.currentTime)} <span className="opacity-60 mx-1">/</span> {props.formatTime(props.duration)}</span>
              </ControlPill>
            </div>

            <div className="flex items-center gap-2.5 relative">
              
              {/* SPEED MENU */}
              <AnimatePresence>
                {props.activeMenu === 'speed' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.15 }} className="absolute bottom-14 right-20 bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-xl py-2 min-w-[140px] shadow-2xl z-50">
                    <div className="px-4 py-1.5 text-xs text-white/50 font-semibold border-b border-white/5 mb-1 uppercase tracking-wider">Speed</div>
                    {SPEEDS.map((s) => (
                      <button key={s} onClick={() => props.handlePlaybackRateChange(s)} className="w-full flex items-center justify-between px-4 py-2 text-[13px] text-white hover:bg-white/10 transition-colors">
                        {s === 1 ? 'Normal' : `${s}x`}
                        {s === props.playbackRate && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* AUDIO MENU */}
              <AnimatePresence>
                {props.activeMenu === 'audio' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.15 }} className="absolute bottom-14 right-10 bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-xl py-2 min-w-[180px] shadow-2xl z-50">
                    <div className="px-4 py-1.5 text-xs text-white/50 font-semibold border-b border-white/5 mb-1 uppercase tracking-wider">Audio Track</div>
                    {props.audioTracks.map((trk: any) => (
                      <button key={trk.index} onClick={() => props.handleAudioChange(trk.index)} className="w-full flex items-center justify-between px-4 py-2 text-[13px] text-white hover:bg-white/10 transition-colors">
                        <span className="truncate">{trk.displayName}</span>
                        {trk.index === props.activeAudio && <span className="w-1.5 h-1.5 rounded-full bg-white ml-2"></span>}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* SUBTITLE MENU */}
              <AnimatePresence>
                {props.activeMenu === 'sub' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.15 }} className="absolute bottom-14 right-5 bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-xl py-2 min-w-[180px] shadow-2xl z-50">
                    <div className="px-4 py-1.5 text-xs text-white/50 font-semibold border-b border-white/5 mb-1 uppercase tracking-wider">Subtitles (CC)</div>
                    <button onClick={() => props.handleSubChange(-1)} className="w-full flex items-center justify-between px-4 py-2 text-[13px] text-white hover:bg-white/10 transition-colors">
                      Off {-1 === props.activeSub && <span className="w-1.5 h-1.5 rounded-full bg-white ml-2"></span>}
                    </button>
                    {props.subTracks.map((trk: any) => (
                      <button key={trk.index} onClick={() => props.handleSubChange(trk.index)} className="w-full flex items-center justify-between px-4 py-2 text-[13px] text-white hover:bg-white/10 transition-colors">
                        <span className="truncate">{trk.displayName}</span>
                        {trk.index === props.activeSub && <span className="w-1.5 h-1.5 rounded-full bg-white ml-2"></span>}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Right-side Tools Pill */}
              <ControlPill className="px-3 gap-4">
                <button onClick={(e) => { e.stopPropagation(); props.setActiveMenu(props.activeMenu === 'audio' ? null : 'audio'); }} className={`hover:scale-110 transition-transform ${props.activeMenu === 'audio' ? 'text-blue-400' : ''}`} title="Audio Tracks">
                  <AudioLines size={18} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); props.setActiveMenu(props.activeMenu === 'sub' ? null : 'sub'); }} className={`hover:scale-110 transition-transform ${props.activeSub !== -1 ? 'text-[#FF0000]' : ''}`} title="Subtitles / CC (c)">
                  <Subtitles size={18} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); props.setActiveMenu(props.activeMenu === 'speed' ? null : 'speed'); }} className={`hover:scale-110 transition-transform ${props.activeMenu === 'speed' ? 'text-yellow-400' : ''}`} title="Settings">
                  <Settings2 size={18} />
                </button>
                <button onClick={props.togglePiP} className="hover:scale-110 transition-transform hidden sm:block" title="Miniplayer">
                  <PictureInPicture2 size={18} />
                </button>
                <button onClick={props.toggleFullscreen} className="hover:scale-110 transition-transform" title="Fullscreen">
                  {props.isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                </button>
              </ControlPill>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}