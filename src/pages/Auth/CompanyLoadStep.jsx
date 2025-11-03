// ======================================
// Company Load Step - شاشة تحميل إعدادات المؤسسة
// ======================================

import React, { useEffect, useState } from 'react';
import { useSaaSAuth } from '../../context/SaaSAuthContext';
import { FaSpinner, FaBuilding, FaCheckCircle, FaPalette, FaIdCard } from 'react-icons/fa';

const CompanyLoadStep = () => {
  const { selectedCompany, proceedToPasswordInput } = useSaaSAuth();
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('initializing');

  useEffect(() => {
    if (!selectedCompany) return;

    const steps = [
      { name: 'initializing', duration: 800 },
      { name: 'loading_config', duration: 1200 },
      { name: 'loading_branding', duration: 1000 },
      { name: 'loading_theme', duration: 800 },
      { name: 'complete', duration: 500 }
    ];

    let currentStepIndex = 0;
    let progress = 0;

    const runStep = () => {
      const step = steps[currentStepIndex];
      setCurrentStep(step.name);

      const stepProgress = (currentStepIndex / steps.length) * 100;
      
      const interval = setInterval(() => {
        progress += 2;
        const stepProgressValue = ((progress - stepProgress) / (100 / steps.length)) * 100;
        setLoadingProgress(Math.min(stepProgress + stepProgressValue, 100));

        if (progress >= (currentStepIndex + 1) * (100 / steps.length)) {
          clearInterval(interval);
          
          if (currentStepIndex < steps.length - 1) {
            currentStepIndex++;
            setTimeout(runStep, 200);
          } else {
            // انتظار لمدة ثانيتين ثم الانتقال
            setTimeout(() => {
              proceedToPasswordInput();
            }, 2000);
          }
        }
      }, 30);
    };

    runStep();
  }, [selectedCompany, proceedToPasswordInput]);

  const getStepIcon = (stepName) => {
    switch (stepName) {
      case 'initializing':
        return <FaSpinner className="animate-spin text-blue-500" size={20} />;
      case 'loading_config':
        return <FaIdCard className="text-green-500" size={20} />;
      case 'loading_branding':
        return <FaBuilding className="text-purple-500" size={20} />;
      case 'loading_theme':
        return <FaPalette className="text-orange-500" size={20} />;
      case 'complete':
        return <FaCheckCircle className="text-green-500" size={24} />;
      default:
        return <FaSpinner className="animate-spin text-gray-500" size={20} />;
    }
  };

  const getStepText = (stepName) => {
    switch (stepName) {
      case 'initializing':
        return 'بدء تحميل النظام...';
      case 'loading_config':
        return `تحميل إعدادات ${selectedCompany?.name}...`;
      case 'loading_branding':
        return 'تطبيق شعار الشركة...';
      case 'loading_theme':
        return 'تخصيص ألوان الواجهة...';
      case 'complete':
        return 'تم التحميل بنجاح!';
      default:
        return 'جاري التحميل...';
    }
  };

  if (!selectedCompany) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-orange-500 mx-auto mb-4" size={48} />
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${selectedCompany.accentColor}20, ${selectedCompany.secondaryColor}15, ${selectedCompany.primaryColor}10)`
      }}
    >
      {/* Background Elements with Company Colors */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute w-96 h-96 rounded-full opacity-10 animate-pulse"
          style={{
            background: `radial-gradient(circle, ${selectedCompany.primaryColor}, ${selectedCompany.secondaryColor})`,
            top: '-48px',
            right: '-48px'
          }}
        ></div>
        
        <div 
          className="absolute w-80 h-80 rounded-full opacity-8 animate-pulse"
          style={{
            background: `radial-gradient(circle, ${selectedCompany.secondaryColor}, ${selectedCompany.primaryColor})`,
            bottom: '-40px',
            left: '-40px',
            animationDelay: '1s'
          }}
        ></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Main Loading Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-sm border-2" 
             style={{ borderColor: `${selectedCompany.primaryColor}30` }}>
          
          {/* Company Header */}
          <div className="text-center mb-8">
            {/* Company Logo Placeholder */}
            <div 
              className="relative inline-block mb-4 w-20 h-20 rounded-2xl flex items-center justify-center text-white shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${selectedCompany.primaryColor}, ${selectedCompany.secondaryColor})`
              }}
            >
              <FaBuilding className="text-3xl" />
            </div>
            
            <h2 className="text-2xl font-bold mb-2" style={{ color: selectedCompany.secondaryColor }}>
              {selectedCompany.name}
            </h2>
            <p className="text-gray-600 text-sm mb-1">{selectedCompany.description}</p>
            <div className="flex items-center justify-center gap-2 text-xs">
              <span 
                className="px-2 py-1 rounded-full text-white"
                style={{ backgroundColor: selectedCompany.primaryColor }}
              >
                {selectedCompany.plan === 'premium' ? 'خطة متميزة' : 
                 selectedCompany.plan === 'standard' ? 'خطة قياسية' : 'نسخة تجريبية'}
              </span>
            </div>
          </div>

          {/* Loading Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">
                {getStepText(currentStep)}
              </span>
              <span className="text-sm text-gray-500">{Math.round(loadingProgress)}%</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div 
                className="h-3 rounded-full transition-all duration-300 ease-out"
                style={{
                  width: `${loadingProgress}%`,
                  background: `linear-gradient(90deg, ${selectedCompany.primaryColor}, ${selectedCompany.secondaryColor})`
                }}
              ></div>
            </div>
            
            {/* Current Step */}
            <div className="flex items-center gap-3 justify-center">
              {getStepIcon(currentStep)}
              <span className="text-sm text-gray-600">{getStepText(currentStep)}</span>
            </div>
          </div>

          {/* Loading Steps */}
          <div className="space-y-3">
            {[
              { name: 'initializing', label: 'بدء التشغيل' },
              { name: 'loading_config', label: 'تحميل الإعدادات' },
              { name: 'loading_branding', label: 'تطبيق الهوية' },
              { name: 'loading_theme', label: 'تخصيص الواجهة' },
              { name: 'complete', label: 'الإنجاز' }
            ].map((step, index) => {
              const isActive = currentStep === step.name;
              const isCompleted = ['initializing', 'loading_config', 'loading_branding', 'loading_theme', 'complete'].indexOf(currentStep) > index;
              
              return (
                <div 
                  key={step.name}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-300 ${
                    isActive ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isCompleted ? 'bg-green-100' : isActive ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    {isCompleted ? (
                      <FaCheckCircle className="text-green-500" size={14} />
                    ) : isActive ? (
                      getStepIcon(step.name)
                    ) : (
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    )}
                  </div>
                  <span className={`text-sm ${
                    isActive ? 'font-medium text-gray-800' : 
                    isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Company Theme Preview */}
          {currentStep === 'complete' && (
            <div className="mt-8 p-4 rounded-xl" style={{ backgroundColor: `${selectedCompany.accentColor}50` }}>
              <h4 className="text-sm font-semibold mb-2" style={{ color: selectedCompany.secondaryColor }}>
                معاينة ألوان المؤسسة
              </h4>
              <div className="flex gap-2">
                <div 
                  className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: selectedCompany.primaryColor }}
                  title="اللون الأساسي"
                ></div>
                <div 
                  className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: selectedCompany.secondaryColor }}
                  title="اللون الثانوي"
                ></div>
                <div 
                  className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: selectedCompany.accentColor }}
                  title="لون التمييز"
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>جاري تحضير نظام إدارة المخازن الخاص بك...</p>
        </div>
      </div>
    </div>
  );
};

export default CompanyLoadStep;