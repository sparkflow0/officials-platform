import React, { useState, useMemo } from 'react';
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
  Calendar
} from 'lucide-react';

/**
 * MOCK DATA GENERATOR
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
      { id: 101, source: 'تويتر', date: '2024-05-20', content: 'تدشين المرحلة الثانية من مشروع المطار الجديد.' },
      { id: 102, source: 'وكالة الأنباء', date: '2024-05-18', content: 'لقاء مع وفد البنك الدولي لمناقشة تمويل مشاريع مستدامة.' }
    ],
    predecessors: [
      { id: 99, name: 'م. خالد السالم', period: '2018 - 2022' }
    ]
  },
  {
    id: 2,
    name: 'السيد جون سميث',
    position: 'الرئيس التنفيذي',
    organization: 'غلوبال لوجيستيكس',
    category: 'company',
    status: 'current',
    nationality: 'المملكة المتحدة',
    appointmentDate: '2020-01-10',
    mandates: ['سلاسل الإمداد', 'الشحن البحري'],
    bio: 'قاد عمليات توسع كبرى في الشرق الأوسط.',
    latestNews: [],
    predecessors: []
  },
  {
    id: 3,
    name: 'السيدة فاطمة الظاهري',
    position: 'سفيرة الدولة',
    category: 'ambassador',
    status: 'current',
    nationality: 'الإمارات العربية المتحدة',
    appointmentDate: '2023-02-01',
    mandates: ['العلاقات الدبلوماسية', 'التعاون الاقتصادي'],
    bio: 'دبلوماسية مخضرمة، عملت سابقاً في الأمم المتحدة.',
    latestNews: [{id: 103, source: 'يوتيوب', date: '2024-05-10', content: 'كلمة الافتتاح في منتدى الاستثمار.'}],
    predecessors: []
  },
  {
    id: 4,
    name: 'م. أحمد العلي',
    position: 'وزير الاتصالات السابق',
    category: 'minister',
    isCounterpart: true,
    status: 'previous',
    successorId: 1,
    period: '2015 - 2021',
    nationality: 'دولة الكويت',
    bio: 'الآن يعمل كمستشار خاص.',
    mandates: [],
    latestNews: [],
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

// Build a simple remote avatar so cards always have a fetched image
const buildAvatarUrl = (name = 'مسؤول') => 
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${COLORS.primary.replace('#', '')}&color=fff&bold=true`;

const withPhotoFallback = (list) =>
  list.map((off) => (off.photoUrl ? off : { ...off, photoUrl: buildAvatarUrl(off.name) }));

const App = () => {
  const [officials, setOfficials] = useState(() => withPhotoFallback(INITIAL_DATA));
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOfficial, setSelectedOfficial] = useState(null);
  const [isSimulatingCrawl, setIsSimulatingCrawl] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // --- LOGIC: FILTER & SEARCH ---
  const filteredOfficials = useMemo(() => {
    return officials.filter(off => {
      const matchesCategory = activeTab === 'all' || off.category === activeTab;
      const matchesSearch = off.name.includes(searchQuery) || 
                            off.position?.includes(searchQuery) ||
                            (off.organization && off.organization.includes(searchQuery));
      return matchesCategory && matchesSearch;
    });
  }, [officials, activeTab, searchQuery]);

  // --- LOGIC: AI DISCUSSION GENERATOR ---
  const generateDiscussionPoints = (official) => {
    if (!official) return [];
    const points = [];
    
    // Logic based on Minister vs Counterpart vs Company
    if (official.category === 'minister') {
      if (official.isCounterpart) {
        points.push('فرص التعاون المشترك في مشاريع الربط البري والسكك الحديدية.');
        points.push('تبادل الخبرات في مجال تنظيم قطاع الاتصالات والتحول الرقمي.');
      }
      points.push('تنسيق المواقف في الاجتماعات الوزارية القادمة.');
    }
    
    if (official.category === 'company') {
      points.push('فرص الاستثمار في المناطق اللوجستية الجديدة.');
      points.push('مناقشة التحديات التنظيمية التي تواجه القطاع الخاص.');
    }

    if (official.mandates && official.mandates.length > 0) {
      points.push(`سبل دعم مبادراتهم الأخيرة بشأن ${official.mandates[0]}.`);
    }

    return points;
  };

  // --- LOGIC: CRAWLER SIMULATION ---
  const simulateWebCrawl = () => {
    setIsSimulatingCrawl(true);
    setTimeout(() => {
      // 1. Update an existing official with "News"
      const updatedOfficials = withPhotoFallback(
        officials.map(off => {
          if (off.id === 1) { // Simulate finding news for the Minister
            return {
              ...off,
              latestNews: [
                { id: Date.now(), source: 'تنبيه آلي', date: new Date().toISOString().split('T')[0], content: 'تم رصد تصريح جديد بشأن السياسات الرقمية.' },
                ...off.latestNews
              ]
            };
          }
          return off;
        })
      );
      
      setOfficials(updatedOfficials);
      setIsSimulatingCrawl(false);
      alert('تم تحديث البيانات بنجاح: تم رصد صور وأخبار جديدة للمسؤولين');
    }, 2000);
  };

  // --- LOGIC: ADD OFFICIAL ---
  const handleAddOfficial = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newOfficial = {
      id: Date.now(),
      name: formData.get('name'),
      position: formData.get('position'),
      category: formData.get('category'),
      status: 'current',
      nationality: 'غير محدد',
      appointmentDate: new Date().toISOString().split('T')[0],
      latestNews: [],
      mandates: [],
      predecessors: [],
      photoUrl: buildAvatarUrl(formData.get('name'))
    };
    setOfficials([newOfficial, ...officials]);
    setShowAddModal(false);
  };

  // --- RENDER HELPERS ---
  const getCategoryLabel = (catId) => {
    const Cat = CATEGORIES[catId.toUpperCase()];
    return Cat ? Cat.label : catId;
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
                placeholder="بحث عن مسؤول، منصب، جهة..."
                className="w-96 pl-4 pr-10 py-2 rounded-full border-none bg-gray-100 focus:ring-2 focus:ring-opacity-50 transition-all"
                style={{ focusRingColor: COLORS.primary }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute right-3 top-2.5 text-gray-400" size={18} />
            </div>
            
            <button 
              onClick={simulateWebCrawl}
              className={`p-2 rounded-full transition-all ${isSimulatingCrawl ? 'animate-spin' : 'hover:bg-gray-100'}`}
              title="تحديث البيانات (زحف الويب)"
            >
              <RefreshCw size={20} color={COLORS.primary} />
            </button>
            
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-white shadow-lg transform active:scale-95 transition-all"
              style={{ backgroundColor: COLORS.primary }}
            >
              <Plus size={18} />
              <span className="hidden sm:inline">إضافة مسؤول</span>
            </button>
          </div>
        </div>
      </header>

      {/* --- MAIN LAYOUT --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
        
        {/* --- SIDEBAR FILTERS --- */}
        <aside className="w-64 flex-shrink-0 hidden lg:block sticky top-24 h-fit">
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
            <h3 className="text-sm font-bold text-gray-400 mb-4 flex items-center gap-2">
              <Filter size={16} />
              التصنيف
            </h3>
            <nav className="space-y-1">
              <button 
                onClick={() => setActiveTab('all')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors ${activeTab === 'all' ? 'bg-opacity-10 font-bold' : 'hover:bg-gray-50 text-gray-600'}`}
                style={{ backgroundColor: activeTab === 'all' ? COLORS.primary : 'transparent', color: activeTab === 'all' ? COLORS.primary : undefined }}
              >
                <span>الكل</span>
                <span className="bg-gray-100 text-gray-500 py-0.5 px-2 rounded-md text-xs">{officials.length}</span>
              </button>
              
              {Object.values(CATEGORIES).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${activeTab === cat.id ? 'bg-opacity-10 font-bold' : 'hover:bg-gray-50 text-gray-600'}`}
                  style={{ backgroundColor: activeTab === cat.id ? COLORS.primary : 'transparent', color: activeTab === cat.id ? COLORS.primary : undefined }}
                >
                  <cat.icon size={18} />
                  {cat.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-6 bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
            <h3 className="text-sm font-bold text-gray-400 mb-4">حالة البيانات</h3>
            <div className="flex items-center gap-2 text-xs text-green-600 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              نظام الزحف نشط
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              آخر تحديث شامل: منذ 2 ساعة.<br/>
              عدد المصادر التي تمت تغطيتها: 142 مصدر.
            </p>
          </div>
        </aside>

        {/* --- CONTENT AREA --- */}
        <main className="flex-1">
          {selectedOfficial ? (
            /* --- DETAILED VIEW --- */
            <OfficialDetail 
              official={selectedOfficial} 
              onBack={() => setSelectedOfficial(null)}
              discussionPoints={generateDiscussionPoints(selectedOfficial)}
              allOfficials={officials}
              onSelectOfficial={setSelectedOfficial}
            />
          ) : (
            /* --- GRID VIEW --- */
            <>
              <div className="flex justify-between items-end mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {activeTab === 'all' ? 'جميع المسؤولين' : getCategoryLabel(activeTab)}
                </h2>
                <div className="text-sm text-gray-500">
                  عرض {filteredOfficials.length} نتيجة
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredOfficials.map((official) => (
                  <div 
                    key={official.id}
                    onClick={() => setSelectedOfficial(official)}
                    className="group bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all border border-gray-100 cursor-pointer relative overflow-hidden"
                  >
                    {/* Status Badge */}
                    {official.status === 'previous' && (
                      <div className="absolute top-0 left-0 bg-gray-100 px-3 py-1 rounded-br-xl text-xs font-bold text-gray-500">
                        سابق
                      </div>
                    )}
                    {official.status === 'current' && official.isCounterpart && (
                      <div className="absolute top-0 left-0 bg-opacity-10 px-3 py-1 rounded-br-xl text-xs font-bold" style={{ backgroundColor: COLORS.primary, color: COLORS.accent }}>
                        نظير
                      </div>
                    )}

                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden border-2 border-white shadow-md">
                        {official.photoUrl ? (
                          <img src={official.photoUrl} alt={official.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <User size={32} />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800 leading-tight mb-1 group-hover:text-[#AC9D81] transition-colors">
                          {official.name}
                        </h3>
                        <p className="text-sm text-gray-500 mb-1">{official.position}</p>
                        {official.organization && (
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Building size={12} /> {official.organization}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-gray-50 pt-3 flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <MapPin size={12} />
                        {official.nationality}
                      </div>
                      <div className="flex items-center gap-1" style={{color: COLORS.primary}}>
                         عرض التفاصيل <ChevronRight size={12} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>

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
              <div className="bg-blue-50 p-4 rounded-lg text-xs text-blue-700 flex items-start gap-2">
                <ShieldAlert size={16} className="flex-shrink-0 mt-0.5" />
                <p>بمجرد إضافة المسؤول، سيقوم النظام بالزحف تلقائياً للبحث عن صورته، تاريخ تعيينه، وأحدث أخباره من المصادر المفتوحة.</p>
              </div>
              <button type="submit" className="w-full py-3 rounded-xl text-white font-bold shadow-lg mt-2" style={{ backgroundColor: COLORS.primary }}>
                حفظ وبدء الجمع الآلي
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* --- DETAILED PROFILE COMPONENT --- */
const OfficialDetail = ({ official, onBack, discussionPoints, allOfficials, onSelectOfficial }) => {
  const successor = official.successorId ? allOfficials.find(o => o.id === official.successorId) : null;

  return (
    <div className="animate-fade-in-up">
      <button 
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-gray-500 hover:text-[#AC9D81] transition-colors"
      >
        <ArrowLeft size={18} />
        العودة للقائمة
      </button>

      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="h-32 bg-gradient-to-r from-[#AC9D81] to-[#C9BEA8] relative">
            <div className="absolute top-4 left-4 flex gap-2">
                 <button className="bg-white/20 hover:bg-white/40 p-2 rounded-full backdrop-blur-md text-white transition">
                    <Share2 size={18} />
                 </button>
            </div>
        </div>
        <div className="px-8 pb-8 relative">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-12 mb-6">
            <div className="w-32 h-32 rounded-2xl bg-white p-1 shadow-lg flex-shrink-0">
               <div className="w-full h-full bg-gray-100 rounded-xl overflow-hidden relative">
                 {official.photoUrl ? (
                   <img src={official.photoUrl} className="w-full h-full object-cover" alt={official.name} />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-gray-300">
                     <User size={48} />
                   </div>
                 )}
               </div>
            </div>
            <div className="flex-1 pb-2">
               <div className="flex items-center gap-3 mb-1">
                 <h1 className="text-3xl font-bold text-gray-800">{official.name}</h1>
                 {official.status === 'current' ? (
                   <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-md border border-green-200 flex items-center gap-1">
                     <CheckCircle size={10} />
                     في المنصب
                   </span>
                 ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md border border-gray-200 flex items-center gap-1">
                     <History size={10} />
                     مسؤول سابق
                   </span>
                 )}
               </div>
               <p className="text-lg text-[#AC9D81] font-medium">{official.position}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 border-t border-gray-100 pt-6">
             <InfoItem icon={Calendar} label="تاريخ التعيين" value={official.appointmentDate} />
             <InfoItem icon={MapPin} label="الجنسية" value={official.nationality} />
             <InfoItem icon={User} label="تاريخ الميلاد" value={official.dob || 'غير متوفر'} />
             <InfoItem icon={Users} label="التبعية" value={official.category === 'minister' ? 'حكومي' : 'خاص/أخرى'} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN (Main Content) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* AI Suggestions Box */}
          {official.status === 'current' && (
            <div className="bg-gradient-to-br from-[#FDFBF7] to-white rounded-2xl p-6 shadow-sm border border-[#E8E1D5]">
                <h3 className="text-[#AC9D81] font-bold mb-4 flex items-center gap-2">
                    <MessageSquare size={20} />
                    مقترحات للنقاش (AI Generated)
                </h3>
                <ul className="space-y-3">
                    {discussionPoints.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-gray-700 text-sm bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                            <span className="w-5 h-5 rounded-full bg-[#AC9D81] text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5">{idx + 1}</span>
                            {point}
                        </li>
                    ))}
                    {discussionPoints.length === 0 && <p className="text-sm text-gray-400">لا توجد مقترحات حالياً.</p>}
                </ul>
            </div>
          )}

          {/* Bio & Experience */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 text-lg">النبذة والخبرات</h3>
            <p className="text-gray-600 leading-relaxed mb-6">
                {official.bio || 'لا توجد نبذة مختصرة متوفرة حالياً لهذا المسؤول. جاري البحث في المصادر المفتوحة...'}
            </p>
            
            {official.mandates && official.mandates.length > 0 && (
                <>
                    <h4 className="font-bold text-sm text-gray-800 mb-3">نطاق الاختصاصات:</h4>
                    <div className="flex flex-wrap gap-2">
                        {official.mandates.map((m, i) => (
                            <span key={i} className="px-3 py-1 bg-gray-50 text-gray-600 rounded-lg text-sm border border-gray-100">{m}</span>
                        ))}
                    </div>
                </>
            )}
          </div>

          {/* Latest News Feed */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 text-lg">آخر الأخبار والنشاطات</h3>
                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-md">محدث آلياً</span>
            </div>
            
            <div className="space-y-4">
                {official.latestNews && official.latestNews.length > 0 ? (
                    official.latestNews.map((news) => (
                        <div key={news.id} className="flex gap-4 border-b border-gray-50 last:border-0 pb-4 last:pb-0">
                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
                                <FileText size={18} />
                            </div>
                            <div>
                                <p className="text-gray-800 text-sm font-medium mb-1">{news.content}</p>
                                <div className="flex items-center gap-3 text-xs text-gray-400">
                                    <span>{news.source}</span>
                                    <span>•</span>
                                    <span>{news.date}</span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-400 text-sm">
                        لم يتم رصد أخبار حديثة خلال الـ 24 ساعة الماضية.
                    </div>
                )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (Timeline & Succession) */}
        <div className="space-y-6">
           {/* Digital Presence Stats */}
           <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
               <h3 className="text-sm font-bold text-gray-400 mb-4">التواجد الرقمي</h3>
               <div className="grid grid-cols-3 gap-2 text-center">
                   <div className="p-2 bg-gray-50 rounded-lg">
                       <span className="block text-lg font-bold text-gray-800">{official.socialStats?.tweets || '-'}</span>
                       <span className="text-xs text-gray-400">تغريدة</span>
                   </div>
                   <div className="p-2 bg-gray-50 rounded-lg">
                       <span className="block text-lg font-bold text-gray-800">{official.socialStats?.videos || '-'}</span>
                       <span className="text-xs text-gray-400">فيديو</span>
                   </div>
                   <div className="p-2 bg-gray-50 rounded-lg">
                       <span className="block text-lg font-bold text-gray-800">{official.socialStats?.news || '-'}</span>
                       <span className="text-xs text-gray-400">خبر</span>
                   </div>
               </div>
           </div>

           {/* Successor / Predecessor Logic */}
           <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
               <h3 className="text-sm font-bold text-gray-400 mb-4 flex items-center gap-2">
                   <History size={16} />
                   سجل المنصب
               </h3>

               <div className="relative border-r-2 border-gray-100 mr-2 pr-6 space-y-6">
                   {/* Current/Successor */}
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

                   {/* The person currently being viewed */}
                   <div className="relative">
                        <div className={`absolute -right-[31px] top-1 w-4 h-4 rounded-full border-2 border-white ${official.status === 'current' ? 'bg-[#AC9D81]' : 'bg-gray-400'}`}></div>
                        <p className="text-xs text-gray-400 mb-1">{official.status === 'current' ? 'الحالي' : 'في هذا السجل'}</p>
                        <p className="text-sm font-bold text-gray-800">{official.name}</p>
                        <p className="text-xs text-gray-500">{official.period || `منذ ${official.appointmentDate}`}</p>
                   </div>

                   {/* Predecessors */}
                   {official.predecessors && official.predecessors.map((prev) => (
                       <div key={prev.id} className="relative opacity-60 hover:opacity-100 transition-opacity">
                            <div className="absolute -right-[31px] top-1 w-4 h-4 rounded-full bg-gray-300 border-2 border-white"></div>
                           <p className="text-xs text-gray-400 mb-1">السلف</p>
                           <p className="text-sm font-bold text-gray-700">{prev.name}</p>
                           <p className="text-xs text-gray-500">{prev.period}</p>
                       </div>
                   ))}
               </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3">
        <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
            <Icon size={18} />
        </div>
        <div>
            <p className="text-xs text-gray-400 mb-0.5">{label}</p>
            <p className="text-sm font-bold text-gray-700">{value}</p>
        </div>
    </div>
);

export default App;
