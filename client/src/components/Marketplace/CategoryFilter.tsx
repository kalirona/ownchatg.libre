import type { TMarketplaceCategoryItem } from 'librechat-data-provider';
import { useLocalize } from '~/hooks';

export default function CategoryFilter({
  categories,
  selected,
  onSelect,
}: {
  categories: TMarketplaceCategoryItem[];
  selected: string;
  onSelect: (category: string) => void;
}) {
  const localize = useLocalize();

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect('')}
        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
          selected === ''
            ? 'bg-green-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
        }`}
      >
        {localize('com_marketplace_all')}
      </button>
      {categories.map((cat) => (
        <button
          key={cat.name}
          onClick={() => onSelect(cat.name)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            selected === cat.name
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          {cat.name}
          <span className="ml-1 opacity-60">({cat.count})</span>
        </button>
      ))}
    </div>
  );
}
