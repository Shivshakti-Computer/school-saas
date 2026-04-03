// FILE: src/lib/chatbot/qa-database.ts
// ═══════════════════════════════════════════════════════════
// Skolify AI Assistant — Knowledge Base
// Formal · Respectful · Professional Indian Tone
// Pure TypeScript — No JSX
// ═══════════════════════════════════════════════════════════

export type UserRole = 'admin' | 'teacher' | 'student' | 'parent' | 'guest'
export type QuestionCategory =
  | 'billing'
  | 'features'
  | 'setup'
  | 'technical'
  | 'support'
  | 'credits'
  | 'limits'
  | 'modules'
  | 'general'

export interface QuickReply {
  text: string
  action?: 'navigate' | 'forward' | 'send_message'
  payload?: string
}

export interface ChatAnswer {
  id: string
  patterns: string[]
  answer: string
  category: QuestionCategory
  roles: UserRole[]
  quickReplies?: QuickReply[]
  canForward?: boolean
  relatedQuestions?: string[]
  metadata?: {
    priority?: number
    lastUpdated?: string
  }
}

// ══════════════════════════════════════════════════════════
// GREETING & GENERAL
// ══════════════════════════════════════════════════════════

export const GREETING_QA: ChatAnswer[] = [
  {
    id: 'greeting_welcome',
    patterns: [
      'hello',
      'hi',
      'hey',
      'namaste',
      'namaskar',
      'helo',
      'hii',
      'start',
      'help',
    ],
    answer: `नमस्कार! 🙏 मैं **Skolify Assistant** हूँ।\n\nमैं आपकी निम्न विषयों में सहायता कर सकता हूँ:\n\n• 📦 **योजनाएँ एवं मूल्य निर्धारण** — शुल्क संरचना\n• 🎁 **निःशुल्क परीक्षण** — 60 दिवस का निःशुल्क अनुभव\n• 💳 **Credits प्रणाली** — संदेश प्रबंधन\n• 🏫 **सुविधाएँ** — उपलब्ध modules\n• 🔧 **Setup सहायता** — प्रारंभ कैसे करें\n• 💰 **Billing** — भुगतान एवं नीतियाँ\n\nकृपया बताएं, आप किस विषय में जानकारी चाहते हैं?`,
    category: 'general',
    roles: ['admin', 'teacher', 'student', 'parent', 'guest'],
    quickReplies: [
      { text: 'योजनाएँ देखें', payload: 'admin_plans_overview' },
      { text: 'निःशुल्क परीक्षण', payload: 'trial_info' },
      { text: 'सुविधाएँ', payload: 'features_overview' },
      { text: 'Support', action: 'forward' },
    ],
  },
]

// ══════════════════════════════════════════════════════════
// ADMIN: BILLING & CREDITS
// ══════════════════════════════════════════════════════════

export const ADMIN_BILLING_QA: ChatAnswer[] = [
  {
    id: 'admin_plans_overview',
    patterns: [
      'plan',
      'plans',
      'pricing',
      'price',
      'cost',
      'kitna',
      'monthly',
      'yearly',
      'subscription',
    ],
    answer: `## 💰 Skolify की योजनाएँ\n\n| योजना | मासिक शुल्क | छात्र सीमा | शिक्षक सीमा | निःशुल्क Credits |\n|------|----------|----------|----------|-------------|\n| **Starter** | ₹499 | 500 | 20 | 500 |\n| **Growth** | ₹999 | 1,500 | 50 | 1,500 |\n| **Pro** | ₹1,999 | 5,000 | 150 | 3,000 |\n| **Enterprise** | ₹3,999 | असीमित | असीमित | 10,000 |\n\n### ✨ मुख्य विशेषताएँ:\n\n✔ **वार्षिक बिलिंग = 2 माह निःशुल्क**\n✔ **60 दिवस का निःशुल्क परीक्षण** — कोई credit card आवश्यक नहीं\n✔ **किसी भी समय upgrade** — Pro-rata billing\n✔ **किसी भी समय रद्द करें** — कोई छिपी हुई फीस नहीं\n\n### 🎯 कौनसी योजना चुनें?\n\n**100-300 छात्र** → Starter (₹17/दिन)\n**300-1000 छात्र** → Growth (सर्वाधिक लोकप्रिय)\n**1000-3000 छात्र** → Pro\n**3000+ या शाखा विद्यालय** → Enterprise\n\n[विस्तृत तुलना देखें →](/pricing)`,
    category: 'billing',
    roles: ['admin', 'guest'],
    quickReplies: [
      { text: 'Upgrade प्रक्रिया', payload: 'admin_upgrade' },
      { text: 'Credit प्रणाली', payload: 'credit_system_overview' },
      { text: 'परीक्षण प्रारंभ करें', payload: 'trial_info' },
    ],
    relatedQuestions: ['admin_upgrade', 'credit_system_overview'],
  },

  {
    id: 'credit_system_overview',
    patterns: [
      'credit',
      'sms',
      'whatsapp',
      'message',
      'messaging',
      'notification',
    ],
    answer: `## 💳 Credit प्रणाली क्या है?\n\n**Pay-as-you-go संदेश प्रणाली!**\n\n### Credit मूल्य:\n\n| कार्रवाई | Credits | मूल्य |\n|--------|---------|------|\n| 1 SMS | 1 | ₹1 |\n| 1 WhatsApp | 1 | ₹1 |\n| 10 Emails | 1 | ₹0.10/email |\n\n### मासिक निःशुल्क Credits:\n\n**Starter** → 500 credits\n**Growth** → 1,500 credits\n**Pro** → 3,000 credits\n**Enterprise** → 10,000 credits\n\n### उदाहरण:\n\n500 छात्रों का विद्यालय:\n• दैनिक उपस्थिति SMS = 500 credits/माह\n• शुल्क अनुस्मारक = 200 credits\n• सूचनाएँ = 100 credits\n**कुल आवश्यकता: 800 credits**\n\n✔ Starter निःशुल्क: 500\n✔ अतिरिक्त आवश्यक: 300 (₹300)\n\n### Rollover नीति:\n\n**Starter** → ❌ कोई rollover नहीं\n**Growth** → ✔ 3 माह तक मान्य\n**Pro** → ✔ 6 माह तक मान्य\n**Enterprise** → ✔ कभी समाप्त नहीं होते\n\n[Credit packs खरीदें →](Admin panel)`,
    category: 'credits',
    roles: ['admin'],
    quickReplies: [
      { text: 'Credit packs', payload: 'buy_credits' },
      { text: 'Rollover विवरण', payload: 'credit_expiry' },
      { text: 'योजना upgrade', payload: 'admin_upgrade' },
    ],
  },

  {
    id: 'buy_credits',
    patterns: [
      'buy credit',
      'credit pack',
      'purchase credit',
      'extra credit',
    ],
    answer: `## 💳 Credit Packs खरीदें\n\n| Pack | Credits | मूल्य | ₹/Credit | बचत |\n|------|---------|-------|----------|--------|\n| Small | 250 | ₹199 | ₹0.80 | 0% |\n| **Medium** | 700 | ₹499 | ₹0.71 | 29% |\n| Large | 1,500 | ₹999 | ₹0.67 | 33% |\n| Bulk | 3,500 | ₹1,999 | ₹0.57 | 43% |\n\n### खरीद प्रक्रिया:\n\n**Admin Panel → Subscription → Credit Packs**\n\n1. Pack चुनें\n2. "Buy Now" पर क्लिक करें\n3. Razorpay payment (UPI/Card/Net Banking)\n4. Credits तुरंत जुड़ जाएंगे ✔\n\n### भुगतान विधियाँ:\n\n✔ UPI (PhonePe, GPay, Paytm)\n✔ Debit/Credit Card\n✔ Net Banking\n✔ Wallets\n\n**सुरक्षित एवं विश्वसनीय** — Razorpay (PCI DSS certified)\n\n[अभी खरीदें →](Admin dashboard)`,
    category: 'credits',
    roles: ['admin'],
    quickReplies: [
      { text: 'सर्वोत्तम pack?', payload: 'credit_pack_recommendation' },
      { text: 'भुगतान समस्या', action: 'forward' },
    ],
    canForward: true,
  },

  {
    id: 'credit_expiry',
    patterns: [
      'expire',
      'expiry',
      'rollover',
      'lapse',
      'carry forward',
      'unused',
    ],
    answer: `## ♻️ Credit Rollover एवं समाप्ति\n\n| योजना | Rollover नीति |\n|------|----------------|\n| **Starter** | ❌ प्रतिमाह समाप्त |\n| **Growth** | ✔ 3 माह मान्य |\n| **Pro** | ✔ 6 माह मान्य |\n| **Enterprise** | ✔ कभी समाप्त नहीं |\n\n### उदाहरण (Growth Plan):\n\n**जनवरी:** 500 निःशुल्क + 200 खरीदे = 700\n→ उपयोग 600 → **शेष: 100**\n\n**फरवरी:** नए 500 + 100 carry = 600\n→ उपयोग 400 → **शेष: 200**\n\n**मार्च:** नए 500 + 200 carry = 700\n→ उपयोग 500 → **शेष: 200**\n\n**अप्रैल:** नए 500 + 200 carry = 700\n→ **जनवरी के 100 समाप्त** (3 माह पुराने)\n\n### सुझाव:\n\n✔ Growth/Pro upgrade → rollover स्वचालित\n✔ Enterprise → कभी समाप्त नहीं\n✔ उपयोग ट्रैकिंग → Admin panel में देखें\n\n**Upgrade करने पर credits सुरक्षित रहते हैं!**`,
    category: 'credits',
    roles: ['admin'],
    quickReplies: [
      { text: 'योजना upgrade', payload: 'admin_upgrade' },
      { text: 'उपयोग statistics', payload: 'usage_stats' },
    ],
  },

  {
    id: 'credit_rollover_detail',
    patterns: [
      'rollover kya hai',
      'rollover kaise kaam karta hai',
      'credit rollover',
      'rollover policy',
      'rollover upgrade',
      'credits safe',
      'credits bachenge',
      'purane credit',
      'credit transfer',
      'rollover benefit',
    ],
    answer: `## ♻️ Credit Rollover — सम्पूर्ण जानकारी\n\n**Rollover का अर्थ है — अप्रयुक्त credits अगले माह carry forward होना।**\n\n### योजना-वार Rollover:\n\n| योजना | Rollover | वैधता | विशेष |\n|------|----------|-------|-------|\n| **Starter** | ❌ नहीं | — | माह अंत में समाप्त |\n| **Growth** | ✔ हाँ | 3 माह | Auto carry forward |\n| **Pro** | ✔ हाँ | 6 माह | Auto carry forward |\n| **Enterprise** | ✔ हाँ | कभी नहीं | Permanent |\n\n### Rollover कैसे काम करता है?\n\n**Growth Plan उदाहरण (1,500 credits/माह):**\n\n**जनवरी:**\n• मिले: 1,500\n• उपयोग: 900\n• शेष: 600 → अगले माह carry ✔\n\n**फरवरी:**\n• नए: 1,500 + carry 600 = **2,100**\n• उपयोग: 1,200\n• शेष: 900 → carry ✔\n\n**मार्च:**\n• नए: 1,500 + carry 900 = **2,400**\n• उपयोग: 800\n• शेष: 1,600 → carry ✔\n\n**अप्रैल:**\n• जनवरी के 600 की 3 माह वैधता समाप्त\n• केवल फरवरी + मार्च के credits carry होंगे\n\n### Purchased Credits का Rollover:\n\n✔ खरीदे गए credit packs पर भी rollover लागू\n✔ Plan के अनुसार वैधता मिलती है\n✔ Enterprise में purchased credits कभी expire नहीं\n\n### Upgrade करने पर:\n\n**Starter → Growth:**\n• Starter के unused credits — ❌ expire (rollover नहीं था)\n• Growth से नया rollover प्रारंभ ✔\n\n**Growth → Pro:**\n• Growth के सभी rollover credits — ✔ safe रहते हैं\n• Pro की 6 माह वैधता लागू होती है\n\n**Pro → Enterprise:**\n• सभी credits — ✔ permanent हो जाते हैं\n• कभी expire नहीं होंगे\n\n### Credit उपयोग का क्रम:\n\n**FIFO (First In, First Out):**\n• सबसे पुराने credits पहले उपयोग होते हैं\n• यह स्वचालित है — मैन्युअल नहीं करना\n\n### Track कैसे करें?\n\n**Admin Panel → Subscription → Credit History**\n\n✔ कब मिले\n✔ कितने उपयोग हुए\n✔ कब expire होंगे\n✔ Balance summary\n\n### सुझाव:\n\n• **Starter** पर हैं और credits waste हो रहे हैं → Growth upgrade करें\n• **Growth** पर हैं और 3 माह से ज़्यादा बचाना है → Pro लें\n• **बड़ा credit pack** खरीद रहे हैं → Enterprise सबसे किफ़ायती`,
    category: 'credits',
    roles: ['admin'],
    quickReplies: [
      { text: 'Credit history देखें', payload: 'usage_stats' },
      { text: 'Growth upgrade', payload: 'admin_upgrade' },
      { text: 'Credit pack खरीदें', payload: 'buy_credits' },
    ],
    relatedQuestions: ['credit_expiry', 'admin_upgrade', 'buy_credits'],
    metadata: {
      priority: 8,
      lastUpdated: '2025-01',
    },
  },

  {
    id: 'admin_upgrade',
    patterns: [
      'upgrade',
      'change plan',
      'higher plan',
      'switch plan',
      'better plan',
    ],
    answer: `## ⬆️ योजना Upgrade कैसे करें?\n\n### प्रक्रिया:\n\n**Admin Portal → Settings → Subscription → Choose Plan → Pay**\n\n### क्या होगा:\n\n✔ **Pro-rated Billing**\n• शेष दिनों का credit मिलेगा\n• नई योजना के शुल्क से घटाया जाएगा\n• केवल अंतर का भुगतान करें\n\n✔ **तुरंत सक्रियण**\n• नए modules unlock हो जाएंगे\n• नई सीमाएँ लागू होंगी\n• शून्य downtime\n\n✔ **डेटा 100% सुरक्षित**\n• सभी records यथावत\n• छात्र, शिक्षक, अभिलेख\n\n### उदाहरण:\n\n**Starter → Growth** (15 दिन शेष)\n\nStarter: ₹499/माह = ₹16.63/दिन\n15 दिन = ₹250 credit\n\nGrowth: ₹999\n**केवल भुगतान: ₹999 - ₹250 = ₹749**\n\n### Upgrade के बाद लाभ:\n\n📈 **नई सुविधाएँ**\n• Online शुल्क संग्रहण\n• परीक्षा एवं परिणाम\n• गृहकार्य प्रणाली\n• उन्नत रिपोर्ट्स\n• अधिक credits (1,500 vs 500)\n\n[अभी upgrade करें →](Admin panel)`,
    category: 'billing',
    roles: ['admin'],
    quickReplies: [
      { text: 'छात्र सीमा', payload: 'student_addon' },
      { text: 'शिक्षक सीमा', payload: 'teacher_addon' },
      { text: 'Downgrade', payload: 'admin_downgrade' },
    ],
    canForward: true,
  },

  {
    id: 'student_addon',
    patterns: [
      'student limit',
      'extra student',
      'add student',
      'more student',
      'student addon',
    ],
    answer: `## 👤 छात्र सीमा बढ़ाना\n\n### 2 विकल्प:\n\n### विकल्प 1: Add-on (त्वरित)\n\n| Pack | छात्र | मूल्य |\n|------|----------|-------|\n| +50 | 50 | ₹99 |\n| +100 | 100 | ₹179 |\n| +250 | 250 | ₹399 |\n| +500 | 500 | ₹699 |\n\n**Admin → Subscription → Student Add-on**\n\n✔ तुरंत सक्रियण\n✔ Razorpay payment\n✔ 2 मिनट में पूर्ण\n\n### विकल्प 2: योजना Upgrade\n\n| वर्तमान | नई योजना | सीमा वृद्धि |\n|---------|----------|----------------|\n| Starter (500) | Growth | +1,000 (कुल 1,500) |\n| Growth (1,500) | Pro | +3,500 (कुल 5,000) |\n| Pro (5,000) | Enterprise | असीमित |\n\n✔ अधिक सुविधाएँ + उच्च सीमा\n✔ बढ़ते विद्यालयों के लिए बेहतर मूल्य\n\n### Add-on सीमाएँ:\n\n| योजना | अधिकतम अतिरिक्त |\n|------|----------|\n| Starter | +250 (कुल 750) |\n| Growth | +750 (कुल 2,250) |\n| Pro | +2,000 (कुल 7,000) |\n| Enterprise | असीमित |\n\n**सुझाव:**\n200-500 छात्र → Add-on लें\n500-1000 छात्र → Growth plan\n1000+ छात्र → Pro/Enterprise`,
    category: 'limits',
    roles: ['admin'],
    quickReplies: [
      { text: 'Add-on खरीदें', payload: 'buy_student_addon' },
      { text: 'Upgrade बेहतर है?', payload: 'admin_upgrade' },
      { text: 'शिक्षक add-on', payload: 'teacher_addon' },
    ],
  },

  {
    id: 'teacher_addon',
    patterns: [
      'teacher limit',
      'extra teacher',
      'staff limit',
      'add teacher',
      'more teacher',
    ],
    answer: `## 👨‍🏫 शिक्षक सीमा बढ़ाना\n\n### वर्तमान सीमाएँ:\n\n| योजना | निःशुल्क | अधिकतम Add-on | कुल अधिकतम |\n|------|------|-----------|----------|\n| Starter | 20 | +10 | 30 |\n| Growth | 50 | +25 | 75 |\n| Pro | 150 | +50 | 200 |\n| Enterprise | असीमित | असीमित | असीमित |\n\n### Add-on Packs:\n\n| Pack | शिक्षक | मूल्य |\n|------|----------|-------|\n| +5 | 5 | ₹99 |\n| +10 | 10 | ₹179 |\n| +25 | 25 | ₹399 |\n\n**Admin → Subscription → Teacher Add-on → Buy**\n\n✔ तुरंत सक्रियण\n✔ Razorpay payment\n✔ 2 मिनट में पूर्ण\n\n### कब Upgrade करें?\n\n**20-30 शिक्षक** → Add-on (₹99)\n**50-75 शिक्षक** → Growth विचार करें\n**150+ शिक्षक** → Pro योजना`,
    category: 'limits',
    roles: ['admin'],
    quickReplies: [
      { text: 'Add-on खरीदें', payload: 'buy_teacher_addon' },
      { text: 'योजना upgrade', payload: 'admin_upgrade' },
      { text: 'छात्र add-on', payload: 'student_addon' },
    ],
  },

  {
    id: 'admin_cancel_policy',
    patterns: [
      'cancel',
      'stop',
      'band',
      'downgrade',
      'delete account',
      'exit',
    ],
    answer: `## ❌ रद्दीकरण एवं वापसी नीति\n\n### रद्द कैसे करें:\n\n**Admin Panel → Settings → Subscription → Cancel**\n\n### क्या होगा:\n\n✔ **अवधि समाप्ति तक उपयोग**\n• आज रद्द करें = माह के अंत तक उपयोग करें\n• अगली billing नहीं होगी\n\n❌ **समाप्ति के बाद सुविधाएँ बंद**\n• Modules lock हो जाएंगे\n• केवल subscription page दिखेगा\n\n✔ **डेटा 90 दिन सुरक्षित**\n• किसी भी समय पुनः सक्रिय करें\n• पूर्ण पुनर्स्थापना\n\n### वापसी नीति:\n\n**मासिक योजना:**\n❌ कोई वापसी नहीं\n✔ शेष अवधि तक उपयोग\n\n**वार्षिक योजना:**\n✔ 30 दिन के भीतर = Pro-rata वापसी\n❌ 30 दिन के बाद = कोई वापसी नहीं\n\n### उदाहरण (वार्षिक):\n\n1 जनवरी: ₹9,999 वार्षिक भुगतान\n15 जनवरी: रद्द (14 दिन)\n**वापसी: ~₹9,200** (346 दिन अप्रयुक्त)\n\n### डेटा विलोपन:\n\n**स्थायी रूप से हटाना है?**\n• Support से संपर्क करें\n• 7 दिन की प्रक्रिया\n• पूर्ण विलोपन\n\n[रद्द करें →](Admin settings) | [Support →](/enquiry)`,
    category: 'billing',
    roles: ['admin'],
    quickReplies: [
      { text: 'वापसी जांचें', action: 'forward' },
      { text: 'डेटा export', payload: 'data_export' },
      { text: 'Support', action: 'forward' },
    ],
    canForward: true,
  },
]

// ══════════════════════════════════════════════════════════
// ADMIN: FEATURES & SETUP
// ══════════════════════════════════════════════════════════

export const ADMIN_FEATURES_QA: ChatAnswer[] = [
  {
    id: 'features_overview',
    patterns: [
      'feature',
      'module',
      'kya hai',
      'kya kya',
      'available',
      'modules',
    ],
    answer: `## 📦 Skolify की 22+ सुविधाएँ\n\n### ✔ मूल सुविधाएँ (सभी योजनाओं में):\n\n• **छात्र प्रबंधन** — Bulk import, ID cards\n• **उपस्थिति** — दैनिक अंकन, रिपोर्ट, SMS\n• **सूचना बोर्ड** — तत्काल सूचनाएँ\n• **विद्यालय Website** — Professional site builder\n• **Gallery** — फोटो albums\n\n### 📈 Growth+ (₹999+):\n\n• **शुल्क संग्रहण** — Online payments (Razorpay)\n• **परीक्षा एवं परिणाम** — अंक प्रविष्टि, grade cards\n• **गृहकार्य** — Assignments, submissions\n• **समय-सारणी** — कक्षा schedules\n• **प्रमाणपत्र** — TC, CC, Bonafide स्वचालित\n• **रिपोर्ट** — Analytics dashboard\n• **संचार** — Bulk SMS/WhatsApp/Email\n\n### 🎓 Pro+ (₹1,999+):\n\n• **पुस्तकालय** — पुस्तक सूची, issue tracking\n• **प्रमाणपत्र** — Custom generation\n• **Online Classes (LMS)** — Video lessons, quizzes\n\n### 🏢 Enterprise (₹3,999+):\n\n• **HR एवं वेतन** — Salary, leaves, payslips\n• **परिवहन** — Routes, GPS tracking\n• **छात्रावास** — कक्ष आवंटन, भोजन\n• **इन्वेंटरी** — संपत्ति tracking\n• **आगंतुक प्रबंधन** — Gate pass, logs\n• **स्वास्थ्य रिकॉर्ड** — चिकित्सा इतिहास\n• **पूर्व छात्र नेटवर्क** — Directory, events\n\n### 📱 विशेष:\n\n✔ **PWA** — मोबाइल पर install करें\n✔ **Multi-role** — Admin/Teacher/Student/Parent\n✔ **सुरक्षा** — HTTPS, role-based access\n\n[सभी सुविधाएँ देखें →](/features)`,
    category: 'modules',
    roles: ['admin', 'guest'],
    quickReplies: [
      { text: 'Website builder', payload: 'website_builder' },
      { text: 'Mobile app', payload: 'mobile_app' },
      { text: 'शुल्क संग्रहण', payload: 'fee_setup' },
    ],
  },

  {
    id: 'website_builder',
    patterns: ['website', 'web', 'site', 'school website', 'builder'],
    answer: `## 🌐 विद्यालय Website Builder\n\n**बिना coding के Professional website!**\n\n### सुविधाएँ:\n\n✔ **10+ Templates**\n• पूर्व-डिज़ाइन किए गए professional\n• Mobile responsive\n• SEO optimized\n\n✔ **अनुभाग:**\n• Home with hero image\n• विद्यालय परिचय\n• शिक्षक निर्देशिका\n• समाचार एवं अपडेट\n• Gallery (स्वचालित sync)\n• प्रवेश फॉर्म (सीधा)\n• शुल्क संरचना (स्वचालित)\n• संपर्क फॉर्म\n\n✔ **Domain:**\n• निःशुल्क: myschool.skolify.in\n• Custom: myschool.com (₹299/वर्ष)\n\n✔ **एकीकरण:**\n• Events from calendar\n• Gallery स्वचालित sync\n• शुल्क संरचना admin से\n\n### Setup (15 मिनट):\n\n**Admin → Website Builder**\n\n1. Template चुनें\n2. रंग, जानकारी customize करें\n3. Logo upload करें\n4. सामग्री जोड़ें\n5. Publish करें ✔\n\n**Starter योजना से उपलब्ध!**\n\n[अभी setup करें →](Admin panel)`,
    category: 'modules',
    roles: ['admin'],
    quickReplies: [
      { text: 'Custom domain', payload: 'custom_domain' },
      { text: 'उदाहरण देखें', payload: '/website-examples' },
      { text: 'Setup सहायता', action: 'forward' },
    ],
    canForward: true,
  },

  {
    id: 'mobile_app',
    patterns: [
      'app',
      'mobile',
      'android',
      'ios',
      'phone',
      'pwa',
      'download',
      'install',
    ],
    answer: `## 📱 Mobile App (PWA)\n\n**Native app की आवश्यकता नहीं!**\n\nSkolify = **Progressive Web App**\n\n### यह क्या है?\n\n✔ Web app जैसा install होता है\n✔ Native app जैसी performance\n✔ App store की आवश्यकता नहीं\n✔ Browser से स्वचालित\n\n### Installation:\n\n**Android:**\n1. Portal खोलें (Chrome में)\n2. Menu → "Install app"\n3. Home screen पर icon आ जाएगा ✔\n\n**iPhone:**\n1. Safari में खोलें\n2. Share → "Add to Home Screen"\n3. पूर्ण ✔\n\n### लाभ:\n\n✔ **Offline कार्य**\n• उपस्थिति mark करें → बाद में sync\n• ₹5,000 के मोबाइल में चलेगा\n\n✔ **तीव्र loading**\n• Native जैसी गति\n• Push notifications\n\n✔ **सदैव अद्यतन**\n• मैन्युअल updates नहीं\n• नवीनतम सुविधाएँ स्वचालित\n\n### भूमिकाओं के लिए:\n\n**शिक्षक:**\n📱 कक्षा में उपस्थिति mark करें\n📱 चलते-फिरते अंक दर्ज करें\n📱 सूचनाएँ जांचें\n\n**अभिभावक:**\n📱 उपस्थिति देखें\n📱 शुल्क भुगतान करें\n📱 सूचनाएँ प्राप्त करें\n\n**छात्र:**\n📱 उपस्थिति देखें\n📱 Assignments जमा करें\n📱 परिणाम जांचें`,
    category: 'modules',
    roles: ['admin', 'teacher', 'student', 'parent'],
    quickReplies: [
      { text: 'Offline सुविधाएँ', payload: 'offline_features' },
      { text: 'App size', payload: 'app_size' },
      { text: 'Install समस्या', action: 'forward' },
    ],
  },
]

// ══════════════════════════════════════════════════════════
// ADMIN: SETUP
// ══════════════════════════════════════════════════════════

export const ADMIN_SETUP_QA: ChatAnswer[] = [
  {
    id: 'admin_first_steps',
    patterns: [
      'setup',
      'start',
      'begin',
      'shuru',
      'kaise',
      'how to',
      'getting started',
    ],
    answer: `## ⚡ Setup — 5 सरल चरण\n\n### चरण 1: पंजीकरण (1 मिनट)\n\n[Register करें →](/register)\n• विद्यालय नाम, फोन, शहर\n• ✔ परीक्षण प्रारंभ!\n\n### चरण 2: विद्यालय विवरण (2 मिनट)\n\n**Settings → School Info**\n• पता, फोन\n• Logo upload\n• प्राचार्य का नाम\n\n### चरण 3: छात्र जोड़ें (5 मिनट)\n\n**Students → Import**\n• Excel template download करें\n• डेटा भरें\n• Upload करें\n• **500 छात्र 5 मिनट में!**\n\n### चरण 4: शिक्षक जोड़ें (3 मिनट)\n\n**Teachers → Add**\n• नाम, फोन, email\n• विषय, कक्षा\n• उन्हें login मिल जाएगा ✔\n\n### चरण 5: Modules सेटअप करें\n\n**Settings → Modules**\n• शुल्क संग्रहण सक्षम करें\n• Website setup करें\n• सूचनाएँ configure करें\n\n**कुल: 15 मिनट!** ⚡\n\n### सहायता:\n\n💬 Live chat\n📞 WhatsApp\n📧 Email\n📹 Video call setup\n\n[प्रारंभ करें →](Admin panel)`,
    category: 'setup',
    roles: ['admin'],
    quickReplies: [
      { text: 'Bulk import', payload: 'bulk_import' },
      { text: 'शुल्क setup', payload: 'fee_setup' },
      { text: 'Support', action: 'forward' },
    ],
    canForward: true,
  },

  {
    id: 'bulk_import',
    patterns: [
      'bulk import',
      'import student',
      'csv',
      'excel',
      'batch',
      'upload',
    ],
    answer: `## 📥 Bulk छात्र Import\n\n**500+ छात्र 5 मिनट में!**\n\n### प्रक्रिया:\n\n**1. Template Download करें**\n\nStudents → Import → Download\n\n**2. Excel भरें**\n\n| Column | आवश्यक |\n|--------|----------|\n| Roll No | ✔ |\n| Name | ✔ |\n| Class | ✔ |\n| Parent Phone | ✔ |\n| Email | ❌ |\n| DOB | ❌ |\n| Address | ❌ |\n\n**3. Upload करें**\n\nStudents → Import → Choose File → Upload\n\n**4. सत्यापित करें**\n\nत्रुटियाँ दिखेंगी (यदि कोई हो) → सुधारें → पुनः प्रयास\n\n**5. पूर्ण!**\n\n500 छात्र जुड़ गए ✔\n\n### सुझाव:\n\n✔ CSV format बेहतर है\n✔ Phone: 10 अंक (बिना +91)\n✔ Class names सुसंगत रखें\n✔ Duplicate roll numbers नहीं\n✔ UTF-8 encoding\n\n### त्रुटियाँ:\n\n**"Invalid roll"** → रिक्त स्थान जांचें\n**"Class not found"** → पहले class जोड़ें\n**"Phone format"** → ठीक 10 अंक\n\n[अभी import करें →](Admin panel)`,
    category: 'setup',
    roles: ['admin'],
    quickReplies: [
      { text: 'Class setup', payload: 'class_setup' },
      { text: 'शिक्षक assignment', payload: 'teacher_assignment' },
      { text: 'सहायता', action: 'forward' },
    ],
    canForward: true,
  },

  {
    id: 'fee_setup',
    patterns: [
      'fee',
      'fees',
      'fee collection',
      'online payment',
      'razorpay',
    ],
    answer: `## 💰 Online शुल्क संग्रहण Setup\n\n### क्यों Online?\n\n✔ अभिभावकों को कार्यालय नहीं आना होगा\n✔ स्वचालित रसीदें\n✔ स्वचालित अनुस्मारक\n✔ विलंब भुगतान सूचनाएँ\n✔ 100% पारदर्शिता\n✔ Razorpay सुरक्षित\n\n### Setup:\n\n**चरण 1: शुल्क संरचना**\n\nFees → Structure → कक्षा-वार निर्धारित करें\n• ट्यूशन, परिवहन, आदि\n• उदाहरण: कक्षा 5 = ₹5,000/माह\n\n**चरण 2: कैलेंडर**\n\n• मासिक/त्रैमासिक/वार्षिक\n• देय तिथियाँ\n• विलंब शुल्क नियम\n\n**चरण 3: आवंटन**\n\n• Bulk assign (कक्षा-वार)\n• या व्यक्तिगत\n\n**चरण 4: अभिभावक Portal**\n\n• अभिभावकों को login मिलता है\n• वे online भुगतान करते हैं\n• सीधे Razorpay\n\n**चरण 5: सूचनाएँ**\n\n• स्वचालित SMS/WhatsApp\n• देय तिथि से पहले\n• लंबित सूचनाएँ\n\n### भुगतान प्रवाह:\n\nअभिभावक App → Fees → Pay\n→ Razorpay (UPI/Card/Net Banking)\n→ Payment\n→ तुरंत रसीद\n→ Admin सूचना\n\n### कमीशन:\n\n**Razorpay: 2% + GST**\n\nउदाहरण:\nअभिभावक भुगतान: ₹5,000\nRazorpay शुल्क: ₹118\n**विद्यालय को मिलता है: ₹4,882**\n\n[Setup करें →](Admin panel)`,
    category: 'setup',
    roles: ['admin'],
    quickReplies: [
      { text: 'शुल्क छूट', payload: 'fee_concessions' },
      { text: 'रिपोर्ट', payload: 'fee_reports' },
      { text: 'अभिभावक portal', payload: 'parent_portal' },
    ],
  },
]

// ══════════════════════════════════════════════════════════
// TEACHER QUESTIONS
// ══════════════════════════════════════════════════════════

export const TEACHER_QA: ChatAnswer[] = [
  {
    id: 'teacher_attendance',
    patterns: [
      'attendance',
      'mark attendance',
      'present',
      'absent',
      'roll call',
    ],
    answer: `## ✔ उपस्थिति कैसे अंकित करें?\n\n### Desktop:\n\n**Teacher Portal → Attendance → Class**\n\n1. Class चुनें\n2. तिथि (आज default)\n3. छात्र सूची\n4. ✔ = उपस्थित, ❌ = अनुपस्थित\n5. टिप्पणी (वैकल्पिक)\n6. Save करें ✔\n\n### Mobile (PWA):\n\n1. App खोलें\n2. Attendance\n3. Class स्वचालित चयन\n4. Quick swipe\n5. Submit करें\n6. **Offline काम करता है!**\n\n### सुविधाएँ:\n\n✔ स्वचालित % गणना\n✔ Bulk mark (सभी उपस्थित)\n✔ इतिहास संपादन\n✔ अवकाश प्रबंधन\n✔ अभिभावक SMS स्वचालित\n\n### समय-सीमा:\n\n❌ 2 बजे के बाद अंकित नहीं कर सकते\n✔ Admin अपवाद उपलब्ध\n\n### रिपोर्ट:\n\nAttendance → Reports\n• छात्र-वार %\n• अनुपस्थिति तिथियाँ\n• कम उपस्थिति सूचनाएँ\n\n[अभी mark करें →](Teacher portal)`,
    category: 'features',
    roles: ['teacher'],
    quickReplies: [
      { text: 'रिपोर्ट', payload: 'attendance_reports' },
      { text: 'Bulk mark', payload: 'bulk_mark' },
      { text: 'अभिभावक सूचनाएँ', payload: 'parent_alerts' },
    ],
  },

  {
    id: 'teacher_marks',
    patterns: ['marks', 'mark entry', 'exam', 'result', 'score', 'grades'],
    answer: `## 📝 अंक प्रविष्टि कैसे करें?\n\n### प्रक्रिया:\n\n**Teacher Portal → Exams → परीक्षा चुनें**\n\n1. परीक्षा चुनें (उदा., "Final - Math")\n2. Class चुनें (उदा., "8A")\n3. छात्र सूची\n4. अंक दर्ज करें\n5. स्वचालित % एवं grade गणना\n6. Save करें ✔\n\n### सुविधाएँ:\n\n✔ अधिकतम अंक सत्यापन\n✔ स्वचालित grades (A, B, C)\n✔ टिप्पणी अनुभाग\n✔ उपस्थिति लिंकिंग\n✔ Bulk import (Excel)\n\n### Bulk Import:\n\nExams → Import\n• Template download करें\n• अंक भरें\n• Upload करें\n• सत्यापित करें\n• पूर्ण!\n\n### Grade Cards:\n\n✔ स्वचालित PDF generation\n✔ अभिभावकों को email\n✔ छात्र portal में view\n✔ Print-ready\n\n### संपादन:\n\n❌ Publish के बाद = locked\n✔ Publish से पहले = असीमित संपादन\n✔ परिवर्तनों के लिए admin से संपर्क करें\n\n[अंक दर्ज करें →](Teacher portal)`,
    category: 'features',
    roles: ['teacher'],
    quickReplies: [
      { text: 'Grade cards', payload: 'grade_cards' },
      { text: 'Performance', payload: 'performance' },
      { text: 'सहायता', action: 'forward' },
    ],
  },

  {
    id: 'teacher_homework',
    patterns: ['homework', 'assignment', 'submit', 'deadline'],
    answer: `## 📚 गृहकार्य कैसे आवंटित करें?\n\n### चरण:\n\n**Teacher Portal → Homework → Create**\n\n1. शीर्षक — "अध्याय 5 अभ्यास"\n2. विषय — स्वचालित चयन\n3. Class — 8A\n4. विवरण — निर्देश\n5. Attachment — PDF/image/video\n6. देय तिथि — 3 दिन\n7. Publish → छात्रों को सूचित!\n\n### छात्र पक्ष:\n\n• Portal में गृहकार्य दृश्यमान\n• Attachments download करें\n• देय तिथि देखें\n• Assignment जमा करें\n\n### Grading:\n\nदेय तिथि के बाद:\n• Submissions दिखेंगे\n• कार्य खोलें\n• 10/20/100 में से अंक दें\n• टिप्पणी जोड़ें\n• Publish करें → छात्र को सूचित\n\n### सुविधाएँ:\n\n✔ देय तिथि विस्तार\n✔ आंशिक submission स्वीकार करें\n✔ पुनः-submission अनुमति\n✔ कक्षा-व्यापी या व्यक्तिगत\n✔ Rubric-based grading\n\n### अभिभावक सूचना:\n\n✔ आवंटन पर माता/पिता को सूचना\n✔ प्रगति अपडेट\n✔ Grades स्वचालित सूचित\n\n[आवंटित करें →](Teacher portal)`,
    category: 'features',
    roles: ['teacher'],
    quickReplies: [
      { text: 'Submission tracking', payload: 'submission_tracking' },
      { text: 'Rubrics', payload: 'rubrics' },
      { text: 'अभिभावक सूचनाएँ', payload: 'parent_homework' },
    ],
  },
]

// ══════════════════════════════════════════════════════════
// STUDENT & PARENT
// ══════════════════════════════════════════════════════════

export const STUDENT_PARENT_QA: ChatAnswer[] = [
  {
    id: 'student_attendance_check',
    patterns: [
      'attendance',
      'present absent',
      'percentage',
      'how many days',
    ],
    answer: `## ✔ उपस्थिति कैसे देखें?\n\n### Student/Parent Portal:\n\n**Dashboard → My Attendance**\n\n### विवरण:\n\n✔ कुल प्रतिशत\n✔ उपस्थित/अनुपस्थित संख्या\n✔ लिए गए अवकाश\n✔ चिकित्सा प्रमाणपत्र\n✔ प्रवृत्ति विश्लेषण\n\n### रंग कोड:\n\n🟢 **>75%** = अच्छा\n🟡 **70-75%** = चेतावनी\n🔴 **<70%** = गंभीर\n\n### महत्वपूर्ण:\n\n⚠️ **75% न्यूनतम** आवश्यक\n✔ कम होने पर अभिभावक सूचना\n❌ 70% से कम = परिणाम प्रभावित हो सकते हैं\n\n### मासिक दृश्य:\n\n• कैलेंडर दृश्य\n• उपस्थित दिन (हरा)\n• अनुपस्थित दिन (लाल)\n• अवकाश (ग्रे)\n\n[अभी जांचें →](Portal)`,
    category: 'general',
    roles: ['student', 'parent'],
    quickReplies: [
      { text: 'परिणाम', payload: 'student_results' },
      { text: 'Assignments', payload: 'student_assignments' },
      { text: 'शुल्क', payload: 'fee_status_student' },
    ],
  },

  {
    id: 'student_results',
    patterns: [
      'results',
      'exam result',
      'marks',
      'performance',
      'grade',
      'report card',
    ],
    answer: `## 📊 परिणाम कैसे देखें?\n\n### Portal:\n\n**Dashboard → My Exams/Results**\n\n### विवरण:\n\n✔ सभी परीक्षा परिणाम\n✔ विषय-वार अंक\n✔ Grade (A, B, C)\n✔ कक्षा रैंक (यदि प्रकाशित)\n✔ औसत से तुलना\n✔ Grade card PDF download\n\n### सुविधाएँ:\n\n📈 प्रवृत्ति विश्लेषण\n🎯 विषय शक्तियाँ\n⚠️ सुधार क्षेत्र\n📊 कक्षा तुलना\n\n### Grade Card:\n\n✔ तुरंत डिजिटल\n✔ PDF download\n✔ साझा करने योग्य\n✔ आधिकारिक letterhead\n\n### संबंधित:\n\n✔ गृहकार्य लिंक\n✔ अभ्यास सामग्री\n✔ अध्ययन संसाधन\n\n[परिणाम जांचें →](Portal)`,
    category: 'general',
    roles: ['student', 'parent'],
    quickReplies: [
      { text: 'उपस्थिति', payload: 'student_attendance_check' },
      { text: 'लंबित assignments', payload: 'student_assignments' },
      { text: 'शिक्षक से संपर्क', payload: 'contact_teacher' },
    ],
  },

  {
    id: 'fee_status_student',
    patterns: [
      'fee',
      'fees',
      'fee status',
      'fee payment',
      'pending fee',
      'due',
    ],
    answer: `## 💰 शुल्क स्थिति एवं भुगतान\n\n### Portal:\n\n**Dashboard → Fees**\n\n### विवरण:\n\n✔ शुल्क संरचना\n✔ मासिक विवरण\n✔ भुगतान रसीदें\n✔ लंबित राशि\n✔ देय तिथि\n✔ विलंब शुल्क (यदि कोई हो)\n\n### रंग कोड:\n\n🟢 **भुगतान किया गया** ✔\n🟡 **शीघ्र देय**\n🔴 **अतिदेय**\n\n### Online भुगतान:\n\n**यदि लंबित है:**\n\n1. "Pay Now" पर क्लिक करें\n2. राशि की पुष्टि करें\n3. विधि चुनें (UPI/Card/Net Banking)\n4. Razorpay payment\n5. पूर्ण करें\n6. तुरंत रसीद मिलेगी ✔\n\n### भुगतान विधियाँ:\n\n✔ UPI (PhonePe, GPay)\n✔ Debit/Credit Card\n✔ Net Banking\n✔ Wallets\n\n### रसीद:\n\n✔ तुरंत PDF\n✔ Email भेजा गया\n✔ Downloadable\n✔ आधिकारिक header\n\n### छूट:\n\nवित्तीय समस्या?\n• Admin से संपर्क करें\n• छूट के लिए आवेदन करें\n• भुगतान योजना उपलब्ध\n\n[शुल्क भुगतान करें →](Portal)`,
    category: 'general',
    roles: ['student', 'parent'],
    quickReplies: [
      { text: 'भुगतान इतिहास', payload: 'payment_history' },
      { text: 'छूट आवेदन', payload: 'fee_concession' },
      { text: 'रसीद download', payload: 'receipt_download' },
    ],
  },
]

// ══════════════════════════════════════════════════════════
// SUPPORT & GENERAL
// ══════════════════════════════════════════════════════════

export const SUPPORT_QA: ChatAnswer[] = [
  {
    id: 'support_contact',
    patterns: [
      'support',
      'help',
      'contact',
      'problem',
      'issue',
      'error',
      'technical',
    ],
    answer: `## 🤝 सहायता एवं संपर्क\n\n### संपर्क:\n\n**Email:**\n📧 support@skolify.in\nप्रतिक्रिया: उसी दिन\n\n**WhatsApp:**\n💬 सीधे founder से\nप्रतिक्रिया: 1-2 घंटे\n\n**Call:**\n📞 व्यावसायिक समय\nव्यक्तिगत सहायता\n\n**Live Chat:**\n💻 Portal में — तुरंत\n\n### समय:\n\n⏰ **सोम-शनि:** सुबह 9 - शाम 6\n⏰ **रविवार:** बंद\n⏰ **आपातकाल:** Premium support\n\n### समस्या रिपोर्ट करें:\n\n1. विशिष्ट बताएं\n2. त्रुटि का screenshot\n3. आपकी भूमिका\n4. पुनः उत्पन्न करने के चरण\n5. कब प्रारंभ हुआ\n\n### प्रतिक्रिया समय:\n\n🟢 **गंभीर** (साइट बंद) → 30 मिनट\n🟡 **उच्च** (सुविधाएँ बंद) → 2 घंटे\n🔵 **मध्यम** (वैकल्पिक उपाय) → 24 घंटे\n⚪ **कम** (सौंदर्य) → 48 घंटे\n\n[टिकट जमा करें →](/enquiry)`,
    category: 'support',
    roles: ['admin', 'teacher', 'student', 'parent', 'guest'],
    quickReplies: [
      { text: 'Bug रिपोर्ट', action: 'forward' },
      { text: 'Feature request', action: 'forward' },
      { text: 'Account समस्या', action: 'forward' },
    ],
    canForward: true,
  },

  {
    id: 'trial_info',
    patterns: ['trial', 'free', 'try', 'demo', 'test', 'muft'],
    answer: `## 🎁 60-दिवस निःशुल्क परीक्षण\n\n### यह क्या है?\n\n✔ **60 दिन पूर्णतः निःशुल्क**\n✔ **कोई credit card आवश्यक नहीं**\n✔ **पूर्ण पहुँच**\n✔ **सभी सुविधाएँ**\n✔ **व्यक्तिगत onboarding**\n\n### सम्मिलित:\n\n✔ 500 messaging credits\n✔ असीमित छात्र प्रबंधन\n✔ सभी मूल modules\n✔ Website builder\n✔ Mobile app (PWA)\n✔ Email support\n\n### सम्मिलित नहीं:\n\n❌ उन्नत modules (LMS, Payroll)\n❌ Custom domain\n❌ समर्पित प्रबंधक\n\n### परीक्षण के बाद:\n\n**जब 60 दिन समाप्त होंगे:**\n\n✔ डेटा 90 दिन सुरक्षित\n✔ कोई भी योजना चुनें\n✔ Pro-rata billing\n✔ किसी भी समय upgrade करें\n\n### प्रारंभ करें:\n\n[अभी पंजीकरण करें →](/register)\n\n• फोन\n• विद्यालय नाम\n• शहर\n• पूर्ण! ⚡\n\n**कोई प्रतिबद्धता नहीं, कोई जोखिम नहीं!**`,
    category: 'general',
    roles: ['guest', 'admin'],
    quickReplies: [
      { text: 'परीक्षण के बाद योजनाएँ', payload: 'admin_plans_overview' },
      { text: 'पंजीकरण करें', payload: '/register' },
      { text: 'Demo', action: 'forward' },
    ],
  },

  {
    id: 'security_privacy',
    patterns: [
      'security',
      'safe',
      'data',
      'privacy',
      'secure',
      'breach',
      'hack',
    ],
    answer: `## 🔒 सुरक्षा एवं गोपनीयता\n\n### डेटा सुरक्षा:\n\n✔ **HTTPS encryption** — संपूर्ण\n✔ **End-to-end** — browser से database तक\n✔ **कोई तृतीय-पक्ष साझाकरण नहीं**\n✔ **भूमिका-आधारित पहुँच** — सख्त\n✔ **Audit logs** — ट्रैक किए गए\n\n### Infrastructure:\n\n✔ MongoDB Atlas (AWS)\n✔ Vercel hosting (99.9% uptime)\n✔ दैनिक स्वचालित बैकअप\n✔ विश्राम पर encryption\n✔ भौगोलिक redundancy\n\n### अनुपालन:\n\n✔ GDPR-प्रेरित\n✔ कोई spam नहीं\n✔ भुगतान: Razorpay (PCI DSS)\n✔ डेटा प्रतिधारण: 90 दिन grace\n\n### आपके अधिकार:\n\n✔ किसी भी समय डेटा export करें\n✔ स्थायी रूप से हटाएं\n✔ गोपनीयता नियंत्रण\n✔ सहमति-आधारित\n\n[गोपनीयता नीति →](/privacy)\n[सुरक्षा विवरण →](/security)`,
    category: 'support',
    roles: ['admin', 'teacher', 'student', 'parent', 'guest'],
    quickReplies: [
      { text: 'डेटा विलोपन', action: 'forward' },
      { text: 'गोपनीयता नीति', payload: '/privacy' },
      { text: 'सुरक्षा पृष्ठ', payload: '/security' },
    ],
  },
]

// ══════════════════════════════════════════════════════════
// DEFAULT FALLBACK
// ══════════════════════════════════════════════════════════

export const FALLBACK_ANSWER: ChatAnswer = {
  id: 'fallback_default',
  patterns: ['__default__'],
  answer: `क्षमा करें, मैं यह समझ नहीं पाया... 🤔\n\nमैं निम्न विषयों में आपकी सहायता कर सकता हूँ:\n\n• **योजनाएँ एवं मूल्य** — शुल्क संरचना\n• **निःशुल्क परीक्षण** — 60 दिवस निःशुल्क\n• **सुविधाएँ** — क्या उपलब्ध है\n• **Credits** — संदेश प्रणाली\n• **Setup** — कैसे प्रारंभ करें\n• **Support** — सीधी सहायता\n\nया सीधे **मानव टीम से बात करें** 👇`,
  category: 'general',
  roles: ['admin', 'teacher', 'student', 'parent', 'guest'],
  quickReplies: [
    { text: 'योजनाएँ देखें', payload: 'admin_plans_overview' },
    { text: 'निःशुल्क परीक्षण', payload: 'trial_info' },
    { text: 'सुविधाएँ', payload: 'features_overview' },
    { text: 'Support', action: 'forward' },
  ],
  canForward: true,
}

// ══════════════════════════════════════════════════════════
// EXPORT ALL
// ══════════════════════════════════════════════════════════

export const ALL_QA: ChatAnswer[] = [
  ...GREETING_QA,
  ...ADMIN_BILLING_QA,
  ...ADMIN_FEATURES_QA,
  ...ADMIN_SETUP_QA,
  ...TEACHER_QA,
  ...STUDENT_PARENT_QA,
  ...SUPPORT_QA,
]

// ══════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════

export function findAnswer(
  userMessage: string,
  userRole: UserRole = 'guest'
): ChatAnswer | null {
  const msg = userMessage.toLowerCase().trim()

  // Exact ID match
  const exactMatch = ALL_QA.find(
    qa => qa.id === msg && qa.roles.includes(userRole)
  )
  if (exactMatch) return exactMatch

  // Pattern match
  for (const qa of ALL_QA) {
    if (!qa.roles.includes(userRole)) continue
    if (qa.patterns.some(pattern => msg.includes(pattern))) {
      return qa
    }
  }

  // Return fallback if allowed for this role
  if (FALLBACK_ANSWER.roles.includes(userRole)) {
    return FALLBACK_ANSWER
  }

  return null
}

export function getQuestionsByRole(role: UserRole): ChatAnswer[] {
  return ALL_QA.filter(qa => qa.roles.includes(role))
}

export function getQuestionsByCategory(
  category: QuestionCategory,
  role: UserRole = 'guest'
): ChatAnswer[] {
  return ALL_QA.filter(
    qa => qa.category === category && qa.roles.includes(role)
  )
}

export function getRelatedQuestions(
  questionId: string,
  role: UserRole = 'guest'
): ChatAnswer[] {
  const question = ALL_QA.find(qa => qa.id === questionId)
  if (!question || !question.relatedQuestions) return []

  return ALL_QA.filter(
    qa => question.relatedQuestions!.includes(qa.id) && qa.roles.includes(role)
  )
}