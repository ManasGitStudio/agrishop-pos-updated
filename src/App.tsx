import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Check,
  X,
  Search,
  Plus,
  Trash2,
  Printer,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Shield,
  Store,
  ShoppingCart,
  Users,
  Package,
  Settings,
  Sun,
  Moon,
  Camera,
  Upload,
  Share2,
  Send,
  Phone,
  MapPin,
  IndianRupee,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  FileText
} from 'lucide-react';

const SafeStorage = {
  get: (key, fallback) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  },
  set: (key, val) => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.warn('Storage quota exceeded or unavailable', e);
    }
  }
};

const formatINR = (num) => {
  const n = Number(num) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(n);
};

const round2 = (num) => Math.round((Number(num) || 0) * 100) / 100;

const DEFAULT_PIN = '1234';

const MaskUtils = {
  maskMoney: (val, isMasked) => {
    if (!isMasked) return formatINR(val);
    return '₹ ••••••';
  },
  maskPhone: (phone, isMasked) => {
    if (!isMasked || !phone) return phone || 'N/A';
    const str = String(phone).replace(/\D/g, '');
    if (str.length < 6) return '••••••';
    return `${str.slice(0, 2)}••••${str.slice(-4)}`;
  },
  maskText: (text, isMasked) => {
    if (!isMasked || !text) return text;
    return '••••••••';
  }
};

const DEFAULT_PROFILE = {
  shopName: 'De Fertilizer',
  shopNameBn: 'দে ফার্টিলাইজার',
  ownerName: 'Subrata De',
  phone: '9832109876',
  licenseNo: 'WB/AGR/FERT/2024/8892',
  address: 'Station Road, Memari, Purba Bardhaman, WB 713146',
  upiId: 'subratade@oksbi'
};

const TRANSLATIONS = {
  en: {
    shopSubtitle: 'Fertilizers, Seeds & Plant Protection Chemicals',
    dashboard: 'Dashboard',
    sales: 'Sales Ledger',
    customers: 'Farmers Khata',
    products: 'Products & Rates',
    settings: 'Store Profile',
    newSale: 'Record Sale',
    scanSlip: 'Scan Slip',
    totalSales: "Today's Gross Sales",
    totalBills: 'Bills Issued',
    activeKhata: 'Pending Farmer Dues',
    inStock: 'Items in Stock',
    recentTransactions: 'Recent Transactions',
    customer: 'Farmer Name',
    grandTotal: 'Grand Total',
    paid: 'Paid Amount',
    due: 'Balance Due',
    actions: 'Actions',
    cash: 'Cash',
    online: 'Online UPI',
    khataDue: 'Credit / Due',
    unmask: 'Unmasked',
    masked: 'Masked (PIN)',
    enterPin: 'Enter Master PIN',
    pinPlaceholder: '4-digit PIN',
    unlock: 'Unlock',
    cancel: 'Cancel',
    save: 'Save & Print',
    clear: 'Clear',
    whatsappBill: 'Share WhatsApp Bill',
    sendReminder: 'Send Due Notice',
    searchPlaceholder: 'Search farmers, products or diseases...',
    voidSale: 'Void Sale',
    roleOwner: 'Owner',
    roleStaff: 'Staff'
  },
  bn: {
    shopSubtitle: 'সার, কীটনাশক ও আধুনিক কৃষি সুরক্ষা কেন্দ্র',
    dashboard: 'ড্যাশবোর্ড',
    sales: 'বিক্রয় খাতা',
    customers: 'কৃষক ও বাকি খাতা',
    products: 'পণ্য ও বর্তমান দর',
    settings: 'দোকানের তথ্য',
    newSale: 'নতুন বিক্রয়',
    scanSlip: 'চিরকুট স্ক্যান',
    totalSales: 'আজকের মোট বিক্রি',
    totalBills: 'মোট মেমো সংখ্যা',
    activeKhata: 'বকেয়া বাকি (খাতা)',
    inStock: 'মজুত পণ্য',
    recentTransactions: 'সাম্প্রতিক লেনদেন',
    customer: 'কৃষকের নাম',
    grandTotal: 'সর্বমোট মূল্য',
    paid: 'পরিশোধিত টাকা',
    due: 'বাকি টাকা',
    actions: 'পদক্ষেপ',
    cash: 'ন নগদ টাকা',
    online: 'অনলাইন ইউপিআই',
    khataDue: 'বাকি / খাতা',
    unmask: 'উন্মুক্ত মান',
    masked: 'গোপনীয় (পিন)',
    enterPin: 'মাস্টার পিন দিন',
    pinPlaceholder: '৪-সংখ্যার পিন',
    unlock: 'আনলক করুন',
    cancel: 'বাতিল',
    save: 'সংরক্ষণ ও প্রিন্ট',
    clear: 'মুছুন',
    whatsappBill: 'হোয়াটসঅ্যাপ মেমো',
    sendReminder: 'বাকির নোটিশ পাঠান',
    searchPlaceholder: 'কৃষক, পণ্য বা রোগের নাম দিয়ে খুঁজুন...',
    voidSale: 'বিল বাতিল',
    roleOwner: 'মালিক',
    roleStaff: 'কর্মী'
  }
};

const RAW_CUSTOMERS = [
  ['c1', 'Rajesh Mondal', '9832145670', 'Memari, Purba Bardhaman', 'Paddy & Potato specialist - 6 Acres'],
  ['c2', 'Balaram Ghosh', '9734512389', 'Rasulpur, Purba Bardhaman', 'Boro Paddy & Mustard grower - 4 Acres'],
  ['c3', 'Pradip Kumar Roy', '9434098712', 'Satgachia, Bardhaman', 'Aman Paddy, Chilli & Vegetables'],
  ['c4', 'Tapan Santra', '9800123456', 'Palla Road, Hooghly', 'Commercial Potato seed producer'],
  ['c5', 'Nirmal Majhi', '9647890123', 'Bagnan, Howrah', 'Paddy & Jute cultivator - 3 Acres'],
  ['c6', 'Haradhan Malik', '9832987654', 'Uchalan, Bardhaman', 'Basmati & Swarna Paddy - 8 Acres'],
  ['c7', 'Sukumar Pal', '9733456789', 'Jamalpur, Bardhaman', 'Pointed Gourd (Potal) & Bitter Gourd'],
  ['c8', 'Ananta Das', '9474123890', 'Tarakeswar, Hooghly', 'Potato, Cauliflower & Cabbage'],
  ['c9', 'Subhas Mukherjee', '9832567890', 'Dainhat, Katwa', 'Boro Paddy & Sesame (Til)'],
  ['c10', 'Bikash Murmu', '9641234567', 'Guskara, Bardhaman', 'Organic Paddy & Mustard farming']
];

const SEED_CUSTOMERS = RAW_CUSTOMERS.map(([id, name, mobile, village, notes]) => ({
  id,
  name,
  mobile,
  village,
  notes
}));

const RAW_PRODUCTS = [
  ['p1', 'Neem Coated Urea 46% N', 'Inorganic Fertilizers', 'IFFCO', 266.5, '45 Kg Bag', 240, 'Vegetative growth & severe Nitrogen chlorosis in all field crops'],
  ['p2', 'DAP (Di-Ammonium Phosphate 18:46:0)', 'Inorganic Fertilizers', 'IFFCO', 1350.0, '50 Kg Bag', 180, 'Basal root establishment & tillering in Paddy, Wheat and Mustard'],
  ['p3', 'MOP (Muriate of Potash 60% K2O)', 'Inorganic Fertilizers', 'IPL', 1700.0, '50 Kg Bag', 95, 'Grain filling, pest tolerance and drought resistance in crops'],
  ['p4', 'NPK 10:26:26 Complex', 'Inorganic Fertilizers', 'IFFCO', 1470.0, '50 Kg Bag', 110, 'Root development & high potassium requirement in Potato, Sugarcane'],
  ['p5', 'NPK 12:32:16 Complex', 'Inorganic Fertilizers', 'IFFCO', 1470.0, '50 Kg Bag', 125, 'Balanced primary nutrition for Basmati, Cotton and Pulses'],
  ['p25', 'Coragen (Chlorantraniliprole 18.5% SC)', 'Insecticides', 'FMC', 1850.0, '150 ml Bottle', 60, 'Yellow stem borer & leaf folder in Paddy; fruit borer in Tomato'],
  ['p26', 'Coragen 60 ml', 'Insecticides', 'FMC', 790.0, '60 ml Bottle', 90, 'Early shoot borer in Sugarcane and DBM in Cabbage/Cauliflower'],
  ['p18', 'Zinc Sulphate Heptahydrate 21%', 'Micronutrients', 'Multiplex', 85.0, '1 Kg Pack', 150, 'Khaira disease in Paddy, interveinal leaf chlorosis and stunted growth']
];

const SEED_PRODUCTS = RAW_PRODUCTS.map(([id, name, category, brand, sellingPrice, unit, stockQty, cropProblem]) => ({
  id,
  name,
  category,
  brand,
  sellingPrice,
  unit,
  stockQty,
  cropProblem
}));

const SEED_SALES = [
  {
    id: 'BILL-1001',
    date: '2026-09-26',
    time: '10:15 AM',
    customerId: 'c1',
    customerName: 'Rajesh Mondal',
    customerMobile: '9832145670',
    customerVillage: 'Memari, Purba Bardhaman',
    items: [
      { productId: 'p1', productName: 'Neem Coated Urea 46% N', brand: 'IFFCO', unit: '45 Kg Bag', qty: 2, price: 266.5, lineTotal: 533.0 },
      { productId: 'p2', productName: 'DAP (Di-Ammonium Phosphate 18:46:0)', brand: 'IFFCO', unit: '50 Kg Bag', qty: 1, price: 1350.0, lineTotal: 1350.0 }
    ],
    grandTotal: 1883.0,
    paidAmount: 1883.0,
    dueAmount: 0.0,
    paymentMode: 'Cash',
    notes: 'Boro seedbed preparation'
  },
  {
    id: 'BILL-1002',
    date: '2026-09-26',
    time: '11:40 AM',
    customerId: 'c2',
    customerName: 'Balaram Ghosh',
    customerMobile: '9734512389',
    customerVillage: 'Rasulpur, Purba Bardhaman',
    items: [
      { productId: 'p25', productName: 'Coragen 150 ml', brand: 'FMC', unit: '150 ml Bottle', qty: 1, price: 1850.0, lineTotal: 1850.0 },
      { productId: 'p18', productName: 'Zinc Sulphate Heptahydrate 21%', brand: 'Multiplex', unit: '1 Kg Pack', qty: 2, price: 85.0, lineTotal: 170.0 }
    ],
    grandTotal: 2020.0,
    paidAmount: 1000.0,
    dueAmount: 1020.0,
    paymentMode: 'Online UPI',
    notes: 'Stem borer outbreak; balance promised after harvesting'
  }
];

const WhatsAppService = {
  cleanPhone: (num) => {
    if (!num) return '';
    let digits = String(num).replace(/\D/g, '');
    if (digits.length === 10) digits = '91' + digits;
    return digits;
  },
  generateInvoiceLink: (sale, shopProfile) => {
    const phone = WhatsAppService.cleanPhone(sale.customerMobile);
    if (!phone) return null;

    let text = `*🌾 ${shopProfile.shopName.toUpperCase()} 🌾*\n`;
    text += `${shopProfile.address}\n`;
    text += `Phone: ${shopProfile.phone} | Lic: ${shopProfile.licenseNo}\n`;
    text += `--------------------------------\n`;
    text += `*DIGITAL CASH MEMO / ডিজিটাল মেমো*\n`;
    text += `*Bill No:* ${sale.id}\n`;
    text += `*Date:* ${sale.date} ${sale.time || ''}\n`;
    text += `*Customer:* ${sale.customerName} (${sale.customerVillage || 'N/A'})\n`;
    text += `--------------------------------\n`;
    text += `*ITEMS PURCHASED:*\n`;

    sale.items.forEach((it, idx) => {
      text += `${idx + 1}. *${it.productName}*\n`;
      text += `   Qty: ${it.qty} ${it.unit} × ₹${it.price} = *₹${it.lineTotal}*\n`;
    });

    text += `--------------------------------\n`;
    text += `*Grand Total:* ₹${sale.grandTotal}\n`;
    text += `*Paid Amount (${sale.paymentMode}):* ₹${sale.paidAmount}\n`;

    if (sale.dueAmount > 0) {
      text += `*⚠️ Balance Due (বাকি):* ₹${sale.dueAmount}\n`;
      text += `_Please settle the balance at your earliest convenience._\n`;
    } else {
      text += `*Payment Status:* Fully Paid (পরিশোধিত) ✅\n`;
    }

    text += `--------------------------------\n`;
    text += `Thank you for your visit! Wishing you high agricultural yield!\nদে ফার্টিলাইজারে আসার জন্য ধন্যবাদ!`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  },
  generateDueReminderLink: (customer, dueAmount, shopProfile) => {
    const phone = WhatsAppService.cleanPhone(customer.mobile);
    if (!phone) return null;

    let text = `*🌾 ${shopProfile.shopName.toUpperCase()} 🌾*\n`;
    text += `Dear *${customer.name}*,\n`;
    text += `This is a friendly reminder that your outstanding Khata balance at De Fertilizer is *₹${dueAmount}*.\n`;
    text += `Kindly clear the balance at your convenience via Cash or UPI at ${shopProfile.upiId}.\n\n`;
    text += `Contact: ${shopProfile.phone}\n`;
    text += `ধন্যবাদ, দে ফার্টিলাইজার`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }
};

function PinVerificationModal({ isOpen, onClose, onVerify, t }) {
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleKeyClick = (val) => {
    setErrorMsg('');
    if (pinInput.length < 6) {
      setPinInput(prev => prev + val);
    }
  };

  const handleBackspace = () => {
    setErrorMsg('');
    setPinInput(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setErrorMsg('');
    setPinInput('');
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!pinInput.trim()) {
      setErrorMsg('Please enter your PIN');
      return;
    }
    const success = onVerify(pinInput);
    if (!success) {
      setErrorMsg('Incorrect PIN! Default is 1234');
      setPinInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xs p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-2">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
            {t.enterPin || 'Enter Security PIN'}
          </h3>
          <p className="text-xs text-slate-500">
            Enter your 4-digit PIN to unmask sensitive rates and khata figures.
          </p>
        </div>

        {/* PIN Dots Display */}
        <div className="flex justify-center items-center gap-3 py-2">
          {[0, 1, 2, 3].map(idx => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                idx < pinInput.length
                  ? 'bg-emerald-600 border-emerald-600 scale-110'
                  : 'border-slate-300 dark:border-slate-700 bg-transparent'
              }`}
            />
          ))}
        </div>

        {errorMsg && (
          <p className="text-[11px] font-bold text-rose-500 text-center animate-pulse">
            {errorMsg}
          </p>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyClick(String(num))}
              className="py-3 text-base font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl active:scale-95 transition"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="py-3 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleKeyClick('0')}
            className="py-3 text-base font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl active:scale-95 transition"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition flex items-center justify-center"
          >
            ⌫
          </button>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-1/2 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          >
            {t.cancel || 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="w-1/2 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition"
          >
            {t.unlock || 'Unlock'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ScanSlipModal({ isOpen, onClose, onApplySale, customers, products, t }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [detectedData, setDetectedData] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target.result);
      processOCR();
    };
    reader.readAsDataURL(file);
  };

  const processOCR = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setDetectedData({
        farmerName: 'Rajesh Mondal',
        matchedCustomer: customers[0],
        items: [
          { product: products[0], qty: 2 },
          { product: products[1], qty: 1 }
        ],
        paymentMode: 'Cash'
      });
    }, 1200);
  };

  const handleApply = () => {
    if (!detectedData) return;
    onApplySale(detectedData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              {t.scanSlip || 'Scan Handwritten Memo / চিরকুট স্ক্যান'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {!selectedImage ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl p-8 text-center cursor-pointer hover:bg-emerald-50 transition space-y-2"
          >
            <Upload className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Click to photograph or upload handwritten slip
            </p>
            <p className="text-[11px] text-slate-500">
              Supports Bengali and English handwriting (চিরকুট / মেমো)
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden max-h-48 border border-slate-200 dark:border-slate-800 bg-slate-100">
              <img src={selectedImage} alt="Uploaded Slip" className="w-full h-full object-cover" />
              <button
                onClick={() => { setSelectedImage(null); setDetectedData(null); }}
                className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {isScanning ? (
              <div className="p-4 text-center space-y-2">
                <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Analyzing handwriting in English & Bengali...
                </p>
              </div>
            ) : detectedData ? (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl space-y-2">
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Detected Farmer: <strong>{detectedData.farmerName}</strong>
                </p>
                <div className="text-[11px] space-y-1 text-slate-700 dark:text-slate-300">
                  {detectedData.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>• {it.product.name}</span>
                      <span className="font-bold">x {it.qty} {it.product.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="w-1/2 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          >
            {t.cancel || 'Cancel'}
          </button>
          <button
            disabled={!detectedData}
            onClick={handleApply}
            className="w-1/2 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded-xl shadow-md transition"
          >
            Create Bill
          </button>
        </div>
      </div>
    </div>
  );
}

function SaleEntryModal({ isOpen, onClose, onSaveSale, customers, products, initialData, t, isMasked }) {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [items, setItems] = useState([
    { productId: products[0]?.id || '', qty: 1, price: products[0]?.sellingPrice || 0 }
  ]);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paidAmount, setPaidAmount] = useState(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialData) {
      if (initialData.matchedCustomer) {
        setSelectedCustomerId(initialData.matchedCustomer.id);
      }
      if (initialData.items && initialData.items.length > 0) {
        setItems(
          initialData.items.map(it => ({
            productId: it.product.id,
            qty: it.qty,
            price: it.product.sellingPrice
          }))
        );
      }
    } else {
      setSelectedCustomerId(customers[0]?.id || '');
      setItems([
        { productId: products[0]?.id || '', qty: 1, price: products[0]?.sellingPrice || 0 }
      ]);
    }
  }, [initialData, customers, products, isOpen]);

  const grandTotal = useMemo(() => {
    return items.reduce((acc, it) => acc + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
  }, [items]);

  useEffect(() => {
    setPaidAmount(grandTotal);
  }, [grandTotal]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    const firstProd = products[0];
    setItems(prev => [
      ...prev,
      { productId: firstProd.id, qty: 1, price: firstProd.sellingPrice }
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems(prev => {
      const updated = [...prev];
      if (field === 'productId') {
        const prod = products.find(p => p.id === value);
        updated[index] = {
          ...updated[index],
          productId: value,
          price: prod ? prod.sellingPrice : 0
        };
      } else {
        updated[index] = {
          ...updated[index],
          [field]: value
        };
      }
      return updated;
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === selectedCustomerId) || {
      id: 'walkin',
      name: 'Counter Walk-in',
      mobile: '',
      village: ''
    };

    const finalItems = items.map(it => {
      const prod = products.find(p => p.id === it.productId) || {};
      return {
        productId: it.productId,
        productName: prod.name || 'Product',
        brand: prod.brand || '',
        unit: prod.unit || 'Bag',
        qty: Number(it.qty) || 1,
        price: Number(it.price) || 0,
        lineTotal: round2((Number(it.qty) || 1) * (Number(it.price) || 0))
      };
    });

    const parsedPaid = Math.min(grandTotal, Math.max(0, Number(paidAmount) || 0));
    const dueAmount = round2(grandTotal - parsedPaid);

    const newSale = {
      id: 'BILL-' + Math.floor(1000 + Math.random() * 9000),
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      customerId: cust.id,
      customerName: cust.name,
      customerMobile: cust.mobile,
      customerVillage: cust.village,
      items: finalItems,
      grandTotal: round2(grandTotal),
      paidAmount: parsedPaid,
      dueAmount,
      paymentMode,
      notes
    };

    onSaveSale(newSale);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
              {t.newSale || 'Create New Cash Memo / বিল তৈরি'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Customer Selection */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              {t.customer || 'Select Farmer / কৃষক নির্বাচন'}
            </label>
            <select
              value={selectedCustomerId}
              onChange={e => setSelectedCustomerId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
            >
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.village} ({MaskUtils.maskPhone(c.mobile, isMasked)})
                </option>
              ))}
            </select>
          </div>

          {/* Line Items List */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Products & Quantities
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-emerald-600 font-bold hover:text-emerald-700 flex items-center gap-1 text-[11px]"
              >
                <Plus className="w-3.5 h-3.5" /> Add Another Product
              </button>
            </div>

            <div className="space-y-2">
              {items.map((it, idx) => {
                const prod = products.find(p => p.id === it.productId);
                return (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-2"
                  >
                    <div className="flex gap-2 items-center">
                      <select
                        value={it.productId}
                        onChange={e => handleItemChange(idx, 'productId', e.target.value)}
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-medium"
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.brand}) — ₹{p.sellingPrice}/{p.unit}
                          </option>
                        ))}
                      </select>

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 items-center">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Quantity</span>
                        <input
                          type="number"
                          min="1"
                          value={it.qty}
                          onChange={e => handleItemChange(idx, 'qty', e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1.5 text-center font-bold text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Rate / Unit</span>
                        <input
                          type="number"
                          step="0.5"
                          value={it.price}
                          onChange={e => handleItemChange(idx, 'price', e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1.5 text-center font-bold text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Subtotal</span>
                        <div className="py-1.5 font-black text-emerald-600 dark:text-emerald-400 text-xs">
                          {formatINR((Number(it.qty) || 0) * (Number(it.price) || 0))}
                        </div>
                      </div>
                    </div>

                    {prod && prod.cropProblem && (
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 italic">
                        <span>🎯 Solves:</span> {prod.cropProblem}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Mode & Splitting */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Payment Mode
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {['Cash', 'Online UPI', 'Credit / Due'].map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setPaymentMode(mode);
                      if (mode === 'Credit / Due') setPaidAmount(0);
                      else setPaidAmount(grandTotal);
                    }}
                    className={`py-2 px-1 text-[11px] font-bold rounded-xl border transition ${
                      paymentMode === mode
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Paid Amount (নগদ বা ইউপিআই)
              </label>
              <input
                type="number"
                step="1"
                value={paidAmount}
                onChange={e => setPaidAmount(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-bold text-slate-900 dark:text-slate-100 text-sm"
              />
            </div>
          </div>

          {/* Summary Box */}
          <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-2xl flex justify-between items-center border border-emerald-200 dark:border-emerald-800/60">
            <div>
              <span className="text-[11px] text-slate-500 block">Grand Total</span>
              <span className="text-base font-black text-slate-900 dark:text-slate-100">
                {formatINR(grandTotal)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500 block">Pending Due (খাতায় বাকি)</span>
              <span className={`text-base font-black ${grandTotal - paidAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {formatINR(Math.max(0, grandTotal - paidAmount))}
              </span>
            </div>
          </div>

          <div>
            <input
              type="text"
              placeholder="Notes or crop details (optional)..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs"
            />
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              {t.cancel || 'Cancel'}
            </button>
            <button
              type="submit"
              className="w-2/3 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition"
            >
              {t.save || 'Save Bill & Print'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InvoiceModal({ sale, onClose, shopProfile, t }) {
  if (!sale) return null;

  const waLink = WhatsAppService.generateInvoiceLink(sale, shopProfile);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center no-print">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Tax Invoice / মেমো #{sale.id}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 text-xs font-mono text-slate-800 dark:text-slate-200 flex-1">
          <div className="text-center border-b border-slate-200 dark:border-slate-700 pb-3">
            <h2 className="font-black text-lg text-emerald-700 dark:text-emerald-400">
              {shopProfile.shopName.toUpperCase()}
            </h2>
            <p className="text-[11px] text-slate-500">{shopProfile.address}</p>
            <p className="text-[10px] text-slate-400">
              Phone: {shopProfile.phone} | Lic: {shopProfile.licenseNo}
            </p>
          </div>

          <div className="flex justify-between text-[11px]">
            <div>
              <p><strong>Bill No:</strong> {sale.id}</p>
              <p><strong>Customer:</strong> {sale.customerName}</p>
              <p className="text-slate-400">{sale.customerVillage}</p>
            </div>
            <div className="text-right">
              <p><strong>Date:</strong> {sale.date}</p>
              <p><strong>Time:</strong> {sale.time}</p>
            </div>
          </div>

          <table className="w-full text-left border-t border-b border-slate-200 dark:border-slate-700 py-2">
            <thead>
              <tr className="text-[10px] uppercase text-slate-400">
                <th className="py-1">Item</th>
                <th className="py-1 text-center">Qty</th>
                <th className="py-1 text-right">Rate</th>
                <th className="py-1 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
              {sale.items?.map((it, idx) => (
                <tr key={idx}>
                  <td className="py-1.5 pr-1">
                    <p className="font-bold">{it.productName}</p>
                    <span className="text-[10px] text-slate-400">{it.brand}</span>
                  </td>
                  <td className="py-1.5 text-center">{it.qty} {it.unit?.split(' ')[0]}</td>
                  <td className="py-1.5 text-right">₹{it.price}</td>
                  <td className="py-1.5 text-right font-bold">₹{it.lineTotal}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="space-y-1 text-right pt-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Grand Total:</span>
              <span className="font-bold text-sm">₹{sale.grandTotal}</span>
            </div>
            <div className="flex justify-between text-emerald-600">
              <span>Paid ({sale.paymentMode}):</span>
              <span className="font-bold">₹{sale.paidAmount}</span>
            </div>
            {sale.dueAmount > 0 && (
              <div className="flex justify-between text-rose-600 font-bold">
                <span>Khata Due (বাকি):</span>
                <span>₹{sale.dueAmount}</span>
              </div>
            )}
          </div>

          <div className="text-center pt-3 text-[10px] text-slate-400 border-t border-slate-200 dark:border-slate-700">
            Thank you for your visit to De Fertilizer!
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex gap-2 no-print">
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>WhatsApp Memo</span>
            </a>
          )}
          <button
            onClick={() => window.print()}
            className="flex-1 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 rounded-xl flex items-center justify-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Memo</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function SalesTable({ sales, onViewInvoice, onVoidSale, t, shopProfile, isMasked }) {
  if (sales.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400">
        <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-30" />
        <p className="text-xs">No sales recorded yet. Click 'Record Sale' above to start.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="hidden md:block overflow-x-auto min-w-full">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4">Bill No</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">{t.customer}</th>
              <th className="py-3 px-4">Items</th>
              <th className="py-3 px-4">{t.grandTotal}</th>
              <th className="py-3 px-4">{t.paid}</th>
              <th className="py-3 px-4">{t.due}</th>
              <th className="py-3 px-4 text-right">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {sales.map(s => {
              const waLink = WhatsAppService.generateInvoiceLink(s, shopProfile);
              return (
                <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                    {s.id}
                  </td>
                  <td className="py-3 px-4 text-slate-500">{s.date}</td>
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900 dark:text-slate-100">{s.customerName}</p>
                    <span className="text-[11px] text-slate-400">
                      {s.customerVillage || MaskUtils.maskPhone(s.customerMobile, isMasked)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {s.items?.length} items ({s.items?.map(it => it.productName.split(' ')[0]).join(', ')})
                  </td>
                  <td className="py-3 px-4 font-black text-slate-900 dark:text-slate-100">
                    {MaskUtils.maskMoney(s.grandTotal, isMasked)}
                  </td>
                  <td className="py-3 px-4 text-emerald-600 font-bold">
                    {MaskUtils.maskMoney(s.paidAmount, isMasked)}
                    <span className="text-[10px] block font-normal text-slate-400">({s.paymentMode})</span>
                  </td>
                  <td className="py-3 px-4">
                    {s.dueAmount > 0 ? (
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        {MaskUtils.maskMoney(s.dueAmount, isMasked)}
                      </span>
                    ) : (
                      <span className="text-slate-400">Paid in Full</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onViewInvoice(s)}
                        title="View & Print Bill"
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      {waLink && (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Share to WhatsApp"
                          className="p-1.5 hover:bg-green-50 dark:hover:bg-green-950/40 rounded-lg text-green-600"
                        >
                          <Send className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => onVoidSale(s.id)}
                        title="Void Sale"
                        className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-rose-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Fallback */}
      <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
        {sales.map(s => (
          <div key={s.id} className="p-3.5 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono font-bold text-xs text-emerald-600">{s.id}</span>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{s.customerName}</h4>
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                {MaskUtils.maskMoney(s.grandTotal, isMasked)}
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Paid: {MaskUtils.maskMoney(s.paidAmount, isMasked)} ({s.paymentMode})</span>
              {s.dueAmount > 0 && (
                <span className="font-bold text-rose-600">Due: {MaskUtils.maskMoney(s.dueAmount, isMasked)}</span>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-1 border-t border-slate-50 dark:border-slate-800/60">
              <button
                onClick={() => onViewInvoice(s)}
                className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" /> View
              </button>
              <button
                onClick={() => onVoidSale(s.id)}
                className="text-[11px] font-bold text-rose-500 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Void
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomersManager({ customers, setCustomers, sales, onQuickSale, onAddCustomer, t, isMasked, shopProfile }) {
  const [search, setSearch] = useState('');

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.mobile.includes(search) ||
    (c.village && c.village.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="font-bold text-xl text-slate-900 dark:text-slate-100">{t.customers}</h2>
          <p className="text-xs text-slate-500">{customers.length} registered farmers</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search farmer or village..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full sm:w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold"
          />
          <button
            onClick={onAddCustomer}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shrink-0 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Farmer</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(c => {
          const customerDues = sales
            .filter(s => s.customerId === c.id)
            .reduce((acc, s) => acc + (Number(s.dueAmount) || 0), 0);

          const reminderLink = customerDues > 0 ? WhatsAppService.generateDueReminderLink(c, customerDues, shopProfile) : null;

          return (
            <div key={c.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{c.name}</h4>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {c.village || 'No village recorded'}
                  </span>
                </div>
                {customerDues > 0 ? (
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-lg">
                    Due: {MaskUtils.maskMoney(customerDues, isMasked)}
                  </span>
                ) : (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg">
                    Clear
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 font-mono flex items-center gap-1">
                <Phone className="w-3 h-3" /> {MaskUtils.maskPhone(c.mobile, isMasked)}
              </p>
              {c.notes && <p className="text-[11px] text-slate-400 italic">🌾 {c.notes}</p>}

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                {reminderLink && (
                  <a
                    href={reminderLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send Notice</span>
                  </a>
                )}
                <button
                  onClick={() => onQuickSale(c)}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 ml-auto"
                >
                  <ShoppingCart className="w-3 h-3" />
                  <span>Create Bill</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProductsManager({ products, setProducts, t, isMasked }) {
  const [search, setSearch] = useState('');

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase()) ||
    (p.cropProblem && p.cropProblem.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="font-bold text-xl text-slate-900 dark:text-slate-100">{t.products}</h2>
          <p className="text-xs text-slate-500">{products.length} catalog items</p>
        </div>
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search crop problem, brand, product..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(p => (
          <div key={p.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{p.category}</span>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{p.name}</h4>
              </div>
              <span className="text-sm font-black text-emerald-600">
                {MaskUtils.maskMoney(p.sellingPrice, isMasked)}
              </span>
            </div>

            <div className="text-xs text-slate-500 flex justify-between">
              <span>Brand: <strong>{p.brand}</strong></span>
              <span>Stock: <strong className={p.stockQty < 10 ? 'text-rose-600' : 'text-slate-800 dark:text-slate-200'}>{p.stockQty} {p.unit}</strong></span>
            </div>

            {p.cropProblem && (
              <div className="text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-xl">
                🎯 <strong>Solves:</strong> {p.cropProblem}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsManager({ profile, setProfile, securityPin, setSecurityPin, showToast, t }) {
  const [shopName, setShopName] = useState(profile.shopName);
  const [licenseNo, setLicenseNo] = useState(profile.licenseNo);
  const [address, setAddress] = useState(profile.address);
  const [phone, setPhone] = useState(profile.phone);
  const [ownerName, setOwnerName] = useState(profile.ownerName);

  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setProfile(prev => ({
      ...prev,
      shopName,
      licenseNo,
      address,
      phone,
      ownerName
    }));
    showToast('Store Profile updated successfully!', 'success');
  };

  const handleUpdatePin = (e) => {
    e.preventDefault();
    if (currentPinInput !== securityPin) {
      showToast('Current PIN is incorrect!', 'error');
      return;
    }
    if (!/^\d{4,6}$/.test(newPinInput)) {
      showToast('New PIN must be 4 to 6 digits!', 'error');
      return;
    }
    if (newPinInput !== confirmPinInput) {
      showToast('New PINs do not match!', 'error');
      return;
    }
    setSecurityPin(newPinInput);
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
    showToast('Master Security PIN updated successfully!', 'success');
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="font-bold text-xl text-slate-900 dark:text-slate-100">{t.settings}</h2>
        <p className="text-xs text-slate-500">Configure your store information, PIN, and security</p>
      </div>

      {/* PIN Management Section */}
      <form onSubmit={handleUpdatePin} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Master Security PIN (Masking & Privacy)</span>
            </h3>
            <p className="text-[11px] text-slate-400">Used to unmask financial amounts, bills, and phone numbers</p>
          </div>
          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-mono text-slate-500">
            Default: 1234
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="font-bold block mb-1">Current PIN *</label>
            <input
              type="password"
              maxLength={6}
              value={currentPinInput}
              onChange={e => setCurrentPinInput(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 1234"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono text-center tracking-widest text-sm"
            />
          </div>
          <div>
            <label className="font-bold block mb-1">New 4-6 Digit PIN *</label>
            <input
              type="password"
              maxLength={6}
              value={newPinInput}
              onChange={e => setNewPinInput(e.target.value.replace(/\D/g, ''))}
              placeholder="New PIN"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono text-center tracking-widest text-sm"
            />
          </div>
          <div>
            <label className="font-bold block mb-1">Confirm New PIN *</label>
            <input
              type="password"
              maxLength={6}
              value={confirmPinInput}
              onChange={e => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
              placeholder="Confirm PIN"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono text-center tracking-widest text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition"
        >
          Update Security PIN
        </button>
      </form>

      {/* Store Profile Form */}
      <form onSubmit={handleSaveProfile} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">
          Store & Counter Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-bold block mb-1">Store Name</label>
            <input
              type="text"
              value={shopName}
              onChange={e => setShopName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-semibold"
            />
          </div>
          <div>
            <label className="font-bold block mb-1">Owner Name</label>
            <input
              type="text"
              value={ownerName}
              onChange={e => setOwnerName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-semibold"
            />
          </div>
          <div>
            <label className="font-bold block mb-1">Contact Phone</label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-semibold"
            />
          </div>
          <div>
            <label className="font-bold block mb-1">Fertilizer License No</label>
            <input
              type="text"
              value={licenseNo}
              onChange={e => setLicenseNo(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-semibold"
            />
          </div>
        </div>

        <div>
          <label className="font-bold block mb-1">Physical Address</label>
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-semibold"
          />
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition"
        >
          Save Store Profile
        </button>
      </form>
    </div>
  );
}

export default function AgriShopApp() {
  const [operatorRole, setOperatorRole] = useState(() => SafeStorage.get('agri_active_role', 'Owner'));
  const [profile, setProfile] = useState(() => SafeStorage.get('agri_profile', DEFAULT_PROFILE));
  const [lang, setLang] = useState(() => SafeStorage.get('agri_lang', 'en'));
  const [theme, setTheme] = useState(() => SafeStorage.get('agri_theme', 'light'));
  const [activeTab, setActiveTab] = useState('dashboard');

  const [isMasked, setIsMasked] = useState(() => SafeStorage.get('agri_data_masked', true));
  const [securityPin, setSecurityPin] = useState(() => SafeStorage.get('agri_master_pin', DEFAULT_PIN));
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  const [customers, setCustomers] = useState(() => SafeStorage.get('agri_customers', SEED_CUSTOMERS));
  const [products, setProducts] = useState(() => SafeStorage.get('agri_products', SEED_PRODUCTS));
  const [sales, setSales] = useState(() => SafeStorage.get('agri_sales', SEED_SALES));

  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scanPrefillData, setScanPrefillData] = useState(null);
  const [viewInvoiceSale, setViewInvoiceSale] = useState(null);
  const [toast, setToast] = useState(null);

  const t = useMemo(() => TRANSLATIONS[lang] || TRANSLATIONS.en, [lang]);

  useEffect(() => { SafeStorage.set('agri_profile', profile); }, [profile]);
  useEffect(() => { SafeStorage.set('agri_customers', customers); }, [customers]);
  useEffect(() => { SafeStorage.set('agri_products', products); }, [products]);
  useEffect(() => { SafeStorage.set('agri_sales', sales); }, [sales]);
  useEffect(() => { SafeStorage.set('agri_lang', lang); }, [lang]);
  useEffect(() => { SafeStorage.set('agri_theme', theme); }, [theme]);
  useEffect(() => { SafeStorage.set('agri_active_role', operatorRole); }, [operatorRole]);
  useEffect(() => { SafeStorage.set('agri_data_masked', isMasked); }, [isMasked]);
  useEffect(() => { SafeStorage.set('agri_master_pin', securityPin); }, [securityPin]);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleMask = () => {
    if (isMasked) {
      setIsPinModalOpen(true);
    } else {
      setIsMasked(true);
      showToast('Privacy Mode Enabled: Values masked', 'info');
    }
  };

  const handleVerifyPin = (enteredPin) => {
    if (enteredPin === securityPin) {
      setIsMasked(false);
      setIsPinModalOpen(false);
      showToast('PIN Verified: All figures unmasked', 'success');
      return true;
    }
    return false;
  };

  const handleSaveSale = (newSale) => {
    setSales(prev => [newSale, ...prev]);

    setProducts(prev =>
      prev.map(p => {
        const soldItem = newSale.items.find(it => it.productId === p.id);
        if (soldItem) {
          return { ...p, stockQty: Math.max(0, p.stockQty - soldItem.qty) };
        }
        return p;
      })
    );

    showToast(`Bill #${newSale.id} recorded successfully!`, 'success');
  };

  const handleVoidSale = (saleId) => {
    const saleToVoid = sales.find(s => s.id === saleId);
    if (!saleToVoid) return;

    setProducts(prev =>
      prev.map(p => {
        const soldItem = saleToVoid.items.find(it => it.productId === p.id);
        if (soldItem) {
          return { ...p, stockQty: p.stockQty + soldItem.qty };
        }
        return p;
      })
    );

    setSales(prev => prev.filter(s => s.id !== saleId));
    showToast(`Sale #${saleId} voided and stock restored.`, 'info');
  };

  const metrics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(s => s.date === today);
    const todayGross = todaySales.reduce((acc, s) => acc + (Number(s.grandTotal) || 0), 0);
    const totalDue = sales.reduce((acc, s) => acc + (Number(s.dueAmount) || 0), 0);
    return {
      todayGross,
      todayCount: todaySales.length,
      totalDue,
      productCount: products.length,
      customerCount: customers.length
    };
  }, [sales, products, customers]);

  const todayStr = new Date().toLocaleDateString(lang === 'bn' ? 'bn-IN' : 'en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  const navTabs = [
    { id: 'dashboard', label: t.dashboard, icon: Store },
    { id: 'sales', label: t.sales, icon: ShoppingCart },
    { id: 'customers', label: t.customers, icon: Users },
    { id: 'products', label: t.products, icon: Package },
    { id: 'settings', label: t.settings, icon: Settings }
  ];

  return (
    <div className={`min-h-screen w-full flex bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-2xl shadow-xl font-bold text-xs flex items-center gap-2 border animate-in slide-in-from-top-4 duration-200 ${
          toast.type === 'error'
            ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
            : toast.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
            : 'bg-slate-900 text-white border-slate-700'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Sidebar (Desktop Only) */}
      <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-col justify-between hidden md:flex shrink-0 no-print">
        <div className="p-4 space-y-6">
          {/* Logo & Store Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-600/30">
              <Store className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <h1 className="font-black text-sm tracking-tight text-slate-900 dark:text-slate-100 truncate">
                {profile.shopName}
              </h1>
              <p className="text-[10px] text-slate-400 truncate">{profile.address.split(',')[1] || 'Agri Retail'}</p>
            </div>
          </div>

          {/* Quick Language & Theme Controls */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-xs">
            <button
              onClick={() => setLang(prev => (prev === 'en' ? 'bn' : 'en'))}
              className="px-2.5 py-1 font-bold rounded-lg bg-white dark:bg-slate-700 shadow-sm text-[11px]"
            >
              {lang === 'en' ? 'English' : 'বাংলা'}
            </button>
            <button
              onClick={() => setTheme(prev => (prev === 'light' ? 'dark' : 'light'))}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer & Role Switcher */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Mode:</span>
            <button
              onClick={() => setOperatorRole(prev => (prev === 'Owner' ? 'Staff' : 'Owner'))}
              className="font-bold text-emerald-600 hover:text-emerald-700"
            >
              {operatorRole === 'Owner' ? `👑 ${t.roleOwner}` : `💼 ${t.roleStaff}`}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 text-center">De Fertilizer POS v2.5</p>
        </div>
      </aside>

      {/* Main Content Area */}
      {/* Added pb-16 to avoid content hiding behind mobile bottom nav */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-16 md:pb-0">
        {/* Sticky Action Header */}
        <header className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 py-3 flex items-center justify-between gap-2 no-print">
          <div className="flex items-center gap-1.5 sm:gap-3 overflow-x-auto hide-scrollbar">
            {/* Mobile Store Icon */}
            <div className="md:hidden flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white mr-1 shrink-0">
              <Store className="w-4 h-4" />
            </div>

            <button
              onClick={() => { setScanPrefillData(null); setIsSaleModalOpen(true); }}
              className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold px-3 py-2 rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{t.newSale}</span>
              <span className="sm:hidden">Sale</span>
            </button>
            <button
              onClick={() => setIsScanModalOpen(true)}
              className="flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold px-3 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 active:scale-95 transition shrink-0"
            >
              <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">{t.scanSlip}</span>
              <span className="sm:hidden">Scan</span>
            </button>

            {/* Privacy Mask Toggle Button */}
            <button
              onClick={handleToggleMask}
              title={isMasked ? 'Enter PIN to unmask figures' : 'Click to mask figures'}
              className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold border transition shrink-0 ${
                isMasked
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              }`}
            >
              {isMasked ? <Lock className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isMasked ? `🔒 ${t.masked}` : `👁️ ${t.unmask}`}</span>
            </button>
          </div>

          <div className="text-right hidden sm:block shrink-0">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">{todayStr}</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {metrics.todayCount} Bills Today
            </span>
          </div>
        </header>

        {/* TAB CONTENTS */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-xs font-semibold">{t.totalSales}</span>
                    <IndianRupee className="w-4 h-4 text-emerald-500" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {MaskUtils.maskMoney(metrics.todayGross, isMasked)}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">{metrics.todayCount} {t.totalBills}</p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-xs font-semibold">{t.activeKhata}</span>
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
                    {MaskUtils.maskMoney(metrics.totalDue, isMasked)}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">Pending farmer dues</p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-xs font-semibold">{t.customers}</span>
                    <Users className="w-4 h-4 text-blue-500" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                    {metrics.customerCount}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">Registered farmers</p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-xs font-semibold">{t.inStock}</span>
                    <Package className="w-4 h-4 text-amber-500" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                    {metrics.productCount}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">Catalog items</p>
                </div>
              </div>

              {/* Recent Sales Table */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{t.recentTransactions}</h3>
                  <button
                    onClick={() => setActiveTab('sales')}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <SalesTable
                  sales={sales.slice(0, 8)}
                  onViewInvoice={setViewInvoiceSale}
                  onVoidSale={handleVoidSale}
                  t={t}
                  shopProfile={profile}
                  isMasked={isMasked}
                />
              </div>
            </div>
          )}

          {/* SALES TAB */}
          {activeTab === 'sales' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-xl text-slate-900 dark:text-slate-100">{t.sales}</h2>
                <button
                  onClick={() => { setScanPrefillData(null); setIsSaleModalOpen(true); }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t.newSale}</span>
                </button>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <SalesTable
                  sales={sales}
                  onViewInvoice={setViewInvoiceSale}
                  onVoidSale={handleVoidSale}
                  t={t}
                  shopProfile={profile}
                  isMasked={isMasked}
                />
              </div>
            </div>
          )}

          {/* CUSTOMERS TAB */}
          {activeTab === 'customers' && (
            <CustomersManager
              customers={customers}
              setCustomers={setCustomers}
              sales={sales}
              onQuickSale={(c) => {
                setScanPrefillData({ matchedCustomer: c, items: [] });
                setIsSaleModalOpen(true);
              }}
              onAddCustomer={() => {
                const name = prompt('Farmer Full Name:');
                if (!name) return;
                const mobile = prompt('10-digit Mobile Number:');
                const village = prompt('Village:');
                const newC = {
                  id: 'c' + (customers.length + 1),
                  name,
                  mobile: mobile || '',
                  village: village || '',
                  notes: 'Added at counter'
                };
                setCustomers(prev => [newC, ...prev]);
                showToast('Farmer registered successfully!', 'success');
              }}
              t={t}
              isMasked={isMasked}
              shopProfile={profile}
            />
          )}

          {/* PRODUCTS TAB */}
          {activeTab === 'products' && (
            <ProductsManager
              products={products}
              setProducts={setProducts}
              t={t}
              isMasked={isMasked}
            />
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <SettingsManager
              profile={profile}
              setProfile={setProfile}
              securityPin={securityPin}
              setSecurityPin={setSecurityPin}
              showToast={showToast}
              t={t}
            />
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center px-2 pb-safe z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {navTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 space-y-1 transition ${
                isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110 transition-transform' : ''}`} />
              <span className="text-[10px] font-bold truncate w-full text-center px-1">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Pin Verification Modal */}
      <PinVerificationModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onVerify={handleVerifyPin}
        t={t}
      />

      {/* Slip Scanner Modal */}
      <ScanSlipModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onApplySale={(detected) => {
          setScanPrefillData(detected);
          setIsSaleModalOpen(true);
        }}
        customers={customers}
        products={products}
        t={t}
      />

      {/* Sale Entry Modal */}
      <SaleEntryModal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        onSaveSale={handleSaveSale}
        customers={customers}
        products={products}
        initialData={scanPrefillData}
        t={t}
        isMasked={isMasked}
      />

      {/* Invoice Modal */}
      <InvoiceModal
        sale={viewInvoiceSale}
        onClose={() => setViewInvoiceSale(null)}
        shopProfile={profile}
        t={t}
      />
    </div>
  );
}