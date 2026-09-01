export type Language = 'en' | 'hi' | 'kn';

export interface Translations {
  appName: string;
  appSubtitle: string;
  loginTitle: string;
  loginSubtitle: string;
  username: string;
  password: string;
  signIn: string;
  defaultCredentials: string;
  offlineFallback: string;
  versionInfo: string;
  dashboard: string;
  scanProduct: string;
  inspectionHistory: string;
  settings: string;
  signOut: string;
  complianceStats: string;
  statsSubtitle: string;
  searchInspectionLog: string;
  totalScanned: string;
  compliant: string;
  violationsFound: string;
  needsReview: string;
  frequentViolations: string;
  batchUpload: string;
  batchUploadDesc: string;
  startFieldInspection: string;
  dbSynced: string;
  officer: string;
  scanTitle: string;
  scanSubtitle: string;
  startCamera: string;
  capturePhoto: string;
  uploadFile: string;
  cancel: string;
  runOcr: string;
  alignPdp: string;
  activePanel: string;
  cameraInactive: string;
  cameraInactiveSub: string;
  frontPanelPdp: string;
  backLabel: string;
  sideViews: string;
  capturedPreview: string;
  imageQuality: string;
  sharpness: string;
  glare: string;
  perspective: string;
  processingCompliance: string;
  historyTitle: string;
  recordsFound: string;
  searchPlaceholder: string;
  status: string;
  category: string;
  all: string;
  allCategories: string;
  grain: string;
  edibleOil: string;
  confectionery: string;
  cosmetics: string;
  beverage: string;
  id: string;
  productName: string;
  manufacturer: string;
  dateTime: string;
  compliance: string;
  score: string;
  actions: string;
  review: string;
  delete: string;
  noInspections: string;
  noInspectionsSub: string;
  resetFilters: string;
  deleteConfirmTitle: string;
  deleteConfirmSubtitle: string;
  deleteConfirmMsg: string;
  confirmDelete: string;
  downloadPdf: string;
  backToHistory: string;
  labelVisualizer: string;
  ruleLog: string;
  manualOverride: string;
  mrpDecl: string;
  netQuantityDecl: string;
  packDateDecl: string;
  consumerCareDecl: string;
  manufacturerDecl: string;
  statutoryRequirement: string;
  verdict: string;
  pass: string;
  fail: string;
  reviewStatus: string;
  saveVerification: string;
  settingsTitle: string;
  settingsSubtitle: string;
  interfaceLang: string;
  interfaceLangDesc: string;
  availableOcrLangs: string;
  autoDetectDesc: string;
  rulesEngine: string;
  rulesEngineDesc: string;
  batchModalTitle: string;
  batchProgress: string;
  approveAndNext: string;
  flagAndNext: string;
  batchCompleteTitle: string;
  batchCompleteMsg: string;
  viewInHistory: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: "PaarakhMetric",
    appSubtitle: "Legal Metrology",
    loginTitle: "Legal Metrology Inspector Portal",
    loginSubtitle: "Sign in for local offline compliance auditing",
    username: "Officer Username",
    password: "Password",
    signIn: "Sign In to Terminal",
    defaultCredentials: "Default credentials: officer_shrey / password123",
    offlineFallback: "100% Fully Offline CPU Processing. Works without active internet.",
    versionInfo: "Version 1.0 • Offline CPU Engine",
    dashboard: "Dashboard",
    scanProduct: "Scan Product",
    inspectionHistory: "Inspection Log",
    settings: "Settings",
    signOut: "Sign Out",
    complianceStats: "Compliance Statistics",
    statsSubtitle: "Real-time breakdown of Legal Metrology (PCR 2011/2026) inspections",
    searchInspectionLog: "Search Inspection Log",
    totalScanned: "Total Scanned",
    compliant: "Compliant",
    violationsFound: "Violations Found",
    needsReview: "Needs Review",
    frequentViolations: "Frequent Violation Categories",
    batchUpload: "Batch Upload & Review",
    batchUploadDesc: "Upload multiple packaging images and verify each item sequentially.",
    startFieldInspection: "Start New Field Inspection",
    dbSynced: "Local Database Synced",
    officer: "Officer",
    scanTitle: "New Product Inspection",
    scanSubtitle: "Capture or upload packaging panels for instant OCR and compliance verification",
    startCamera: "Start Camera Viewfinder",
    capturePhoto: "Capture Photo",
    uploadFile: "Upload File",
    cancel: "Cancel",
    runOcr: "Run OCR & Check Compliance",
    alignPdp: "Align Principal Display Panel (PDP)",
    activePanel: "Active Packaging Panel",
    cameraInactive: "Camera is inactive",
    cameraInactiveSub: "Tap below to activate live scanner or upload an image file",
    frontPanelPdp: "Front Panel (PDP)",
    backLabel: "Back Label",
    sideViews: "Side Panel Views",
    capturedPreview: "Captured Packaging Preview",
    imageQuality: "Image Quality Diagnostics",
    sharpness: "Sharpness Score",
    glare: "Glare Index",
    perspective: "Perspective Warp",
    processingCompliance: "Compliance Processing",
    historyTitle: "Inspection Log & Search",
    recordsFound: "Records Found",
    searchPlaceholder: "Search by product name, manufacturer, barcode, OCR text, or rule ID...",
    status: "Status",
    category: "Category",
    all: "All",
    allCategories: "All Categories",
    grain: "Grain",
    edibleOil: "Edible Oil",
    confectionery: "Confectionery",
    cosmetics: "Cosmetics",
    beverage: "Beverage",
    id: "ID",
    productName: "Product Name",
    manufacturer: "Manufacturer",
    dateTime: "Date/Time",
    compliance: "Compliance",
    score: "Score",
    actions: "Actions",
    review: "Review",
    delete: "Delete",
    noInspections: "No inspections found matching your criteria",
    noInspectionsSub: "Try changing keywords or clearing status filters",
    resetFilters: "Reset all filters",
    deleteConfirmTitle: "Delete Inspection",
    deleteConfirmSubtitle: "This action cannot be undone.",
    deleteConfirmMsg: "Are you sure you want to permanently delete this inspection record? All associated OCR bounding boxes, compliance logs, and generated PDF reports will be purged from the local database.",
    confirmDelete: "Confirm Delete",
    downloadPdf: "Download PDF Notice",
    backToHistory: "Back to History",
    labelVisualizer: "Dynamic Label Visualizer & Multi-Side Views",
    ruleLog: "Rule Verification Log",
    manualOverride: "Manual Verification & Override",
    mrpDecl: "Maximum Retail Price (MRP)",
    netQuantityDecl: "Net Quantity Declaration",
    packDateDecl: "Date of Packing / Mfg",
    consumerCareDecl: "Consumer Care Helpline",
    manufacturerDecl: "Manufacturer / Packer Details",
    statutoryRequirement: "Statutory Requirement",
    verdict: "Verdict",
    pass: "PASS",
    fail: "VIOLATION",
    reviewStatus: "REVIEW",
    saveVerification: "Save Verification Record",
    settingsTitle: "System & Regulatory Configuration",
    settingsSubtitle: "Manage device settings, local storage, and regulatory enforcement matrices",
    interfaceLang: "App Interface Language",
    interfaceLangDesc: "Select language for the user interface and report generation",
    availableOcrLangs: "Available OCR Languages (Auto-Detect)",
    autoDetectDesc: "Multilingual packaging OCR auto-detects all statutory scripts simultaneously by default.",
    rulesEngine: "Consolidated Rules Engine",
    rulesEngineDesc: "Active statutory matrix for automated compliance checking",
    batchModalTitle: "Batch Inspection Queue",
    batchProgress: "Reviewing Item {curr} of {total}",
    approveAndNext: "Approve & Proceed to Next",
    flagAndNext: "Flag for Review & Next",
    batchCompleteTitle: "Batch Audit Completed Successfully",
    batchCompleteMsg: "All {count} packaging items have been audited and saved into your inspection database.",
    viewInHistory: "View All in Inspection Log"
  },
  hi: {
    appName: "पारखमेट्रिक",
    appSubtitle: "विधिक मापविज्ञान",
    loginTitle: "विधिक मापविज्ञान निरीक्षक पोर्टल",
    loginSubtitle: "स्थानीय ऑफ़लाइन अनुपालन ऑडिट हेतु साइन इन करें",
    username: "अधिकारी उपयोगकर्ता नाम",
    password: "पासवर्ड",
    signIn: "टर्मिनल में साइन इन करें",
    defaultCredentials: "डिफ़ॉल्ट क्रेडेंशियल: officer_shrey / password123",
    offlineFallback: "100% पूर्णतः ऑफ़लाइन सीपीयू प्रोसेसिंग। इंटरनेट के बिना भी त्वरित कार्य करता है।",
    versionInfo: "संस्करण 1.0 • ऑफ़लाइन सीपीयू इंजन",
    dashboard: "डैशबोर्ड",
    scanProduct: "उत्पाद स्कैन करें",
    inspectionHistory: "निरीक्षण इतिहास",
    settings: "सेटिंग्स",
    signOut: "साइन आउट",
    complianceStats: "अनुपालन सांख्यिकी",
    statsSubtitle: "विधिक मापविज्ञान (पीसीआर 2011/2026) का वास्तविक समय विवरण",
    searchInspectionLog: "निरीक्षण लॉग खोजें",
    totalScanned: "कुल स्कैन किए गए",
    compliant: "अनुपालक (पास)",
    violationsFound: "उल्लंघन पाए गए",
    needsReview: "समीक्षा आवश्यक",
    frequentViolations: "बार-बार होने वाले उल्लंघन",
    batchUpload: "बैच अपलोड और समीक्षा",
    batchUploadDesc: "एकाधिक पैकेजिंग छवियां अपलोड करें और प्रत्येक की क्रमिक रूप से समीक्षा करें।",
    startFieldInspection: "नया फील्ड निरीक्षण शुरू करें",
    dbSynced: "स्थानीय डेटाबेस सिंक हुआ",
    officer: "अधिकारी",
    scanTitle: "नया उत्पाद निरीक्षण",
    scanSubtitle: "त्वरित ओसीआर और अनुपालन जांच के लिए पैकेजिंग कैप्चर या अपलोड करें",
    startCamera: "कैमरा शुरू करें",
    capturePhoto: "फ़ोटो लें",
    uploadFile: "फ़ाइल अपलोड करें",
    cancel: "रद्द करें",
    runOcr: "ओसीआर चलाएं और अनुपालन जांचें",
    alignPdp: "मुख्य प्रदर्शन पैनल (PDP) संरेखित करें",
    activePanel: "सक्रिय पैकेजिंग पैनल",
    cameraInactive: "कैमरा निष्क्रिय है",
    cameraInactiveSub: "लाइव स्कैनर सक्रिय करने या छवि फ़ाइल अपलोड करने के लिए नीचे टैप करें",
    frontPanelPdp: "सामने का पैनल (PDP)",
    backLabel: "पीछे का लेबल",
    sideViews: "पार्श्व दृश्य (साइड)",
    capturedPreview: "कैप्चर किया गया पैकेजिंग पूर्वावलोकन",
    imageQuality: "छवि गुणवत्ता निदान",
    sharpness: "स्पष्टता स्कोर",
    glare: "चमक सूचकांक",
    perspective: "परिप्रेक्ष्य विकृति",
    processingCompliance: "अनुपालन प्रसंस्करण",
    historyTitle: "निरीक्षण लॉग और खोज",
    recordsFound: "रिकॉर्ड मिले",
    searchPlaceholder: "उत्पाद का नाम, निर्माता, बारकोड, ओसीआर पाठ या नियम आईडी खोजें...",
    status: "स्थिति",
    category: "श्रेणी",
    all: "सभी",
    allCategories: "सभी श्रेणियां",
    grain: "अनाज / दाल",
    edibleOil: "खाद्य तेल",
    confectionery: "मिष्ठान्न / स्नैक्स",
    cosmetics: "प्रसाधन सामग्री",
    beverage: "पेय पदार्थ",
    id: "आईडी",
    productName: "उत्पाद का नाम",
    manufacturer: "निर्माता",
    dateTime: "दिनांक/समय",
    compliance: "अनुपालन",
    score: "स्कोर",
    actions: "कार्रवाई",
    review: "समीक्षा",
    delete: "हटाएं",
    noInspections: "आपके मानदंडों से मेल खाता कोई निरीक्षण नहीं मिला",
    noInspectionsSub: "कीवर्ड बदलने या फ़िल्टर साफ़ करने का प्रयास करें",
    resetFilters: "सभी फ़िल्टर रीसेट करें",
    deleteConfirmTitle: "निरीक्षण हटाएं",
    deleteConfirmSubtitle: "यह क्रिया पूर्ववत नहीं की जा सकती।",
    deleteConfirmMsg: "क्या आप वाकई इस निरीक्षण रिकॉर्ड को स्थायी रूप से हटाना चाहते हैं? सभी ओसीआर बाउंडिंग बॉक्स और पीडीएफ रिपोर्ट हटा दिए जाएंगे।",
    confirmDelete: "हटाने की पुष्टि करें",
    downloadPdf: "पीडीएफ नोटिस डाउनलोड करें",
    backToHistory: "इतिहास पर वापस जाएं",
    labelVisualizer: "डायनामिक लेबल विज़ुअलाइज़र और बहु-पक्षीय दृश्य",
    ruleLog: "नियम सत्यापन लॉग",
    manualOverride: "मैनुअल सत्यापन और बदलाव",
    mrpDecl: "अधिकतम खुदरा मूल्य (MRP)",
    netQuantityDecl: "शुद्ध मात्रा घोषणा",
    packDateDecl: "पैकिंग / निर्माण तिथि",
    consumerCareDecl: "उपभोक्ता सेवा हेल्पलाइन",
    manufacturerDecl: "निर्माता / पैकर विवरण",
    statutoryRequirement: "वैधानिक आवश्यकता",
    verdict: "निर्णय",
    pass: "पास (उत्तीर्ण)",
    fail: "उल्लंघन (फेल)",
    reviewStatus: "समीक्षा आवश्यक",
    saveVerification: "सत्यापन रिकॉर्ड सहेजें",
    settingsTitle: "सिस्टम एवं विनियामक सेटिंग्स",
    settingsSubtitle: "डिवाइस सेटिंग्स और विनियामक प्रवर्तन मैट्रिक्स प्रबंधित करें",
    interfaceLang: "ऐप इंटरफ़ेस भाषा",
    interfaceLangDesc: "यूजर इंटरफेस और रिपोर्ट के लिए भाषा चुनें",
    availableOcrLangs: "उपलब्ध ओसीआर भाषाएं (स्वचालित पहचान)",
    autoDetectDesc: "बहुभाषी पैकेजिंग ओसीआर डिफ़ॉल्ट रूप से सभी वैधानिक लिपियों की स्वचालित रूप से पहचान करता है।",
    rulesEngine: "समेकित नियम इंजन",
    rulesEngineDesc: "स्वचालित अनुपालन जांच के लिए सक्रिय विनियामक मैट्रिक्स",
    batchModalTitle: "बैच निरीक्षण समीक्षा",
    batchProgress: "मद {curr} / {total} की समीक्षा जारी",
    approveAndNext: "स्वीकृत करें और आगे बढ़ें",
    flagAndNext: "समीक्षा हेतु चिह्नित करें",
    batchCompleteTitle: "बैच ऑडिट सफलतापूर्वक पूर्ण",
    batchCompleteMsg: "सभी {count} पैकेजिंग मदों का ऑडिट कर डेटाबेस में सुरक्षित कर लिया गया है।",
    viewInHistory: "निरीक्षण लॉग में सभी देखें"
  },
  kn: {
    appName: "ಪಾರಖ್‌ಮೆಟ್ರಿಕ್",
    appSubtitle: "ಕಾನೂನು ಮಾಪನಶಾಸ್ತ್ರ",
    loginTitle: "ಕಾನೂನು ಮಾಪನಶಾಸ್ತ್ರ ನಿರೀಕ್ಷಕರ ಪೋರ್ಟಲ್",
    loginSubtitle: "ಸ್ಥಳೀಯ ಆಫ್‌ಲೈನ್ ಅನುಸರಣಾ ಆಡಿಟ್‌ಗಾಗಿ ಸೈನ್ ಇನ್ ಮಾಡಿ",
    username: "ಅಧಿಕಾರಿ ಬಳಕೆದಾರ ಹೆಸರು",
    password: "ಪಾಸ್‌ವರ್ಡ್",
    signIn: "ಟರ್ಮಿನಲ್‌ಗೆ ಸೈನ್ ಇನ್ ಮಾಡಿ",
    defaultCredentials: "ಪೂರ್ವನಿಯೋಜಿತ ರುಜುವಾತುಗಳು: officer_shrey / password123",
    offlineFallback: "100% ಸಂಪೂರ್ಣ ಆಫ್‌ಲೈನ್ ಸಿಪಿಯು ಪ್ರಕ್ರಿಯೆ. ಇಂಟರ್ನೆಟ್ ಇಲ್ಲದೆಯೂ ವೇಗವಾಗಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ.",
    versionInfo: "ಆವೃತ್ತಿ 1.0 • ಆಫ್‌ಲೈನ್ ಸಿಪಿಯು ಎಂಜಿನ್",
    dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    scanProduct: "ಉತ್ಪನ್ನ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ",
    inspectionHistory: "ತಪಾಸಣೆ ಲಾಗ್",
    settings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    signOut: "ಸೈನ್ ಔಟ್",
    complianceStats: "ಅನುಸರಣೆ ಅಂಕಿಅಂಶಗಳು",
    statsSubtitle: "ಕಾನೂನು ಮಾಪನಶಾಸ್ತ್ರ (ಪಿಸಿಆರ್ 2011/2026) ತಪಾಸಣೆಗಳ ನೈಜ-ಸಮಯ ವಿವರ",
    searchInspectionLog: "ತಪಾಸಣೆ ಲಾಗ್ ಹುಡುಕಿ",
    totalScanned: "ಒಟ್ಟು ಸ್ಕ್ಯಾನ್ ಮಾಡಲಾಗಿದೆ",
    compliant: "ಅನುಸರಣೆ (ಪಾಸ್)",
    violationsFound: "ಉಲ್ಲಂಘನೆಗಳು ಕಂಡುಬಂದಿವೆ",
    needsReview: "ಪರಿಶೀಲನೆ ಅಗತ್ಯವಿದೆ",
    frequentViolations: "ಆಗಾಗ್ಗೆ ಉಲ್ಲಂಘನೆ ವಿಭಾಗಗಳು",
    batchUpload: "ಬ್ಯಾಚ್ ಅಪ್‌ಲೋಡ್ ಮತ್ತು ಪರಿಶೀಲನೆ",
    batchUploadDesc: "ಬಹು ಪ್ಯಾಕೇಜಿಂಗ್ ಚಿತ್ರಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ ಮತ್ತು ಅನುಮೋದನೆಯೊಂದಿಗೆ ಒಂದೊಂದಾಗಿ ಪರಿಶೀಲಿಸಿ.",
    startFieldInspection: "ಹೊಸ ಕ್ಷೇತ್ರ ತಪಾಸಣೆ ಪ್ರಾರಂಭಿಸಿ",
    dbSynced: "ಸ್ಥಳೀಯ ಡೇಟಾಬೇಸ್ ಸಿಂಕ್ ಆಗಿದೆ",
    officer: "ಅಧಿಕಾರಿ",
    scanTitle: "ಹೊಸ ಉತ್ಪನ್ನ ತಪಾಸಣೆ",
    scanSubtitle: "ತ್ವರಿತ ಒಸಿಆರ್ ಮತ್ತು ಅನುಸರಣೆ ಪರಿಶೀಲನೆಗಾಗಿ ಪ್ಯಾಕೇಜಿಂಗ್ ಸೆರೆಹಿಡಿಯಿರಿ ಅಥವಾ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
    startCamera: "ಕ್ಯಾಮೆರಾ ಪ್ರಾರಂಭಿಸಿ",
    capturePhoto: "ಫೋಟೋ ತೆಗೆಯಿರಿ",
    uploadFile: "ಫೈಲ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
    cancel: "ರದ್ದುಮಾಡಿ",
    runOcr: "ಒಸಿಆರ್ ಚಲಾಯಿಸಿ ಮತ್ತು ಪರಿಶೀಲಿಸಿ",
    alignPdp: "ಮುಖ್ಯ ಪ್ರದರ್ಶನ ಫಲಕವನ್ನು (PDP) ಜೋಡಿಸಿ",
    activePanel: "ಸಕ್ರಿಯ ಪ್ಯಾಕೇಜಿಂಗ್ ಫಲಕ",
    cameraInactive: "ಕ್ಯಾಮೆರಾ ನಿಷ್ಕ್ರಿಯವಾಗಿದೆ",
    cameraInactiveSub: "ಲೈವ್ ಸ್ಕ್ಯಾನರ್ ಸಕ್ರಿಯಗೊಳಿಸಲು ಅಥವಾ ಚಿತ್ರ ಫೈಲ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಲು ಕೆಳಗೆ ಟ್ಯಾಪ್ ಮಾಡಿ",
    frontPanelPdp: "ಮುಂಭಾಗದ ಫಲಕ (PDP)",
    backLabel: "ಹಿಂದಿನ ಲೇಬಲ್",
    sideViews: "ಪಾರ್ಶ್ವ ಫಲಕ ನೋಟಗಳು",
    capturedPreview: "ಸೆರೆಹಿಡಿಯಲಾದ ಪ್ಯಾಕೇಜಿಂಗ್ ಪೂರ್ವವೀಕ್ಷಣೆ",
    imageQuality: "ಚಿತ್ರದ ಗುಣಮಟ್ಟ ವಿಶ್ಲೇಷಣೆ",
    sharpness: "ತೀಕ್ಷ್ಣತೆ ಸ್ಕೋರ್",
    glare: "ಹೊಳಪು ಸೂಚ್ಯಂಕ",
    perspective: "ದೃಷ್ಟಿಕೋನ ವಕ್ರತೆ",
    processingCompliance: "ಅನುಸರಣೆ ಪ್ರಕ್ರಿಯೆ",
    historyTitle: "ತಪಾಸಣೆ ಲಾಗ್ ಮತ್ತು ಹುಡುಕಾಟ",
    recordsFound: "ದಾಖಲೆಗಳು ಕಂಡುಬಂದಿವೆ",
    searchPlaceholder: "ಉತ್ಪನ್ನದ ಹೆಸರು, ತಯಾರಕರು, ಬಾರ್‌ಕೋಡ್, ಒಸಿಆರ್ ಪಠ್ಯದ ಮೂಲಕ ಹುಡುಕಿ...",
    status: "ಸ್ಥಿತಿ",
    category: "ವರ್ಗ",
    all: "ಎಲ್ಲಾ",
    allCategories: "ಎಲ್ಲಾ ವರ್ಗಗಳು",
    grain: "ಧಾನ್ಯ / ಬೇಳೆಕಾಳು",
    edibleOil: "ಖಾದ್ಯ ತೈಲ",
    confectionery: "ಮಿಠಾಯಿ / ತಿಂಡಿಗಳು",
    cosmetics: "ಸೌಂದರ್ಯವರ್ಧಕಗಳು",
    beverage: "ಪಾನೀಯಗಳು",
    id: "ಐಡಿ",
    productName: "ಉತ್ಪನ್ನದ ಹೆಸರು",
    manufacturer: "ತಯಾರಕರು",
    dateTime: "ದಿನಾಂಕ/ಸಮಯ",
    compliance: "ಅನುಸರಣೆ",
    score: "ಸ್ಕೋರ್",
    actions: "ಕ್ರಮಗಳು",
    review: "ಪರಿಶೀಲಿಸಿ",
    delete: "ಅಳಿಸಿ",
    noInspections: "ನಿಮ್ಮ ಮಾನದಂಡಗಳಿಗೆ ಹೊಂದಿಕೆಯಾಗುವ ಯಾವುದೇ ತಪಾಸಣೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ",
    noInspectionsSub: "ಕೀವರ್ಡ್‌ಗಳನ್ನು ಬದಲಾಯಿಸಲು ಅಥವಾ ಫಿಲ್ಟರ್‌ಗಳನ್ನು ತೆರವುಗೊಳಿಸಲು ಪ್ರಯತ್ನಿಸಿ",
    resetFilters: "ಎಲ್ಲಾ ಫಿಲ್ಟರ್‌ಗಳನ್ನು ಮರುಹೊಂದಿಸಿ",
    deleteConfirmTitle: "ತಪಾಸಣೆ ಅಳಿಸಿ",
    deleteConfirmSubtitle: "ಈ ಕ್ರಿಯೆಯನ್ನು ರದ್ದುಗೊಳಿಸಲಾಗುವುದಿಲ್ಲ.",
    deleteConfirmMsg: "ನೀವು ಈ ತಪಾಸಣಾ ದಾಖಲೆಯನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಲು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ? ಎಲ್ಲಾ ಒಸಿಆರ್ ಬೌಂಡಿಂಗ್ ಬಾಕ್ಸ್‌ಗಳು ಮತ್ತು ವರದಿಗಳನ್ನು ತೆರವುಗೊಳಿಸಲಾಗುತ್ತದೆ.",
    confirmDelete: "ಅಳಿಸುವಿಕೆಯನ್ನು ದೃಢೀಕರಿಸಿ",
    downloadPdf: "ಪಿಡಿಎಫ್ ಸೂಚನೆ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
    backToHistory: "ಇತಿಹಾಸಕ್ಕೆ ಹಿಂತಿರುಗಿ",
    labelVisualizer: "ಡೈನಾಮಿಕ್ ಲೇಬಲ್ ವೀಕ್ಷಕ ಮತ್ತು ಬಹು-ಕೋನದ ನೋಟಗಳು",
    ruleLog: "ನಿಯಮ ಪರಿಶೀಲನಾ ಲಾಗ್",
    manualOverride: "ಹಸ್ತಚಾಲಿತ ಪರಿಶೀಲನೆ ಮತ್ತು ತಿದ್ದುಪಡಿ",
    mrpDecl: "ಗರಿಷ್ಠ ಚಿಲ್ಲರೆ ಬೆಲೆ (MRP)",
    netQuantityDecl: "ನಿವ್ವಳ ಪ್ರಮಾಣ ಘೋಷಣೆ",
    packDateDecl: "ಪ್ಯಾಕಿಂಗ್ / ಉತ್ಪಾದನಾ ದಿನಾಂಕ",
    consumerCareDecl: "ಗ್ರಾಹಕ ಸೇವಾ ಸಹಾಯವಾಣಿ",
    manufacturerDecl: "ತಯಾರಕರು / ಪ್ಯಾಕರ್ ವಿವರ",
    statutoryRequirement: "ಶಾಸನಬದ್ಧ ಅವಶ್ಯಕತೆ",
    verdict: "ತೀರ್ಪು",
    pass: "ಪಾಸ್ (ಸಮರ್ಪಕ)",
    fail: "ಉಲ್ಲಂಘನೆ (ವಿಫಲ)",
    reviewStatus: "ಪರಿಶೀಲನೆ ಅಗತ್ಯವಿದೆ",
    saveVerification: "ಪರಿಶೀಲನಾ ದಾಖಲೆ ಉಳಿಸಿ",
    settingsTitle: "ವ್ಯವಸ್ಥೆ ಮತ್ತು ನಿಯಂತ್ರಕ ಸಂರಚನೆ",
    settingsSubtitle: "ಸಾಧನ ಸೆಟ್ಟಿಂಗ್‌ಗಳು ಮತ್ತು ನಿಯಂತ್ರಕ ಜಾರಿ ಮ್ಯಾಟ್ರಿಕ್ಸ್‌ಗಳನ್ನು ನಿರ್ವಹಿಸಿ",
    interfaceLang: "ಅಪ್ಲಿಕೇಶನ್ ಭಾಷೆ",
    interfaceLangDesc: "ಬಳಕೆದಾರ ಇಂಟರ್ಫೇಸ್ ಮತ್ತು ವರದಿಗಳಿಗಾಗಿ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    availableOcrLangs: "ಲಭ್ಯವಿರುವ ಒಸಿಆರ್ ಭಾಷೆಗಳು (ಸ್ವಯಂ ಪತ್ತೆ)",
    autoDetectDesc: "ಬಹುಭಾಷಾ ಪ್ಯಾಕೇಜಿಂಗ್ ಒಸಿಆರ್ ಪೂರ್ವನಿಯೋಜಿತವಾಗಿ ಎಲ್ಲಾ ಶಾಸನಬದ್ಧ ಲಿಪಿಗಳನ್ನು ಏಕಕಾಲದಲ್ಲಿ ಸ್ವಯಂ-ಪತ್ತೆ ಮಾಡುತ್ತದೆ.",
    rulesEngine: "ಏಕೀಕೃತ ನಿಯಮಗಳ ಎಂಜಿನ್",
    rulesEngineDesc: "ಸ್ವಯಂಚಾಲಿತ ಅನುಸರಣೆ ಪರಿಶೀಲನೆಗಾಗಿ ಸಕ್ರಿಯ ಶಾಸನಬದ್ಧ ಮ್ಯಾಟ್ರಿಕ್ಸ್",
    batchModalTitle: "ಬ್ಯಾಚ್ ತಪಾಸಣೆ ಪರಿಶೀಲನೆ",
    batchProgress: "ಐಟಂ {curr} / {total} ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ",
    approveAndNext: "ಅನುಮೋದಿಸಿ ಮತ್ತು ಮುಂದುವರಿಯಿರಿ",
    flagAndNext: "ಪರಿಶೀಲನೆಗಾಗಿ ಫ್ಲ್ಯಾಗ್ ಮಾಡಿ",
    batchCompleteTitle: "ಬ್ಯಾಚ್ ಆಡಿಟ್ ಯಶಸ್ವಿಯಾಗಿ ಪೂರ್ಣಗೊಂಡಿದೆ",
    batchCompleteMsg: "ಎಲ್ಲಾ {count} ಪ್ಯಾಕೇಜಿಂಗ್ ಐಟಂಗಳನ್ನು ಆಡಿಟ್ ಮಾಡಲಾಗಿದೆ ಮತ್ತು ಡೇಟಾಬೇಸ್‌ಗೆ ಉಳಿಸಲಾಗಿದೆ.",
    viewInHistory: "ತಪಾಸಣೆ ಲಾಗ್‌ನಲ್ಲಿ ಎಲ್ಲವನ್ನೂ ವೀಕ್ಷಿಸಿ"
  }
};
