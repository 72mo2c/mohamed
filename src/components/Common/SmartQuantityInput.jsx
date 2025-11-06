// ======================================
// Smart Quantity Component
// مكون الكمية الذكي - يعرض ويعدل الكمية بطريقة ذكية
// ======================================

import React, { useState, useEffect } from 'react';
import { FaCubes, FaPlus, FaMinus, FaCalculator } from 'react-icons/fa';
import { 
  calculateTotalSubQuantity, 
  convertSubToMain, 
  addSubQuantity, 
  removeSubQuantity,
  getStockDetail 
} from '../../utils/unitConversion';

const SmartQuantityInput = ({ 
  stock, 
  onStockChange, 
  label = "الكمية", 
  className = "",
  showTotal = true,
  showConversion = true
}) => {
  const [inputValue, setInputValue] = useState('');
  const [activeMode, setActiveMode] = useState('main'); // 'main' or 'sub'
  const [error, setError] = useState('');

  const stockDetail = getStockDetail(stock);

  // تحديث القيم عند تغيير المخزون
  useEffect(() => {
    if (activeMode === 'main') {
      setInputValue(stockDetail.main.toString());
    } else {
      setInputValue(stockDetail.sub.toString());
    }
  }, [stockDetail, activeMode]);

  const handleModeChange = (mode) => {
    setActiveMode(mode);
    setInputValue(mode === 'main' ? stockDetail.main.toString() : stockDetail.sub.toString());
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newValue = parseInt(inputValue) || 0;
    
    try {
      if (activeMode === 'main') {
        // تحديث الكمية الأساسية
        onStockChange({
          ...stock,
          mainQuantity: newValue
        });
      } else {
        // تحديث الكمية الفرعية
        onStockChange({
          ...stock,
          subQuantity: newValue
        });
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // أزرار الزيادة والنقصان
  const incrementQuantity = () => {
    try {
      const currentValue = parseInt(inputValue) || 0;
      const newValue = currentValue + 1;
      
      if (activeMode === 'main') {
        onStockChange({
          ...stock,
          mainQuantity: newValue
        });
      } else {
        onStockChange({
          ...stock,
          subQuantity: newValue
        });
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const decrementQuantity = () => {
    try {
      const currentValue = parseInt(inputValue) || 0;
      const newValue = Math.max(0, currentValue - 1);
      
      if (activeMode === 'main') {
        onStockChange({
          ...stock,
          mainQuantity: newValue
        });
      } else {
        onStockChange({
          ...stock,
          subQuantity: newValue
        });
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={`bg-white rounded-lg border ${className}`}>
      {/* العنوان */}
      <div className="px-4 py-2 bg-gray-50 border-b">
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <FaCubes className="text-blue-500" />
          {label}
        </h4>
      </div>

      <div className="p-4">
        {/* أزرار التبديل بين الأنواع */}
        <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => handleModeChange('main')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeMode === 'main'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            الكمية الأساسية
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('sub')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeMode === 'sub'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            الكمية الفرعية
          </button>
        </div>

        {/* حقل الإدخال */}
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="number"
                value={inputValue}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-lg border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={activeMode === 'main' ? 'كرتونة' : 'قطعة'}
                min="0"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                {activeMode === 'main' ? 'كرتونة' : 'قطعة'}
              </div>
            </div>
            
            {/* أزرار الزيادة والنقصان */}
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={incrementQuantity}
                className="w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded flex items-center justify-center"
              >
                <FaPlus className="text-xs" />
              </button>
              <button
                type="button"
                onClick={decrementQuantity}
                className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded flex items-center justify-center"
              >
                <FaMinus className="text-xs" />
              </button>
            </div>
          </div>
        </form>

        {/* عرض التحويل الذكي */}
        {showConversion && stockDetail.hasConversion && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <FaCalculator className="text-blue-500" />
              <span className="text-sm font-medium text-blue-800">التحويل الذكي</span>
            </div>
            <div className="text-sm text-blue-700 space-y-1">
              <p>المتاح: {stockDetail.totalDisplay}</p>
              <p>التفصيل: {stockDetail.main} كرتونة + {stockDetail.sub} قطعة</p>
              <p className="text-xs text-blue-600">
                = {stockDetail.total} قطعة إجمالية
              </p>
            </div>
          </div>
        )}

        {/* عرض الإجمالي */}
        {showTotal && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <FaCubes className="text-green-500" />
              <span className="text-sm font-medium text-green-800">الكامل</span>
            </div>
            <p className="text-lg font-bold text-green-700">
              {stockDetail.totalDisplay}
            </p>
            {stockDetail.hasConversion && (
              <p className="text-xs text-green-600 mt-1">
                1 {stockDetail.unitsInMain} قطعة في الكرتونة
              </p>
            )}
          </div>
        )}

        {/* رسالة الخطأ */}
        {error && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartQuantityInput;
