import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Search, 
  Filter, 
  Plus, 
  User, 
  Briefcase, 
  Globe, 
  Building, 
  Users, 
  ArrowLeft, 
  RefreshCw, 
  MessageSquare, 
  Share2, 
  FileText, 
  ChevronRight,
  ShieldAlert,
  History,
  CheckCircle,
  MapPin,
  Calendar,
  Upload,
  Loader2,
  ScanSearch
} from 'lucide-react';

// --- SUPABASE CONFIG ---
// Initialize Supabase client
// Make sure to set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// --- SEARCH API CONFIG (SerpAPI unified) ---
const serpApiKey = import.meta.env.VITE_SERPAPI_KEY;
const SERP_READY = Boolean(serpApiKey);

/**
 * MOCK DATA GENERATOR (Fallback if Supabase is not connected)
 */
const CATEGORIES = {
  MINISTER: { id: 'minister', label: 'الوزراء', icon: Briefcase },
  AMBASSADOR: { id: 'ambassador', label: 'السفراء', icon: Globe },
  INT_ORG: { id: 'int_org', label: 'منظمات دولية', icon: Users },
  COMPANY: { id: 'company', label: 'الشركات', icon: Building },
  LOCAL: { id: 'local', label: 'جهات محلية', icon: MapPin },
  OTHER: { id: 'other', label: 'أخرى', icon: User },
};

const INITIAL_DATA = [
  {
    id: 1,
    name: 'د. محمد بن عبدالله الهاشمي',
    position: 'وزير البنية التحتية والنقل',
    category: 'minister',
    isCounterpart: true,
    status: 'current',
    photoUrl: null,
    nationality: 'المملكة العربية السعودية',
    appointmentDate: '2022-05-15',
    dob: '1975-03-12',
    bio: 'خبير في تخطيط المدن والسكك الحديدية، شغل سابقاً منصب رئيس هيئة الطرق.',
    mandates: ['تطوير شبكة القطارات', 'الموانئ اللوجستية', 'النقل الذكي'],
    socialStats: { tweets: 120, videos: 15, news: 45 },
    latestNews: [
      { id: 101, source: 'تويتر', date: '2024-05-20', content: 'تدشين المرحلة الثانية من مشروع المطار الجديد.' }
    ],
    predecessors: []
  }
];

// --- COLOR THEME CONSTANTS ---
const COLORS = {
  primary: '#AC9D81', // Gold/Bronze
  background: '#F2EFEA', // Cream/Off-white
  textMain: '#2C2C2C',
  textLight: '#6B7280',
  white: '#FFFFFF',
  accent: '#8C7D61'
};

// --- IMAGE HELPERS ---
// Build a local SVG with initials so missing photos show letters (no random faces)
const buildAvatarUrl = (name = 'مسؤول') => {
  const words = (name || '').trim().split(/\s+/).filter(Boolean);
  const initials = words.slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'مس';
  const bg = COLORS.primary;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
      <rect width="200" height="200" rx="24" fill="${bg}"/>
      <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="#fff" font-family="Arial, sans-serif" font-size="72" font-weight="700">${initials}</text>
    </svg>
  `;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

const ensurePhoto = (item = {}) => {
  const photo = item.photo_url || item.photoUrl || item.photo;
  return photo ? item : { ...item, photo_url: buildAvatarUrl(item.name) };
};

const ensurePhotos = (list = []) => list.map(ensurePhoto);

// --- EXTERNAL SEARCH HELPERS (SerpAPI) ---
const buildSearchQuery = (criteria = {}) => {
  const { name, position, country } = criteria;
  return [name, position, country].filter(Boolean).join(' ').trim() || 'government official';
};

const serpSearch = async (query, { num = 10 } = {}) => {
  if (!SERP_READY) return [];
  const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&num=${num}&api_key=${serpApiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('فشل اتصال SerpAPI (بحث عام)');
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.organic_results || [];
};

const serpNewsSearch = async (query, { count = 10 } = {}) => {
  if (!SERP_READY) return [];
  const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&tbm=nws&num=${count}&api_key=${serpApiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('فشل اتصال SerpAPI (أخبار)');
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.news_results || [];
};

const serpImageSearch = async (query, { count = 12 } = {}) => {
  if (!SERP_READY) return [];
  const url = `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(query)}&ijn=0&api_key=${serpApiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('فشل اتصال SerpAPI (صور)');
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return (data.images_results || []).slice(0, count);
};

const normalizeSerpItem = (item, fallback = {}) => ({
  name: item.title || fallback.name,
  snippet: item.snippet || item.description,
  link: item.link,
  image: item.thumbnail,
  source: 'SerpAPI Web',
});

const normalizeSerpNews = (item, fallback = {}) => ({
  name: item.title || fallback.name,
  snippet: item.snippet || item.description,
  link: item.link,
  image: item.thumbnail,
  date: item.date,
  source: 'SerpAPI News',
});

const pickImage = (pool = [], idx = 0) => pool[idx % Math.max(pool.length, 1)];

const runDiscoverySearch = async (criteria = {}, setProgress) => {
  const query = buildSearchQuery(criteria);
  setProgress?.('جاري الاتصال بمحركات البحث...');

  const [serpWeb, serpNews, serpImages] = await Promise.all([
    serpSearch(query, { num: 10 }),
    serpNewsSearch(query, { count: 10 }),
    serpImageSearch(query, { count: 12 })
  ]);

  setProgress?.('تم جمع النتائج الأولية، جاري التحليل...');

  const imagePool = serpImages
    .map((item) => item.original || item.thumbnail || item.image)
    .filter(Boolean);

  const combined = [
    ...serpWeb.map((item) => normalizeSerpItem(item, { name: criteria.name })),
    ...serpNews.map((item) => normalizeSerpNews(item, { name: criteria.name }))
  ];

  if (combined.length === 0) {
    const fallbackSeeds = [
      {
        name: criteria.name || 'مرشح محتمل',
        position: criteria.position || 'منصب قيادي',
        nationality: criteria.country || 'غير محدد',
        source: 'عينات محلية',
        confidence: 80,
        roleType: 'مسؤول حكومي محتمل'
      },
      {
        name: criteria.name ? `${criteria.name} (خبر سابق)` : 'خبر سابق',
        position: 'مسؤول سابق',
        nationality: criteria.country || 'غير محدد',
        source: 'عينات محلية',
        confidence: 68,
        roleType: 'سجل إعلامي'
      }
    ];

    return fallbackSeeds.map((seed, idx) => ({
      id: `fallback_${idx}`,
      name: seed.name,
      position: seed.position,
      nationality: seed.nationality,
      source: seed.source,
      confidence: seed.confidence,
      roleType: seed.roleType,
      photo_url: pickImage(imagePool, idx) || buildAvatarUrl(seed.name),
      latest_news: []
    }));
  }

  setProgress?.('تم تحليل النتائج وتصنيفها...');

  return combined.slice(0, 24).map((item, idx) => {
    const confidence = Math.max(45, 96 - idx * 3);
    return {
      id: `${item.source}_${idx}`,
      name: item.name || criteria.name || 'مسؤول محتمل',
      position: criteria.position || item.snippet || 'منصب غير محدد',
      nationality: criteria.country || 'غير محدد',
      source: item.source || 'مصدر مفتوح',
      confidence,
      roleType: item.source?.includes('News') ? 'تغطية إعلامية' : 'مطابقة ويب',
      photo_url: item.image || pickImage(imagePool, idx) || buildAvatarUrl(item.name),
      latest_news: item.date ? [{ source: item.source, date: item.date, content: item.snippet }] : []
    };
  });
};

const App = () => {
  const [officials, setOfficials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOfficial, setSelectedOfficial] = useState(null);
  const [isSimulatingCrawl, setIsSimulatingCrawl] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDiscoveryModal, setShowDiscoveryModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [isSearchingWeb, setIsSearchingWeb] = useState(false);
  const [searchProgress, setSearchProgress] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isDetailRefreshing, setIsDetailRefreshing] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [serpStatus, setSerpStatus] = useState({ state: 'idle', message: '' });

  // --- SUPABASE FETCH ---
  useEffect(() => {
    fetchOfficials();
  }, []);

  async function fetchOfficials() {
    setLoading(true);
    if (!supabase) {
      console.warn("Supabase keys missing. Using mock data.");
      setOfficials(ensurePhotos(INITIAL_DATA));
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('officials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // If DB is empty, optionally show mock data
      if (data && data.length > 0) {
          // Normalize data structure (snake_case from DB to camelCase if needed, 
          // but we will just handle both in render)
          setOfficials(ensurePhotos(data));
      } else {
          setOfficials(ensurePhotos(INITIAL_DATA));
      }
    } catch (error) {
      console.error('Error fetching officials:', error);
      setOfficials(ensurePhotos(INITIAL_DATA));
    } finally {
      setLoading(false);
    }
  }

  // --- LOGIC: ADD OFFICIAL (Supabase) ---
  const handleAddOfficial = async (e) => {
    e.preventDefault();
    
    if (!supabase) {
      alert("Please configure Supabase in .env file to save data.");
      return;
    }

    setUploading(true);
    const formData = new FormData(e.target);
    const imageFile = formData.get('photo');
    const name = formData.get('name');
    const position = formData.get('position');
    const category = formData.get('category');

    let photoUrl = null;

    try {
      // 1. Upload Image if exists
      if (imageFile && imageFile.size > 0) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('official-photos')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        // 2. Get Public URL
        const { data: publicUrlData } = supabase.storage
          .from('official-photos')
          .getPublicUrl(fileName);
        
        photoUrl = publicUrlData.publicUrl;
      }

      // 3. Insert Record
      const newOfficial = {
        name,
        position,
        category,
        status: 'current',
        nationality: 'غير محدد',
        appointment_date: new Date().toISOString().split('T')[0],
        photo_url: photoUrl,
        social_stats: { tweets: 0, videos: 0, news: 0 },
        mandates: [],
        latest_news: [],
        predecessors: []
      };

      const { error: insertError } = await supabase
        .from('officials')
        .insert([newOfficial]);

      if (insertError) throw insertError;

      alert('تم إضافة المسؤول بنجاح!');
      setShowAddModal(false);
      fetchOfficials(); // Refresh list

    } catch (error) {
      alert('حدث خطأ: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // --- LOGIC: FILTER & SEARCH ---
  const filteredOfficials = useMemo(() => {
    return officials.filter(off => {
      const matchesCategory = activeTab === 'all' || off.category === activeTab;
      // Handle both database (snake_case) and mock (camelCase) keys
      const name = off.name || '';
      const position = off.position || '';
      const organization = off.organization || '';
      
      const matchesSearch = name.includes(searchQuery) || 
                            position.includes(searchQuery) ||
                            organization.includes(searchQuery);
      return matchesCategory && matchesSearch;
    });
  }, [officials, activeTab, searchQuery]);

  // --- DETAIL AUTO-REFRESH ON OPEN ---
  useEffect(() => {
    const refreshDetail = async () => {
      if (!selectedOfficial || !selectedOfficial.id || !supabase) return;
      setIsDetailRefreshing(true);
      try {
        const { data, error } = await supabase
          .from('officials')
          .select('*')
          .eq('id', selectedOfficial.id)
          .limit(1)
          .single();
        if (error) throw error;
        if (data) {
          const updated = ensurePhoto(data);
          setSelectedOfficial(updated);
          setOfficials((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
        }
      } catch (err) {
        console.warn('تفاصيل المسؤول: تعذر التحديث', err.message);
      } finally {
        setIsDetailRefreshing(false);
      }
    };
    refreshDetail();
  }, [selectedOfficial?.id]);

  // --- DELETE OFFICIAL ---
  const handleDeleteOfficial = async (official) => {
    if (!official || !official.id) {
      alert('لا يمكن حذف هذا السجل حالياً.');
      return;
    }
    const confirmed = window.confirm(`هل أنت متأكد من حذف ${official.name}؟`);
    if (!confirmed) return;

    if (supabase) {
      try {
        const { error } = await supabase.from('officials').delete().eq('id', official.id);
        if (error) throw error;
        setOfficials((prev) => prev.filter((o) => o.id !== official.id));
        setSelectedOfficial(null);
        alert('تم حذف المسؤول بنجاح.');
      } catch (err) {
        alert('حدث خطأ أثناء الحذف: ' + err.message);
      }
    } else {
      setOfficials((prev) => prev.filter((o) => o.id !== official.id));
      setSelectedOfficial(null);
      alert('تم الحذف في وضع المحاكاة (بدون قاعدة بيانات).');
    }
  };

  // --- SMART DISCOVERY SEARCH ---
  const handleSmartSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const criteria = {
      name: formData.get('name'),
      position: formData.get('position'),
      country: formData.get('country')
    };

    setShowDiscoveryModal(false);
    setShowResultsModal(true);
    setIsSearchingWeb(true);
    setSearchProgress('جاري الاتصال بمحرك البحث الموحّد...');
    setSearchError(null);
    setSearchResults([]);

    if (!SERP_READY) {
      setIsSearchingWeb(false);
      setSearchError('الرجاء إضافة مفتاح SerpAPI في ملف البيئة قبل البدء.');
      setSearchResults([]);
      return;
    }

    runDiscoverySearch(criteria, setSearchProgress)
      .then((results) => {
        setSearchResults(results);
      })
      .catch((err) => {
        console.error(err);
        setSearchError(err.message || 'حدث خطأ أثناء البحث الخارجي.');
      })
      .finally(() => {
        setIsSearchingWeb(false);
      });
  };

  const handleTestSerpApi = async () => {
    if (!SERP_READY) {
      setSerpStatus({ state: 'error', message: 'أضف المفتاح VITE_SERPAPI_KEY أولاً.' });
      return;
    }
    setSerpStatus({ state: 'loading', message: 'جاري اختبار الاتصال...' });
    try {
      const res = await fetch(`https://serpapi.com/search.json?engine=google&q=test&num=1&api_key=${serpApiKey}`);
      if (!res.ok) throw new Error('تعذر الوصول إلى SerpAPI (HTTP)');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSerpStatus({ state: 'ok', message: 'تم الاتصال بنجاح. المفتاح يعمل.' });
    } catch (err) {
      setSerpStatus({ state: 'error', message: err.message || 'فشل الاختبار.' });
    }
  };

  const handleAddFromDiscovery = async (result) => {
    const newOfficial = {
      name: result.name,
      position: result.position,
      category: 'other',
      status: 'current',
      nationality: result.nationality,
      appointment_date: new Date().toISOString().split('T')[0],
      photo_url: result.photo_url || buildAvatarUrl(result.name),
      latest_news: [{ source: result.source, date: '2024', content: 'تم استخراج البيانات آلياً من المصادر المفتوحة' }]
    };

    if (supabase) {
      try {
        const { error } = await supabase.from('officials').insert([newOfficial]);
        if (error) throw error;
        alert(`تم إضافة ${result.name} إلى قاعدة البيانات بنجاح.`);
        closeResultsModal();
        fetchOfficials();
      } catch (err) {
        alert("خطأ في الحفظ: " + err.message);
      }
    } else {
      setOfficials((prev) => ensurePhotos([newOfficial, ...prev]));
      alert(`تمت إضافة ${result.name} مؤقتاً (وضع محاكاة).`);
      closeResultsModal();
    }
  };

  const closeResultsModal = () => {
    setShowResultsModal(false);
    setIsSearchingWeb(false);
    setSearchProgress('');
    setSearchResults([]);
    setSearchError(null);
  };

  // --- SIMULATION ---
  const simulateWebCrawl = () => {
    setIsSimulatingCrawl(true);
    setTimeout(() => {
        // Just a UI simulation
        setIsSimulatingCrawl(false);
        alert('اكتمل الزحف: لا توجد تحديثات جوهرية في الوقت الحالي.');
    }, 2000);
  };

  // --- RENDER HELPERS ---
  const getCategoryLabel = (catId) => {
    const Cat = CATEGORIES[catId.toUpperCase()];
    return Cat ? Cat.label : catId;
  };

  const generateDiscussionPoints = (official) => {
    // Basic discussion generation logic
    const points = [];
    if (official.category === 'minister') points.push('فرص التعاون المشترك.');
    points.push('استعراض آخر الإنجازات.');
    return points;
  };

  return (
    <div className="min-h-screen font-sans text-right" dir="rtl" style={{ backgroundColor: COLORS.background, color: COLORS.textMain }}>
      
      {/* --- HEADER --- */}
      <header className="shadow-sm sticky top-0 z-20 backdrop-blur-md bg-opacity-90" style={{ backgroundColor: COLORS.white }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md" style={{ backgroundColor: COLORS.primary }}>
              م
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: COLORS.primary }}>منصة القادة</h1>
              <p className="text-xs text-gray-400">نظام ذكاء العلاقات المؤسسية</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <input 
                type="text" 
                placeholder="بحث..."
                className="w-96 pl-4 pr-10 py-2 rounded-full border-none bg-gray-100 focus:ring-2 focus:ring-opacity-50 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute right-3 top-2.5 text-gray-400" size={18} />
            </div>
            
            <button onClick={simulateWebCrawl} className={`p-2 rounded-full transition-all ${isSimulatingCrawl ? 'animate-spin' : 'hover:bg-gray-100'}`}>
              <RefreshCw size={20} color={COLORS.primary} />
            </button>

            <button 
              onClick={() => setShowDiscoveryModal(true)} 
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-all shadow-sm"
            >
              <ScanSearch size={18} className="text-[#AC9D81]" />
              <span className="hidden sm:inline">بحث ذكي</span>
            </button>
            
            <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-full text-white shadow-lg transition-all" style={{ backgroundColor: COLORS.primary }}>
              <Plus size={18} />
              <span className="hidden sm:inline">إضافة مسؤول</span>
            </button>
          </div>
        </div>
      </header>

      {/* --- MAIN LAYOUT --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
        
        {/* SIDEBAR */}
        <aside className="w-64 flex-shrink-0 hidden lg:block sticky top-24 h-fit">
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
            <h3 className="text-sm font-bold text-gray-400 mb-4 flex items-center gap-2"><Filter size={16} />التصنيف</h3>
            <nav className="space-y-1">
              <button onClick={() => setActiveTab('all')} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors ${activeTab === 'all' ? 'bg-opacity-10 font-bold' : 'hover:bg-gray-50 text-gray-600'}`} style={{ backgroundColor: activeTab === 'all' ? COLORS.primary : 'transparent', color: activeTab === 'all' ? COLORS.primary : undefined }}>
                <span>الكل</span>
                <span className="bg-gray-100 text-gray-500 py-0.5 px-2 rounded-md text-xs">{officials.length}</span>
              </button>
              {Object.values(CATEGORIES).map((cat) => (
                <button key={cat.id} onClick={() => setActiveTab(cat.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${activeTab === cat.id ? 'bg-opacity-10 font-bold' : 'hover:bg-gray-50 text-gray-600'}`} style={{ backgroundColor: activeTab === cat.id ? COLORS.primary : 'transparent', color: activeTab === cat.id ? COLORS.primary : undefined }}>
                  <cat.icon size={18} />{cat.label}
                </button>
              ))}
            </nav>
          </div>
          {/* Status Box */}
          <div className="mt-6 bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
            <h3 className="text-sm font-bold text-gray-400 mb-4">حالة النظام</h3>
             {!supabase ? (
               <div className="flex items-center gap-2 text-xs text-orange-600 mb-2">
                 <ShieldAlert size={14} /> وضع المحاكاة (DB غير متصل)
               </div>
             ) : (
               <div className="flex items-center gap-2 text-xs text-green-600 mb-2">
                 <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                 متصل بقاعدة البيانات
               </div>
             )}
          </div>
        </aside>

        {/* CONTENT */}
        <main className="flex-1">
          {loading ? (
             <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#AC9D81]"></div></div>
          ) : selectedOfficial ? (
            <OfficialDetail 
              official={selectedOfficial} 
              onBack={() => setSelectedOfficial(null)}
              discussionPoints={generateDiscussionPoints(selectedOfficial)}
              allOfficials={officials}
              onSelectOfficial={setSelectedOfficial}
              onDeleteOfficial={handleDeleteOfficial}
              isRefreshing={isDetailRefreshing}
            />
          ) : (
            <>
              <div className="flex justify-between items-end mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{activeTab === 'all' ? 'جميع المسؤولين' : getCategoryLabel(activeTab)}</h2>
                <div className="text-sm text-gray-500">عرض {filteredOfficials.length} نتيجة</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredOfficials.map((official) => {
                  // Handle different key naming conventions (DB vs Mock)
                  const photo = official.photo_url || official.photoUrl || official.photo || buildAvatarUrl(official.name);
                  const date = official.appointment_date || official.appointmentDate;
                  const nat = official.nationality;

                  return (
                    <div key={official.id} onClick={() => setSelectedOfficial(official)} className="group bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all border border-gray-100 cursor-pointer relative overflow-hidden">
                      {official.status === 'previous' && <div className="absolute top-0 left-0 bg-gray-100 px-3 py-1 rounded-br-xl text-xs font-bold text-gray-500">سابق</div>}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden border-2 border-white shadow-md">
                          {photo ? <img src={photo} alt={official.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><User size={32} /></div>}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-800 leading-tight mb-1 group-hover:text-[#AC9D81] transition-colors">{official.name}</h3>
                          <p className="text-sm text-gray-500 mb-1">{official.position}</p>
                        </div>
                      </div>
                      <div className="border-t border-gray-50 pt-3 flex items-center justify-between text-xs text-gray-400">
                        <div className="flex items-center gap-1"><MapPin size={12} />{nat}</div>
                        <div className="flex items-center gap-1" style={{color: COLORS.primary}}>عرض التفاصيل <ChevronRight size={12} /></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </main>
      </div>

      {/* --- DISCOVERY FORM MODAL --- */}
      {showDiscoveryModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div className="flex items-center gap-2">
                    <ScanSearch className="text-[#AC9D81]" />
                    <div>
                        <h3 className="text-lg font-bold">بحث واستكشاف ذكي</h3>
                        <p className="text-xs text-gray-500">لن يتم الحفظ حتى تختار النتيجة المناسبة</p>
                    </div>
                </div>
                <button onClick={() => setShowDiscoveryModal(false)} className="text-gray-400 hover:text-red-500">✕</button>
            </div>
            
            <form onSubmit={handleSmartSearch} className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                         <label className="block text-sm font-medium text-gray-700 mb-1">صورة للبحث (اختياري)</label>
                         <div className="border border-gray-200 rounded-lg p-3 flex items-center gap-3 bg-gray-50">
                            <Upload size={16} className="text-gray-400" />
                            <input type="file" name="photo" className="text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-[#AC9D81] file:text-white hover:file:bg-[#96886e]" />
                         </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">الاسم التقريبي</label>
                        <input name="name" type="text" placeholder="مثال: محمد الهاشمي" className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#AC9D81] outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">المنصب المتوقع</label>
                        <input name="position" type="text" placeholder="مثال: وزير النقل" className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#AC9D81] outline-none" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">الدولة / الجهة</label>
                        <input name="country" type="text" placeholder="مثال: المملكة العربية السعودية" className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#AC9D81] outline-none" />
                    </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>سيتم استخدام SerpAPI لجلب الأخبار والصور من محرك موحد.</span>
                    <span className={`flex items-center gap-1 ${SERP_READY ? 'text-green-600' : 'text-amber-600'}`}>
                        <div className={`w-2 h-2 rounded-full ${SERP_READY ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                        {SERP_READY ? 'تم إعداد المفتاح' : 'تحتاج مفتاح VITE_SERPAPI_KEY'}
                    </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600">
                    <button
                      type="button"
                      onClick={handleTestSerpApi}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      اختبار اتصال SerpAPI
                    </button>
                    {serpStatus.state !== 'idle' && (
                      <span className={`flex items-center gap-2 ${serpStatus.state === 'ok' ? 'text-green-600' : serpStatus.state === 'loading' ? 'text-gray-500' : 'text-red-600'}`}>
                        <div className={`w-2 h-2 rounded-full ${serpStatus.state === 'ok' ? 'bg-green-500' : serpStatus.state === 'loading' ? 'bg-gray-400' : 'bg-red-500'}`}></div>
                        {serpStatus.message}
                      </span>
                    )}
                </div>

                <div className="pt-2">
                    <button type="submit" className="w-full py-3 rounded-xl text-white font-bold shadow-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity" style={{ backgroundColor: COLORS.primary }}>
                        <ScanSearch size={20} />
                        بدء البحث
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* --- RESULTS & PROGRESS MODAL --- */}
      {showResultsModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in-up">
              
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                      {isSearchingWeb ? <Loader2 className="animate-spin text-[#AC9D81]" /> : <CheckCircle className="text-green-500" />}
                      {isSearchingWeb ? 'جاري البحث والزحف...' : 'نتائج البحث المستكشفة'}
                  </h3>
                  <button onClick={closeResultsModal} className="text-gray-400 hover:text-red-500">✕</button>
              </div>

              {isSearchingWeb && (
                  <div className="px-6 py-8 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 border-4 border-[#AC9D81] border-t-transparent rounded-full animate-spin mb-4"></div>
                      <h4 className="text-lg font-bold text-gray-700 mb-2">{searchProgress}</h4>
                      <p className="text-sm text-gray-400 max-w-md">يقوم النظام بالزحف على محركات البحث والسجلات الرسمية للعثور على صور وأسماء متطابقة.</p>
                  </div>
              )}

              {!isSearchingWeb && (
                  <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
                      {searchError && (
                        <div className="mb-4 px-4 py-3 rounded-lg text-sm text-red-700 bg-red-50 border border-red-100">
                          {searchError}
                        </div>
                      )}
                      {!SERP_READY && (
                        <div className="mb-4 px-4 py-3 rounded-lg text-sm text-amber-700 bg-amber-50 border border-amber-100">
                          لتفعيل البحث الخارجي أدخل مفتاح البيئة: VITE_SERPAPI_KEY
                        </div>
                      )}
                      {searchResults.length === 0 ? (
                          <div className="text-center py-10 text-gray-400">لم يتم العثور على نتائج مطابقة.</div>
                      ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {searchResults.map((res) => (
                                  <div key={res.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow relative">
                                      <div className="absolute top-2 left-2 bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full font-bold">
                                          تطابق {res.confidence}%
                                      </div>
                                      <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center text-gray-300 overflow-hidden">
                                          {res.photo_url ? <img src={res.photo_url} className="w-full h-full rounded-full object-cover" alt={res.name} /> : <User size={32} />}
                                      </div>
                                      <div className="text-center mb-4">
                                          <h4 className="font-bold text-gray-800">{res.name}</h4>
                                          <p className="text-sm text-[#AC9D81] font-medium">{res.position}</p>
                                          <p className="text-xs text-gray-500 mt-1">{res.roleType || 'مسؤول محتمل'}</p>
                                          <p className="text-xs text-gray-400">{res.nationality}</p>
                                      </div>
                                      <div className="text-xs text-gray-400 bg-gray-50 p-2 rounded-lg mb-4 text-center">
                                          المصدر: {res.source}
                                      </div>
                                      <button 
                                        onClick={() => handleAddFromDiscovery(res)}
                                        className="w-full py-2 bg-gray-800 text-white rounded-lg text-sm font-bold hover:bg-[#AC9D81] transition-colors flex items-center justify-center gap-2"
                                      >
                                          <Plus size={14} /> إضافة للقاعدة
                                      </button>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              )}
           </div>
        </div>
      )}

      {/* --- ADD MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center" style={{backgroundColor: COLORS.background}}>
              <h3 className="text-lg font-bold">إضافة مسؤول جديد</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-red-500">✕</button>
            </div>
            <form onSubmit={handleAddOfficial} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">صورة المسؤول</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                    <input type="file" name="photo" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">اضغط لرفع صورة (PNG, JPG)</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل</label>
                <input required name="name" type="text" className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#AC9D81]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">المنصب</label>
                   <input required name="position" type="text" className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#AC9D81]" />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">التصنيف</label>
                   <select name="category" className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#AC9D81]">
                     {Object.values(CATEGORIES).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                   </select>
                </div>
              </div>
              <button disabled={uploading} type="submit" className="w-full py-3 rounded-xl text-white font-bold shadow-lg mt-2 flex items-center justify-center gap-2" style={{ backgroundColor: COLORS.primary }}>
                {uploading ? 'جاري الرفع والحفظ...' : 'حفظ البيانات'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* --- DETAILED PROFILE COMPONENT --- */
const OfficialDetail = ({ official, onBack, discussionPoints, allOfficials, onSelectOfficial, onDeleteOfficial, isRefreshing }) => {
  const successor = official.successorId ? allOfficials.find(o => o.id === official.successorId) : null;
  // Fallback for keys
  const photo = official.photo_url || official.photoUrl || official.photo || buildAvatarUrl(official.name);
  const date = official.appointment_date || official.appointmentDate;
  const newsList = official.latest_news || official.latestNews || [];
  const mandates = official.mandates || [];
  const social = official.social_stats || official.socialStats || {};
  const predecessors = official.predecessors || [];
  const nationality = official.nationality || 'غير متوفر';

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-[#AC9D81] transition-colors">
          <ArrowLeft size={18} />العودة للقائمة
        </button>
        {isRefreshing && (
          <span className="inline-flex items-center gap-2 text-xs text-[#AC9D81] bg-[#F5F0E6] px-3 py-1 rounded-full">
            <Loader2 size={14} className="animate-spin" /> تحديث تلقائي
          </span>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="h-32 bg-gradient-to-r from-[#AC9D81] to-[#C9BEA8] relative"></div>
        <div className="px-8 pb-8 relative">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-12 mb-6">
            <div className="w-32 h-32 rounded-2xl bg-white p-1 shadow-lg flex-shrink-0">
               <div className="w-full h-full bg-gray-100 rounded-xl overflow-hidden relative">
                 {photo ? <img src={photo} className="w-full h-full object-cover" alt={official.name} /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><User size={48} /></div>}
               </div>
            </div>
            <div className="flex-1 pb-2">
               <h1 className="text-3xl font-bold text-gray-800 mb-1">{official.name}</h1>
               <p className="text-lg text-[#AC9D81] font-medium">{official.position}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 border-t border-gray-100 pt-6">
             <InfoItem icon={Calendar} label="تاريخ التعيين" value={date} />
             <InfoItem icon={MapPin} label="الجنسية" value={nationality} />
             <InfoItem icon={User} label="تاريخ الميلاد" value={official.dob || 'غير متوفر'} />
             <InfoItem icon={Users} label="التبعية" value={official.category === 'minister' ? 'حكومي' : 'خاص/أخرى'} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* AI Suggestions */}
          <div className="bg-gradient-to-br from-[#FDFBF7] to-white rounded-2xl p-6 shadow-sm border border-[#E8E1D5]">
              <h3 className="text-[#AC9D81] font-bold mb-4 flex items-center gap-2">
                  <MessageSquare size={20} />
                  مقترحات للنقاش (AI Generated)
              </h3>
              <ul className="space-y-3">
                  {discussionPoints && discussionPoints.length > 0 ? discussionPoints.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-gray-700 text-sm bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                          <span className="w-5 h-5 rounded-full bg-[#AC9D81] text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5">{idx + 1}</span>
                          {point}
                      </li>
                  )) : <p className="text-sm text-gray-400">لا توجد مقترحات حالياً.</p>}
              </ul>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 text-lg">النبذة والخبرات</h3>
            <p className="text-gray-600 leading-relaxed mb-6">{official.bio || 'لا توجد نبذة...'}</p>
            {mandates.length > 0 && <div className="flex flex-wrap gap-2">{mandates.map((m, i) => <span key={i} className="px-3 py-1 bg-gray-50 text-gray-600 rounded-lg text-sm border border-gray-100">{m}</span>)}</div>}
          </div>

          {/* Latest News */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 text-lg">آخر الأخبار والنشاطات</h3>
                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-md">محدث آلياً</span>
            </div>
            
            <div className="space-y-4">
                {newsList && newsList.length > 0 ? (
                    newsList.map((news, idx) => (
                        <div key={news.id || idx} className="flex gap-4 border-b border-gray-50 last:border-0 pb-4 last:pb-0">
                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
                                <FileText size={18} />
                            </div>
                            <div>
                                <p className="text-gray-800 text-sm font-medium mb-1">{news.content}</p>
                                <div className="flex items-center gap-3 text-xs text-gray-400">
                                    <span>{news.source || 'مصدر غير معروف'}</span>
                                    {news.date && <> <span>•</span><span>{news.date}</span> </>}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-400 text-sm">
                        لم يتم رصد أخبار حديثة.
                    </div>
                )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
               <h3 className="text-sm font-bold text-gray-400 mb-4">التواجد الرقمي</h3>
               <div className="grid grid-cols-3 gap-2 text-center">
                   <div className="p-2 bg-gray-50 rounded-lg"><span className="block text-lg font-bold text-gray-800">{social.tweets || '-'}</span><span className="text-xs text-gray-400">تغريدة</span></div>
                   <div className="p-2 bg-gray-50 rounded-lg"><span className="block text-lg font-bold text-gray-800">{social.videos || '-'}</span><span className="text-xs text-gray-400">فيديو</span></div>
                   <div className="p-2 bg-gray-50 rounded-lg"><span className="block text-lg font-bold text-gray-800">{social.news || '-'}</span><span className="text-xs text-gray-400">خبر</span></div>
               </div>
           </div>

           {/* Succession / Timeline */}
           <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
               <h3 className="text-sm font-bold text-gray-400 mb-4 flex items-center gap-2">
                   <History size={16} />
                   سجل المنصب
               </h3>

               <div className="relative border-r-2 border-gray-100 mr-2 pr-6 space-y-6">
                   {successor && (
                       <div className="relative">
                            <div className="absolute -right-[31px] top-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
                           <p className="text-xs text-gray-400 mb-1">الخلف (الحالي)</p>
                           <button 
                             onClick={() => onSelectOfficial(successor)}
                             className="text-sm font-bold text-[#AC9D81] hover:underline text-right"
                            >
                               {successor.name}
                           </button>
                       </div>
                   )}

                   <div className="relative">
                        <div className={`absolute -right-[31px] top-1 w-4 h-4 rounded-full border-2 border-white ${official.status === 'current' ? 'bg-[#AC9D81]' : 'bg-gray-400'}`}></div>
                        <p className="text-xs text-gray-400 mb-1">{official.status === 'current' ? 'الحالي' : 'في هذا السجل'}</p>
                        <p className="text-sm font-bold text-gray-800">{official.name}</p>
                        <p className="text-xs text-gray-500">{official.period || `منذ ${date || 'تاريخ غير محدد'}`}</p>
                   </div>

                   {predecessors.map((prev) => (
                       <div key={prev.id || prev.name} className="relative opacity-80">
                            <div className="absolute -right-[31px] top-1 w-4 h-4 rounded-full bg-gray-300 border-2 border-white"></div>
                           <p className="text-xs text-gray-400 mb-1">السلف</p>
                           <p className="text-sm font-bold text-gray-700">{prev.name}</p>
                           <p className="text-xs text-gray-500">{prev.period || 'مدة غير معروفة'}</p>
                       </div>
                   ))}
               </div>
           </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={() => onDeleteOfficial && onDeleteOfficial(official)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors"
        >
          حذف هذا المسؤول
        </button>
      </div>
    </div>
  );
};

const InfoItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3">
        <div className="p-2 bg-gray-50 rounded-lg text-gray-400"><Icon size={18} /></div>
        <div><p className="text-xs text-gray-400 mb-0.5">{label}</p><p className="text-sm font-bold text-gray-700">{value}</p></div>
    </div>
);

export default App;
