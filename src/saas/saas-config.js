// ======================================
// SaaS Configuration - إعدادات النظام
// ======================================

const saasConfig = {
  "version": "1.0.0",
  "defaultBackend": "https://main-system.bero.com",
  "fallbackMode": "local",
  "tenantRegistration": {
    "enabled": false,
    "autoApprove": false
  },
  "companies": {
    "demo": {
      "name": "شركة المثال",
      "displayName": "شركة المثال التجارية",
      "logo": "/imgs/demo-logo.png",
      "primaryColor": "#f97316",
      "secondaryColor": "#ea580c",
      "backendUrl": "https://api-demo.bero.com",
      "status": "active",
      "expiryDate": "2025-12-31",
      "settings": {
        "currency": "SAR",
        "language": "ar",
        "timezone": "Asia/Riyadh",
        "dateFormat": "DD/MM/YYYY",
        "decimalSeparator": ".",
        "thousandsSeparator": ","
      }
    },
    "alpha": {
      "name": "شركة ألفا",
      "displayName": "شركة ألفا للتجارة",
      "logo": "/imgs/alpha-logo.png",
      "primaryColor": "#3b82f6",
      "secondaryColor": "#1d4ed8",
      "backendUrl": "https://api-alpha.bero.com",
      "status": "active",
      "expiryDate": "2026-06-30",
      "settings": {
        "currency": "AED",
        "language": "ar",
        "timezone": "Asia/Dubai",
        "dateFormat": "DD/MM/YYYY",
        "decimalSeparator": ".",
        "thousandsSeparator": ","
      }
    },
    "beta": {
      "name": "شركة بيتا",
      "displayName": "شركة بيتا للصناعات",
      "logo": "/imgs/beta-logo.png",
      "primaryColor": "#10b981",
      "secondaryColor": "#059669",
      "backendUrl": "https://api-beta.bero.com",
      "status": "active",
      "expiryDate": "2026-03-15",
      "settings": {
        "currency": "SAR",
        "language": "ar",
        "timezone": "Asia/Riyadh",
        "dateFormat": "DD/MM/YYYY",
        "decimalSeparator": ".",
        "thousandsSeparator": ","
      }
    }
  },
  "features": {
    "offlineMode": true,
    "syncOnReconnect": true,
    "autoBackup": true,
    "multiCurrency": true,
    "themeCustomization": true,
    "branding": true
  },
  "limits": {
    "maxUsers": 50,
    "maxProducts": 10000,
    "maxWarehouses": 10,
    "maxInvoices": 50000,
    "storageLimit": "5GB"
  },
  "branding": {
    "companyName": "Bero SaaS",
    "supportEmail": "support@bero.com",
    "website": "https://www.bero.com",
    "termsOfService": "https://www.bero.com/terms",
    "privacyPolicy": "https://www.bero.com/privacy"
  }
};

export default saasConfig;