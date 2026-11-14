import React from 'react';
import { Film, Image, Mic, Scissors } from 'lucide-react';
import { SavedStudioItem } from '../utils/authSubscription';
import { StudioTabId } from './HeroShowcase';
import { PhotoEditingTool } from './tools/PhotoEditingTool';
import { TextToVideoTool } from './tools/TextToVideoTool';
import { VideoEditingTool } from './tools/VideoEditingTool';
import { VoiceToVideoTool } from './tools/VoiceToVideoTool';

interface StudioWorkspaceProps {
  activeTab: StudioTabId;
  onChangeTab: (tab: StudioTabId) => void;
  onSaveProject: (item: SavedStudioItem) => void;
}

const TABS: { id: StudioTabId; label: string; icon: React.ReactNode }[] = [
  { id: 'text-to-video', label: 'Text to Video', icon: <Film className="h-4 w-4" aria-hidden="true" /> },
  { id: 'voice-to-video', label: 'Voice to Video', icon: <Mic className="h-4 w-4" aria-hidden="true" /> },
  { id: 'photo-editing', label: 'Photo Editing', icon: <Image className="h-4 w-4" aria-hidden="true" /> },
  { id: 'video-editing', label: 'Video Editing', icon: <Scissors className="h-4 w-4" aria-hidden="true" /> },
];

export const StudioWorkspace: React.FC<StudioWorkspaceProps> = ({
  activeTab,
  onChangeTab,
  onSaveProject,
}) => {
  return (
    <section id="studio" className="scroll-mt-16 border-t border-white/[0.08] py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Zero-API Creative Studio
            </h2>
            <p className="mt-1.5 text-sm text-slate-400">
              All video, voice, and photo tools run locally in your browser via HTML5 Canvas & Web Audio.
            </p>
          </div>

          {/* Segmented Studio Tool Tabs */}
          <div
            role="tablist"
            aria-label="Creative studio tools"
            className="flex max-w-full shrink-0 flex-wrap gap-1 rounded-xl border border-white/10 bg-[#13131C] p-1 lg:flex-nowrap"
          >
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onChangeTab(tab.id)}
                  className={`inline-flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-[#5D4DF4] text-white'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          {activeTab === 'text-to-video' && <TextToVideoTool onSaveProject={onSaveProject} />}
          {activeTab === 'voice-to-video' && <VoiceToVideoTool onSaveProject={onSaveProject} />}
          {activeTab === 'photo-editing' && <PhotoEditingTool onSaveProject={onSaveProject} />}
          {activeTab === 'video-editing' && <VideoEditingTool onSaveProject={onSaveProject} />}
        </div>
      </div>
    </section>
  );
};
