import { categoryStructure, productConfig, categoryProducts } from '@/config/submission-products';

interface CategoryFilterProps {
  selectedCategory: string;
  productFilter: string;
  onCategorySelect: (category: string) => void;
  onProductSelect: (product: string) => void;
}

export function CategoryFilter({
  selectedCategory,
  productFilter,
  onCategorySelect,
  onProductSelect,
}: CategoryFilterProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm space-y-4">
      {/* 대분류 탭 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(categoryStructure).map(([key, category]) => {
          const Icon = category.icon;
          const isActive = selectedCategory === key;
          return (
            <button
              key={key}
              onClick={() => onCategorySelect(key)}
              className={`
                flex flex-col items-center justify-center gap-2 py-4 px-3 text-xs font-medium rounded-lg border-2 transition-all
                ${
                  isActive
                    ? 'bg-blue-500 text-white border-blue-600 shadow-md'
                    : 'bg-gray-50 border-transparent hover:bg-gray-100'
                }
              `}
            >
              <Icon className="h-5 w-5" />
              <span className="font-semibold">{category.label}</span>
            </button>
          );
        })}
      </div>

      {/* 세부 항목 (하위 카테고리가 있을 때만 표시) */}
      {selectedCategory !== 'all' && categoryProducts[selectedCategory]?.length > 1 && (
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2 font-medium">세부 항목</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {categoryProducts[selectedCategory].map((productKey) => {
              const config = productConfig[productKey as keyof typeof productConfig];
              const Icon = config.icon;
              const isActive = productFilter === productKey;
              return (
                <button
                  key={productKey}
                  onClick={() => onProductSelect(productKey)}
                  className={`
                    flex items-center gap-2 py-2 px-3 text-xs font-medium rounded-md border transition-all
                    ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-blue-300'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span>{config.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

