import React, { useRef } from 'react';
import { Category } from '../types';

interface CategoryNavProps {
  categories: Category[];
  activeCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  categoryCounts?: Record<string, number>;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  categories,
  activeCategoryId,
  onSelectCategory,
  categoryCounts,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleCategoryClick = (categoryId: string) => {
    onSelectCategory(categoryId);
  };

  return (
    <div id="category-nav-wrapper" className="sticky top-[61px] z-30 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/80 py-2.5 px-3">
      <div 
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth max-w-4xl mx-auto py-0.5"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map((cat) => {
          const isActive = activeCategoryId === cat.id;
          const count = categoryCounts ? categoryCounts[cat.id] : undefined;

          return (
            <button
              key={cat.id}
              id={`cat-btn-${cat.id}`}
              onClick={() => handleCategoryClick(cat.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer select-none shrink-0 ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 shadow-md shadow-amber-500/20 scale-[1.02]'
                  : 'bg-zinc-900/90 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-zinc-800'
              }`}
            >
              <span className="text-sm">{cat.icon}</span>
              <span>{cat.name}</span>
              {typeof count === 'number' && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5 ${
                  isActive ? 'bg-zinc-950 text-amber-400' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
