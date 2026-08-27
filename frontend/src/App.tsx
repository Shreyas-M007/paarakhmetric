import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle, AlertTriangle, AlertCircle, RefreshCw, BarChart2, Scan, 
  History, Settings as SettingsIcon, FileText, Plus, Upload, Camera, 
  User, Download, Languages, Info,
  Search, X, ShieldCheck, ShieldAlert, LogOut,
  PanelLeftClose, PanelLeft, Trash2, Eye
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

type Page = 'dashboard' | 'scan' | 'history' | 'inspection' | 'settings';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('paarakhmetric_token'));
  const [loginUsername, setLoginUsername] = useState<string>('officer_shrey');
  const [loginPassword, setLoginPassword] = useState<string>('password123');
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
  
  // App settings
  const [language, setLanguage] = useState<string>('en');
  const [rulesVersion, setRulesVersion] = useState<string>("PCR 2011 (Consolidated 2026)");

  // Scanning state
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [activeSide, setActiveSide] = useState<string>('front');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  
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

  const violationStats = [
    { name: 'MRP Missing', value: 4 },
    { name: 'Net Qty Format', value: 3 },
    { name: 'Consumer Care info missing', value: 2 },
    { name: 'Pack Date illegible', value: 1 },
  ];

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
      <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-xl border border-gray-100">
          <div>
            <div className="mx-auto h-12 w-12 rounded-lg bg-primary-600 flex items-center justify-center text-white text-2xl font-bold">🔍</div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">PaarakhMetric</h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Sign in to start Metrology Inspection Audit
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            {loginError && (
              <div className="rounded-md bg-red-50 p-4 border border-red-200 flex gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                {loginError}
              </div>
            )}
            <div className="space-y-4 rounded-md shadow-sm">
              <div>
                <label className="text-xs font-semibold text-gray-600">Username</label>
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="relative block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm bg-gray-50"
                  placeholder="e.g. officer_shrey"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Password</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="relative block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm bg-gray-50"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative flex w-full justify-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors shadow"
              >
                Sign In
              </button>
            </div>
            
            <div className="text-center text-[10px] text-gray-400">
              <p>Default credentials: <b>officer_shrey</b> / <b>password123</b></p>
              <p className="mt-1">Supports offline fallback verification on connection loss.</p>
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
                  <h1 className="font-extrabold text-base leading-tight text-white">PaarakhMetric</h1>
                  <p className="text-[10px] text-slate-400">Legal Metrology</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isSidebarCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
          </div>
          
          <nav className="p-2 space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
              { id: 'scan', label: 'Scan Product', icon: Scan, action: () => startCamera() },
              { id: 'history', label: 'Inspection Log', icon: History },
              { id: 'settings', label: 'Settings', icon: SettingsIcon },
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
                  className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
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
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors`}
              title={isSidebarCollapsed ? "Sign Out" : undefined}
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">Sign Out</span>}
            </button>
          </nav>
        </div>

        {!isSidebarCollapsed && (
          <div className="p-4 border-t border-slate-800 text-[10px] text-slate-500 space-y-0.5">
            <p>Version: 1.0 (MVP)</p>
            <p>Mode: Offline-Capable CPU</p>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 bg-green-50 text-green-700 rounded-full border border-green-200 flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block animate-pulse"></span>
              Local Database Synced
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1.5 font-medium">
              <User className="w-4 h-4 text-gray-400" />
              {user ? user.username.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) : 'Officer'}
            </span>
          </div>
        </header>

        {/* Dynamic Pages Container */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* Dashboard Page */}
          {currentPage === 'dashboard' && (
            <div className="space-y-6 max-w-5xl">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Compliance Statistics</h2>
                <p className="text-sm text-gray-500 font-normal">Real-time breakdown of Legal Metrology (PCR 2011/2026) inspections</p>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Scanned</p>
                    <p className="text-2xl font-extrabold text-gray-900 mt-1">{stats.total}</p>
                  </div>
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                    <FileText className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Compliant</p>
                    <p className="text-2xl font-extrabold text-green-600 mt-1">{stats.compliant}</p>
                  </div>
                  <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Violations Found</p>
                    <p className="text-2xl font-extrabold text-red-600 mt-1">{stats.nonCompliant}</p>
                  </div>
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Needs Review</p>
                    <p className="text-2xl font-extrabold text-amber-500 mt-1">{stats.review}</p>
                  </div>
                  <div className="p-3 bg-amber-50 text-amber-500 rounded-lg">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Graphical Trend */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-4">Frequent Violation Categories</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={violationStats}>
                        <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#53789f" radius={[4, 4, 0, 0]}>
                          {violationStats.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : '#53789f'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Automated Inspection Flow</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      PaarakhMetric performs geometric unwarping, OCR extraction, and Legal Metrology Rule 6/7 evaluations directly on local CPU. All inspections are cryptographically audited and searchable offline.
                    </p>
                  </div>
                  <button 
                    onClick={() => { startCamera(); setCurrentPage('scan'); }}
                    className="w-full mt-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-sm shadow transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Start New Field Inspection
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Scan Page */}
          {currentPage === 'scan' && (
            <div className="space-y-6 max-w-5xl">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">New Product Inspection</h2>
                <p className="text-sm text-gray-500 font-normal">Capture or upload packaging panels for instant OCR and compliance verification</p>
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
                        <p className="text-sm font-medium">Camera is inactive</p>
                        <p className="text-xs text-gray-500">Tap below to activate live scanner or upload an image file</p>
                      </div>
                    )}

                    {/* Framing Guide Overlay */}
                    {cameraActive && (
                      <div className="absolute inset-8 border-2 border-dashed border-white/50 rounded-lg pointer-events-none flex items-center justify-center">
                        <span className="text-[10px] text-white/80 bg-black/40 px-2 py-0.5 rounded">Align Principal Display Panel (PDP)</span>
                      </div>
                    )}
                  </div>

                  {/* Camera action buttons */}
                  <div className="flex gap-4 mt-4 w-full">
                    {!cameraActive ? (
                      <button 
                        onClick={startCamera}
                        className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-sm shadow transition-colors"
                      >
                        <Camera className="w-4 h-4" />
                        Start Camera Viewfinder
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={capturePhoto}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-sm shadow transition-colors"
                        >
                          <Camera className="w-4 h-4" />
                          Capture Photo
                        </button>
                        <button 
                          onClick={stopCamera}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-4 rounded-lg text-sm transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    )}

                    {/* File Upload Button */}
                    <label className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-sm shadow-sm cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" />
                      Upload File
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
                    <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Active Packaging Panel</h3>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { name: 'front', label: 'Front Panel (PDP)' },
                        { name: 'back', label: 'Back Label' },
                        { name: 'left', label: 'Left Side' },
                        { name: 'right', label: 'Right Side' },
                        { name: 'top', label: 'Top View' },
                        { name: 'bottom', label: 'Bottom View' }
                      ].map((panel) => (
                        <button 
                          key={panel.name}
                          onClick={() => setActiveSide(panel.name)}
                          className={`p-2.5 rounded-lg border font-medium flex items-center justify-between text-left transition-colors ${activeSide === panel.name ? 'border-primary-500 bg-primary-50 text-primary-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
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
                    <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Compliance Processing</h3>
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
                        Run OCR & Check Compliance
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
                      {activeInspection.status ? activeInspection.status.replace('_', ' ') : 'PENDING'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {activeInspection.product?.name || "Packaged Item"} • Scanned on {activeInspection.timestamp ? new Date(activeInspection.timestamp).toLocaleString() : "N/A"}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => window.open(`/api/inspections/${activeInspection.id}/pdf-report`, '_blank')}
                    className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-2 shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF Notice
                  </button>
                  <button 
                    onClick={() => setCurrentPage('history')}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-2 shadow"
                  >
                    Back to History
                  </button>
                </div>
              </div>

              {/* Layout for image overlay + metadata */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left side: Package picture with dynamic box outlines */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900 flex items-center gap-1.5">
                      <Scan className="w-5 h-5 text-primary-600" />
                      Dynamic Label Visualizer & Bounding Overlays
                    </h3>
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                      Category: {activeInspection.product?.category || "General"}
                    </span>
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
                              MRP Declaration: {mrpDecl?.value || "Not Detected"}
                            </span>
                            <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${isFail ? 'bg-red-500 text-white' : isReview ? 'bg-amber-500 text-white' : 'bg-green-500 text-white'}`}>
                              {mrpRule?.status || (isFail ? 'FAIL' : 'PASS')}
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
                            <span>Net Qty: {qtyDecl?.value || "N/A"}</span>
                            <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${isFail ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                              {qtyRule?.status || 'PASS'}
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
                            <span>Date: {dateDecl?.value || "N/A"}</span>
                            <span className="text-[9px] px-1 py-0.2 bg-green-500 text-white rounded font-mono">PASS</span>
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
                              Consumer Care: {careDecl?.value || "MISSING / NOT DETECTED"}
                            </span>
                            <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${isFail ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                              {isFail ? 'FAIL' : 'PASS'}
                            </span>
                          </div>
                          {isFail && <p className="text-[9px] text-red-200 mt-0.5">Violation: Mandatory email or consumer helpline missing (Rule 6(1)(n))</p>}
                        </div>
                      );
                    })()}
                  </div>
                  
                  <div className="mt-4 text-xs text-gray-500 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-primary-500" />
                      Hover / tap overlays to view exact statutory rule citations.
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[10px] text-green-600 font-bold"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> Pass</span>
                      <span className="flex items-center gap-1 text-[10px] text-red-600 font-bold"><span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span> Violation</span>
                      <span className="flex items-center gap-1 text-[10px] text-amber-600 font-bold"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span> Review</span>
                    </span>
                  </div>
                </div>

                {/* Right side: Field validations */}
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Rule Verification Log</h3>
                    
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
                            {rule.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Manual corrections list */}
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Manual Verification & Override</h3>
                    
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
                  <h2 className="text-2xl font-bold text-gray-900">Inspection Log & Search</h2>
                  <p className="text-sm text-gray-500 font-normal">Fast SQLite FTS5 + RapidFuzz hybrid search across historical scans</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-green-600" />
                    {inspections.length} {inspections.length === 1 ? 'Record' : 'Records'} Found
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
                    placeholder="Search by product name, manufacturer, barcode, OCR text, or rule ID (e.g. 'Basmati', 'Sweet', 'PC-MRP')..."
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                      title="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-100 text-xs">
                  {/* Status Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-gray-400 font-medium mr-1">Status:</span>
                    {[
                      { id: 'ALL', label: 'All' },
                      { id: 'COMPLIANT', label: 'Compliant' },
                      { id: 'NON_COMPLIANT', label: 'Non-Compliant' },
                      { id: 'REQUIRES_REVIEW', label: 'Needs Review' }
                    ].map((pill) => (
                      <button
                        key={pill.id}
                        onClick={() => setStatusFilter(pill.id)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors border ${
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
                    <span className="text-gray-400 font-medium">Category:</span>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      <option value="ALL">All Categories</option>
                      <option value="Grain">Grain</option>
                      <option value="Confectionery">Confectionery</option>
                      <option value="Edible Oil">Edible Oil</option>
                      <option value="Cosmetics">Cosmetics</option>
                      <option value="Beverage">Beverage</option>
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
                        <th className="py-3 px-4">ID</th>
                        <th className="py-3 px-4">Product Name</th>
                        <th className="py-3 px-4">Manufacturer</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Date/Time</th>
                        <th className="py-3 px-4">Compliance</th>
                        {searchQuery && <th className="py-3 px-4 text-center">Score</th>}
                        <th className="py-3 px-4 text-right">Actions</th>
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
                              {insp.status ? insp.status.replace('_', ' ') : 'PENDING'}
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
                                className="bg-primary-50 hover:bg-primary-100 text-primary-700 py-1 px-2.5 rounded font-bold text-xs inline-flex items-center gap-1 transition-colors"
                                title="Review inspection details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Review
                              </button>
                              <button 
                                onClick={() => setDeletingInspectionId(insp.id)}
                                className="bg-red-50 hover:bg-red-100 text-red-600 py-1 px-2 rounded font-bold text-xs inline-flex items-center transition-colors"
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
                    <p className="text-sm font-semibold text-gray-700">No inspections found matching your criteria</p>
                    <p className="text-xs text-gray-400">Try changing keywords or clearing status filters</p>
                    {(searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL') && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('ALL');
                          setCategoryFilter('ALL');
                        }}
                        className="mt-2 text-xs text-primary-600 hover:text-primary-700 font-semibold underline cursor-pointer"
                      >
                        Reset all filters
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
                    <h3 className="font-bold text-base text-gray-900">Delete Inspection #{deletingInspectionId}</h3>
                    <p className="text-xs text-gray-500">This action cannot be undone.</p>
                  </div>
                </div>
                
                <p className="text-xs text-gray-600 leading-relaxed">
                  Are you sure you want to permanently delete this inspection record? All associated OCR bounding boxes, compliance logs, and generated PDF reports will be purged from the local database.
                </p>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    onClick={() => setDeletingInspectionId(null)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteInspection(deletingInspectionId)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Confirm Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Settings Page */}
          {currentPage === 'settings' && (
            <div className="max-w-3xl space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Application Configuration</h2>
                <p className="text-sm text-gray-500">Configure Rule versions, target languages, and sync settings offline</p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6 text-sm">
                
                {/* Metrology rules version selector */}
                <div className="space-y-2">
                  <label className="font-bold text-gray-800 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-gray-500" />
                    Legal Rules Baseline (PCR)
                  </label>
                  <p className="text-xs text-gray-400">Specify the Legal Metrology Packaged Commodities Rules (PCR) version database.</p>
                  <select 
                    value={rulesVersion}
                    onChange={(e) => setRulesVersion(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:outline-none"
                  >
                    <option value="PCR 2011 (Consolidated 2026)">Legal Metrology (Packaged Commodities) Rules, 2011 (Consolidated 2026)</option>
                    <option value="PCR 2011 (2022 Amendment)">Legal Metrology (Packaged Commodities) Rules, 2011 (2022 Amendment)</option>
                    <option value="PCR 2011 (Original)">Legal Metrology (Packaged Commodities) Rules, 2011 (Base version)</option>
                  </select>
                </div>

                {/* Target languages */}
                <div className="space-y-2">
                  <label className="font-bold text-gray-800 flex items-center gap-1.5">
                    <Languages className="w-4 h-4 text-gray-500" />
                    Preferred Scanning Languages
                  </label>
                  <p className="text-xs text-gray-400">PaddleOCR handles language models on execution. Select default OCR script matching target commodities.</p>
                  <div className="flex gap-3">
                    {[
                      { code: 'en', label: 'English' },
                      { code: 'hi', label: 'Hindi (हिंदी)' },
                      { code: 'kn', label: 'Kannada (ಕನ್ನಡ)' }
                    ].map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => setLanguage(lang.code)}
                        className={`py-2 px-4 rounded-lg border font-medium text-xs transition-colors ${language === lang.code ? 'border-primary-500 bg-primary-50 text-primary-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        {lang.label}
                      </button>
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
                    <button className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2 px-4 rounded-lg text-xs transition-colors shadow">
                      Test Connection
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

      </main>

    </div>
  );
}
