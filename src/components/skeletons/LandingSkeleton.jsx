import React from 'react';
import Skeleton from '../ui/Skeleton';

export default function LandingSkeleton() {
  return (
    <div className="min-h-screen bg-sv-bg font-sans overflow-hidden">
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Copy Skeleton */}
          <div className="flex flex-col items-start gap-6 z-10 w-full">
            <Skeleton className="w-40 h-6 rounded-full mb-2" />
            <div className="space-y-4 w-full max-w-lg">
              <Skeleton className="w-full h-14 md:h-16" />
              <Skeleton className="w-4/5 h-14 md:h-16" />
            </div>
            <div className="space-y-3 w-full max-w-lg mt-2">
              <Skeleton className="w-full h-5" />
              <Skeleton className="w-11/12 h-5" />
              <Skeleton className="w-4/5 h-5" />
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-5">
              <Skeleton className="w-40 h-12 rounded-lg" />
              <Skeleton className="w-32 h-12 rounded-lg" />
            </div>
          </div>

          {/* Right: Hero Image/Card Skeleton */}
          <div className="relative h-96 w-full flex items-center justify-center">
             <Skeleton className="w-full h-full rounded-3xl" />
          </div>
        </div>
      </section>
    </div>
  );
}
