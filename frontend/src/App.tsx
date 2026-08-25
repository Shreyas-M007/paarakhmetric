import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle, AlertTriangle, AlertCircle, RefreshCw, BarChart2, Scan, 
  History, Settings as SettingsIcon, FileText, Plus, Upload, Camera, 
  MapPin, User, ChevronRight, Download, Save, ShieldAlert, Languages, Info
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

type Page = 'dashboard' | 'scan' | 'history' | 'inspection' | 'settings';

interface OCRBBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface OCRItem {
  text: string;
  confidence: number;
  bounding_box: OCRBBox;
}

interface ExtractedDeclarations {
  product_name?: string;
  manufacturer?: string;
  net_quantity?: string;
  mrp?: string;
  packing_date?: string;
  consumer_care?: string;
}

interface RuleResult {
  rule_id: string;
  field: string;
  required: boolean;
  status: 'PASS' | 'FAIL' | 'REVIEW' | 'NOT_APPLICABLE';
  details: string;
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loginUsername, setLoginUsername] = useState<string>('officer_shrey');
  const [loginPassword, setLoginPassword] = useState<string>('password123');
  const [loginError, setLoginError] = useState<string>('');

  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [inspections, setInspections] = useState<any[]>([]);
  const [selectedInspectionId, setSelectedInspectionId] = useState<number | null>(null);
  
  // App settings
  const [language, setLanguage] = useState<string>('en');
  const [rulesVersion, setRulesVersion] = useState<string>("PCR 2011 (Consolidated 2026)");

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
        setUser(data);
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
  
  // Scanning state
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [activeSide, setActiveSide] = useState<string>('front');
  const [currentInspection, setCurrentInspection] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  
  // Camera stream ref
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mock static stats
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

  // Dummy Initial Data
  useEffect(() => {
    const dummyInspections = [
      {
        id: 101,
        product: { name: "Premium Basmati Rice", manufacturer: "India Foods Ltd", category: "Grain", barcode: "8901234567890" },
        timestamp: "2026-08-25T10:30:00",
        status: "COMPLIANT",
        location: "Warehouse A, New Delhi",
        officer: "Officer Shrey",
        declarations: [
          { field_name: "mrp", value: "₹240", status: "VALIDATED", confidence: 0.98, original_text: "MRP Rs 240.00" },
          { field_name: "net_quantity", value: "5 kg", status: "VALIDATED", confidence: 0.96, original_text: "NET QUANTITY 5 kg" },
          { field_name: "manufacturer", value: "India Foods Ltd", status: "VALIDATED", confidence: 0.95, original_text: "Mfd by India Foods Ltd" },
          { field_name: "packing_date", value: "07/2026", status: "VALIDATED", confidence: 0.94, original_text: "PKD 07/2026" },
          { field_name: "consumer_care", value: "1800-111-222", status: "VALIDATED", confidence: 0.91, original_text: "Care No: 1800-111-222" },
        ],
        compliance_results: [
          { rule_id: "PC-MRP-001", field: "mrp", status: "PASS", details: "MRP declaration present and validly formatted (₹240)" },
          { rule_id: "PC-QTY-002", field: "net_quantity", status: "PASS", details: "Net quantity is declared in standard units (kg)" },
          { rule_id: "PC-DATE-003", field: "packing_date", status: "PASS", details: "Packing date present and valid (07/2026)" },
          { rule_id: "PC-CARE-004", field: "consumer_care", status: "PASS", details: "Customer care details detected" }
        ],
        notes: "Perfect packaging, all compliance rules satisfied."
      },
      {
        id: 102,
        product: { name: "Choco Bites Family Pack", manufacturer: "Sweet Treats Inc", category: "Confectionery", barcode: "8902345678901" },
        timestamp: "2026-08-25T11:15:00",
        status: "NON_COMPLIANT",
        location: "Reliance Store, Mumbai",
        officer: "Officer Shrey",
        declarations: [
          { field_name: "mrp", value: "₹150", status: "VALIDATED", confidence: 0.97, original_text: "MRP ₹150" },
          { field_name: "net_quantity", value: "400 g", status: "VALIDATED", confidence: 0.95, original_text: "Net Wt. 400g" },
          { field_name: "packing_date", value: "05/2026", status: "VALIDATED", confidence: 0.93, original_text: "PACKED 05/26" },
          { field_name: "consumer_care", value: "", status: "POTENTIAL_VIOLATION", confidence: 0.0, original_text: "No match found" },
        ],
        compliance_results: [
          { rule_id: "PC-MRP-001", field: "mrp", status: "PASS", details: "MRP declaration present and valid" },
          { rule_id: "PC-QTY-002", field: "net_quantity", status: "PASS", details: "Net quantity declared in standard units (g)" },
          { rule_id: "PC-DATE-003", field: "packing_date", status: "PASS", details: "Packing date present" },
          { rule_id: "PC-CARE-004", field: "consumer_care", status: "FAIL", details: "Mandatory Customer Care phone number or email NOT found." }
        ],
        notes: "Missing consumer care address and toll-free helpline number."
      }
    ];
    setInspections(dummyInspections);
  }, []);

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
      
      {/* Sidebar Desktop Navigation */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between shrink-0">
        <div>
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <span className="bg-primary-500 p-2 rounded-lg text-white font-bold flex items-center justify-center">🔍</span>
            <div>
              <h1 className="font-extrabold text-lg leading-tight">PaarakhMetric</h1>
              <p className="text-xs text-slate-400">SIH26034 Metrology App</p>
            </div>
          </div>
          
          <nav className="p-4 space-y-1">
            <button 
              onClick={() => setCurrentPage('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentPage === 'dashboard' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <BarChart2 className="w-5 h-5" />
              Dashboard
            </button>
            <button 
              onClick={() => { startCamera(); setCurrentPage('scan'); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentPage === 'scan' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <Scan className="w-5 h-5" />
              Scan Product
            </button>
            <button 
              onClick={() => setCurrentPage('history')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentPage === 'history' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <History className="w-5 h-5" />
              Inspection History
            </button>
            <button 
              onClick={() => setCurrentPage('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentPage === 'settings' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <SettingsIcon className="w-5 h-5" />
              Settings
            </button>
            <button 
              onClick={() => setUser(null)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors"
            >
              <User className="w-5 h-5" />
              Sign Out
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 space-y-1">
          <p>Version: 1.0 (MVP)</p>
          <p>Mode: Offline-Capable</p>
        </div>
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
                <p className="text-sm text-gray-500">Real-time status of Legal Metrology inspections in target warehouses</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Total Scanned</p>
                    <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{stats.total}</h3>
                  </div>
                  <span className="bg-gray-100 text-gray-600 p-3 rounded-lg"><FileText className="w-6 h-6" /></span>
                </div>
                
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Compliant (PASS)</p>
                    <h3 className="text-3xl font-extrabold text-green-600 mt-1">{stats.compliant}</h3>
                  </div>
                  <span className="bg-green-50 text-green-600 p-3 rounded-lg"><CheckCircle className="w-6 h-6" /></span>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Violations (FAIL)</p>
                    <h3 className="text-3xl font-extrabold text-red-600 mt-1">{stats.nonCompliant}</h3>
                  </div>
                  <span className="bg-red-50 text-red-600 p-3 rounded-lg"><AlertCircle className="w-6 h-6" /></span>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Requires Review</p>
                    <h3 className="text-3xl font-extrabold text-amber-600 mt-1">{stats.review}</h3>
                  </div>
                  <span className="bg-amber-50 text-amber-600 p-3 rounded-lg"><AlertTriangle className="w-6 h-6" /></span>
                </div>
              </div>

              {/* Chart section */}
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
                          {violationStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : '#53789f'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Legal Metrology Guide</h4>
                    <p className="text-sm text-gray-500 mb-4">Quick rules mapping under PCR 2011</p>
                    <div className="space-y-3">
                      <div className="flex gap-3 text-xs bg-slate-50 p-2.5 rounded-lg">
                        <span className="font-bold text-slate-700 uppercase shrink-0">Rule 6</span>
                        <p className="text-slate-600">Requires legible declarations of manufacturer, net quantity, packed date, and customer care contact.</p>
                      </div>
                      <div className="flex gap-3 text-xs bg-slate-50 p-2.5 rounded-lg">
                        <span className="font-bold text-slate-700 uppercase shrink-0">Rule 9</span>
                        <p className="text-slate-600">Specifies layout formatting requirements and readability sizes according to package dimension.</p>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => { startCamera(); setCurrentPage('scan'); }}
                    className="w-full mt-4 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                  >
                    <Plus className="w-5 h-5" />
                    New Packaging Scan
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Scan Page */}
          {currentPage === 'scan' && (
            <div className="max-w-4xl space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Scan Commodity Label</h2>
                <p className="text-sm text-gray-500">Capture label photo using standard devices or upload high-resolution evidence</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Left controls and image display */}
                <div className="md:col-span-2 space-y-4">
                  <div className="relative aspect-[4/3] bg-slate-900 rounded-xl overflow-hidden shadow-inner flex items-center justify-center border border-gray-300">
                    
                    {cameraActive && (
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
                    )}

                    {!cameraActive && capturedImage && (
                      <img src={capturedImage} alt="Captured scan" className="w-full h-full object-contain" />
                    )}

                    {!cameraActive && !capturedImage && (
                      <div className="text-center p-8">
                        <Camera className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">No live feed. Start camera or select upload.</p>
                      </div>
                    )}

                    {/* Quality Warning Overlays */}
                    {cameraActive && (
                      <div className="absolute top-3 left-3 bg-black/75 text-white text-xs px-2.5 py-1.5 rounded flex items-center gap-1.5 backdrop-blur-md">
                        <Info className="w-4 h-4 text-amber-400" />
                        Align PDP inside guidelines
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 justify-center">
                    {cameraActive ? (
                      <button 
                        onClick={capturePhoto} 
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-6 rounded-lg flex items-center gap-2 text-sm shadow transition-colors"
                      >
                        <Camera className="w-5 h-5" />
                        Capture Label Side
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={startCamera} 
                          className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 px-6 rounded-lg flex items-center gap-2 text-sm shadow transition-colors"
                        >
                          <Camera className="w-5 h-5" />
                          Start Live Camera
                        </button>
                        
                        <label className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 px-6 rounded-lg flex items-center gap-2 text-sm shadow-sm cursor-pointer transition-colors">
                          <Upload className="w-5 h-5" />
                          Upload Package Image
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = () => setCapturedImage(reader.result as string);
                                reader.readAsDataURL(file);
                              }
                            }} 
                          />
                        </label>
                      </>
                    )}
                  </div>
                </div>

                {/* Right controls: Multipage & Processing Info */}
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Multi-Side Scans</h3>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { name: 'front', label: 'Front Panel (PDP)' },
                        { name: 'back', label: 'Back Panel' },
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
                      {activeInspection.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Scanned on {new Date(activeInspection.timestamp).toLocaleString()}</p>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => window.print()}
                    className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-2 shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    Export PDF
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
                
                {/* Left side: Package picture with box outlines */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-1.5">
                    <Scan className="w-5 h-5 text-gray-500" />
                    Label Bounding Boxes
                  </h3>
                  
                  <div className="relative border border-gray-100 rounded-lg overflow-hidden bg-slate-100 aspect-square flex items-center justify-center">
                    {/* Simulated image with OCR outlines */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 font-mono text-xs">
                      [Product Label Side View]
                      <p className="text-[10px] text-slate-400 mt-1">(Outlines depict verified OCR coordinates)</p>
                    </div>

                    {/* Sample overlay representation */}
                    <div className="absolute top-1/4 left-1/4 w-1/2 h-12 border-2 border-green-500 bg-green-50/20 flex items-center justify-center text-[10px] text-green-700 font-bold uppercase tracking-wider rounded">
                      MRP detected: ₹240
                    </div>
                    <div className="absolute top-[45%] left-[20%] w-[35%] h-8 border-2 border-green-500 bg-green-50/20 flex items-center justify-center text-[10px] text-green-700 font-bold uppercase tracking-wider rounded">
                      Qty: 5 kg
                    </div>
                    <div className="absolute bottom-[20%] right-[10%] w-[50%] h-10 border-2 border-red-500 bg-red-50/20 flex items-center justify-center text-[10px] text-red-700 font-bold uppercase tracking-wider rounded">
                      Helpline: review
                    </div>
                  </div>
                  
                  <div className="mt-4 text-xs text-gray-500 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-gray-400" />
                    Tap outline labels to directly check coordinates and confidence scores.
                  </div>
                </div>

                {/* Right side: Field validations */}
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Rule Verification Log</h3>
                    
                    <div className="space-y-3">
                      {activeInspection.compliance_results.map((rule: any) => (
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
                      {activeInspection.declarations.map((decl: any) => (
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
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Inspection Log</h2>
                <p className="text-sm text-gray-500 font-normal">Retrieve previously scanned products and edit verification logs offline</p>
              </div>

              {/* History Table */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Inspection ID</th>
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-4">Manufacturer</th>
                      <th className="py-3 px-4">Officer</th>
                      <th className="py-3 px-4">Date/Time</th>
                      <th className="py-3 px-4">Compliance</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                    {inspections.map((insp) => (
                      <tr key={insp.id} className="hover:bg-gray-50/50">
                        <td className="py-3.5 px-4 font-mono">#{insp.id}</td>
                        <td className="py-3.5 px-4">{insp.product.name}</td>
                        <td className="py-3.5 px-4 text-gray-500">{insp.product.manufacturer}</td>
                        <td className="py-3.5 px-4">{insp.officer}</td>
                        <td className="py-3.5 px-4 text-gray-500">{new Date(insp.timestamp).toLocaleString()}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border uppercase ${
                            insp.status === 'COMPLIANT' ? 'bg-green-50 text-green-700 border-green-100' :
                            insp.status === 'NON_COMPLIANT' ? 'bg-red-50 text-red-700 border-red-100' :
                            'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {insp.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button 
                            onClick={() => viewInspection(insp.id)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-1 px-3 rounded font-bold text-xs inline-flex items-center gap-1 transition-colors"
                          >
                            Review
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
