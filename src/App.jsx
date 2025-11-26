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
  Upload
} from 'lucide-react';

// --- SUPABASE CONFIG ---
// Initialize Supabase client
// Make sure to set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

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

const App = () => {
  const [officials, setOfficials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOfficial, setSelectedOfficial] = useState(null);
  const [isSimulatingCrawl, setIsSimulatingCrawl] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  // --- SUPABASE FETCH ---
  useEffect(() => {
    fetchOfficials();
  }, []);

  async function fetchOfficials() {
    setLoading(true);
    if (!supabase) {
      console.warn("Supabase keys missing. Using mock data.");
      setOfficials(INITIAL_DATA);
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
          setOfficials(data);
      } else {
          setOfficials(INITIAL_DATA);
      }
    } catch (error) {
      console.error('Error fetching officials:', error);
      setOfficials(INITIAL_DATA);
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
                  const photo = official.photo_url || official.photoUrl;
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
const OfficialDetail = ({ official, onBack, discussionPoints, allOfficials, onSelectOfficial }) => {
  const successor = official.successorId ? allOfficials.find(o => o.id === official.successorId) : null;
  // Fallback for keys
  const photo = official.photo_url || official.photoUrl;
  const date = official.appointment_date || official.appointmentDate;
  const newsList = official.latest_news || official.latestNews || [];
  const mandates = official.mandates || [];
  const social = official.social_stats || official.socialStats || {};

  return (
    <div className="animate-fade-in-up">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-[#AC9D81] transition-colors"><ArrowLeft size={18} />العودة للقائمة</button>

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
             <InfoItem icon={MapPin} label="الجنسية" value={official.nationality} />
             <InfoItem icon={User} label="تاريخ الميلاد" value={official.dob || 'غير متوفر'} />
             <InfoItem icon={Users} label="التبعية" value={official.category === 'minister' ? 'حكومي' : 'خاص/أخرى'} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 text-lg">النبذة والخبرات</h3>
            <p className="text-gray-600 leading-relaxed mb-6">{official.bio || 'لا توجد نبذة...'}</p>
            {mandates.length > 0 && <div className="flex flex-wrap gap-2">{mandates.map((m, i) => <span key={i} className="px-3 py-1 bg-gray-50 text-gray-600 rounded-lg text-sm border border-gray-100">{m}</span>)}</div>}
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
        </div>
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
