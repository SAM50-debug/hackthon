import React from 'react';
import Skeleton from '../ui/Skeleton';

export default function CoachSkeleton() {
  return (
    <div className="min-h-screen bg-sv-bg p-6 md:p-10 font-sans text-sv-text animate-in fade-in duration-300">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
             <Skeleton className="w-32 h-8" />
             <Skeleton className="w-48 h-4" />
          </div>
          <div className="flex items-center gap-3">
             <Skeleton className="w-24 h-6 rounded-full" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          
          {/* Left Column: Camera (Big) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
             {/* Session HUD */}
             <div className="bg-sv-surface/70 border border-sv-border/70 backdrop-blur-md rounded-2xl shadow-sm p-4 flex flex-wrap items-center justify-between gap-4">
                <Skeleton className="w-48 h-10 rounded-lg" />
                <Skeleton className="w-24 h-6 rounded-full" />
                <div className="hidden lg:flex items-center gap-6">
                  <div className="space-y-1 block"><Skeleton className="w-8 h-2" /><Skeleton className="w-6 h-4" /></div>
                  <div className="space-y-1 block"><Skeleton className="w-8 h-2" /><Skeleton className="w-6 h-4" /></div>
                  <div className="space-y-1 block"><Skeleton className="w-10 h-2" /><Skeleton className="w-8 h-4" /></div>
                </div>
             </div>

             {/* Camera Viewport Container */}
             <div className="bg-sv-surface/70 border border-sv-border/70 backdrop-blur-md rounded-3xl shadow-sm overflow-hidden relative">
                <div className="relative aspect-[4/3] w-full bg-slate-900/50 flex flex-col items-center justify-center overflow-hidden">
                   <div className="absolute inset-0 flex items-center justify-center z-10">
                      <Skeleton className="w-full h-full rounded-none" />
                   </div>
                </div>
                {/* Footer Info */}
                <div className="px-6 py-3 bg-sv-surface/50 flex justify-between items-center h-10">
                   <Skeleton className="w-24 h-3" />
                   <Skeleton className="w-28 h-3" />
                </div>
             </div>
          </div>

          {/* Right Column: Controls & Analytics */}
          <div className="space-y-6 lg:sticky lg:top-24">
             {/* Score Card */}
             <div className="bg-sv-surface/70 backdrop-blur-md rounded-3xl shadow-sm border border-sv-border/70 p-8 text-center relative overflow-hidden h-40 flex flex-col items-center justify-center">
                 <div className="w-full flex justify-between items-center absolute top-6 left-0 px-8">
                   <Skeleton className="w-20 h-2" />
                   <Skeleton className="w-16 h-4 rounded-md" />
                 </div>
                 <Skeleton className="w-24 h-16 mt-4" />
             </div>

             {/* Live Stats Grid */}
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-sv-surface/70 backdrop-blur-md px-5 py-4 rounded-2xl border border-sv-border/70 shadow-sm h-24 flex flex-col justify-center">
                   <Skeleton className="w-12 h-2 mb-2" />
                   <Skeleton className="w-16 h-6" />
                </div>
                <div className="bg-sv-surface/70 backdrop-blur-md px-5 py-4 rounded-2xl border border-sv-border/70 shadow-sm h-24 flex flex-col justify-center">
                   <Skeleton className="w-12 h-2 mb-2" />
                   <Skeleton className="w-16 h-6" />
                </div>
             </div>

             {/* Feedback Board */}
             <div className="bg-sv-surface/40 border border-sv-border/50 p-6 rounded-3xl h-28 flex flex-col justify-center">
                <Skeleton className="w-full h-4 mb-2" />
                <Skeleton className="w-4/5 h-4" />
             </div>

             {/* Main Actions */}
             <div className="pt-4 space-y-2">
                <Skeleton className="w-24 h-2 mx-auto" />
                <Skeleton className="w-full h-14 rounded-2xl" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
