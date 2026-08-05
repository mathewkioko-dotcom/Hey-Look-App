import React, { useState } from 'react';
import { Instagram, Calendar, Image as ImageIcon } from 'lucide-react';
import { GridPost } from '../../lib/plugins/instagramGridPlanner';

interface GridPlannerProps {
  posts: GridPost[];
}

export const InstagramGridPlanner: React.FC<GridPlannerProps> = ({ posts }) => {
  const [activePost, setActivePost] = useState<GridPost | null>(posts[0] || null);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const handleImgError = (id: string) => {
    setImgErrors((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="my-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl font-sans">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-md">
            <Instagram className="w-4 h-4" />
          </div>
          <span className="text-sm font-semibold text-rose-400">Meta Feed Planner</span>
          <span className="text-xs px-2.5 py-0.5 bg-rose-500/10 text-rose-400 rounded-full font-mono font-medium border border-rose-500/20">
            3x3 Preview
          </span>
        </div>
        <span className="text-xs text-slate-400 font-mono">{posts.length} Posts Queued</span>
      </div>

      <div className="grid grid-cols-3 gap-1.5 bg-slate-900 p-2 rounded-xl border border-slate-800">
        {posts.slice(0, 9).map((post, idx) => {
          const isSelected = activePost?.id === post.id;
          const hasError = imgErrors[post.id];

          return (
            <button
              key={post.id || idx}
              onClick={() => setActivePost(post)}
              className={`aspect-square overflow-hidden rounded-lg relative group border-2 transition-all cursor-pointer bg-slate-950 flex flex-col items-center justify-center ${
                isSelected ? 'border-rose-500 shadow-lg shadow-rose-500/20 scale-[0.98]' : 'border-transparent hover:opacity-90'
              }`}
            >
              {post.imageUrl && !hasError ? (
                <img
                  src={post.imageUrl}
                  alt={`Grid post ${idx + 1}`}
                  onError={() => handleImgError(post.id)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-2 text-center">
                  <ImageIcon className="w-6 h-6 text-slate-600 mb-1" />
                  <span className="text-[10px] text-slate-400 font-mono">Post #{idx + 1}</span>
                </div>
              )}
              <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-[10px] font-mono text-white backdrop-blur-sm">
                #{idx + 1}
              </div>
            </button>
          );
        })}
      </div>

      {activePost && (
        <div className="mt-3 p-3.5 bg-slate-900/90 rounded-xl border border-slate-800/80 text-xs">
          <div className="flex justify-between items-center text-slate-400 mb-2 font-mono text-[11px] pb-2 border-b border-slate-800">
            <span className="text-rose-400 font-semibold">Selected Post Details</span>
            {activePost.scheduledTime && (
              <span className="flex items-center gap-1 text-slate-300">
                <Calendar className="w-3 h-3 text-rose-400" />
                {activePost.scheduledTime}
              </span>
            )}
          </div>
          <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{activePost.caption}</p>
        </div>
      )}
    </div>
  );
};
