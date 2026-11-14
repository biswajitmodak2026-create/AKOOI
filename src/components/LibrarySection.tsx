import React from 'react';
import { FolderOpen, Trash2 } from 'lucide-react';
import { SavedStudioItem } from '../utils/authSubscription';

interface LibrarySectionProps {
  items: SavedStudioItem[];
  onDeleteItem: (id: string) => void;
  onJumpToStudio: () => void;
}

const TOOL_LABELS: Record<SavedStudioItem['tool'], string> = {
  'text-to-video': 'Text to Video',
  'voice-to-video': 'Voice to Video',
  'photo-editing': 'Photo Editing',
  'video-editing': 'Video Editing',
};

export const LibrarySection: React.FC<LibrarySectionProps> = ({
  items,
  onDeleteItem,
  onJumpToStudio,
}) => {
  return (
    <section id="library" className="scroll-mt-16 border-t border-white/[0.08] py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-white">
              Local Project Library
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Exports rendered in your browser are cataloged locally for quick reference.
            </p>
          </div>
          {items.length > 0 && (
            <span className="font-mono-tabular text-xs text-slate-400">
              {items.length} saved {items.length === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>

        {items.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-[#13131C] p-8 text-center">
            <FolderOpen className="mx-auto h-8 w-8 text-slate-500" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-white">No saved exports yet</p>
            <p className="mt-1 text-xs text-slate-400">
              Render a Text-to-Video clip, Voice video, or edited Photo above to save it here.
            </p>
            <button
              type="button"
              onClick={onJumpToStudio}
              className="mt-4 cursor-pointer rounded-xl bg-[#5D4DF4] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#4F3FE6]"
            >
              Open Studio
            </button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-xl border border-white/10 bg-[#13131C]"
              >
                {item.previewDataUrl ? (
                  <img
                    src={item.previewDataUrl}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="h-36 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-36 items-center justify-center bg-[#0B0B10] text-xs text-slate-500">
                    {TOOL_LABELS[item.tool]}
                  </div>
                )}
                <div className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                      <span>{TOOL_LABELS[item.tool]}</span>
                      <span aria-hidden="true">·</span>
                      <span className="uppercase">{item.format}</span>
                      {item.durationSec ? (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono-tabular">{item.durationSec}s</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteItem(item.id)}
                    aria-label={`Delete ${item.title}`}
                    className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
