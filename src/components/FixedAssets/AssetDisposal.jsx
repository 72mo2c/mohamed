// ======================================
// التصرف في الأصول الثابتة
// ======================================

import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import Card from '../Common/Card';
import Button from '../Common/Button';
import Table from '../Common/Table';
import Modal from '../Common/Modal';

const AssetDisposal = () => {
  const {
    fixedAssets,
    assetLocations,
    assetDisposals,
    disposeAsset,
    transferAsset,
    calculateDepreciation,
    updateFixedAsset
  } = useData();

  const [selectedDisposal, setSelectedDisposal] = useState(null);
  const [showDisposalModal, setShowDisposalModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // بيانات التصرف
  const [disposalData, setDisposalData] = useState({
    assetId: '',
    disposalMethod: 'sale',
    disposalDate: new Date().toISOString().split('T')[0],
    disposalValue: '',
    disposalReason: '',
    buyerName: '',
    buyerContact: '',
    disposalNotes: '',
    approvedBy: '',
    approvalDate: ''
  });

  // بيانات النقل
  const [transferData, setTransferData] = useState({
    assetId: '',
    fromLocationId: '',
    toLocationId: '',
    transferDate: new Date().toISOString().split('T')[0],
    transferReason: '',
    transferredBy: '',
    receivedBy: '',
    transferNotes: ''
  });

  // تصفير بيانات التصرف
  const filteredDisposals = assetDisposals.filter(disposal => {
    const asset = fixedAssets.find(a => a.id === disposal.assetId);
    const matchesSearch = asset?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         disposal.buyerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         disposal.disposalReason?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = !filterMethod || disposal.disposalMethod === filterMethod;
    const matchesStatus = !filterStatus || disposal.status === filterStatus;
    
    return matchesSearch && matchesMethod && matchesStatus;
  });

  // إحصائيات التصرف
  const getDisposalStats = () => {
    const totalDisposals = assetDisposals.length;
    const thisYearDisposals = assetDisposals.filter(disposal => {
      const disposalYear = new Date(disposal.disposalDate).getFullYear();
      const currentYear = new Date().getFullYear();
      return disposalYear === currentYear;
    }).length;

    const totalValue = assetDisposals.reduce((sum, disposal) => sum + (disposal.disposalValue || 0), 0);
    const thisYearValue = assetDisposals
      .filter(disposal => {
        const disposalYear = new Date(disposal.disposalDate).getFullYear();
        const currentYear = new Date().getFullYear();
        return disposalYear === currentYear;
      })
      .reduce((sum, disposal) => sum + (disposal.disposalValue || 0), 0);

    const methodDistribution = assetDisposals.reduce((acc, disposal) => {
      acc[disposal.disposalMethod] = (acc[disposal.disposalMethod] || 0) + 1;
      return acc;
    }, {});

    return {
      totalDisposals,
      thisYearDisposals,
      totalValue,
      thisYearValue,
      methodDistribution
    };
  };

  // الأصول المقترح للتصرف (عمرها تجاوز العمر الافتراضي)
  const getAssetsForDisposal = () => {
    return fixedAssets.filter(asset => {
      if (!asset.purchaseDate || !asset.usefulLife) return false;
      
      const purchaseDate = new Date(asset.purchaseDate);
      const currentDate = new Date();
      const yearsUsed = currentDate.getFullYear() - purchaseDate.getFullYear();
      
      return yearsUsed >= asset.usefulLife && asset.status === 'Active';
    }).slice(0, 10);
  };

  // أعمدة جدول التصرفات
  const disposalColumns = [
    {
      header: 'الأصل',
      accessor: 'assetId',
      render: (value) => {
        const asset = fixedAssets.find(a => a.id === value);
        return (
          <div>
            <div className="font-medium text-gray-900">{asset?.name || 'غير محدد'}</div>
            <div className="text-sm text-gray-500">{asset?.serialNumber || '-'}</div>
          </div>
        );
      }
    },
    {
      header: 'طريقة التصرف',
      accessor: 'disposalMethod',
      render: (value) => {
        const methodLabels = {
          'sale': 'بيع',
          'donation': 'تبرع',
          'scrap': 'خردة',
          'transfer': 'نقل',
          'write-off': 'شطب'
        };
        const methodColors = {
          'sale': 'bg-green-100 text-green-800',
          'donation': 'bg-blue-100 text-blue-800',
          'scrap': 'bg-gray-100 text-gray-800',
          'transfer': 'bg-yellow-100 text-yellow-800',
          'write-off': 'bg-red-100 text-red-800'
        };
        return (
          <div className={`px-2 py-1 rounded text-sm ${methodColors[value] || 'bg-gray-100 text-gray-800'}`}>
            {methodLabels[value] || value}
          </div>
        );
      }
    },
    {
      header: 'تاريخ التصرف',
      accessor: 'disposalDate',
      render: (value) => (
        <div className="text-sm text-gray-600">
          {new Date(value).toLocaleDateString('ar-SA')}
        </div>
      )
    },
    {
      header: 'قيمة التصرف',
      accessor: 'disposalValue',
      render: (value) => (
        <div className="font-medium text-green-600">
          {value ? value.toLocaleString() : 0} ريال
        </div>
      )
    },
    {
      header: 'المشتري',
      accessor: 'buyerName',
      render: (value) => (
        <div className="text-sm text-gray-900">
          {value || '-'}
        </div>
      )
    },
    {
      header: 'السبب',
      accessor: 'disposalReason',
      render: (value) => (
        <div className="text-sm text-gray-600 max-w-xs truncate" title={value}>
          {value || '-'}
        </div>
      )
    },
    {
      header: 'الحالة',
      accessor: 'status',
      render: (value) => {
        const statusLabels = {
          'pending': 'معلق',
          'approved': 'موافق عليه',
          'completed': 'مكتمل',
          'cancelled': 'ملغي'
        };
        const statusColors = {
          'pending': 'bg-yellow-100 text-yellow-800',
          'approved': 'bg-blue-100 text-blue-800',
          'completed': 'bg-green-100 text-green-800',
          'cancelled': 'bg-red-100 text-red-800'
        };
        return (
          <div className={`px-2 py-1 rounded text-sm ${statusColors[value] || 'bg-gray-100 text-gray-800'}`}>
            {statusLabels[value] || value}
          </div>
        );
      }
    },
    {
      header: 'الإجراءات',
      accessor: 'id',
      render: (value, row) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedDisposal(row);
              setShowDetailsModal(true);
            }}
          >
            تفاصيل
          </Button>
          {row.status === 'pending' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleApproveDisposal(value)}
              className="text-blue-600 hover:text-blue-700"
            >
              موافقة
            </Button>
          )}
        </div>
      )
    }
  ];

  // إجراء التصرف
  const handleDisposal = () => {
    if (!disposalData.assetId || !disposalData.disposalMethod || !disposalData.disposalDate) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const asset = fixedAssets.find(a => a.id === disposalData.assetId);
    if (!asset) {
      alert('الأصل غير موجود');
      return;
    }

    const disposal = {
      ...disposalData,
      id: Date.now().toString(),
      disposalValue: parseFloat(disposalData.disposalValue) || 0,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    disposeAsset(disposal);
    
    // تحديث حالة الأصل
    updateFixedAsset(asset.id, { 
      status: disposalData.disposalMethod === 'transfer' ? 'Transferred' : 'Disposed' 
    });

    setShowDisposalModal(false);
    setDisposalData({
      assetId: '',
      disposalMethod: 'sale',
      disposalDate: new Date().toISOString().split('T')[0],
      disposalValue: '',
      disposalReason: '',
      buyerName: '',
      buyerContact: '',
      disposalNotes: '',
      approvedBy: '',
      approvalDate: ''
    });
  };

  // إجراء النقل
  const handleTransfer = () => {
    if (!transferData.assetId || !transferData.fromLocationId || !transferData.toLocationId || !transferData.transferDate) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (transferData.fromLocationId === transferData.toLocationId) {
      alert('الموقع الحالي والوجهة يجب أن يكونا مختلفين');
      return;
    }

    const transfer = {
      ...transferData,
      id: Date.now().toString(),
      status: 'completed',
      createdAt: new Date().toISOString()
    };

    transferAsset(transfer);
    
    // تحديث موقع الأصل
    updateFixedAsset(transferData.assetId, { locationId: transferData.toLocationId });

    setShowTransferModal(false);
    setTransferData({
      assetId: '',
      fromLocationId: '',
      toLocationId: '',
      transferDate: new Date().toISOString().split('T')[0],
      transferReason: '',
      transferredBy: '',
      receivedBy: '',
      transferNotes: ''
    });
  };

  // الموافقة على التصرف
  const handleApproveDisposal = (disposalId) => {
    if (window.confirm('هل أنت متأكد من الموافقة على هذا التصرف؟')) {
      // تحديث حالة التصرف إلى "موافق عليه"
      const updatedDisposals = assetDisposals.map(disposal => 
        disposal.id === disposalId 
          ? { ...disposal, status: 'approved', approvalDate: new Date().toISOString() }
          : disposal
      );
      
      // حفظ في localStorage
      localStorage.setItem('assetDisposals', JSON.stringify(updatedDisposals));
      
      alert('تم الموافقة على التصرف بنجاح');
    }
  };

  const stats = getDisposalStats();
  const assetsForDisposal = getAssetsForDisposal();

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">التصرف في الأصول</h1>
          <p className="mt-1 text-sm text-gray-500">
            إدارة عملية التصرف في الأصول الثابتة المنتهية الصلاحية
          </p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={() => setShowTransferModal(true)} variant="outline">
            نقل أصل
          </Button>
          <Button onClick={() => setShowDisposalModal(true)}>
            التصرف في أصل
          </Button>
        </div>
      </div>

      {/* إحصائيات التصرف */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-500">إجمالي التصرفات</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDisposals}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 12v4m-4 4h.01M16 4h.01M20 8h-6a2 2 0 00-2 2v10a2 2 0 002 2h6a2 2 0 002-2V10a2 2 0 00-2-2z" />
                </svg>
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-500">هذا العام</p>
                <p className="text-2xl font-bold text-gray-900">{stats.thisYearDisposals}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-500">القيمة الإجمالية</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalValue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-500">هذا العام</p>
                <p className="text-2xl font-bold text-gray-900">{stats.thisYearValue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* توزيع طرق التصرف */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">توزيع طرق التصرف</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(stats.methodDistribution).map(([method, count]) => {
              const methodLabels = {
                'sale': 'بيع',
                'donation': 'تبرع',
                'scrap': 'خردة',
                'transfer': 'نقل',
                'write-off': 'شطب'
              };
              const methodColors = {
                'sale': 'bg-green-100 text-green-800',
                'donation': 'bg-blue-100 text-blue-800',
                'scrap': 'bg-gray-100 text-gray-800',
                'transfer': 'bg-yellow-100 text-yellow-800',
                'write-off': 'bg-red-100 text-red-800'
              };
              const percentage = stats.totalDisposals > 0 ? ((count / stats.totalDisposals) * 100).toFixed(1) : 0;
              return (
                <div key={method} className={`p-4 rounded-lg ${methodColors[method] || 'bg-gray-100'}`}>
                  <div className="text-sm font-medium">{methodLabels[method] || method}</div>
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-xs">{percentage}%</div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* الأصول المقترحة للتصرف */}
      {assetsForDisposal.length > 0 && (
        <Card>
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-orange-100 rounded-full mr-3">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 17.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-orange-600">أصول مقترحة للتصرف (عمرها افتراضي منتهي)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assetsForDisposal.map(asset => {
                const purchaseYear = new Date(asset.purchaseDate).getFullYear();
                const currentYear = new Date().getFullYear();
                const yearsUsed = currentYear - purchaseYear;
                const depreciation = calculateDepreciation(asset.id, asset.depreciationMethod || 'straight-line');
                const currentValue = (asset.originalValue || 0) - (depreciation?.totalDepreciation || 0);
                
                return (
                  <div key={asset.id} className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                    <div className="font-medium text-orange-900">{asset.name}</div>
                    <div className="text-sm text-orange-700 mt-1">
                      المستخدم: {yearsUsed} سنة من {asset.usefulLife}
                    </div>
                    <div className="text-sm text-orange-600 mt-1">
                      القيمة الحالية: {currentValue.toLocaleString()} ريال
                    </div>
                    <div className="text-xs text-orange-500 mt-1">
                      {asset.depreciationMethod === 'straight-line' ? 'القسط الثابت' :
                       asset.depreciationMethod === 'declining-balance' ? 'الرصيد المتناقص' :
                       asset.depreciationMethod === 'units-of-production' ? 'وحدات الإنتاج' : 'غير محدد'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* شريط البحث والفلترة */}
      <Card>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                البحث
              </label>
              <input
                type="text"
                placeholder="البحث في التصرفات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                طريقة التصرف
              </label>
              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">جميع الطرق</option>
                <option value="sale">بيع</option>
                <option value="donation">تبرع</option>
                <option value="scrap">خردة</option>
                <option value="transfer">نقل</option>
                <option value="write-off">شطب</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الحالة
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">جميع الحالات</option>
                <option value="pending">معلق</option>
                <option value="approved">موافق عليه</option>
                <option value="completed">مكتمل</option>
                <option value="cancelled">ملغي</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilterMethod('');
                  setFilterStatus('');
                }}
              >
                مسح الفلاتر
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* جدول التصرفات */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              سجل التصرفات ({filteredDisposals.length})
            </h3>
          </div>
          <Table
            columns={disposalColumns}
            data={filteredDisposals}
            searchable={false}
            maxHeight="600px"
          />
        </div>
      </Card>

      {/* نموذج التصرف */}
      <Modal
        isOpen={showDisposalModal}
        onClose={() => setShowDisposalModal(false)}
        title="التصرف في أصل"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الأصل *
              </label>
              <select
                value={disposalData.assetId}
                onChange={(e) => {
                  setDisposalData({...disposalData, assetId: e.target.value});
                  // تحديد الموقع الحالي
                  const asset = fixedAssets.find(a => a.id === e.target.value);
                  if (asset) {
                    setTransferData({
                      ...transferData,
                      fromLocationId: asset.locationId || ''
                    });
                  }
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                <option value="">اختر الأصل</option>
                {fixedAssets
                  .filter(asset => asset.status === 'Active')
                  .map(asset => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                طريقة التصرف *
              </label>
              <select
                value={disposalData.disposalMethod}
                onChange={(e) => setDisposalData({...disposalData, disposalMethod: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                <option value="sale">بيع</option>
                <option value="donation">تبرع</option>
                <option value="scrap">خردة</option>
                <option value="write-off">شطب</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تاريخ التصرف *
              </label>
              <input
                type="date"
                value={disposalData.disposalDate}
                onChange={(e) => setDisposalData({...disposalData, disposalDate: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                قيمة التصرف
              </label>
              <input
                type="number"
                value={disposalData.disposalValue}
                onChange={(e) => setDisposalData({...disposalData, disposalValue: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="ريال"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              سبب التصرف *
            </label>
            <textarea
              value={disposalData.disposalReason}
              onChange={(e) => setDisposalData({...disposalData, disposalReason: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              rows={2}
              placeholder="السبب في التصرف..."
              required
            />
          </div>
          
          {disposalData.disposalMethod === 'sale' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم المشتري
                </label>
                <input
                  type="text"
                  value={disposalData.buyerName}
                  onChange={(e) => setDisposalData({...disposalData, buyerName: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="اسم المشتري أو الشركة..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  بيانات الاتصال
                </label>
                <input
                  type="text"
                  value={disposalData.buyerContact}
                  onChange={(e) => setDisposalData({...disposalData, buyerContact: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="رقم الهاتف أو البريد الإلكتروني..."
                />
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              موافق عليه من
            </label>
            <input
              type="text"
              value={disposalData.approvedBy}
              onChange={(e) => setDisposalData({...disposalData, approvedBy: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="اسم المسؤول..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ملاحظات إضافية
            </label>
            <textarea
              value={disposalData.disposalNotes}
              onChange={(e) => setDisposalData({...disposalData, disposalNotes: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              rows={2}
              placeholder="أي ملاحظات إضافية..."
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDisposalModal(false)}
            >
              إلغاء
            </Button>
            <Button onClick={handleDisposal}>
              تسجيل التصرف
            </Button>
          </div>
        </div>
      </Modal>

      {/* نموذج النقل */}
      <Modal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        title="نقل أصل"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الأصل *
              </label>
              <select
                value={transferData.assetId}
                onChange={(e) => {
                  setTransferData({...transferData, assetId: e.target.value});
                  // تحديد الموقع الحالي
                  const asset = fixedAssets.find(a => a.id === e.target.value);
                  if (asset) {
                    setTransferData({
                      ...transferData,
                      assetId: e.target.value,
                      fromLocationId: asset.locationId || ''
                    });
                  }
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                <option value="">اختر الأصل</option>
                {fixedAssets
                  .filter(asset => asset.status === 'Active')
                  .map(asset => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تاريخ النقل *
              </label>
              <input
                type="date"
                value={transferData.transferDate}
                onChange={(e) => setTransferData({...transferData, transferDate: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الموقع الحالي
              </label>
              <select
                value={transferData.fromLocationId}
                onChange={(e) => setTransferData({...transferData, fromLocationId: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                disabled
              >
                <option value="">اختر الأصل أولاً</option>
                {assetLocations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الموقع الجديد *
              </label>
              <select
                value={transferData.toLocationId}
                onChange={(e) => setTransferData({...transferData, toLocationId: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                <option value="">اختر الموقع</option>
                {assetLocations
                  .filter(location => location.id !== transferData.fromLocationId)
                  .map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              سبب النقل *
            </label>
            <textarea
              value={transferData.transferReason}
              onChange={(e) => setTransferData({...transferData, transferReason: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              rows={2}
              placeholder="السبب في نقل الأصل..."
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                منقول بواسطة
              </label>
              <input
                type="text"
                value={transferData.transferredBy}
                onChange={(e) => setTransferData({...transferData, transferredBy: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="اسم المسؤول عن النقل..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                مستلم بواسطة
              </label>
              <input
                type="text"
                value={transferData.receivedBy}
                onChange={(e) => setTransferData({...transferData, receivedBy: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="اسم المستقبل..."
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ملاحظات النقل
            </label>
            <textarea
              value={transferData.transferNotes}
              onChange={(e) => setTransferData({...transferData, transferNotes: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              rows={2}
              placeholder="أي ملاحظات حول النقل..."
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowTransferModal(false)}
            >
              إلغاء
            </Button>
            <Button onClick={handleTransfer}>
              تسجيل النقل
            </Button>
          </div>
        </div>
      </Modal>

      {/* نموذج تفاصيل التصرف */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="تفاصيل التصرف"
        size="lg"
      >
        {selectedDisposal && (
          <div className="space-y-6">
            <Card>
              <div className="p-4">
                <h4 className="font-medium text-gray-900 mb-3">معلومات التصرف</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">الأصل:</span>
                    <span className="mr-2 font-medium">
                      {fixedAssets.find(a => a.id === selectedDisposal.assetId)?.name || 'غير محدد'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">طريقة التصرف:</span>
                    <span className="mr-2 font-medium">
                      {selectedDisposal.disposalMethod === 'sale' ? 'بيع' :
                       selectedDisposal.disposalMethod === 'donation' ? 'تبرع' :
                       selectedDisposal.disposalMethod === 'scrap' ? 'خردة' :
                       selectedDisposal.disposalMethod === 'write-off' ? 'شطب' : selectedDisposal.disposalMethod}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">تاريخ التصرف:</span>
                    <span className="mr-2 font-medium">
                      {new Date(selectedDisposal.disposalDate).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">قيمة التصرف:</span>
                    <span className="mr-2 font-medium">
                      {selectedDisposal.disposalValue?.toLocaleString() || 0} ريال
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">الحالة:</span>
                    <span className="mr-2 font-medium">
                      {selectedDisposal.status === 'pending' ? 'معلق' :
                       selectedDisposal.status === 'approved' ? 'موافق عليه' :
                       selectedDisposal.status === 'completed' ? 'مكتمل' :
                       selectedDisposal.status === 'cancelled' ? 'ملغي' : selectedDisposal.status}
                    </span>
                  </div>
                  {selectedDisposal.buyerName && (
                    <div>
                      <span className="text-gray-600">المشتري:</span>
                      <span className="mr-2 font-medium">{selectedDisposal.buyerName}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-4">
                <h4 className="font-medium text-gray-900 mb-2">سبب التصرف</h4>
                <p className="text-sm text-gray-600">{selectedDisposal.disposalReason}</p>
              </div>
            </Card>

            {selectedDisposal.disposalNotes && (
              <Card>
                <div className="p-4">
                  <h4 className="font-medium text-gray-900 mb-2">ملاحظات</h4>
                  <p className="text-sm text-gray-600">{selectedDisposal.disposalNotes}</p>
                </div>
              </Card>
            )}
            
            <div className="flex justify-end pt-4">
              <Button onClick={() => setShowDetailsModal(false)}>
                إغلاق
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AssetDisposal;