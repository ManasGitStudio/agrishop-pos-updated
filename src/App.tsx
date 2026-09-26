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
    cash: 'নগদ টাকা',
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
  ['c10', 'Bikash Murmu', '9641234567', 'Guskara, Bardhaman', 'Organic Paddy & Mustard farming'],
  ['c11', 'Gurpreet Singh Dhillon', '9814012345', 'Samrala, Ludhiana, Punjab', 'Wheat-Paddy rotation - 25 Acres'],
  ['c12', 'Harjinder Sandhu', '9872034567', 'Khamanon, Fatehgarh Sahib', 'Paddy 1509 & Sharbati Wheat'],
  ['c13', 'Kulwant Singh Mann', '9815098765', 'Moga Road, Jagraon', 'Silage Maize & Potato rotation'],
  ['c14', 'Balwinder Kang', '9888012389', 'Doraha, Ludhiana', 'Basmati Pusa 1121 & Sunflower'],
  ['c15', 'Jaipal Hooda', '9416012345', 'Kiloi, Rohtak, Haryana', 'Wheat & Pearl Millet (Bajra)'],
  ['c16', 'Surender Dahiya', '9812034567', 'Murthal, Sonipat, Haryana', 'Commercial Tomato & Baby Corn'],
  ['c17', 'Virender Phogat', '9466098712', 'Charkhi Dadri, Haryana', 'Mustard & Chickpea (Chana)'],
  ['c18', 'Satish Nain', '9896012345', 'Narwana, Jind, Haryana', 'Basmati Paddy & Barley (Jau)'],
  ['c19', 'Ramesh Patel', '9825012345', 'Sanand, Ahmedabad, Gujarat', 'Bt Cotton & Castor (Divela)'],
  ['c20', 'Kishorebhai Vaghani', '9879034567', 'Bavla, Ahmedabad, Gujarat', 'Paddy Gurjari & Wheat GW-496'],
  ['c21', 'Hareshbhai Chaudhary', '9909012389', 'Deesa, Banaskantha, Gujarat', 'Kufri Pukhraj Potato - 15 Acres'],
  ['c22', 'Bharatbhai Prajapati', '9824098712', 'Dholka, Gujarat', 'Cumin (Jeera) & Fenugreek'],
  ['c23', 'Dnyaneshwar Patil', '9822012345', 'Baramati, Pune, Maharashtra', 'Sugarcane Co-86032 & Sweet Corn'],
  ['c24', 'Sambhaji Jadhav', '9850034567', 'Phaltan, Satara, Maharashtra', 'Export Grade Pomegranate (Bhagwa)'],
  ['c25', 'Nitin Shinde', '9890012389', 'Pimpalgaon, Nashik', 'Thompson Seedless Table Grapes'],
  ['c26', 'Eknath Deshmukh', '9765098712', 'Kopargaon, Ahmednagar', 'Soybean JS-335 & Cotton'],
  ['c27', 'Bapu Jagtap', '9823056789', 'Indapur, Pune', 'Onion (Fursungi) & Marigold'],
  ['c28', 'Ramvilas Yadav', '9450012345', 'Chaubepur, Kanpur, UP', 'Wheat HD-2967 & Mentha'],
  ['c29', 'Awadhesh Tiwari', '9415034567', 'Fatehpur Road, UP', 'Green Pea (Azad P-1) & Potato'],
  ['c30', 'Chandrabhan Verma', '9839012389', 'Haidergarh, Barabanki, UP', 'Mentha Arka & Sugarcane'],
  ['c31', 'Gireesh Pandey', '9935098712', 'Phulpur, Prayagraj, UP', 'Paddy Sambha Mahsuri & Mustard'],
  ['c32', 'Radheshyam Meena', '9414012345', 'Bassia, Dausa, Rajasthan', 'Mustard Giriraj & Gram'],
  ['c33', 'Bhagwan Singh Gurjar', '9829034567', 'Chaksu, Jaipur, Rajasthan', 'Bajra Pioneer 86M88 & Cluster Bean'],
  ['c34', 'Devendra Shekhawat', '9460012389', 'Nawalgarh, Jhunjhunu', 'Onion & Fenugreek (Methi)'],
  ['c35', 'Gopal Lal Dadhich', '9828098712', 'Kapasan, Chittorgarh', 'Groundnut TG-37A & Maize'],
  ['c36', 'Dinesh Patidar', '9826012345', 'Sanwer, Indore, MP', 'Garlic (Amleta) & Malwa Wheat'],
  ['c37', 'Mukesh Dhakad', '9893034567', 'Jaora, Ratlam, MP', 'Soybean RVS-2001-4 & Gram'],
  ['c38', 'Kailash Chouhan', '9926012389', 'Ashta, Sehore, MP', 'Sharbati Wheat & Kabuli Chana'],
  ['c39', 'Santosh Sharma', '9425098712', 'Ambah, Morena, MP', 'Mustard Pusa Bold - 12 Acres'],
  ['c40', 'Lalan Prasad Singh', '9431012345', 'Musahari, Muzaffarpur, Bihar', 'Shahi Litchi, Maize & Potato'],
  ['c41', 'Bipin Bihari Mahto', '9934034567', 'Pusa, Samastipur, Bihar', 'Winter Maize & Cauliflower'],
  ['c42', 'Raghvendra Yadav', '9470012389', 'Sasaram, Rohtas, Bihar', 'Sona Mahsuri Paddy & Wheat'],
  ['c43', 'Basavaraj Gowda', '9845012345', 'Sindhanur, Raichur, Karnataka', 'BPT-5204 Rice Belt - 10 Acres'],
  ['c44', 'Mallikarjun Patil', '9448034567', 'Mudhol, Bagalkot, Karnataka', 'Sugarcane & Sunflower'],
  ['c45', 'Shivanna K.', '9880012389', 'Maddur, Mandya, Karnataka', 'Paddy, Ragi & Banana (Robusta)'],
  ['c46', 'Venkat Reddy', '9848012345', 'Miryalaguda, Nalgonda, Telangana', 'MTU-1010 Paddy & Cotton'],
  ['c47', 'Srinivasa Rao', '9440034567', 'Tenali, Guntur, AP', 'Teja Chilli & Black Gram'],
  ['c48', 'Nageswara Rao', '9866012389', 'Tadepalligudem, West Godavari', 'Swarna Paddy & Fish Pond feed'],
  ['c49', 'Subba Rayudu', '9490098712', 'Anantapur, AP', 'Groundnut K-6 & Sweet Orange'],
  ['c50', 'Tarun Debnath', '9832876543', 'Nabadwip, Nadia, WB', 'Pointed Gourd, Betel Vine & Paddy']
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
  ['p6', 'FACTAMFOS (NPK 20:20:0:13 Sulphur)', 'Inorganic Fertilizers', 'FACT', 1350.0, '50 Kg Bag', 80, 'Sulphur hungry oilseeds (Mustard, Groundnut) and early tillering'],
  ['p7', 'SSP Powder (Single Super Phosphate 16% P)', 'Inorganic Fertilizers', 'Khaitan', 580.0, '50 Kg Bag', 140, 'Low-cost basal phosphorus with calcium and sulphur for Oilseeds & Pulses'],
  ['p8', 'SSP Granulated 16% P', 'Inorganic Fertilizers', 'Rama', 640.0, '50 Kg Bag', 120, 'Slow release phosphorus preventing soil fixation in acidic soils'],
  ['p9', 'Ammonium Sulphate 20.6% N + 24% S', 'Inorganic Fertilizers', 'GSFC', 1050.0, '50 Kg Bag', 65, 'Sulphur deficiency, yellowing of younger leaves in Tea and Paddy'],
  ['p10', 'Calcium Nitrate (Water Soluble)', 'Speciality Fertilizers', 'YaraLiva', 1650.0, '25 Kg Bag', 45, 'Blossom end rot in Tomato, fruit cracking in Pomegranate'],
  ['p11', '19:19:19 100% Water Soluble NPK', 'Speciality Fertilizers', 'Mahadhan', 185.0, '1 Kg Pack', 320, 'Vegetative booster spray for all vegetables, nurseries and orchards'],
  ['p12', '00:52:34 MKP (Mono Potassium Phosphate)', 'Speciality Fertilizers', 'Mahadhan', 240.0, '1 Kg Pack', 210, 'Flower bud induction, profuse blooming & prevention of bud drop'],
  ['p13', '00:00:50 SOP (Potassium Sulphate)', 'Speciality Fertilizers', 'IFFCO', 210.0, '1 Kg Pack', 190, 'Fruit sizing, brix sweetness, rich color and weight in Potato & Fruits'],
  ['p14', '13:00:45 Potassium Nitrate', 'Speciality Fertilizers', 'Mahadhan', 225.0, '1 Kg Pack', 160, 'Starch accumulation and tuber bulking in Potato and Onion'],
  ['p15', '12:61:00 MAP (Mono Ammonium Phosphate)', 'Speciality Fertilizers', 'Yara', 260.0, '1 Kg Pack', 140, 'Initial root system elongation during transplanting'],
  ['p16', 'IFFCO Nano Urea Liquid', 'Nano Fertilizers', 'IFFCO', 225.0, '500 ml Bottle', 280, 'Foliar nitrogen replacement; eliminates bulky urea bag transport'],
  ['p17', 'IFFCO Nano DAP Liquid', 'Nano Fertilizers', 'IFFCO', 600.0, '500 ml Bottle', 190, 'Seed treatment & early foliar spray for enhanced phosphorus uptake'],
  ['p18', 'Zinc Sulphate Heptahydrate 21%', 'Micronutrients', 'Multiplex', 85.0, '1 Kg Pack', 150, 'Khaira disease in Paddy, interveinal leaf chlorosis and stunted growth'],
  ['p19', 'Chelated Zinc 12% EDTA', 'Micronutrients', 'Tata Rallis', 360.0, '500 g Pack', 110, 'Rapid correction of white bud in Maize and little leaf in Citrus'],
  ['p20', 'Di-Sodium Octaborate Tetrahydrate 20% Boron', 'Micronutrients', 'Multiplex', 380.0, '1 Kg Pack', 85, 'Hollow heart in Potato, poor pollination & fruit cracking in Tomato'],
  ['p21', 'Ferrous Sulphate 19% Fe', 'Micronutrients', 'Multiplex', 75.0, '1 Kg Pack', 70, 'Iron chlorosis in high-pH calcareous soils and sugarcane nurseries'],
  ['p22', 'Agricultural Bentonite Sulphur 90%', 'Micronutrients', 'Fertis', 1250.0, '25 Kg Bag', 50, 'Oil content enhancer in Mustard & Groundnut, soil acidification'],
  ['p23', 'Magnesium Sulphate (Epsom Salt)', 'Micronutrients', 'Multiplex', 450.0, '25 Kg Bag', 40, 'Interveinal yellowing of mature lower leaves in Cotton & Banana'],
  ['p24', 'Multiplex Kranti Complete Micronutrient Foliar', 'Micronutrients', 'Multiplex', 420.0, '1 Ltr Bottle', 75, 'Multi-element deficiency corrector boosting plant immunity and vigor'],
  ['p25', 'Coragen (Chlorantraniliprole 18.5% SC)', 'Insecticides', 'FMC', 1850.0, '150 ml Bottle', 60, 'Yellow stem borer & leaf folder in Paddy; fruit borer in Tomato'],
  ['p26', 'Coragen 60 ml', 'Insecticides', 'FMC', 790.0, '60 ml Bottle', 90, 'Early shoot borer in Sugarcane and DBM in Cabbage/Cauliflower'],
  ['p27', 'Ampligo (Chlorantraniliprole + Lambdacyhalothrin)', 'Insecticides', 'Syngenta', 1450.0, '200 ml Bottle', 55, 'Fall armyworm in Maize, bollworms and caterpillars in Cotton'],
  ['p28', 'Alika (Thiamethoxam + Lambdacyhalothrin)', 'Insecticides', 'Syngenta', 720.0, '200 ml Bottle', 80, 'Sucking pests (Aphids, Jassids) along with chewing caterpillars in Chilli'],
  ['p29', 'Confidor (Imidacloprid 17.8% SL)', 'Insecticides', 'Bayer', 580.0, '250 ml Bottle', 95, 'Severe sucking pests: Aphids, Jassids, Whiteflies in Cotton, Chilli'],
  ['p30', 'Admire 70 WG (Imidacloprid 70% WG)', 'Insecticides', 'Bayer', 420.0, '75 g Pack', 60, 'Long duration systemic protection against hopper burn in Paddy'],
  ['p31', 'Actara (Thiamethoxam 25% WG)', 'Insecticides', 'Syngenta', 490.0, '250 g Pack', 85, 'Brown Plant Hopper (BPH) in Paddy and Green Leaf Hopper in Cotton'],
  ['p32', 'Chess (Pymetrozine 50% WG)', 'Insecticides', 'Syngenta', 1280.0, '500 g Pack', 45, 'Immediate feeding blocker against destructive Brown Plant Hopper in Paddy'],
  ['p33', 'Pegasus (Diafenthiuron 50% WP)', 'Insecticides', 'Syngenta', 1150.0, '250 g Pack', 50, 'Nymphs and adults of Whiteflies, Thrips & Red Spider Mites in Chilli'],
  ['p34', 'Delegate (Spinetoram 11.7% SC)', 'Insecticides', 'Corteva', 1680.0, '100 ml Bottle', 40, 'Black Thrips in Chilli, Fruit Borer and Leaf Miner in Solanaceous crops'],
  ['p35', 'Proclaim (Emamectin Benzoate 5% SG)', 'Insecticides', 'Syngenta', 460.0, '100 g Pack', 110, 'Diamondback moth (DBM), fruit borer and Spodoptera litura caterpillars'],
  ['p36', 'Fame (Flubendiamide 480 SC / 39.35% M/M)', 'Insecticides', 'Bayer', 940.0, '50 ml Bottle', 55, 'Pod borer in Gram/Pulses and American bollworm in Cotton'],
  ['p37', 'Regent 5% SC (Fipronil 5% SC)', 'Insecticides', 'Bayer', 480.0, '500 ml Bottle', 70, 'Root pests, Thrips, Stem Borer in early stages of Paddy'],
  ['p38', 'Regent Ultra 0.6% GR (Fipronil Granules)', 'Insecticides', 'Bayer', 620.0, '4 Kg Bag', 85, 'Soil broadcast for termite eradication and early whorl stem borer in Rice'],
  ['p39', 'Caldan 50 SP (Cartap Hydrochloride 50% SP)', 'Insecticides', 'Dhanuka', 420.0, '250 g Pack', 95, 'Stem borer & leaf folder in Rice with strong contact and stomach poison'],
  ['p40', 'Padan 4G (Cartap Hydrochloride 4% Granules)', 'Insecticides', 'Sumitomo', 590.0, '5 Kg Bag', 65, 'Whorl maggot, leaf folder and stem borer soil prophylactic application'],
  ['p41', 'Token / Osheen (Dinotefuran 20% SG)', 'Insecticides', 'PI Industries', 890.0, '250 g Pack', 60, 'Fast knockdown of Brown Plant Hopper (BPH) & White Backed Hopper in Rice'],
  ['p42', 'Simodis (Isocycloseram 9.2% w/w DC)', 'Insecticides', 'Syngenta', 1350.0, '100 ml Bottle', 35, 'Tough resistant Thrips, Mites and Lepidopteran worms in Chilli & Veg'],
  ['p43', 'Oberon (Spiromesifen 22.9% SC)', 'Insecticides', 'Bayer', 760.0, '200 ml Bottle', 50, 'All stages of Red Spider Mites and Whiteflies in Brinjal and Cotton'],
  ['p44', 'Saaf (Carbendazim 12% + Mancozeb 63% WP)', 'Fungicides', 'UPL', 390.0, '500 g Pack', 130, 'Anthracnose, Leaf spot, damping off in nursery and blast in Paddy'],
  ['p45', 'Saaf 1 Kg Pack', 'Fungicides', 'UPL', 740.0, '1 Kg Pack', 90, 'Comprehensive dual-action contact and systemic fungal disease shield'],
  ['p46', 'Nativo (Tebuconazole 50% + Trifloxystrobin 25% WG)', 'Fungicides', 'Bayer', 1480.0, '250 g Pack', 55, 'Sheath blight, neck blast & dirty panicle in Basmati Rice; powdery mildew'],
  ['p47', 'Nativo 100 g Pack', 'Fungicides', 'Bayer', 640.0, '100 g Pack', 80, 'Grain luster enhancer and disease cleaner prior to panicle emergence'],
  ['p48', 'Amistar Top (Azoxystrobin 18.2% + Difenoconazole 11.4% SC)', 'Fungicides', 'Syngenta', 1520.0, '200 ml Bottle', 45, 'Yellow rust in Wheat, sheath blight in Paddy, anthracnose in Chilli'],
  ['p49', 'Ridomil Gold (Metalaxyl-M 4% + Mancozeb 64% WP)', 'Fungicides', 'Syngenta', 1250.0, '500 g Pack', 60, 'Late blight in Potato & Tomato, Downy mildew in Grapes and Cucurbits'],
  ['p50', 'Acrobat (Dimethomorph 50% WP)', 'Fungicides', 'BASF', 890.0, '200 g Pack', 45, 'Late blight tuber rot in Potato, Downy mildew systemic control'],
  ['p51', 'Cabrio Top (Metiram 55% + Pyraclostrobin 5% WG)', 'Fungicides', 'BASF', 1650.0, '600 g Pack', 35, 'Early & Late blight, Powdery mildew and leaf spot with greening effect'],
  ['p52', 'Custodia (Azoxystrobin 11% + Tebuconazole 18.3% SC)', 'Fungicides', 'ADAMA', 1220.0, '500 ml Bottle', 40, 'Broad spectrum preventive and curative foliar fungicide for horticulture'],
  ['p53', 'Contaf Plus (Hexaconazole 5% SC)', 'Fungicides', 'Tata Rallis', 480.0, '1 Ltr Bottle', 75, 'Sheath blight in Paddy, Powdery mildew in Mango and Rust in Soybean'],
  ['p54', 'Tilt (Propiconazole 25% EC)', 'Fungicides', 'Syngenta', 980.0, '500 ml Bottle', 60, 'Karnal bunt and Yellow Rust in Wheat, False smut in Paddy'],
  ['p55', 'Score (Difenoconazole 25% EC)', 'Fungicides', 'Syngenta', 1150.0, '250 ml Bottle', 50, 'Apple scab, Dieback and Fruit rot in Chilli, purple blotch in Onion'],
  ['p56', 'Blitox 50 (Copper Oxychloride 50% WP)', 'Fungicides', 'Tata Rallis', 390.0, '500 g Pack', 80, 'Bacterial leaf blight, canker, damping off and foot rot in Betel vine'],
  ['p57', 'Indofil M-45 (Mancozeb 75% WP)', 'Fungicides', 'Indofil', 410.0, '1 Kg Pack', 120, 'Preventive contact protective spray against wide spectrum fungal blights'],
  ['p58', 'Antracol (Propineb 70% WP)', 'Fungicides', 'Bayer', 580.0, '1 Kg Pack', 65, 'Zinc-enriched protective fungicide against early blight and scab'],
  ['p59', 'Bavistin (Carbendazim 50% WP)', 'Fungicides', 'Crystal', 390.0, '500 g Pack', 85, 'Seed treatment against seed-borne pathogens, collar rot and wilt'],
  ['p60', 'Sheathmar (Validamycin 3% L)', 'Fungicides', 'Dhanuka', 360.0, '1 Ltr Bottle', 70, 'Specialized antibiotic fungicide against Sheath Blight in Rice'],
  ['p61', 'Streptocycline (Streptomycin Sulphate 90% + Tetracycline 10%)', 'Bactericides', 'Hindustan Antibiotics', 55.0, '6 g Pouch', 350, 'Bacterial leaf streak, bacterial wilt, black rot in brassicas and citrus canker'],
  ['p62', 'Trichoderma Viride 1% WP Bio-Fungicide', 'Bio-Fungicides', 'Multiplex', 180.0, '1 Kg Pack', 90, 'Soil-borne Fusarium wilt, root rot, Sclerotinia and Rhizoctonia suppression'],
  ['p63', 'Roundup (Glyphosate 41% SL)', 'Herbicides', 'Bayer', 490.0, '1 Ltr Bottle', 80, 'Non-selective systemic eradication of deep-rooted perennial field weeds'],
  ['p64', 'Nominee Gold (Bispyribac Sodium 10% SC)', 'Herbicides', 'PI Industries', 780.0, '100 ml Bottle', 110, 'Post-emergence grassy and broadleaf weed eradication in transplanted Paddy'],
  ['p65', 'Topik (Clodinafop-Propargyl 15% WP)', 'Herbicides', 'Syngenta', 420.0, '160 g Pack', 95, 'Specific killer of Phalaris minor (Mandusi/Gulli danda) in Wheat fields'],
  ['p66', 'Sempra (Halosulfuron Methyl 75% WG)', 'Herbicides', 'Dhanuka', 720.0, '36 g Pack', 65, 'Selective killer of Cyperus rotundus (Motha / Nutgrass) from root tuber'],
  ['p67', 'Stomp Xtra (Pendimethalin 38.7% CS)', 'Herbicides', 'BASF', 840.0, '700 ml Bottle', 75, 'Pre-emergence barrier preventing germination of weeds in Onion, Garlic & Soy'],
  ['p68', 'Targa Super (Quizalofop Ethyl 5% EC)', 'Herbicides', 'Dhanuka', 680.0, '500 ml Bottle', 55, 'Selective grassy weed killer in broadleaf crops (Soybean, Groundnut, Cotton)'],
  ['p69', 'Pursuit (Imazethapyr 10% SL)', 'Herbicides', 'BASF', 920.0, '1 Ltr Bottle', 50, 'Early post-emergence control of tough broadleaf and grassy weeds in Pulses'],
  ['p70', '2,4-D Amine Salt 58% SL', 'Herbicides', 'Tata Rallis', 360.0, '1 Ltr Bottle', 70, 'Broad-leaved weeds like Chenopodium (Bathua) in Wheat and Sugarcane'],
  ['p71', 'Planofix (Alpha Naphthyl Acetic Acid 4.5% SL)', 'Plant Growth Regulators', 'Bayer', 145.0, '100 ml Bottle', 180, 'Stops flower & immature fruit shedding in Cotton, Chilli, Mango & Tomato'],
  ['p72', 'Fantac Plus (Amino Acids + Vitamins PGR)', 'Plant Growth Regulators', 'Coromandel', 480.0, '100 ml Bottle', 95, 'Vegetative flush, flower initiation and recovery from drought/pest stress'],
  ['p73', 'Biovita Liquid Organic Seaweed Ascophyllum', 'Bio-Stimulants', 'PI Industries', 640.0, '1 Ltr Bottle', 75, 'Enzymatic stimulation, chlorophyll density and enhanced fertilizer uptake'],
  ['p74', 'Humic Acid 98% Potassium Humate Flakes', 'Bio-Stimulants', 'Multiplex', 420.0, '1 Kg Pack', 120, 'Soil conditioning, white root proliferation and nutrient chelation in rootzone'],
  ['p75', 'ProGibb (Gibberellic Acid 40% WSG)', 'Plant Growth Regulators', 'Sumitomo', 490.0, '2.5 g Pack', 90, 'Elongation of berry clusters in Grapes, internodal shoot growth in Sugarcane'],
  ['p76', 'Rhiza Mycorrhizal Bio-Fertilizer Granules', 'Bio-Fertilizers', 'Tata Rallis', 550.0, '4 Kg Bag', 65, 'Vesicular arbuscular mycorrhiza expanding active root surface absorption 10x'],
  ['p77', 'Bio-NPK Liquid Consortia', 'Bio-Fertilizers', 'IFFCO', 180.0, '1 Ltr Bottle', 80, 'Atmospheric nitrogen fixing & fixed phosphorus/potash mobilizing microbes'],
  ['p78', 'De-Oiled Neem Cake Organic Manure', 'Organic Inputs', 'GreenMax', 950.0, '40 Kg Bag', 45, 'Natural soil nematicide, termite repellent and slow-release nitrogen manure'],
  ['p79', 'PROM (Phosphate Rich Organic Manure)', 'Organic Inputs', 'IFFCO', 850.0, '50 Kg Bag', 60, 'Eco-friendly organic alternative to chemical DAP with rich organic carbon'],
  ['p80', 'City Compost (High Organic Carbon Manure)', 'Organic Inputs', 'IL&FS', 380.0, '50 Kg Bag', 70, 'Soil texture rejuvenation, moisture retention and biological carbon booster'],
  ['p81', 'Alginate Coated Seed Treatment Zinc', 'Micronutrients', 'Yara', 450.0, '250 ml Bottle', 50, 'Direct seed coating ensuring rapid uniform germination and root vigor'],
  ['p82', 'Multiplex Sambrama Bio-Activator', 'Bio-Stimulants', 'Multiplex', 350.0, '500 ml Bottle', 65, 'Multi-enzyme metabolic stimulator for pulses and oilseeds'],
  ['p83', 'Tata Bahaar Plant Energizer', 'Bio-Stimulants', 'Tata Rallis', 540.0, '1 Ltr Bottle', 80, 'Protein peptide supplement inducing heavy flowering and branch branching'],
  ['p84', 'Dursban / Classic (Chlorpyrifos 20% EC)', 'Insecticides', 'Corteva', 410.0, '1 Ltr Bottle', 60, 'Termite infestation in building foundations and soil insects in Sugarcane'],
  ['p85', 'Tata Asataf (Acephate 75% SP)', 'Insecticides', 'Tata Rallis', 450.0, '500 g Pack', 90, 'Severe attack of Green Leafhopper, Mealybugs & Aphids in Cotton'],
  ['p86', 'Lancer Gold (Acephate 50% + Imidacloprid 1.8% SP)', 'Insecticides', 'UPL', 640.0, '500 g Pack', 75, 'Synergistic double strike on tough sucking complexes in Vegetables'],
  ['p87', 'Ulala (Flonicamid 50% WG)', 'Insecticides', 'UPL', 980.0, '100 g Pack', 55, 'Targeted translaminar control of destructive Whiteflies and Thrips in Cotton'],
  ['p88', 'Godrej Gracia (Fluxametamide 10% EC)', 'Insecticides', 'Godrej', 1890.0, '160 ml Bottle', 30, 'Novel isoxazoline molecule conquering chemical-resistant Thrips and Caterpillars'],
  ['p89', 'Kocide 2000 (Copper Hydroxide 53.8% DF)', 'Fungicides', 'Corteva', 890.0, '500 g Pack', 45, 'Advanced dry flowable copper bactericide for citrus canker and pomegranate wilt'],
  ['p90', 'Aliette (Fosetyl-Al 80% WP)', 'Fungicides', 'Bayer', 780.0, '250 g Pack', 40, 'True systemic upward & downward basipetal action on root Phytophthora gummosis'],
  ['p91', 'Roko (Thiophanate Methyl 70% WP)', 'Fungicides', 'Biostadt', 640.0, '500 g Pack', 70, 'Anthracnose, root rot, powdery mildew and surgical pruning paste in orchards'],
  ['p92', 'Sultaf / Sulfex (Wettable Sulphur 80% WP)', 'Fungicides', 'Tata Rallis', 260.0, '1 Kg Pack', 85, 'Combined powdery mildew control and predatory mite suppressive nutrition'],
  ['p93', 'Agri-Spoon Wetting & Spreading Agent (Silicon Spreader)', 'Adjuvants', 'Multiplex', 390.0, '250 ml Bottle', 110, 'Breaks spray droplet surface tension ensuring rainfast penetration in waxy leaves'],
  ['p94', 'Glycel (Glyphosate 41% SL)', 'Herbicides', 'Excel Crop Care', 480.0, '1 Ltr Bottle', 65, 'Bunding and bund weed clearance, non-crop area vegetation eradication'],
  ['p95', 'Atrazine 50% WP (Tata Atrafil)', 'Herbicides', 'Tata Rallis', 360.0, '500 g Pack', 60, 'Pre and early post-emergence broadleaf and grass weed killer in Maize and Cane'],
  ['p96', 'Pretilachlor 50% EC (Rifit)', 'Herbicides', 'Syngenta', 580.0, '1 Ltr Bottle', 80, 'Early pre-emergence grass killer applied within 0-4 days of transplanting Rice'],
  ['p97', 'Pyrazosulfuron Ethyl 10% WP (Saathi)', 'Herbicides', 'UPL', 240.0, '80 g Pack', 90, 'Extremely low-dose pre-emergence sedge and broadleaf control in Rice nursery'],
  ['p98', 'Miraculan (Triacontanol 0.05% EC)', 'Plant Growth Regulators', 'Kalyani', 380.0, '1 Ltr Bottle', 70, 'Increases photosynthetic activity, CO2 fixation and yields in groundnut & chillies'],
  ['p99', 'Carbofuran 3% CG (Furadan)', 'Insecticides', 'FMC', 720.0, '5 Kg Bag', 40, 'Nematode suppression, gall midge and root grubs in heavy infested soils'],
  ['p100', 'Phorate 10% CG (Thimet)', 'Insecticides', 'UPL', 640.0, '5 Kg Bag', 45, 'Potent systemic soil insecticide for white grub eradication in Sugarcane & Groundnut']
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
            <span>Add Farmer</span>
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

      {/* Main Sidebar */}
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
            {[
              { id: 'dashboard', label: t.dashboard, icon: Store },
              { id: 'sales', label: t.sales, icon: ShoppingCart },
              { id: 'customers', label: t.customers, icon: Users },
              { id: 'products', label: t.products, icon: Package },
              { id: 'settings', label: t.settings, icon: Settings }
            ].map(tab => {
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
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Sticky Action Header */}
        <header className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => { setScanPrefillData(null); setIsSaleModalOpen(true); }}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-600/20 active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>{t.newSale}</span>
            </button>
            <button
              onClick={() => setIsScanModalOpen(true)}
              className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold px-3 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 active:scale-95 transition"
            >
              <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">{t.scanSlip}</span>
            </button>

            {/* Privacy Mask Toggle Button */}
            <button
              onClick={handleToggleMask}
              title={isMasked ? 'Enter PIN to unmask figures' : 'Click to mask figures'}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition ${
                isMasked
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              }`}
            >
              {isMasked ? <Lock className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{isMasked ? `🔒 ${t.masked}` : `👁️ ${t.unmask}`}</span>
            </button>
          </div>

          <div className="text-right">
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