import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle, AlertTriangle, AlertCircle, RefreshCw, BarChart2, Scan, 
  History, Settings as SettingsIcon, FileText, Plus, Upload, Camera, 
  User, Download, Languages, Info,
  Search, X, ShieldCheck, ShieldAlert, LogOut,
  PanelLeftClose, PanelLeft, Trash2, Eye, EyeOff,
  Globe, ChevronDown, Check, Layers, ArrowRight, CheckCircle2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Language, translations } from './i18n';

type Page = 'dashboard' | 'scan' | 'history' | 'inspection' | 'settings';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('paarakhmetric_token'));
  const [loginUsername, setLoginUsername] = useState<string>('officer_shrey');
  const [loginPassword, setLoginPassword] = useState<string>('password123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');

  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [inspections, setInspections] = useState<any[]>([]);
  const [selectedInspectionId, setSelectedInspectionId] = useState<number | null>(null);
  const [deletingInspectionId, setDeletingInspectionId] = useState<number | null>(null);
  
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [, setIsSearching] = useState<boolean>(false);
  
  // Multi-Language System
  const [language, setLanguage] = useState<Language>('en');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState<boolean>(false);
  const t = translations[language];

  const [rulesVersion, setRulesVersion] = useState<string>("PCR 2011 (Consolidated 2026)");

  // Scanning state
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [activeSide, setActiveSide] = useState<string>('front');
  const [inspectingSide, setInspectingSide] = useState<string>('front');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  
  // Batch Upload Queue & Sequential Review State
  const [batchQueue, setBatchQueue] = useState<Array<{ file: File; name: string; previewUrl: string }>>([]);
  const [batchCurrentIndex, setBatchCurrentIndex] = useState<number>(0);
  const [batchActiveAnalysis, setBatchActiveAnalysis] = useState<any>(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [isBatchComplete, setIsBatchComplete] = useState<boolean>(false);
  const batchFileInputRef = useRef<HTMLInputElement | null>(null);

  // Camera stream ref
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Stats
  const [stats, setStats] = useState({
    total: 24,
    compliant: 15,
    nonCompliant: 6,
    review: 3
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword, role: 'officer' })
      });
      if (response.ok) {
        const data = await response.json();
        setUser({ username: data.username, role: data.role });
        if (data.access_token) {
          setToken(data.access_token);
          localStorage.setItem('paarakhmetric_token', data.access_token);
        }
      } else {
        const errData = await response.json().catch(() => ({ detail: "Invalid credentials" }));
        setLoginError(errData.detail || "Invalid credentials");
      }
    } catch (err) {
      // Offline fallback check
      if (loginUsername === 'officer_shrey' && loginPassword === 'password123') {
        setUser({ username: 'officer_shrey', role: 'officer' });
      } else {
        setLoginError("Failed to connect. Default user: officer_shrey / password123");
      }
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('paarakhmetric_token');
  };

  const fetchInspections = async (query = searchQuery, status = statusFilter, category = categoryFilter) => {
    setIsSearching(true);
    try {
      const params = new URLSearchParams();
      if (query && query.trim()) params.append('q', query.trim());
      if (status && status !== 'ALL') params.append('status', status);
      if (category && category !== 'ALL') params.append('category', category);

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/inspections/search?${params.toString()}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setInspections(data);
          return;
        }
      }
    } catch (err) {
      console.warn("Search query failed, keeping current list", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDeleteInspection = async (id: number) => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`/api/inspections/${id}`, { method: 'DELETE', headers });
      setInspections(prev => prev.filter(i => i.id !== id));
      if (selectedInspectionId === id) {
        setSelectedInspectionId(null);
        setCurrentPage('history');
      }
    } catch (err) {
      console.error("Failed to delete inspection:", err);
      // Optimistic delete fallback
      setInspections(prev => prev.filter(i => i.id !== id));
    } finally {
      setDeletingInspectionId(null);
    }
  };

  // Batch Processing Methods
  const processBatchItem = async (index: number, queue: Array<{ file: File; name: string; previewUrl: string }>) => {
    if (index >= queue.length) {
      setIsBatchComplete(true);
      fetchInspections();
      return;
    }
    setIsBatchProcessing(true);
    const item = queue[index];

    try {
      // 1. Create temporary product and inspection
      const prodRes = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: item.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "), category: "General" })
      });
      const prodData = await prodRes.json();

      const inspRes = await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: prodData.id, location: "Batch Ingestion Depot", notes: `Batch file: ${item.name}` })
      });
      const inspData = await inspRes.json();

      // 2. Upload and process the image
      const formData = new FormData();
      formData.append('panel_side', 'front');
      formData.append('file', item.file);

      const upRes = await fetch(`/api/inspections/${inspData.id}/upload-image`, {
        method: 'POST',
        body: formData
      });
      const analysisData = await upRes.json();

      setBatchActiveAnalysis({
        inspectionId: inspData.id,
        product: { name: item.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "), category: analysisData.category || "General" },
        imageUrl: item.previewUrl,
        analysis: analysisData,
        declarations: analysisData.declarations || {},
        rules: analysisData.rules_results || []
      });
    } catch (err) {
      console.error("Batch item analysis error:", err);
      // Fallback synthetic preview
      setBatchActiveAnalysis({
        inspectionId: 100 + index,
        product: { name: item.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "), category: "General" },
        imageUrl: item.previewUrl,
        analysis: { status: "COMPLIANT" },
        declarations: {
          mrp: { value: "₹180", status: "VALIDATED" },
          net_quantity: { value: "500 g", status: "VALIDATED" },
          packing_date: { value: "08/2026", status: "VALIDATED" }
        },
        rules: [
          { rule_id: "PC-MRP-001", status: "PASS", details: "MRP declared with tax inclusion" },
          { rule_id: "PC-QTY-002", status: "PASS", details: "Standard SI unit declared" }
        ]
      });
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleBatchFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newQueue: Array<{ file: File; name: string; previewUrl: string }> = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const previewUrl = URL.createObjectURL(file);
      newQueue.push({ file, name: file.name, previewUrl });
    }

    setBatchQueue(newQueue);
    setBatchCurrentIndex(0);
    setIsBatchComplete(false);
    setIsBatchModalOpen(true);
    processBatchItem(0, newQueue);
    if (batchFileInputRef.current) batchFileInputRef.current.value = '';
  };

  const handleApproveBatchItem = () => {
    fetchInspections();
    const nextIdx = batchCurrentIndex + 1;
    setBatchCurrentIndex(nextIdx);
    if (nextIdx < batchQueue.length) {
      processBatchItem(nextIdx, batchQueue);
    } else {
      setIsBatchComplete(true);
    }
  };

  // Instant reactive search effect on every keystroke
  useEffect(() => {
    fetchInspections(searchQuery, statusFilter, categoryFilter);
  }, [searchQuery, statusFilter, categoryFilter, token]);

  // Camera capture methods
  const startCamera = async () => {
    setCameraActive(true);
    setCapturedImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      alert("Could not access camera. Please upload an image or check permissions.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  // Mock processing steps
  const processImage = () => {
    if (!capturedImage) return;
    setIsProcessing(true);
    
    const steps = [
      "Image Quality Check (Sharpness & Brightness)...",
      "Correcting package perspective and deskewing...",
      "Running PaddleOCR engine to locate text elements...",
      "Extracting Legal Metrology declarations via Fuzzy Logic...",
      "Executing Compliance Rule Engine matrix..."
    ];

    let currentStepIndex = 0;
    setProcessingStep(steps[0]);

    const interval = setInterval(() => {
      currentStepIndex++;
      if (currentStepIndex < steps.length) {
        setProcessingStep(steps[currentStepIndex]);
      } else {
        clearInterval(interval);
        setIsProcessing(false);
        // Create a new mock inspection record
        const newInspId = Date.now();
        const newRecord = {
          id: newInspId,
          product: { name: "Snack-o Crunchy Chips", manufacturer: "Snacko Foods", category: "Snacks", barcode: "8905678123456" },
          timestamp: new Date().toISOString(),
          status: "REQUIRES_REVIEW",
          location: "Terminal Store, Delhi",
          officer: "Officer Shrey",
          declarations: [
            { field_name: "mrp", value: "₹40", status: "VALIDATED", confidence: 0.94, original_text: "MRP Rs 40" },
            { field_name: "net_quantity", value: "85 g", status: "VALIDATED", confidence: 0.92, original_text: "NET WT 85g" },
            { field_name: "manufacturer", value: "Snacko Foods", status: "VALIDATED", confidence: 0.89, original_text: "Made in India by Snacko Foods Ltd" },
            { field_name: "packing_date", value: "08/2026", status: "VALIDATED", confidence: 0.91, original_text: "Packed 08/26" },
            { field_name: "consumer_care", value: "1800-456-789", status: "VALIDATED", confidence: 0.54, original_text: "Care? Call 1800-456-789?" } // Low confidence trigger REVIEW
          ],
          compliance_results: [
            { rule_id: "PC-MRP-001", field: "mrp", status: "PASS", details: "MRP detected and verified" },
            { rule_id: "PC-QTY-002", field: "net_quantity", status: "PASS", details: "Net quantity is declared in standard units (g)" },
            { rule_id: "PC-DATE-003", field: "packing_date", status: "PASS", details: "Packing date present" },
            { rule_id: "PC-CARE-004", field: "consumer_care", status: "REVIEW", details: "Low confidence OCR match for Consumer Care. Manual review recommended." }
          ],
          notes: "Helpline text slightly obscured by wrinkle on bag."
        };
        setInspections(prev => [newRecord, ...prev]);
        setStats(prev => ({
          ...prev,
          total: prev.total + 1,
          review: prev.review + 1
        }));
        setSelectedInspectionId(newInspId);
        setCurrentPage('inspection');
      }
    }, 1200);
  };

  const handleManualOverride = (fieldName: string, newValue: string) => {
    // Update inspection field manually
    const updated = inspections.map(insp => {
      if (insp.id === selectedInspectionId) {
        const updatedDecls = insp.declarations.map((decl: any) => {
          if (decl.field_name === fieldName) {
            return { ...decl, value: newValue, status: "OFFICER_CONFIRMED" };
          }
          return decl;
        });
        
        // Update rule result if corrected
        const updatedRules = insp.compliance_results.map((rule: any) => {
          if (rule.field === fieldName) {
            return { ...rule, status: "PASS", details: `Officer verified and updated: ${newValue}` };
          }
          return rule;
        });

        // Compute new overall status
        const hasFail = updatedRules.some((r: any) => r.status === 'FAIL');
        const hasReview = updatedRules.some((r: any) => r.status === 'REVIEW');
        const newStatus = hasFail ? 'NON_COMPLIANT' : (hasReview ? 'REQUIRES_REVIEW' : 'COMPLIANT');

        return { ...insp, declarations: updatedDecls, compliance_results: updatedRules, status: newStatus };
      }
      return insp;
    });
    setInspections(updated);
  };

  const viewInspection = (id: number) => {
    setSelectedInspectionId(id);
    setCurrentPage('inspection');
  };

  const activeInspection = inspections.find(i => i.id === selectedInspectionId);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12 sm:px-6 lg:px-8 relative">
        {/* Language switcher on login screen */}
        <div className="absolute top-6 right-6">
          <div className="relative">
            <button
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer shadow-lg"
              title="Switch Language"
            >
              <Globe className="w-3.5 h-3.5 text-primary-400" />
              <span className="w-5 h-5 rounded-md bg-primary-600 text-white flex items-center justify-center text-xs font-bold font-serif">
                {language === 'en' ? 'A' : language === 'hi' ? 'अ' : 'ಅ'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isLangDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 py-1.5 z-50">
                {[
                  { code: 'en' as Language, symbol: 'A', label: 'English', sub: 'English' },
                  { code: 'hi' as Language, symbol: 'अ', label: 'हिन्दी', sub: 'Hindi' },
                  { code: 'kn' as Language, symbol: 'ಅ', label: 'ಕನ್ನಡ', sub: 'Kannada' }
                ].map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setIsLangDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors text-left cursor-pointer ${
                      language === lang.code ? 'bg-primary-50 text-primary-700 font-bold' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-md bg-slate-100 font-serif flex items-center justify-center font-bold text-slate-800 text-xs">
                        {lang.symbol}
                      </span>
                      <div>
                        <p className="leading-tight font-medium">{lang.label}</p>
                        <p className="text-[10px] text-gray-400 font-normal">{lang.sub}</p>
                      </div>
                    </div>
                    {language === lang.code && <Check className="w-4 h-4 text-primary-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-2xl border border-gray-100">
          <div>
            <div className="mx-auto h-12 w-12 rounded-xl bg-primary-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">🔍</div>
            <h2 className="mt-5 text-center text-2xl font-extrabold text-gray-900">{t.appName}</h2>
            <p className="text-center text-xs font-semibold text-primary-600 uppercase tracking-wider">{t.appSubtitle}</p>
            <p className="mt-2 text-center text-xs text-gray-500">
              {t.loginSubtitle}
            </p>
          </div>
          <form className="mt-6 space-y-5" onSubmit={handleLogin}>
            {loginError && (
              <div className="rounded-lg bg-red-50 p-3 border border-red-200 flex gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                {loginError}
              </div>
            )}
            <div className="space-y-4 rounded-md">
              <div>
                <label className="text-xs font-semibold text-gray-700">{t.username}</label>
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 text-xs sm:text-sm bg-gray-50/50"
                  placeholder="officer_shrey"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">{t.password}</label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="block w-full rounded-xl border border-gray-300 pl-3 pr-10 py-2.5 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 text-xs sm:text-sm bg-gray-50/50"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative flex w-full justify-center rounded-xl bg-primary-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors shadow cursor-pointer"
              >
                {t.signIn}
              </button>
            </div>
            
            <div className="text-center text-[10px] text-gray-400 space-y-1 pt-2 border-t border-gray-100">
              <p>{t.defaultCredentials}</p>
              <p className="text-emerald-700 font-medium">{t.offlineFallback}</p>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      
      {/* Collapsible Sidebar Navigation */}
      <aside className={`${isSidebarCollapsed ? 'w-16' : 'w-64'} bg-slate-900 text-white flex flex-col justify-between shrink-0 transition-all duration-200 ease-in-out`}>
        <div>
          <div className={`p-4 border-b border-slate-800 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-2.5 overflow-hidden">
                <span className="bg-primary-500 p-1.5 rounded-lg text-white font-bold flex items-center justify-center text-sm">🔍</span>
                <div className="truncate">
                  <h1 className="font-extrabold text-base leading-tight text-white">{t.appName}</h1>
                  <p className="text-[10px] text-slate-400">{t.appSubtitle}</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isSidebarCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
          </div>
          
          <nav className="p-2 space-y-1">
            {[
              { id: 'dashboard', label: t.dashboard, icon: BarChart2 },
              { id: 'scan', label: t.scanProduct, icon: Scan, action: () => startCamera() },
              { id: 'history', label: t.inspectionHistory, icon: History },
              { id: 'settings', label: t.settings, icon: SettingsIcon },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button 
                  key={item.id}
                  onClick={() => {
                    if (item.action) item.action();
                    setCurrentPage(item.id as Page);
                  }}
                  className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    isActive ? 'bg-primary-600 text-white shadow-xs' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}

            <button 
              onClick={handleLogout}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors cursor-pointer`}
              title={isSidebarCollapsed ? t.signOut : undefined}
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">{t.signOut}</span>}
            </button>
          </nav>
        </div>

        {!isSidebarCollapsed && (
          <div className="p-4 border-t border-slate-800 text-[10px] text-slate-400 space-y-0.5 font-medium">
            <p>{t.versionInfo}</p>
            <p className="text-emerald-400">● {t.dbSynced}</p>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 relative z-30">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 bg-green-50 text-green-700 rounded-full border border-green-200 flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block animate-pulse"></span>
              {t.dbSynced}
            </span>
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-600">
            {/* Language Switcher Dropdown (Icon + Single Letter Only) */}
            <div className="relative">
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-800 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                title="Switch Language"
              >
                <Globe className="w-3.5 h-3.5 text-primary-600" />
                <span className="w-5 h-5 rounded-md bg-primary-600 text-white flex items-center justify-center text-xs font-bold font-serif shadow-xs">
                  {language === 'en' ? 'A' : language === 'hi' ? 'अ' : 'ಅ'}
                </span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>

              {isLangDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 mb-1">
                    Select Language
                  </div>
                  {[
                    { code: 'en' as Language, symbol: 'A', label: 'English', sub: 'English' },
                    { code: 'hi' as Language, symbol: 'अ', label: 'हिन्दी', sub: 'Hindi' },
                    { code: 'kn' as Language, symbol: 'ಅ', label: 'ಕನ್ನಡ', sub: 'Kannada' }
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setIsLangDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors text-left cursor-pointer ${
                        language === lang.code ? 'bg-primary-50 text-primary-700 font-bold' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-md bg-slate-100 font-serif flex items-center justify-center font-bold text-slate-800 text-xs shadow-2xs">
                          {lang.symbol}
                        </span>
                        <div>
                          <p className="leading-tight font-medium">{lang.label}</p>
                          <p className="text-[10px] text-gray-400 font-normal">{lang.sub}</p>
                        </div>
                      </div>
                      {language === lang.code && <Check className="w-4 h-4 text-primary-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="h-5 w-px bg-gray-200"></div>

            <span className="flex items-center gap-1.5 font-medium">
              <User className="w-4 h-4 text-gray-400" />
              {user ? user.username.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) : t.officer}
            </span>
          </div>
        </header>

        {/* Dynamic Pages Container */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* Dashboard Page */}
          {currentPage === 'dashboard' && (
            <div className="space-y-6 max-w-5xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{t.complianceStats}</h2>
                  <p className="text-sm text-gray-500 font-normal">{t.statsSubtitle}</p>
                </div>
                
                <button
                  onClick={() => setCurrentPage('history')}
                  className="bg-white border border-gray-200 hover:border-primary-500 hover:bg-primary-50 text-gray-700 hover:text-primary-700 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition-all cursor-pointer group"
                  title={t.searchInspectionLog}
                >
                  <Search className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
                  <span>{t.searchInspectionLog}</span>
                </button>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.totalScanned}</p>
                    <p className="text-2xl font-extrabold text-gray-900 mt-1">{stats.total}</p>
                  </div>
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                    <FileText className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.compliant}</p>
                    <p className="text-2xl font-extrabold text-green-600 mt-1">{stats.compliant}</p>
                  </div>
                  <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.violationsFound}</p>
                    <p className="text-2xl font-extrabold text-red-600 mt-1">{stats.nonCompliant}</p>
                  </div>
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.needsReview}</p>
                    <p className="text-2xl font-extrabold text-amber-500 mt-1">{stats.review}</p>
                  </div>
                  <div className="p-3 bg-amber-50 text-amber-500 rounded-lg">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Graphical Trend & Batch Upload Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-4">{t.frequentViolations}</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: language === 'hi' ? 'एमआरपी गायब' : language === 'kn' ? 'ಎಂಆರ್‌ಪಿ ಇಲ್ಲ' : 'MRP Missing', value: 4 },
                        { name: language === 'hi' ? 'मात्रा प्रारूप' : language === 'kn' ? 'ಪ್ರಮಾಣ ಸ್ವರೂಪ' : 'Net Qty Format', value: 3 },
                        { name: language === 'hi' ? 'हेल्पलाइन गायब' : language === 'kn' ? 'ಸಹಾಯವಾಣಿ ಇಲ್ಲ' : 'Consumer Care missing', value: 2 },
                        { name: language === 'hi' ? 'तिथि अस्पष्ट' : language === 'kn' ? 'ದಿನಾಂಕ ಅಸ್ಪಷ್ಟ' : 'Pack Date illegible', value: 1 },
                      ]}>
                        <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#53789f" radius={[4, 4, 0, 0]}>
                          {[0, 1, 2, 3].map((index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : '#53789f'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Batch Upload & Inspection Actions Card */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                        <Layers className="w-5 h-5" />
                      </span>
                      <h4 className="font-bold text-gray-900 text-base">{t.batchUpload}</h4>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed mt-2">
                      {t.batchUploadDesc}
                    </p>
                  </div>

                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    ref={batchFileInputRef} 
                    className="hidden" 
                    onChange={handleBatchFileSelect}
                  />

                  <div className="space-y-2.5 pt-2">
                    <button 
                      onClick={() => batchFileInputRef.current?.click()}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs shadow-md transition-all cursor-pointer group"
                    >
                      <Upload className="w-4 h-4 text-primary-400 group-hover:-translate-y-0.5 transition-transform" />
                      <span>{t.batchUpload}</span>
                      <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-md ml-1">Multi-File</span>
                    </button>

                    <button 
                      onClick={() => { startCamera(); setCurrentPage('scan'); }}
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      {t.startFieldInspection}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Scan Page */}
          {currentPage === 'scan' && (
            <div className="space-y-6 max-w-5xl">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{t.scanTitle}</h2>
                <p className="text-sm text-gray-500 font-normal">{t.scanSubtitle}</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Viewfinder/Capture container */}
                <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-between min-h-[420px]">
                  <div className="w-full relative rounded-lg overflow-hidden bg-black aspect-video flex items-center justify-center">
                    {cameraActive && (
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
                    )}
                    
                    {!cameraActive && capturedImage && (
                      <img src={capturedImage} alt="Captured preview" className="w-full h-full object-contain" />
                    )}

                    {!cameraActive && !capturedImage && (
                      <div className="text-center p-6 text-gray-400">
                        <Camera className="w-12 h-12 mx-auto mb-2 text-gray-600 stroke-1" />
                        <p className="text-sm font-medium">{t.cameraInactive}</p>
                        <p className="text-xs text-gray-500">{t.cameraInactiveSub}</p>
                      </div>
                    )}

                    {/* Framing Guide Overlay */}
                    {cameraActive && (
                      <div className="absolute inset-8 border-2 border-dashed border-white/50 rounded-lg pointer-events-none flex items-center justify-center">
                        <span className="text-[10px] text-white/80 bg-black/40 px-2 py-0.5 rounded">{t.alignPdp}</span>
                      </div>
                    )}
                  </div>

                  {/* Camera action buttons */}
                  <div className="flex gap-4 mt-4 w-full">
                    {!cameraActive ? (
                      <button 
                        onClick={startCamera}
                        className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-sm shadow transition-colors cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        {t.startCamera}
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={capturePhoto}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-sm shadow transition-colors cursor-pointer"
                        >
                          <Camera className="w-4 h-4" />
                          {t.capturePhoto}
                        </button>
                        <button 
                          onClick={stopCamera}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-4 rounded-lg text-sm transition-colors cursor-pointer"
                        >
                          {t.cancel}
                        </button>
                      </>
                    )}

                    {/* File Upload Button */}
                    <label className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-sm shadow-sm cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" />
                      {t.uploadFile}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              setCapturedImage(reader.result as string);
                              stopCamera();
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* Inspection panel controls */}
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">{t.activePanel}</h3>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { name: 'front', label: t.frontPanelPdp },
                        { name: 'back', label: t.backLabel },
                        { name: 'left', label: 'Left Side' },
                        { name: 'right', label: 'Right Side' },
                        { name: 'top', label: 'Top View' },
                        { name: 'bottom', label: 'Bottom View' }
                      ].map((panel) => (
                        <button 
                          key={panel.name}
                          onClick={() => setActiveSide(panel.name)}
                          className={`p-2.5 rounded-lg border font-medium flex items-center justify-between text-left transition-colors cursor-pointer ${activeSide === panel.name ? 'border-primary-500 bg-primary-50 text-primary-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                        >
                          {panel.label}
                          {capturedImage && activeSide === panel.name && (
                            <span className="w-2.5 h-2.5 rounded-full bg-primary-600 block"></span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">{t.processingCompliance}</h3>
                    {isProcessing ? (
                      <div className="space-y-3 py-4 text-center">
                        <RefreshCw className="w-8 h-8 text-primary-500 animate-spin mx-auto" />
                        <p className="text-xs text-gray-500 font-semibold">{processingStep}</p>
                      </div>
                    ) : (
                      <button
                        disabled={!capturedImage}
                        onClick={processImage}
                        className={`w-full py-3 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors ${capturedImage ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                      >
                        <CheckCircle className="w-5 h-5" />
                        {t.runOcr}
                      </button>
                    )}
                  </div>
                </div>

              </div>

              {/* Hidden canvas for video captures */}
              <canvas ref={canvasRef} className="hidden"></canvas>
            </div>
          )}

          {/* Inspection View Page */}
          {currentPage === 'inspection' && activeInspection && (
            <div className="space-y-6 max-w-5xl">
              <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-gray-900">Inspection #{activeInspection.id}</h2>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                      activeInspection.status === 'COMPLIANT' ? 'bg-green-50 text-green-700 border-green-200' :
                      activeInspection.status === 'NON_COMPLIANT' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {activeInspection.status === 'COMPLIANT' ? t.compliant : activeInspection.status === 'NON_COMPLIANT' ? t.fail : t.needsReview}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {activeInspection.product?.name || "Packaged Item"} • Scanned on {activeInspection.timestamp ? new Date(activeInspection.timestamp).toLocaleString() : "N/A"}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => window.open(`/api/inspections/${activeInspection.id}/pdf-report`, '_blank')}
                    className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    {t.downloadPdf}
                  </button>
                  <button 
                    onClick={() => setCurrentPage('history')}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-2 shadow cursor-pointer"
                  >
                    {t.backToHistory}
                  </button>
                </div>
              </div>

              {/* Layout for image overlay + metadata */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left side: Package picture with dynamic box outlines */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-900 flex items-center gap-1.5">
                      <Scan className="w-5 h-5 text-primary-600" />
                      {t.labelVisualizer}
                    </h3>
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                      {t.category}: {activeInspection.product?.category || "General"}
                    </span>
                  </div>

                  {/* Multi-Side Packaging Panel Tabs */}
                  <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 text-xs">
                    {[
                      { id: 'front', label: t.frontPanelPdp },
                      { id: 'back', label: t.backLabel },
                      { id: 'side', label: t.sideViews }
                    ].map((panel) => (
                      <button
                        key={panel.id}
                        onClick={() => setInspectingSide(panel.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                          inspectingSide === panel.id
                            ? 'bg-primary-600 text-white border-primary-600 shadow-xs'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {panel.label}
                      </button>
                    ))}
                  </div>
                  
                  <div className="relative border border-gray-200 rounded-lg overflow-hidden bg-slate-900 aspect-square flex items-center justify-center">
                    {/* Render Real Package Image if available */}
                    {capturedImage ? (
                      <img 
                        src={capturedImage} 
                        alt="Captured Package" 
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-950 flex flex-col items-center justify-center text-slate-400 font-mono text-xs p-4 text-center">
                        <Scan className="w-16 h-16 text-slate-600 mb-3 stroke-1 animate-pulse" />
                        <span className="text-white font-bold">{activeInspection.product?.name || "Packaged Commodity"}</span>
                        <p className="text-[10px] text-slate-500 mt-1">Bounding overlays display detected declaration coordinates & statutory violations</p>
                      </div>
                    )}

                    {/* Interactive Color-Coded Bounding Boxes */}
                    {/* MRP Box */}
                    {(() => {
                      const mrpDecl = activeInspection.declarations?.find((d: any) => d.field_name === 'mrp');
                      const mrpRule = activeInspection.compliance_results?.find((r: any) => r.field === 'mrp' || r.rule_id === 'PC-MRP-001');
                      const isFail = mrpRule?.status === 'FAIL' || mrpDecl?.status === 'POTENTIAL_VIOLATION';
                      const isReview = mrpRule?.status === 'REVIEW';
                      return (
                        <div className={`absolute top-[18%] left-[12%] w-[76%] p-2 border-2 rounded transition-all cursor-pointer backdrop-blur-xs ${
                          isFail ? 'border-red-500 bg-red-950/40 text-red-300 ring-2 ring-red-500/30' :
                          isReview ? 'border-amber-500 bg-amber-950/40 text-amber-300' :
                          'border-green-500 bg-green-950/40 text-green-300'
                        }`}>
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="flex items-center gap-1">
                              {isFail ? <AlertCircle className="w-3 h-3 text-red-400" /> : <CheckCircle className="w-3 h-3 text-green-400" />}
                              {t.mrpDecl}: {mrpDecl?.value || "Not Detected"}
                            </span>
                            <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${isFail ? 'bg-red-500 text-white' : isReview ? 'bg-amber-500 text-white' : 'bg-green-500 text-white'}`}>
                              {isFail ? t.fail : isReview ? t.needsReview : t.pass}
                            </span>
                          </div>
                          {isFail && <p className="text-[9px] text-red-200 mt-0.5">Issue: Missing mandatory tax inclusion clause (Rule 6(1)(e))</p>}
                        </div>
                      );
                    })()}

                    {/* Net Quantity Box */}
                    {(() => {
                      const qtyDecl = activeInspection.declarations?.find((d: any) => d.field_name === 'net_quantity');
                      const qtyRule = activeInspection.compliance_results?.find((r: any) => r.field === 'net_quantity' || r.rule_id === 'PC-QTY-002');
                      const isFail = qtyRule?.status === 'FAIL';
                      return (
                        <div className={`absolute top-[42%] left-[12%] w-[48%] p-2 border-2 rounded transition-all cursor-pointer backdrop-blur-xs ${
                          isFail ? 'border-red-500 bg-red-950/40 text-red-300' : 'border-green-500 bg-green-950/40 text-green-300'
                        }`}>
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span>{t.netQuantityDecl}: {qtyDecl?.value || "N/A"}</span>
                            <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${isFail ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                              {isFail ? t.fail : t.pass}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Packing Date Box */}
                    {(() => {
                      const dateDecl = activeInspection.declarations?.find((d: any) => d.field_name === 'packing_date');
                      return (
                        <div className="absolute top-[42%] right-[12%] w-[32%] p-2 border-2 border-green-500 bg-green-950/40 text-green-300 rounded transition-all cursor-pointer backdrop-blur-xs">
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span>{t.packDateDecl}: {dateDecl?.value || "N/A"}</span>
                            <span className="text-[9px] px-1 py-0.2 bg-green-500 text-white rounded font-mono">{t.pass}</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Consumer Care / Helpline Box */}
                    {(() => {
                      const careDecl = activeInspection.declarations?.find((d: any) => d.field_name === 'consumer_care');
                      const careRule = activeInspection.compliance_results?.find((r: any) => r.field === 'consumer_care' || r.rule_id === 'PC-CARE-004');
                      const isFail = careRule?.status === 'FAIL' || !careDecl?.value || careDecl?.status === 'POTENTIAL_VIOLATION';
                      return (
                        <div className={`absolute bottom-[16%] left-[12%] w-[76%] p-2 border-2 rounded transition-all cursor-pointer backdrop-blur-xs ${
                          isFail ? 'border-red-500 bg-red-950/50 text-red-300 ring-2 ring-red-500/40 animate-pulse' : 'border-green-500 bg-green-950/40 text-green-300'
                        }`}>
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="flex items-center gap-1">
                              {isFail ? <AlertCircle className="w-3 h-3 text-red-400 shrink-0" /> : <CheckCircle className="w-3 h-3 text-green-400 shrink-0" />}
                              {t.consumerCareDecl}: {careDecl?.value || "MISSING"}
                            </span>
                            <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${isFail ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                              {isFail ? t.fail : t.pass}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  
                  <div className="mt-4 text-xs text-gray-500 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-primary-500" />
                      Legal Metrology (PCR 2011 / 2026) Audit Engine
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[10px] text-green-600 font-bold"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> {t.pass}</span>
                      <span className="flex items-center gap-1 text-[10px] text-red-600 font-bold"><span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span> {t.fail}</span>
                      <span className="flex items-center gap-1 text-[10px] text-amber-600 font-bold"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span> {t.needsReview}</span>
                    </span>
                  </div>
                </div>

                {/* Right side: Field validations */}
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">{t.ruleLog}</h3>
                    
                    <div className="space-y-3">
                      {activeInspection.compliance_results?.map((rule: any) => (
                        <div key={rule.rule_id} className="p-3 bg-gray-50 rounded-lg border border-gray-200/80 flex items-start justify-between gap-3 text-xs">
                          <div>
                            <span className="font-bold text-gray-700 block">{rule.rule_id} - {rule.field.replace('_', ' ').toUpperCase()}</span>
                            <p className="text-gray-500 mt-0.5">{rule.details}</p>
                          </div>
                          
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${
                            rule.status === 'PASS' ? 'bg-green-50 text-green-700 border-green-200' :
                            rule.status === 'FAIL' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {rule.status === 'PASS' ? t.pass : rule.status === 'FAIL' ? t.fail : t.needsReview}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Manual corrections list */}
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">{t.manualOverride}</h3>
                    
                    <div className="space-y-3 text-xs">
                      {activeInspection.declarations?.map((decl: any) => (
                        <div key={decl.field_name} className="flex flex-col gap-1.5 p-3 rounded-lg border border-gray-100">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-700 uppercase tracking-wide">{decl.field_name.replace('_', ' ')}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${
                              decl.status === 'VALIDATED' ? 'bg-green-50 text-green-700 border-green-100' :
                              decl.status === 'OFFICER_CONFIRMED' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                              'bg-amber-50 text-amber-700 border-amber-100'
                            }`}>
                              {decl.status.replace('_', ' ')}
                            </span>
                          </div>

                          <div className="text-[10px] text-gray-400">
                            <strong>Raw OCR text:</strong> "{decl.original_text || 'Not detected'}" ({(decl.confidence * 100).toFixed(0)}% confidence)
                          </div>

                          <div className="flex items-center gap-2 mt-1">
                            <input 
                              type="text" 
                              value={decl.value}
                              onChange={(e) => handleManualOverride(decl.field_name, e.target.value)}
                              placeholder="Type override value"
                              className="flex-1 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* History Page */}
          {currentPage === 'history' && (
            <div className="space-y-6 max-w-5xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{t.historyTitle}</h2>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-green-600" />
                    {inspections.length} {t.recordsFound}
                  </span>
                </div>
              </div>

              {/* Search & Filter Controls */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                      title="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-100 text-xs">
                  {/* Status Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-gray-400 font-medium mr-1">{t.status}:</span>
                    {[
                      { id: 'ALL', label: t.all },
                      { id: 'COMPLIANT', label: t.compliant },
                      { id: 'NON_COMPLIANT', label: t.fail },
                      { id: 'REQUIRES_REVIEW', label: t.needsReview }
                    ].map((pill) => (
                      <button
                        key={pill.id}
                        onClick={() => setStatusFilter(pill.id)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors border cursor-pointer ${
                          statusFilter === pill.id
                            ? 'bg-primary-600 text-white border-primary-600 shadow-xs'
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        {pill.label}
                      </button>
                    ))}
                  </div>

                  {/* Category Filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 font-medium">{t.category}:</span>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
                    >
                      <option value="ALL">{t.allCategories}</option>
                      <option value="Grain">{t.grain}</option>
                      <option value="Confectionery">{t.confectionery}</option>
                      <option value="Edible Oil">{t.edibleOil}</option>
                      <option value="Cosmetics">{t.cosmetics}</option>
                      <option value="Beverage">{t.beverage}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* History Table */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {inspections.length > 0 ? (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">{t.id}</th>
                        <th className="py-3 px-4">{t.productName}</th>
                        <th className="py-3 px-4">{t.manufacturer}</th>
                        <th className="py-3 px-4">{t.category}</th>
                        <th className="py-3 px-4">{t.dateTime}</th>
                        <th className="py-3 px-4">{t.compliance}</th>
                        {searchQuery && <th className="py-3 px-4 text-center">{t.score}</th>}
                        <th className="py-3 px-4 text-right">{t.actions}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                      {inspections.map((insp) => (
                        <tr key={insp.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-gray-500">#{insp.id}</td>
                          <td className="py-3.5 px-4 font-semibold text-gray-900">{insp.product?.name || "Unknown Product"}</td>
                          <td className="py-3.5 px-4 text-gray-500">{insp.product?.manufacturer || "N/A"}</td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">
                              {insp.product?.category || "General"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-gray-500">{insp.timestamp ? new Date(insp.timestamp).toLocaleDateString() : "N/A"}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border uppercase ${
                              insp.status === 'COMPLIANT' ? 'bg-green-50 text-green-700 border-green-200' :
                              insp.status === 'NON_COMPLIANT' ? 'bg-red-50 text-red-700 border-red-200' :
                              'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {insp.status === 'COMPLIANT' ? t.compliant : insp.status === 'NON_COMPLIANT' ? t.fail : t.needsReview}
                            </span>
                          </td>
                          {searchQuery && (
                            <td className="py-3.5 px-4 text-center">
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-bold text-[10px] border border-blue-100">
                                {insp.match_score ? `${insp.match_score}%` : 'Match'}
                              </span>
                            </td>
                          )}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                onClick={() => viewInspection(insp.id)}
                                className="bg-primary-50 hover:bg-primary-100 text-primary-700 py-1 px-2.5 rounded font-bold text-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                                title="Review inspection details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                {t.review}
                              </button>
                              <button 
                                onClick={() => setDeletingInspectionId(insp.id)}
                                className="bg-red-50 hover:bg-red-100 text-red-600 py-1 px-2 rounded font-bold text-xs inline-flex items-center transition-colors cursor-pointer"
                                title="Delete inspection"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-12 text-center space-y-3">
                    <Search className="w-8 h-8 text-gray-300 mx-auto" />
                    <p className="text-sm font-semibold text-gray-700">{t.noInspections}</p>
                    <p className="text-xs text-gray-400">{t.noInspectionsSub}</p>
                    {(searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL') && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('ALL');
                          setCategoryFilter('ALL');
                        }}
                        className="mt-2 text-xs text-primary-600 hover:text-primary-700 font-semibold underline cursor-pointer"
                      >
                        {t.resetFilters}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deletingInspectionId !== null && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
              <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-md w-full p-6 space-y-4">
                <div className="flex items-center gap-3 text-red-600">
                  <div className="p-2.5 bg-red-50 rounded-lg">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-gray-900">{t.deleteConfirmTitle} #{deletingInspectionId}</h3>
                    <p className="text-xs text-gray-500">{t.deleteConfirmSubtitle}</p>
                  </div>
                </div>
                
                <p className="text-xs text-gray-600 leading-relaxed">
                  {t.deleteConfirmMsg}
                </p>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    onClick={() => setDeletingInspectionId(null)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={() => handleDeleteInspection(deletingInspectionId)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t.confirmDelete}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Settings Page */}
          {currentPage === 'settings' && (
            <div className="max-w-3xl space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{t.settingsTitle}</h2>
                <p className="text-sm text-gray-500">{t.settingsSubtitle}</p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6 text-sm">
                
                {/* Metrology rules version selector */}
                <div className="space-y-2">
                  <label className="font-bold text-gray-800 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-gray-500" />
                    {t.rulesEngine}
                  </label>
                  <p className="text-xs text-gray-400">{t.rulesEngineDesc}</p>
                  <select 
                    value={rulesVersion}
                    onChange={(e) => setRulesVersion(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none font-medium"
                  >
                    <option value="PCR 2011 (Consolidated 2026)">Legal Metrology (Packaged Commodities) Rules, 2011 (Consolidated 2026)</option>
                    <option value="PCR 2011 (2022 Amendment)">Legal Metrology (Packaged Commodities) Rules, 2011 (2022 Amendment)</option>
                    <option value="PCR 2011 (Original)">Legal Metrology (Packaged Commodities) Rules, 2011 (Base version)</option>
                  </select>
                </div>

                {/* Available OCR Languages Display (Auto-Detect) */}
                <div className="space-y-3 border-t border-gray-100 pt-4">
                  <div>
                    <label className="font-bold text-gray-800 flex items-center gap-1.5">
                      <Languages className="w-4 h-4 text-primary-600" />
                      {t.availableOcrLangs}
                    </label>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {t.autoDetectDesc}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { script: 'English', native: 'Latin Script', code: 'en' },
                      { script: 'हिन्दी / Hindi', native: 'Devanagari', code: 'hi' },
                      { script: 'ಕನ್ನಡ / Kannada', native: 'Kannada Script', code: 'kn' },
                      { script: 'தமிழ் / Tamil', native: 'Tamil Script', code: 'ta' },
                      { script: 'తెలుగు / Telugu', native: 'Telugu Script', code: 'te' },
                      { script: 'मराठी / Marathi', native: 'Devanagari', code: 'mr' },
                      { script: 'বাংলা / Bengali', native: 'Bengali Script', code: 'bn' },
                      { script: 'ગુજરાતી / Gujarati', native: 'Gujarati Script', code: 'gu' }
                    ].map((item) => (
                      <div key={item.code} className="p-2.5 rounded-lg border border-gray-200 bg-gray-50/70 flex flex-col justify-between">
                        <div>
                          <span className="font-bold text-xs text-gray-900 block">{item.script}</span>
                          <span className="text-[10px] text-gray-500 font-mono">{item.native}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-1 text-[10px] text-green-700 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                          <span>Active (Auto)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* DB Sync config */}
                <div className="space-y-2 border-t border-gray-100 pt-4">
                  <label className="font-bold text-gray-800 flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4 text-gray-500" />
                    Central Server Synchronization (Sync API)
                  </label>
                  <p className="text-xs text-gray-400">Manage data syncing back to central dashboard once internet/intranet access is available.</p>
                  <div className="flex items-center gap-3">
                    <input 
                      type="text" 
                      defaultValue="http://10.0.0.45:8080/sync" 
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" 
                    />
                    <button className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2 px-4 rounded-lg text-xs transition-colors shadow cursor-pointer">
                      Test Connection
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Batch Inspection & Sequential Approval Modal */}
        {isBatchModalOpen && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
              
              {/* Modal Header */}
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-600 rounded-lg">
                    <Layers className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">{t.batchModalTitle}</h3>
                    <p className="text-xs text-slate-300">
                      {isBatchComplete 
                        ? t.batchCompleteTitle 
                        : t.batchProgress.replace('{curr}', (batchCurrentIndex + 1).toString()).replace('{total}', batchQueue.length.toString())}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsBatchModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1">
                {isBatchComplete ? (
                  <div className="text-center py-10 space-y-4">
                    <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-green-50/50">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-gray-900">{t.batchCompleteTitle}</h4>
                      <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                        {t.batchCompleteMsg.replace('{count}', batchQueue.length.toString())}
                      </p>
                    </div>

                    <div className="pt-4 flex justify-center gap-3">
                      <button
                        onClick={() => {
                          setIsBatchModalOpen(false);
                          setCurrentPage('history');
                        }}
                        className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 px-6 rounded-xl text-sm shadow transition-colors cursor-pointer flex items-center gap-2"
                      >
                        <History className="w-4 h-4" />
                        <span>{t.viewInHistory}</span>
                      </button>
                    </div>
                  </div>
                ) : isBatchProcessing ? (
                  <div className="py-16 text-center space-y-4">
                    <RefreshCw className="w-10 h-10 text-primary-600 animate-spin mx-auto" />
                    <p className="text-sm font-semibold text-gray-800">
                      Analyzing Packaging #{batchCurrentIndex + 1}: {batchQueue[batchCurrentIndex]?.name}...
                    </p>
                    <p className="text-xs text-gray-400 font-mono">Running OCR extraction & Legal Metrology Rule 6/7 evaluations</p>
                  </div>
                ) : batchActiveAnalysis ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Packaging Photo View */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-700">Packaging Evidence Panel</span>
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-[10px]">
                          {batchActiveAnalysis.product?.category || "General FMCG"}
                        </span>
                      </div>
                      <div className="relative border border-gray-200 rounded-xl overflow-hidden bg-slate-950 aspect-square flex items-center justify-center">
                        <img 
                          src={batchActiveAnalysis.imageUrl} 
                          alt="Batch Packaging preview" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <p className="text-[11px] text-gray-500 text-center font-mono">
                        File: {batchQueue[batchCurrentIndex]?.name}
                      </p>
                    </div>

                    {/* Extracted Findings & Declarations */}
                    <div className="space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                          <h4 className="font-bold text-gray-900 text-sm">{batchActiveAnalysis.product?.name}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            batchActiveAnalysis.analysis?.status === 'COMPLIANT' ? 'bg-green-50 text-green-700 border-green-200' :
                            batchActiveAnalysis.analysis?.status === 'NON_COMPLIANT' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {batchActiveAnalysis.analysis?.status || 'COMPLIANT'}
                          </span>
                        </div>

                        {/* Declarations Summary List */}
                        <div className="space-y-2 text-xs">
                          <p className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">Statutory Declarations Audit</p>
                          <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 space-y-2">
                            {Object.entries(batchActiveAnalysis.declarations).map(([key, val]: [string, any]) => (
                              <div key={key} className="flex items-center justify-between text-xs border-b border-gray-100 pb-1.5 last:border-0 last:pb-0">
                                <span className="text-gray-600 font-medium capitalize">{key.replace('_', ' ')}:</span>
                                <span className="font-semibold text-gray-900 font-mono">{val?.value || val || "Detected"}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Rules Verification Findings */}
                        <div className="space-y-1.5 text-xs">
                          <p className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">Rules Compliance Checks</p>
                          <div className="space-y-1.5 max-h-36 overflow-y-auto">
                            {batchActiveAnalysis.rules.map((rule: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between p-2 rounded-lg border border-gray-100 bg-white text-xs">
                                <span className="text-gray-700 font-medium truncate max-w-[200px]">{rule.details}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  rule.status === 'PASS' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                }`}>
                                  {rule.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Step Approval Buttons */}
                      <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                        <span className="text-xs text-gray-400 font-medium">
                          {batchQueue.length - batchCurrentIndex - 1} remaining in queue
                        </span>

                        <div className="flex gap-2">
                          <button
                            onClick={handleApproveBatchItem}
                            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            <span>{t.approveAndNext}</span>
                            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                          </button>
                        </div>
                      </div>

                    </div>

                  </div>
                ) : null}
              </div>

            </div>
          </div>
        )}

      </main>

    </div>
  );
}
