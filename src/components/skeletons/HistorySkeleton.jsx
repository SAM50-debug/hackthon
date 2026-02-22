import React from 'react';
import Skeleton from '../ui/Skeleton';

export default function HistorySkeleton() {
  return (
    <div className="min-h-screen bg-sv-bg p-6 md:p-10 font-sans text-sv-text animate-in fade-in duration-300">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-sv-border pb-6">
          <div className="space-y-2">
            <Skeleton className="w-48 h-10" />
            <Skeleton className="w-64 h-5" />
          </div>

          <div className="flex flex-wrap gap-3">
            <Skeleton className="w-32 h-10 rounded-xl" />
            <Skeleton className="w-10 h-10 rounded-xl" />
            <Skeleton className="w-10 h-10 rounded-xl" />
          </div>
        </div>

        {/* Summary Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="w-full h-28 rounded-3xl" />
          <Skeleton className="w-full h-28 rounded-3xl" />
          <Skeleton className="w-full h-28 rounded-3xl" />
          <Skeleton className="w-full h-28 rounded-3xl" />
        </div>

        {/* Filters & Toolbar */}
        <div className="bg-sv-surface/80 p-2 rounded-2xl border border-sv-border/60 shadow-sm flex flex-col md:flex-row gap-2 items-center justify-between">
          <div className="flex flex-1 gap-2 w-full md:w-auto p-1">
            <Skeleton className="w-full md:w-64 h-10 rounded-xl" />
            <Skeleton className="w-32 h-10 rounded-xl hidden md:block" />
          </div>
          <div className="p-1">
            <Skeleton className="w-24 h-5" />
          </div>
        </div>

        {/* Sessions List */}
        <div className="space-y-5">
           {[1, 2, 3, 4].map(i => (
             <div key={i} className="bg-sv-surface/70 backdrop-blur-md rounded-3xl border border-sv-border/70 shadow-sm p-5 md:p-6">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                 <div className="flex-1 space-y-2">
                   <div className="flex items-center gap-3">
                     <Skeleton className="w-20 h-6 rounded-full" />
                     <Skeleton className="w-32 h-4" />
                   </div>
                 </div>
                 
                 <div className="hidden md:flex items-center gap-4 px-6 mx-2 border-l border-r border-sv-border/40">
                   <Skeleton className="w-10 h-8" />
                   <Skeleton className="w-10 h-8" />
                 </div>

                 <div className="flex items-center justify-end min-w-[120px] gap-4">
                   <div className="flex flex-col items-end gap-1">
                      <Skeleton className="w-16 h-10" />
                      <Skeleton className="w-20 h-3" />
                   </div>
                   <Skeleton className="w-1.5 h-10 rounded-full" />
                 </div>
               </div>
               
               <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-sv-border/40 mt-4">
                 <Skeleton className="w-16 h-3 mr-2" />
                 <Skeleton className="w-24 h-6 rounded-lg" />
                 <Skeleton className="w-32 h-6 rounded-lg" />
               </div>
             </div>
           ))}
        </div>

      </div>
    </div>
  );
}
