import React, { useEffect, useMemo } from 'react';
import { X, Loader2 } from 'lucide-react';
import ReviewCard from './ReviewCard';
import { renderStars } from '../utils/reviewUtils';

const ReviewsModal = ({
  isOpen,
  onClose,
  reviews,
  totalReviews,
  onLoadMore,
  isLoadingMore,
  hasMore,
  loadingError,
  
  sentinelRef,
  scrollRef,
  entityName = 'Doctor',
}) => {
  // All hooks must be at the top level of the component.
  const averageRating = useMemo(() => {
    if (!reviews.length) return '—';
    const total = reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  const distribution = useMemo(() => {
    const dist = {};
    [5, 4, 3, 2, 1].forEach(stars => {
      const count = reviews.filter(r => Number(r.rating) === stars).length;
      dist[stars] = {
        count,
        pct: reviews.length ? Math.round((count / reviews.length) * 100) : 0,
      };
    });
    return dist;
  }, [reviews]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  // Now, we can conditionally render the UI based on the isOpen prop.
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reviews-title"
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      tabIndex={-1}
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-5xl h-[90vh] rounded-lg sm:rounded-3xl bg-white shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 sticky top-0 z-20 bg-white/95 backdrop-blur border-b">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <h2 id="reviews-title" className="text-xl font-bold text-gray-900">All Reviews</h2>
                <div className="mt-1 flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-bold text-gray-900">{averageRating}</span>
                    <div className="ml-1 flex items-center [&>svg]:text-yellow-500 [&>svg]:fill-yellow-500">
                      {renderStars(averageRating)}
                    </div>
                  </div>
                  <span className="text-gray-500">Based on {totalReviews} reviews</span>
                </div>
                
                {/* Distribution */}
                <div className="mt-3 grid grid-cols-1 gap-1">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const pct = distribution[stars].pct;
                    return (
                      <div key={stars} className="flex items-center gap-2 text-xs">
                        <span className="w-6 text-right text-gray-700 tabular-nums">{stars}★</span>
                        <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-amber-400 transition-[width] duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-gray-600 tabular-nums">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 shrink-0"
                aria-label="Close reviews modal"
              >
                <X className="h-5 w-5 text-gray-500 hover:text-gray-900" />
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div
          className="flex-grow overflow-y-auto px-4 sm:px-6 py-6 space-y-4"
          ref={scrollRef} 
        >
          {loadingError && (
            <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
              <span className="font-medium">Failed to load reviews.</span>
            </div>
          )}

          {!reviews.length && !loadingError && (
            <div className="text-center text-gray-500 py-16">
              <p className="font-medium">No reviews yet for this {entityName.toLowerCase()}.</p>
              <p className="text-sm">New reviews will appear here.</p>
            </div>
          )}

          {reviews.map((r) => (
            <ReviewCard key={r._id} r={r} />
          ))}

          {hasMore && (
            <div ref={sentinelRef} className="h-1 flex items-center justify-center">
              {isLoadingMore && <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewsModal;