// ═══════════════════════════════════════════════════════════
// Skolify AI Assistant — Knowledge Base v2.0
// Professional English · Human-like Tone · Role-Based
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
      'hello', 'hi', 'hey', 'namaste', 'namaskar', 'helo', 'hii',
      'start', 'help', 'good morning', 'good afternoon', 'good evening',
      'yo', 'sup', 'howdy', 'greetings',
    ],
    answer: `Hey there! 👋 I'm the **Skolify Assistant** — happy to help you out!

Whether you're a school admin, teacher, student, or parent, I've got answers ready for you.

**Here's what I can help with:**

• 💰 **Plans & Pricing** — find the right plan for your school
• 🎁 **Free Trial** — 60 days, no credit card needed
• 💳 **Credits System** — SMS, WhatsApp & email messaging
• 📦 **Features** — 22+ modules available
• 🔧 **Setup Help** — get your school running in 15 minutes
• 🔒 **Security & Privacy** — how we protect your data

What would you like to know? Go ahead and ask — I don't bite! 😄`,
    category: 'general',
    roles: ['admin', 'teacher', 'student', 'parent', 'guest'],
    quickReplies: [
      { text: '💰 See Plans', payload: 'admin_plans_overview' },
      { text: '🎁 Free Trial', payload: 'trial_info' },
      { text: '📦 Features', payload: 'features_overview' },
      { text: '📞 Talk to Us', action: 'forward' },
    ],
  },

  {
    id: 'what_is_skolify',
    patterns: [
      'what is skolify', 'what is this', 'tell me about skolify',
      'about skolify', 'skolify kya hai', 'what does skolify do',
      'explain skolify', 'skolify platform', 'is this a school software',
      'school management', 'school erp',
    ],
    answer: `Great question! Let me give you the quick version 😊

**Skolify** is a complete **School Management SaaS Platform** built specifically for Indian schools.

Think of it as your school's digital backbone — everything in one place.

**What it handles:**
• 👥 Student & teacher management
• ✅ Daily attendance with auto SMS to parents
• 💰 Fee collection (online payments via Razorpay)
• 📝 Exams, results & grade cards
• 📚 Homework & assignments
• 🌐 Your school's own website (no coding!)
• 📱 Works on any phone — no app download needed

**Who uses it?**
Admins, teachers, students, and parents — each gets their own dashboard.

**Pricing starts at just ₹499/month** with a **60-day free trial**.

Want to know more about any specific part?`,
    category: 'general',
    roles: ['admin', 'teacher', 'student', 'parent', 'guest'],
    quickReplies: [
      { text: '📦 All Features', payload: 'features_overview' },
      { text: '💰 Pricing', payload: 'admin_plans_overview' },
      { text: '🎁 Try for Free', payload: 'trial_info' },
    ],
  },

  {
    id: 'how_different',
    patterns: [
      'why skolify', 'why choose skolify', 'what makes you different',
      'better than others', 'competitor', 'vs other software',
      'unique feature', 'why not other erp', 'what is special',
      'advantages', 'benefits of skolify',
    ],
    answer: `Honestly? Here's what sets Skolify apart from the usual school ERP tools:

**1. 🚀 You're live in 15 minutes**
Most ERPs take weeks to set up. Skolify? Upload your student list, invite teachers, and you're running. Seriously — 15 minutes.

**2. 💸 Pricing that makes sense**
Starting at ₹499/month for 500 students. No hidden charges, no per-feature costs, no annual lock-in surprises.

**3. 📱 Works on a ₹5,000 phone**
Our PWA (Progressive Web App) runs smoothly on low-end Android phones. No fancy hardware required.

**4. 🇮🇳 Built for Indian schools**
Razorpay payments, Indian date formats, regional school workflows — we thought of all of it.

**5. 🧑‍💼 You talk to real people**
No ticket queues. Direct WhatsApp support. Fast responses.

**6. 60-day free trial**
No credit card. No sales pressure. Just try it out.

Want a quick demo instead? I can connect you with our team!`,
    category: 'general',
    roles: ['admin', 'guest'],
    quickReplies: [
      { text: '🎁 Start Free Trial', payload: 'trial_info' },
      { text: '💰 See Pricing', payload: 'admin_plans_overview' },
      { text: '📞 Request Demo', action: 'forward' },
    ],
    canForward: true,
  },
]

// ══════════════════════════════════════════════════════════
// ADMIN: BILLING & PLANS
// ══════════════════════════════════════════════════════════

export const ADMIN_BILLING_QA: ChatAnswer[] = [
  {
    id: 'admin_plans_overview',
    patterns: [
      'plan', 'plans', 'pricing', 'price', 'cost', 'monthly',
      'yearly', 'subscription', 'rupees', 'how much', 'fees',
      'affordable', 'cheap', 'expensive', 'rate', 'charges',
    ],
    answer: `Here's a clear breakdown of Skolify's plans 👇

| Plan | Monthly | Students | Teachers | Free Credits |
|------|---------|----------|----------|--------------|
| **Starter** | ₹499 | 500 | 20 | 500 |
| **Growth** | ₹999 | 1,500 | 50 | 1,500 |
| **Pro** | ₹1,999 | 5,000 | 150 | 3,000 |
| **Enterprise** | ₹3,999 | Unlimited | Unlimited | 10,000 |

### ✨ Good to know:

✔ **Annual billing = 2 months FREE**
✔ **60-day free trial** — zero credit card required
✔ **Upgrade anytime** — pro-rata billing, pay only the difference
✔ **Cancel anytime** — no hidden fees, no guilt trips

### 🤔 Which plan is right for you?

**Under 300 students** → Starter (just ₹17/day!)
**300–1,000 students** → Growth *(most popular)*
**1,000–3,000 students** → Pro
**3,000+ or multi-branch** → Enterprise

[Compare all plans in detail →](/pricing)`,
    category: 'billing',
    roles: ['admin', 'guest'],
    quickReplies: [
      { text: '⬆️ How to Upgrade', payload: 'admin_upgrade' },
      { text: '💳 Credits System', payload: 'credit_system_overview' },
      { text: '🎁 Start Free Trial', payload: 'trial_info' },
    ],
    relatedQuestions: ['admin_upgrade', 'credit_system_overview'],
  },

  {
    id: 'annual_billing',
    patterns: [
      'annual', 'yearly plan', 'yearly billing', 'annual discount',
      'year plan', 'save money', 'annual offer', '2 months free',
      'yearly price', 'annual pricing',
    ],
    answer: `Great thinking — annual billing saves you a solid chunk of money! 💰

### Annual Plan Pricing:

| Plan | Monthly | Annual (pay once) | You Save |
|------|---------|-------------------|----------|
| **Starter** | ₹499 | ₹4,990 | ₹1,000 (2 months free!) |
| **Growth** | ₹999 | ₹9,990 | ₹1,998 |
| **Pro** | ₹1,999 | ₹19,990 | ₹3,998 |
| **Enterprise** | ₹3,999 | ₹39,990 | ₹7,998 |

### How it works:
- Pay once for the whole year
- Automatic renewal (you'll get a reminder before)
- **30-day refund policy** if you cancel early (pro-rata)

### Is annual worth it?
If you're confident about using Skolify long-term — absolutely yes. The savings are equivalent to getting **2 free months**.

Want to switch to annual? It's easy from your admin panel.`,
    category: 'billing',
    roles: ['admin', 'guest'],
    quickReplies: [
      { text: '💰 All Plans', payload: 'admin_plans_overview' },
      { text: '⬆️ Upgrade Now', payload: 'admin_upgrade' },
      { text: '❌ Cancellation Policy', payload: 'admin_cancel_policy' },
    ],
  },

  {
    id: 'credit_system_overview',
    patterns: [
      'credit', 'sms', 'whatsapp', 'message', 'messaging',
      'notification', 'alerts', 'how credits work', 'what are credits',
      'messaging system',
    ],
    answer: `Let me explain the credits system — it's pretty simple! 😊

**Credits = your messaging budget.** Each plan includes free credits monthly, and you can buy more if needed.

### Credit Usage:

| Action | Credits Used |
|--------|-------------|
| 1 SMS | 1 credit |
| 1 WhatsApp message | 1 credit |
| 10 Emails | 1 credit |

### Monthly Free Credits by Plan:

| Plan | Free Credits | Value |
|------|-------------|-------|
| Starter | 500 | ₹500 worth |
| Growth | 1,500 | ₹1,500 worth |
| Pro | 3,000 | ₹3,000 worth |
| Enterprise | 10,000 | ₹10,000 worth |

### Real-world example:
A 500-student school typically uses:
- Daily attendance SMS → ~500 credits/month
- Fee reminders → ~200 credits
- General announcements → ~100 credits
- **Total: ~800 credits/month**

On Starter (500 free), you'd need ~300 extra credits = ₹300/month.

### Rollover Policy:

| Plan | Unused Credits |
|------|---------------|
| Starter | ❌ Expire monthly |
| Growth | ✔ Valid for 3 months |
| Pro | ✔ Valid for 6 months |
| Enterprise | ✔ Never expire |

Need more credits? You can buy top-up packs anytime!`,
    category: 'credits',
    roles: ['admin'],
    quickReplies: [
      { text: '🛒 Buy Credit Packs', payload: 'buy_credits' },
      { text: '♻️ Rollover Details', payload: 'credit_rollover_detail' },
      { text: '⬆️ Upgrade Plan', payload: 'admin_upgrade' },
    ],
  },

  {
    id: 'buy_credits',
    patterns: [
      'buy credit', 'credit pack', 'purchase credit', 'extra credit',
      'top up', 'topup', 'recharge credits', 'add credits',
      'credit recharge', 'need more credits',
    ],
    answer: `Running low on credits? No worries — top-up packs are available anytime! 👇

### Credit Pack Options:

| Pack | Credits | Price | Per Credit | Savings |
|------|---------|-------|-----------|---------|
| Small | 250 | ₹199 | ₹0.80 | — |
| **Medium** | 700 | ₹499 | ₹0.71 | 11% off |
| Large | 1,500 | ₹999 | ₹0.67 | 16% off |
| Bulk | 3,500 | ₹1,999 | ₹0.57 | **29% off** |

💡 *The Bulk pack is the best value if you send a lot of messages.*

### How to Buy:
**Admin Panel → Subscription → Credit Packs → Choose → Pay**

Payment via UPI, card, net banking, or wallets through Razorpay.
Credits are added **instantly** after payment ✅

### Which pack should you pick?
- Light usage (reminders only) → **Small or Medium**
- Active communication school → **Large**
- High-volume or multi-class school → **Bulk**

Any confusion? I can help you figure out what you need!`,
    category: 'credits',
    roles: ['admin'],
    quickReplies: [
      { text: '♻️ Rollover Policy', payload: 'credit_rollover_detail' },
      { text: '💳 Credit Overview', payload: 'credit_system_overview' },
      { text: '📞 Need Help?', action: 'forward' },
    ],
    canForward: true,
  },

  {
    id: 'credit_expiry',
    patterns: [
      'expire', 'expiry', 'lapse', 'unused credits', 'credits waste',
      'do credits expire', 'when do credits expire',
    ],
    answer: `Good question — here's exactly how credit expiry works:

### Expiry by Plan:

| Plan | Policy |
|------|--------|
| **Starter** | ❌ Credits reset every month |
| **Growth** | ✔ Carry forward for 3 months |
| **Pro** | ✔ Carry forward for 6 months |
| **Enterprise** | ✔ Never expire |

### Example (Growth Plan):

**January:** Get 1,500 → Use 900 → **600 left (carries to Feb)**
**February:** Get 1,500 + 600 = 2,100 → Use 1,200 → **900 left**
**March:** Get 1,500 + 900 = 2,400 → Use 800 → **1,600 left**
**April:** January's 600 expire (3 months old) ⚠️

### Tips to avoid wasting credits:
✔ Enable automated reminders — they use credits well
✔ If you're on Starter and losing credits monthly → upgrade to Growth
✔ Track your usage in **Admin Panel → Subscription → Credit History**

Want to know about the rollover policy in more detail?`,
    category: 'credits',
    roles: ['admin'],
    quickReplies: [
      { text: '♻️ Rollover Details', payload: 'credit_rollover_detail' },
      { text: '⬆️ Upgrade Plan', payload: 'admin_upgrade' },
    ],
  },

  {
    id: 'credit_rollover_detail',
    patterns: [
      'rollover', 'carry forward', 'credit expire', 'credits expire',
      'credits safe', 'rollover policy', 'rollover benefit',
      'credit transfer', 'unused credits rollover', 'old credits',
      'credits carry', 'rollover kya hai', 'rollover kaise',
    ],
    answer: `Let me walk you through the rollover system properly 👇

**Rollover = your unused credits automatically carry over to the next month** (based on your plan).

### Plan-wise Rollover:

| Plan | Rollover? | Valid For | Notes |
|------|-----------|-----------|-------|
| **Starter** | ❌ No | — | Resets every month |
| **Growth** | ✔ Yes | 3 months | Auto carry-forward |
| **Pro** | ✔ Yes | 6 months | Auto carry-forward |
| **Enterprise** | ✔ Yes | Never expires | Permanent |

### How it works step by step (Growth, 1,500 credits/month):

**January:**
- Received: 1,500
- Used: 900
- Carried forward: **600** ✅

**February:**
- New credits: 1,500 + 600 (from Jan) = **2,100**
- Used: 1,200 → Remaining: **900**

**March:**
- New credits: 1,500 + 900 = **2,400**
- Used: 800 → Remaining: **1,600**

**April:**
- January's 600 credits expire (they're now 3 months old) ⚠️
- Only Feb + March carry-over continues

### What happens when you upgrade?

**Starter → Growth:**
- Starter credits expire (they had no rollover) ❌
- Fresh rollover begins from Growth plan ✅

**Growth → Pro:**
- All rollover credits are safe ✅
- Pro's 6-month validity applies going forward

**Pro → Enterprise:**
- All credits become permanent — they never expire ✅

### Credit usage order:
Credits are used **FIFO (oldest first)** — automatically handled, nothing you need to do manually.

### Track your credits:
**Admin Panel → Subscription → Credit History**
You'll see when credits were added, used, and when they expire.

**Bottom line:** If you're wasting credits on Starter, Growth/Pro is worth the upgrade — the savings on messaging more than cover the price difference.`,
    category: 'credits',
    roles: ['admin'],
    quickReplies: [
      { text: '📊 Credit History', payload: 'usage_stats' },
      { text: '⬆️ Upgrade Plan', payload: 'admin_upgrade' },
      { text: '🛒 Buy Credits', payload: 'buy_credits' },
    ],
    relatedQuestions: ['credit_expiry', 'admin_upgrade', 'buy_credits'],
    metadata: { priority: 8, lastUpdated: '2025-01' },
  },

  {
    id: 'admin_upgrade',
    patterns: [
      'upgrade', 'change plan', 'higher plan', 'switch plan',
      'better plan', 'move to growth', 'move to pro', 'upgrade plan',
      'want more features', 'need more students',
    ],
    answer: `Upgrading is super easy — and you only pay the difference, not the full amount! 🎉

### How to Upgrade:
**Admin Portal → Settings → Subscription → Choose Plan → Pay**

### What happens when you upgrade:

✔ **Pro-rated billing** — you get credit for unused days on your current plan, and pay only the difference for the new one

✔ **Instant activation** — new modules unlock immediately, new limits apply right away, zero downtime

✔ **Your data stays safe** — students, teachers, records, everything intact

### Example:
You're on Starter (₹499/month) with 15 days remaining.

Starter = ₹499 ÷ 30 = ₹16.63/day
15 days remaining = ₹249 credit

Growth = ₹999
**You pay: ₹999 − ₹249 = ₹750** (not the full ₹999!)

### What unlocks after upgrading:

**Starter → Growth:**
- ✅ Online fee collection
- ✅ Exam & results module
- ✅ Homework system
- ✅ Timetable
- ✅ Certificates (TC, CC, Bonafide)
- ✅ Advanced reports
- ✅ 1,500 credits/month (3x more!)
- ✅ Credit rollover (3 months)

**Growth → Pro:**
- ✅ Library management
- ✅ Online classes (LMS)
- ✅ Custom certificates
- ✅ 3,000 credits/month

**Pro → Enterprise:**
- ✅ HR & Payroll
- ✅ Transport management
- ✅ Hostel module
- ✅ 10,000 credits (never expire!)

[Upgrade now →](Admin Panel)`,
    category: 'billing',
    roles: ['admin'],
    quickReplies: [
      { text: '👤 Add More Students', payload: 'student_addon' },
      { text: '👨‍🏫 Add More Teachers', payload: 'teacher_addon' },
      { text: '⬇️ Downgrade?', payload: 'admin_downgrade' },
    ],
    canForward: true,
  },

  {
    id: 'admin_downgrade',
    patterns: [
      'downgrade', 'lower plan', 'cheaper plan', 'reduce plan',
      'switch to starter', 'want basic plan', 'downgrade plan',
    ],
    answer: `Yes, you can downgrade — though there are a few things to keep in mind first.

### How to Downgrade:
**Admin Panel → Settings → Subscription → Change Plan**

### Important things to check:

⚠️ **Student limit** — if you have 800 students on Growth and downgrade to Starter (500 limit), you won't be able to add new students until you're under the limit

⚠️ **Feature access** — features like online fees, exams, homework (Growth+) will be locked

⚠️ **Credits** — any rollover credits may be adjusted based on the new plan's policy

### Billing on downgrade:
- Downgrade takes effect at the **end of your current billing cycle**
- You keep full access until then
- No immediate refund for the remaining period (monthly plan)

### Honestly?
If cost is the concern, it might be worth talking to our team first — sometimes there are options we can work out. We'd rather help you stay than lose you! 😊

Want me to connect you with the team?`,
    category: 'billing',
    roles: ['admin'],
    quickReplies: [
      { text: '💰 See All Plans', payload: 'admin_plans_overview' },
      { text: '📞 Talk to Team', action: 'forward' },
      { text: '❌ Cancel Instead?', payload: 'admin_cancel_policy' },
    ],
    canForward: true,
  },

  {
    id: 'student_addon',
    patterns: [
      'student limit', 'extra student', 'add student', 'more student',
      'student addon', 'exceed limit', 'student capacity',
      'increase student', 'student full',
    ],
    answer: `Hit the student limit? No problem — here are your two options:

### Option 1: Buy a Student Add-on (Quick Fix)

| Pack | Students | Price |
|------|----------|-------|
| +50 students | 50 | ₹99 |
| +100 students | 100 | ₹179 |
| +250 students | 250 | ₹399 |
| +500 students | 500 | ₹699 |

**Admin → Subscription → Student Add-on → Buy**
Activates instantly via Razorpay. Done in 2 minutes ✅

### Option 2: Upgrade Your Plan (Better Long-Term)

| Current Plan | Upgrade To | New Limit |
|-------------|-----------|-----------|
| Starter (500) | Growth | 1,500 students |
| Growth (1,500) | Pro | 5,000 students |
| Pro (5,000) | Enterprise | Unlimited |

Upgrading also gets you more credits, more features, and better rollover.

### Add-on Caps (max you can add per plan):

| Plan | Max Add-on | Total Max |
|------|-----------|-----------|
| Starter | +250 | 750 |
| Growth | +750 | 2,250 |
| Pro | +2,000 | 7,000 |
| Enterprise | Unlimited | — |

**Quick tip:** If you need more than 250 extra students, upgrading is usually better value than buying add-ons.`,
    category: 'limits',
    roles: ['admin'],
    quickReplies: [
      { text: '⬆️ Upgrade Instead', payload: 'admin_upgrade' },
      { text: '👨‍🏫 Teacher Add-on', payload: 'teacher_addon' },
      { text: '💰 Compare Plans', payload: 'admin_plans_overview' },
    ],
  },

  {
    id: 'teacher_addon',
    patterns: [
      'teacher limit', 'extra teacher', 'staff limit', 'add teacher',
      'more teacher', 'teacher capacity', 'increase teacher limit',
    ],
    answer: `Need more teacher slots? Here's how to handle it:

### Current Teacher Limits by Plan:

| Plan | Included | Max with Add-on |
|------|----------|----------------|
| Starter | 20 | 30 |
| Growth | 50 | 75 |
| Pro | 150 | 200 |
| Enterprise | Unlimited | — |

### Teacher Add-on Packs:

| Pack | Teachers | Price |
|------|----------|-------|
| +5 teachers | 5 | ₹99 |
| +10 teachers | 10 | ₹179 |
| +25 teachers | 25 | ₹399 |

**Admin → Subscription → Teacher Add-on → Buy**
Instant activation, 2 minutes tops ✅

### When to upgrade instead:
- **20–30 teachers** → Add-on works fine (₹99)
- **50–75 teachers** → Consider Growth plan
- **150+ teachers** → You need Pro

Upgrading gives you more teachers AND more students AND more features for a better overall price.`,
    category: 'limits',
    roles: ['admin'],
    quickReplies: [
      { text: '⬆️ Upgrade Plan', payload: 'admin_upgrade' },
      { text: '👤 Student Add-on', payload: 'student_addon' },
    ],
  },

  {
    id: 'admin_cancel_policy',
    patterns: [
      'cancel', 'stop', 'band', 'delete account', 'exit', 'quit',
      'stop subscription', 'cancel plan', 'refund', 'money back',
      'cancel subscription',
    ],
    answer: `We're sorry to see you go — but here's exactly what happens if you cancel:

### How to Cancel:
**Admin Panel → Settings → Subscription → Cancel Subscription**

### What happens next:

✔ **You keep access until the end of your current billing period**
— Cancel today, still use it through month-end. No immediate shutdown.

✔ **Your data is safe for 90 days**
— If you change your mind, just reactivate and everything is restored.

❌ **After billing period ends:**
— Modules lock, only the subscription page shows

### Refund Policy:

**Monthly Plan:**
- No refund for the current month
- Full access until period ends ✅

**Annual Plan:**
- Cancel within 30 days → pro-rata refund for unused days ✅
- Cancel after 30 days → no refund ❌

### Example (Annual Refund):

Paid ₹9,999 on Jan 1st. Cancel on Jan 15th (14 days used).
14 days × ₹27.4/day = ₹384 used
**Refund: ₹9,999 − ₹384 = ~₹9,615**

### Want your data permanently deleted?
Contact our support team. We'll process it within 7 business days.

**Before you cancel** — is there a specific problem we can fix? Our team would genuinely love to help. 🙏`,
    category: 'billing',
    roles: ['admin'],
    quickReplies: [
      { text: '📥 Export Data First', payload: 'data_export' },
      { text: '📞 Talk to Us First', action: 'forward' },
    ],
    canForward: true,
  },

  {
    id: 'payment_methods',
    patterns: [
      'payment method', 'how to pay', 'upi', 'credit card', 'debit card',
      'net banking', 'gpay', 'phonepe', 'paytm', 'razorpay',
      'payment options', 'how can i pay',
    ],
    answer: `We accept all major payment methods through **Razorpay** (India's most trusted payment gateway) 🔐

### Accepted Payments:

✅ **UPI** — PhonePe, Google Pay, Paytm, BHIM, any UPI app
✅ **Debit Cards** — Visa, Mastercard, RuPay
✅ **Credit Cards** — Visa, Mastercard, Amex
✅ **Net Banking** — All major banks
✅ **Wallets** — Paytm, Mobikwik, etc.

### Is it safe?
Absolutely. Razorpay is **PCI DSS certified** — the gold standard for payment security. We never store your card details.

### Any issues with payment?
If a payment fails or gets stuck, don't worry — it auto-reverses within 5-7 business days. For help, just contact our support team and we'll sort it out quickly.`,
    category: 'billing',
    roles: ['admin', 'student', 'parent', 'guest'],
    quickReplies: [
      { text: '💰 See Plans', payload: 'admin_plans_overview' },
      { text: '📞 Payment Issue?', action: 'forward' },
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
      'feature', 'module', 'what is available', 'modules', 'available',
      'what can skolify do', 'all features', 'list of features',
      'what do i get', 'included features',
    ],
    answer: `Here's everything Skolify offers — 22+ modules across all plans:

### ✅ Core Features (All Plans — Starting Starter):

• **Student Management** — bulk import, ID cards, profiles
• **Attendance** — daily marking, auto SMS to parents, reports
• **Notice Board** — instant announcements to all users
• **School Website** — build your school's site (no coding!)
• **Photo Gallery** — organized albums, auto-synced
• **Mobile App (PWA)** — works on any Android or iPhone

### 📈 Growth Plan (₹999+) adds:

• **Online Fee Collection** — Razorpay payments, auto receipts
• **Exams & Results** — marks entry, grade cards, report cards
• **Homework** — assignments, submissions, grading
• **Timetable** — class schedules for teachers & students
• **Certificates** — TC, CC, Bonafide — auto-generated
• **Reports & Analytics** — attendance, fees, performance
• **Bulk Messaging** — SMS, WhatsApp, email campaigns

### 🎓 Pro Plan (₹1,999+) adds:

• **Library Management** — book catalog, issue tracking
• **Online Classes (LMS)** — video lessons, quizzes
• **Custom Certificates** — fully branded design

### 🏢 Enterprise Plan (₹3,999) adds:

• **HR & Payroll** — salary, leaves, payslips
• **Transport** — routes, stops, GPS tracking
• **Hostel** — room allocation, meals
• **Inventory** — asset tracking
• **Visitor Management** — gate pass, logs
• **Health Records** — medical history per student
• **Alumni Network** — directory, events

### 📱 Works everywhere:
PWA app for mobile, full portal on desktop. All roles have their own dashboard.

[See all features →](/features)`,
    category: 'modules',
    roles: ['admin', 'guest'],
    quickReplies: [
      { text: '🌐 Website Builder', payload: 'website_builder' },
      { text: '📱 Mobile App', payload: 'mobile_app' },
      { text: '💰 Fee Collection', payload: 'fee_setup' },
    ],
  },

  {
    id: 'website_builder',
    patterns: [
      'website', 'web', 'site', 'school website', 'builder',
      'create website', 'make website', 'own website', 'website feature',
      'online presence',
    ],
    answer: `Yes — every Skolify school gets its own professional website! 🌐

**No coding. No designers needed. Seriously.**

### What you get:

✔ **10+ Beautiful Templates**
Pre-designed, mobile-responsive, SEO-friendly

✔ **All the sections you need:**
- Home page with hero banner
- About the school
- Teacher directory
- News & updates
- Photo gallery (auto-syncs from your admin panel!)
- Online admission form
- Fee structure (pulls from your system)
- Contact form & map


✔ **Auto-updates:**
Events, gallery, news — update once in admin, reflects on website instantly

### How to set it up:

1. Admin Panel → Website Builder
2. Pick a template
3. Add your school colors, logo, info
4. Add your sections & content
5. Hit Publish ✅

**Setup time: ~15 minutes**

Available from the Starter plan onwards!

[Set it up now →](Admin Panel)`,
    category: 'modules',
    roles: ['admin'],
    quickReplies: [
      { text: '🌐 Custom Domain', payload: 'custom_domain' },
      { text: '📞 Setup Help', action: 'forward' },
    ],
    canForward: true,
  },

  {
    id: 'mobile_app',
    patterns: [
      'app', 'mobile', 'android', 'ios', 'phone', 'pwa',
      'download', 'install', 'mobile app', 'phone app',
      'app download', 'play store', 'app store',
    ],
    answer: `Good news — you don't need to download anything from the Play Store or App Store! 🎉

Skolify is a **Progressive Web App (PWA)** — it works like a native app but runs through your browser.

### What does that mean for you?
✔ No Play Store / App Store needed
✔ Works on any Android or iPhone
✔ Installs in seconds
✔ Auto-updates — always the latest version
✔ Works even on budget ₹5,000 phones

### How to Install:

**Android (Chrome):**
1. Open Skolify portal in Chrome
2. Tap Menu → "Install App" or "Add to Home Screen"
3. Done — icon appears on your home screen ✅

**iPhone (Safari):**
1. Open in Safari
2. Tap Share → "Add to Home Screen"
3. Done ✅

### What you can do on mobile:

**Teachers:** Mark attendance, enter marks, post homework — all from the classroom
**Parents:** Check attendance, pay fees, view results — anywhere, anytime
**Students:** View assignments, check results, see timetable
**Admins:** Monitor dashboards, approve things on the go

### Offline support:
The app works offline for core actions (like marking attendance) and syncs when you're back online. Perfect for schools with spotty internet.`,
    category: 'modules',
    roles: ['admin', 'teacher', 'student', 'parent'],
    quickReplies: [
      { text: '🔌 Offline Features', payload: 'offline_features' },
      { text: '📞 Install Help', action: 'forward' },
    ],
  },

  {
    id: 'attendance_feature',
    patterns: [
      'attendance feature', 'attendance module', 'attendance system',
      'track attendance', 'parent sms attendance', 'auto sms',
      'attendance notification',
    ],
    answer: `The attendance module is one of Skolify's most-used features — and for good reason! Here's everything it does:

### For Teachers:
✔ Mark attendance in under 2 minutes per class
✔ Works on mobile (even offline!)
✔ Bulk mark all present, then just update absents
✔ Add remarks for individual students
✔ View and edit history

### For Parents:
✔ Automatic SMS/WhatsApp when child is absent
✔ Monthly attendance report in parent portal
✔ Visual calendar view (green = present, red = absent)

### For Admins:
✔ Class-wise and school-wide reports
✔ Low-attendance alerts (below 75%)
✔ Holiday & exam day management
✔ Export attendance data to Excel

### Attendance Report Colors:
🟢 **Above 75%** — Good
🟡 **70–75%** — Warning (parent notified)
🔴 **Below 70%** — Critical (admin alerted)

### Time Limit:
Teachers can mark attendance until 2 PM. After that, it requires admin approval to make changes.

Available from Starter plan.`,
    category: 'features',
    roles: ['admin', 'teacher'],
    quickReplies: [
      { text: '✔ How to Mark Attendance', payload: 'teacher_attendance' },
      { text: '📊 Attendance Reports', payload: 'attendance_reports' },
    ],
  },

  {
    id: 'fee_collection_feature',
    patterns: [
      'online fee', 'fee collection', 'collect fees online',
      'fee module', 'fee management', 'fee system',
      'payment collection', 'school fees online',
    ],
    answer: `Online fee collection is a game-changer for schools. Here's how it works on Skolify:

### For Parents:
✔ Pay fees from phone — UPI, card, net banking
✔ Get instant digital receipt
✔ View complete payment history
✔ Auto-reminders before due date

### For Admins:
✔ Set up fee structure class-wise (once!)
✔ Assign fees in bulk or individually
✔ Set due dates and late fee rules
✔ Track paid / pending / overdue — real-time dashboard
✔ Download fee reports (Excel, PDF)
✔ Give fee concessions to specific students

### How payment flows:
Parent opens app → Fees → Pay Now → Razorpay (UPI/Card) → Instant receipt → Admin gets notified ✅

### Payment gateway:
Powered by **Razorpay** (PCI DSS certified, fully secure)

**Razorpay charges: 2% + GST per transaction**
Example: Parent pays ₹5,000 → School receives ₹4,882

### Auto-reminders:
Set up fee reminder SMS/WhatsApp — they go out automatically X days before due date. Reduces follow-up calls significantly!

Available from **Growth plan** onwards.`,
    category: 'features',
    roles: ['admin'],
    quickReplies: [
      { text: '🔧 Setup Fees', payload: 'fee_setup' },
      { text: '📊 Fee Reports', payload: 'fee_reports' },
      { text: '🎟️ Fee Concessions', payload: 'fee_concessions' },
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
      'setup', 'start', 'begin', 'how to start', 'getting started',
      'first steps', 'how to use', 'how to setup', 'onboarding',
      'new user', 'just registered', 'just signed up',
    ],
    answer: `Welcome aboard! Let's get your school up and running — it's easier than you think 🚀

### Step 1: Register (1 minute)
Go to [/register](/register) → Enter school name, phone, city → Done. Trial starts instantly!

### Step 2: Fill School Details (2 minutes)
**Settings → School Info**
- School address, phone
- Upload your logo
- Principal's name and contact

### Step 3: Add Students (5 minutes)
**Students → Import → Download Template**

Fill the Excel file:
- Roll Number, Name, Class, Parent Phone (required)
- Email, DOB, Address (optional)

Upload it back → **500 students added in 5 minutes!** ⚡

### Step 4: Add Teachers (3 minutes)
**Teachers → Add Teacher**

Enter name, phone, email, subject, class. They get login credentials automatically ✅

### Step 5: Configure Modules
**Settings → Modules**
- Enable fee collection
- Set up your school website
- Configure notification preferences

**Total time: ~15 minutes for a fully working school system.**

### Need help at any step?
💬 Live chat in the portal
📞 WhatsApp support
📹 We offer free video call onboarding — just ask!`,
    category: 'setup',
    roles: ['admin'],
    quickReplies: [
      { text: '📥 Bulk Import', payload: 'bulk_import' },
      { text: '💰 Fee Setup', payload: 'fee_setup' },
      { text: '📞 Onboarding Help', action: 'forward' },
    ],
    canForward: true,
  },

  {
    id: 'bulk_import',
    patterns: [
      'bulk import', 'import student', 'csv', 'excel', 'batch',
      'upload students', 'import data', 'excel upload',
      'bulk upload', 'mass import',
    ],
    answer: `Bulk import is the fastest way to get your students into Skolify — here's how:

### The Process:

**1. Download the Template**
Students → Import → Download Template

**2. Fill it in Excel:**

| Column | Required? |
|--------|-----------|
| Roll Number | ✅ Yes |
| Full Name | ✅ Yes |
| Class | ✅ Yes |
| Parent Phone | ✅ Yes |
| Email | ❌ Optional |
| Date of Birth | ❌ Optional |
| Address | ❌ Optional |

**3. Upload the File**
Students → Import → Choose File → Upload

**4. Review Errors (if any)**
Any issues show up clearly — fix them and re-upload

**5. Done!** ✅
500 students added in about 5 minutes

### Pro Tips:
✔ CSV format works best
✔ Phone numbers: 10 digits only (no +91)
✔ Class names must match exactly what you've created in the system
✔ No duplicate roll numbers
✔ Use UTF-8 encoding (default in most Excel apps)

### Common Errors:

**"Invalid roll number"** → Check for spaces or special characters
**"Class not found"** → Create the class first, then import
**"Invalid phone format"** → Must be exactly 10 digits

Need the template? Go to: Admin Panel → Students → Import → Download Template`,
    category: 'setup',
    roles: ['admin'],
    quickReplies: [
      { text: '🏫 Class Setup', payload: 'class_setup' },
      { text: '📞 Import Help', action: 'forward' },
    ],
    canForward: true,
  },

  {
    id: 'fee_setup',
    patterns: [
      'fee setup', 'setup fees', 'configure fees', 'fee structure',
      'set up payment', 'online payment setup', 'razorpay setup',
      'fee configuration',
    ],
    answer: `Setting up online fee collection takes about 10 minutes — here's the full walkthrough:

### Step 1: Create Fee Structure
**Fees → Structure → Add Fee Type**
- Set fees class-wise (e.g., Class 5 = ₹5,000/month)
- Include categories: Tuition, Transport, etc.

### Step 2: Set the Calendar
- Monthly / Quarterly / Annual
- Due dates for each period
- Late fee rules (e.g., ₹50 after due date)

### Step 3: Assign Fees
- Bulk assign by class (fastest)
- Or assign individually

### Step 4: Parents Can Pay
Parents get login → open Fees → click Pay → Razorpay → done
**Instant receipt generated ✅**

### Step 5: Set Auto-Reminders
- SMS/WhatsApp goes out X days before due date
- Separate reminder for overdue fees
- Uses credits from your plan

### Payment Flow:
Parent App → Fees → Pay Now → Razorpay → Receipt
↓
School gets notified
Dashboard updates


### Razorpay Commission:
**2% + GST per transaction**
Example: ₹5,000 payment → ₹118 fee → **School receives ₹4,882**

Razorpay settles to your bank account within **2-3 business days**.

### Available from: Growth plan (₹999/month)`,
    category: 'setup',
    roles: ['admin'],
    quickReplies: [
      { text: '🎟️ Fee Concessions', payload: 'fee_concessions' },
      { text: '📊 Fee Reports', payload: 'fee_reports' },
      { text: '📞 Setup Help', action: 'forward' },
    ],
    canForward: true,
  },

  {
    id: 'data_export',
    patterns: [
      'export data', 'download data', 'backup', 'export students',
      'data export', 'get my data', 'download records',
    ],
    answer: `You own your data — and you can export it anytime. Here's how:

### What you can export:

✔ **Student records** — complete profiles + history
✔ **Attendance data** — class-wise, date-wise
✔ **Fee records** — payments, pending, receipts
✔ **Exam results** — all terms, all subjects
✔ **Teacher records** — staff information

### How to Export:
Most sections have a **Download** or **Export to Excel** button.

**Admin Panel → [Section] → Export → Choose Format (Excel/PDF/CSV)**

### For complete school data backup:
**Admin Panel → Settings → Data Export → Full Backup**

This generates a ZIP file with all your data.

### If you're leaving Skolify:
Export everything before canceling. Your data stays accessible for **90 days after cancellation**, but it's best to download a backup before.

Need help exporting? Our support team can assist.`,
    category: 'technical',
    roles: ['admin'],
    quickReplies: [
      { text: '❌ Cancel Account', payload: 'admin_cancel_policy' },
      { text: '📞 Export Help', action: 'forward' },
    ],
    canForward: true,
  },
]

// ══════════════════════════════════════════════════════════
// TEACHER QUESTIONS
// ══════════════════════════════════════════════════════════

export const TEACHER_QA: ChatAnswer[] = [
  {
    id: 'teacher_attendance',
    patterns: [
      'attendance', 'mark attendance', 'present', 'absent',
      'roll call', 'take attendance', 'daily attendance',
    ],
    answer: `Here's how to mark attendance quickly and easily:

### On Desktop:
**Teacher Portal → Attendance → Select Class**

1. Choose your class
2. Today's date is pre-selected
3. Student list loads automatically
4. Tap ✔ for present, ✗ for absent
5. Add a remark if needed (optional)
6. Click **Save** ✅

### On Mobile (PWA):
1. Open the app
2. Tap Attendance
3. Your class auto-loads
4. Quick swipe or tap
5. Submit — even works offline!

### Useful Features:
✔ **Bulk mark** — hit "All Present" first, then just mark absents (faster!)
✔ **Edit history** — you can correct past records
✔ **Holiday marking** — mark class-wide holidays
✔ **Auto SMS** — parents get notified when child is absent (uses credits)
✔ **Automatic % calculation** — no manual math

### Time Limit:
You can mark attendance until **2 PM**. After that, contact your admin for an exception.

### Reports:
**Attendance → Reports** — see per-student percentages, absence trends, and more.`,
    category: 'features',
    roles: ['teacher'],
    quickReplies: [
      { text: '📊 View Reports', payload: 'attendance_reports' },
      { text: '📞 Help', action: 'forward' },
    ],
  },

  {
    id: 'teacher_marks',
    patterns: [
      'marks', 'mark entry', 'exam', 'result', 'score', 'grades',
      'enter marks', 'add marks', 'marks entry',
    ],
    answer: `Entering exam marks is straightforward — here's how:

### Steps:
**Teacher Portal → Exams → Select Exam**

1. Choose the exam (e.g., "Final - Math")
2. Select your class (e.g., "8A")
3. Student list loads with a marks column
4. Enter marks for each student
5. Grades (A, B, C, etc.) calculate automatically
6. Click **Save** ✅

### Handy Features:
✔ **Max marks validation** — can't accidentally enter more than max
✔ **Auto grade calculation** — A, B, C, D, F based on your grade rules
✔ **Remarks section** — add performance notes per student
✔ **Bulk import via Excel** — for large classes

### Bulk Import (for big classes):
Exams → Import → Download Template → Fill marks → Upload → Review → Done

### Grade Cards:
Once published:
✔ Auto-generated PDF grade cards
✔ Emailed to parents (uses credits)
✔ Visible in student/parent portal
✔ Print-ready format with school letterhead

### Important:
❌ Once you **Publish** results, marks are locked
✔ Before publishing — unlimited edits
✔ Need to change after publishing? Contact admin

[Enter marks now →](Teacher Portal)`,
    category: 'features',
    roles: ['teacher'],
    quickReplies: [
      { text: '📋 Grade Cards', payload: 'grade_cards' },
      { text: '📊 Performance View', payload: 'performance' },
      { text: '📞 Help', action: 'forward' },
    ],
  },

  {
    id: 'teacher_homework',
    patterns: [
      'homework', 'assignment', 'submit', 'deadline', 'create homework',
      'give homework', 'homework assignment',
    ],
    answer: `Creating and managing homework is simple — here's the full flow:

### Creating Homework:
**Teacher Portal → Homework → Create**

Fill in:
- **Title** — e.g., "Chapter 5 Practice Problems"
- **Subject** — auto-filled based on your assignment
- **Class** — e.g., 8A
- **Description** — instructions for students
- **Attachment** — PDF, image, or video (optional)
- **Due Date** — e.g., 3 days from now
- **Publish** → Students get notified immediately!

### What Students See:
- Homework listed in their portal
- Can download attachments
- Can see due date clearly
- Can submit their work online

### Grading After Due Date:
1. Homework → View Submissions
2. Open each student's submission
3. Enter marks (e.g., out of 20)
4. Add comments
5. Publish → student gets notified with their grade

### Other Options:
✔ Extend due date if needed
✔ Accept late submissions (toggle on/off)
✔ Allow resubmission
✔ Assign to whole class OR specific students
✔ Set rubric-based grading

### Parent Notification:
When you publish homework → parents get notified too (great for younger classes!)
When grades are published → parents see their child's marks instantly`,
    category: 'features',
    roles: ['teacher'],
    quickReplies: [
      { text: '📊 Track Submissions', payload: 'submission_tracking' },
      { text: '👨‍👩‍👧 Parent Alerts', payload: 'parent_homework' },
    ],
  },

  {
    id: 'teacher_timetable',
    patterns: [
      'timetable', 'schedule', 'class schedule', 'period', 'time table',
      'class timing', 'my schedule',
    ],
    answer: `Your timetable is right there in the portal — here's where to find it:

### For Teachers:
**Teacher Portal → Timetable**

You'll see:
- Your classes for each day of the week
- Subject, class, period timing
- Room number (if set by admin)

### For the week view:
Click "Week View" to see your full weekly schedule at a glance.

### Managing Timetable (Admin's job):
Only admins can create and edit the timetable:
**Admin → Timetable → Set Schedule → Assign Teacher + Subject + Class + Period**

### Substitution:
If a teacher is absent, admin can set up a substitute teacher for that day — it shows on the timetable automatically.

### Students see it too:
Students and parents can view the class timetable from their portal.

Need to change your timetable? That goes through your admin.`,
    category: 'features',
    roles: ['teacher'],
    quickReplies: [
      { text: '📝 Mark Attendance', payload: 'teacher_attendance' },
      { text: '📚 Homework', payload: 'teacher_homework' },
    ],
  },

  {
    id: 'teacher_communication',
    patterns: [
      'send message', 'notify parents', 'message parents', 'bulk message',
      'communication', 'notify students', 'send sms', 'send notification',
    ],
    answer: `Need to reach parents or students quickly? Here's how:

### Quick Announcement (Notice Board):
**Teacher Portal → Notices → Create**

- Post text, image, or PDF
- Visible to all students & parents in your class immediately
- No credits used for this

### Direct Message / SMS (uses credits):
**Teacher Portal → Communication → Send Message**

- Choose audience: whole class, specific students
- Choose channel: SMS, WhatsApp, or in-app notification
- Type your message → Send

Each SMS or WhatsApp message uses 1 credit from your school's credit balance.

### For urgent alerts (attendance SMS):
When you mark a student absent → parent gets an automatic SMS if your admin has this enabled. You don't need to do anything extra.

### Can't send messages?
You might not have messaging permission — ask your admin to enable it for your account.`,
    category: 'features',
    roles: ['teacher'],
    quickReplies: [
      { text: '💳 Credits', payload: 'credit_system_overview' },
      { text: '📢 Notice Board', payload: 'notice_board' },
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
      'my attendance', 'check attendance', 'attendance percentage',
      'how many days absent', 'present absent', 'attendance record',
      'see attendance', 'view attendance',
    ],
    answer: `Checking your attendance is easy — here's where to find it:

### Student / Parent Portal:
**Dashboard → My Attendance** (or just look at the dashboard summary)

### What you'll see:
✔ Your overall attendance percentage
✔ Total days present / absent
✔ Medical leave count
✔ Month-by-month calendar view
✔ Trend analysis

### Color Guide:
🟢 **Above 75%** — You're good!
🟡 **70–75%** — Getting low, be careful
🔴 **Below 70%** — Critical — talk to your school admin

### Why 75% matters:
Most schools require **75% minimum attendance**. Below 70% can affect your exam eligibility. Your school will notify parents if attendance gets low.

### Calendar View:
Switch to calendar mode to see:
- 🟢 Green = Present
- 🔴 Red = Absent
- ⚫ Grey = Holiday or no school

Something looks wrong? Contact your class teacher or admin to review.`,
    category: 'general',
    roles: ['student', 'parent'],
    quickReplies: [
      { text: '📊 My Results', payload: 'student_results' },
      { text: '📚 Assignments', payload: 'student_assignments' },
      { text: '💰 Fee Status', payload: 'fee_status_student' },
    ],
  },

  {
    id: 'student_results',
    patterns: [
      'results', 'exam result', 'my marks', 'performance',
      'grade', 'report card', 'check results', 'see marks',
      'my scores', 'how did i do',
    ],
    answer: `Here's how to check your exam results:

### Student / Parent Portal:
**Dashboard → Exams / Results**

### What you'll see:
✔ All published exam results
✔ Subject-wise marks
✔ Grade (A, B, C, D, F)
✔ Class rank (if your school shares it)
✔ Class average for comparison
✔ Download grade card as PDF

### Performance Analysis:
📈 Subject-wise trend across exams
🎯 Your strong subjects highlighted
⚠️ Areas needing improvement
📊 Compared to class average

### Download Grade Card:
Results → Select Exam → Download PDF

This is the official grade card with your school's letterhead — usable for records or applications.

### Results not showing?
Your teacher may not have published them yet. Published results appear instantly. Check back or ask your teacher!

### Parent view:
Parents see the same information — your marks are not hidden from them! 😄`,
    category: 'general',
    roles: ['student', 'parent'],
    quickReplies: [
      { text: '✅ My Attendance', payload: 'student_attendance_check' },
      { text: '📚 Pending Assignments', payload: 'student_assignments' },
      { text: '📞 Contact Teacher', payload: 'contact_teacher' },
    ],
  },

  {
    id: 'fee_status_student',
    patterns: [
      'fee', 'fees', 'fee status', 'fee payment', 'pending fee',
      'due fee', 'pay fee', 'fee due', 'outstanding fee',
      'fee receipt', 'pay online',
    ],
    answer: `Here's how to check and pay your school fees online:

### Parent / Student Portal:
**Dashboard → Fees**

### What you'll see:
✔ Complete fee structure
✔ Month-by-month breakdown
✔ Payment history with receipts
✔ Pending amount
✔ Due date clearly shown
✔ Late fee (if any)

### Status Colors:
🟢 **Paid** — all clear!
🟡 **Due soon** — pay before due date
🔴 **Overdue** — late fee may apply

### How to Pay Online:
1. Click **"Pay Now"** next to the pending amount
2. Confirm the amount
3. Choose payment method (UPI, Card, Net Banking)
4. Complete Razorpay payment
5. **Instant receipt generated** ✅

### Payment Methods Accepted:
✔ UPI — PhonePe, Google Pay, Paytm
✔ Debit / Credit Card
✔ Net Banking
✔ Wallets

### Receipt:
- Auto-generated PDF after payment
- Emailed to your registered email
- Always downloadable from the portal
- Official format with school letterhead

### Need a concession or installment?
Contact your school admin directly — they can adjust fees or set up a payment plan for you.`,
    category: 'general',
    roles: ['student', 'parent'],
    quickReplies: [
      { text: '📜 Payment History', payload: 'payment_history' },
      { text: '🎟️ Fee Concession', payload: 'fee_concession' },
      { text: '🧾 Download Receipt', payload: 'receipt_download' },
    ],
  },

  {
    id: 'student_assignments',
    patterns: [
      'homework', 'assignment', 'my homework', 'pending homework',
      'submit assignment', 'assignment due', 'due homework',
    ],
    answer: `Here's how to view and submit your assignments:

### Student Portal:
**Dashboard → Homework / Assignments**

### What you'll see:
✔ All assigned homework
✔ Subject and teacher name
✔ Due date and time
✔ Attachments from teacher (if any)
✔ Status: Pending / Submitted / Graded

### Submitting an Assignment:
1. Click on the assignment
2. Read the instructions
3. Upload your work (PDF, image, doc)
4. Click **Submit**
5. Done — teacher gets notified ✅

### After Grading:
Once your teacher grades it, you'll see:
- Marks scored
- Teacher's comments
- Feedback

You'll get a notification when grades are out.

### Late Submission?
Check if the teacher allows late submissions — some do, some don't. If the submit button is gone, deadline has passed and late submission is not allowed.

Talk to your teacher if you need an extension.`,
    category: 'general',
    roles: ['student', 'parent'],
    quickReplies: [
      { text: '📊 My Results', payload: 'student_results' },
      { text: '✅ My Attendance', payload: 'student_attendance_check' },
    ],
  },

  {
    id: 'parent_portal',
    patterns: [
      'parent portal', 'parent login', 'parent access', 'parent account',
      'how parents login', 'parent dashboard',
    ],
    answer: `As a parent, you get your own dedicated dashboard to stay updated on your child's school life!

### How to Access:
Your login credentials are set up by the school admin. You'll receive them via SMS or WhatsApp.

**URL:** Same as your school's Skolify portal
**Role:** Select "Parent" when logging in

### What You Can See:

✔ **Attendance** — daily record, percentage, calendar
✔ **Fees** — pending amount, pay online, download receipts
✔ **Results** — all published exam results
✔ **Homework** — what's assigned, what's submitted, grades
✔ **Timetable** — your child's class schedule
✔ **Notices** — school announcements
✔ **Certificates** — TC, Bonafide (if issued)

### Notifications:
You'll get automatic SMS/WhatsApp for:
- Child marked absent
- Fee due reminders
- Results published
- Important announcements

### Multiple Children?
If you have more than one child in the same school, you can switch between their profiles from the same login.

Didn't receive login credentials? Contact your school's admin.`,
    category: 'general',
    roles: ['parent'],
    quickReplies: [
      { text: '✅ Check Attendance', payload: 'student_attendance_check' },
      { text: '💰 Pay Fees', payload: 'fee_status_student' },
      { text: '📊 View Results', payload: 'student_results' },
    ],
  },

  {
    id: 'student_login',
    patterns: [
      'student login', 'how to login', 'login problem', 'cant login',
      'forgot password', 'password reset', 'login issue', 'access portal',
    ],
    answer: `Having trouble logging in? Let me help you sort it out.

### Normal Login:
**Go to your school's Skolify portal URL**
→ Enter your Roll Number (or email)
→ Enter password
→ Select role: Student
→ Login ✅

### Forgot Password?
Click **"Forgot Password"** on the login page → Enter your registered phone/email → You'll get a reset link via SMS or email.

### First Time Login?
Your school admin would have given you a temporary password via SMS. Use that to log in first, then change it.

### Still can't log in?
A few things to check:
- Are you using the correct portal URL? (Ask your school for the link)
- Is your roll number entered correctly? (No spaces)
- Did your admin activate your account?

If none of that works, contact your class teacher or school admin — they can reset your access directly.

Need more help? I can connect you with our support team too.`,
    category: 'technical',
    roles: ['student', 'parent'],
    quickReplies: [
      { text: '📞 Support', action: 'forward' },
    ],
    canForward: true,
  },
]

// ══════════════════════════════════════════════════════════
// SUPPORT & GENERAL
// ══════════════════════════════════════════════════════════

export const SUPPORT_QA: ChatAnswer[] = [
  {
    id: 'support_contact',
    patterns: [
      'support', 'help', 'contact', 'problem', 'issue', 'error',
      'technical', 'need help', 'something wrong', 'not working',
      'bug', 'report issue',
    ],
    answer: `Happy to help! Here's how you can reach us:

### 📧 Email:
**support@skolify.in**
Response time: Same business day

### 💬 WhatsApp:
Direct message to our founder team
Response time: 1–2 hours (business hours)

### 📞 Phone:
Available during business hours for urgent issues

### 💻 Live Chat:
Right here in the portal — fastest way to get answers

### Support Hours:
⏰ **Monday–Saturday:** 9 AM – 6 PM
⏰ **Sunday:** Closed
⏰ **Emergencies:** Premium support available for critical issues

### Response Times by Priority:

🔴 **Critical** (system down) → 30 minutes
🟡 **High** (major feature broken) → 2 hours
🔵 **Medium** (workaround available) → 24 hours
⚪ **Low** (cosmetic/minor) → 48 hours

### Before Contacting:
It helps to have ready:
- What exactly happened
- Screenshot of the error (if any)
- Your role (admin/teacher/student/parent)
- Steps to reproduce the issue

[Submit a support ticket →](/enquiry)`,
    category: 'support',
    roles: ['admin', 'teacher', 'student', 'parent', 'guest'],
    quickReplies: [
      { text: '🐛 Report a Bug', action: 'forward' },
      { text: '💡 Feature Request', action: 'forward' },
      { text: '🔑 Account Issue', action: 'forward' },
    ],
    canForward: true,
  },

  {
    id: 'trial_info',
    patterns: [
      'trial', 'free', 'try', 'demo', 'test', 'free trial',
      'no credit card', 'try for free', 'free plan',
    ],
    answer: `Yes — we offer a **60-day free trial**. No credit card, no commitment. Just try it out! 🎁

### What's Included in the Trial:

✅ 500 messaging credits
✅ Unlimited student management
✅ All core modules (attendance, notices, website, gallery)
✅ Mobile app (PWA)
✅ Email support
✅ Free onboarding call (just ask!)

### What's Not Included:
❌ Advanced modules (LMS, Payroll, Transport)
❌ Custom domain
❌ Dedicated account manager

### After the 60 Days:
- Your data stays safe for 90 days
- Pick any plan that fits your school
- Everything carries over — no data loss

### How to Start:
[Register here →](/register)

Just enter:
- School name
- Your phone number
- City

That's it — you're in! ⚡

**No sales pressure. No surprise charges. If you don't upgrade, we don't charge you — ever.**`,
    category: 'general',
    roles: ['guest', 'admin'],
    quickReplies: [
      { text: '💰 Plans After Trial', payload: 'admin_plans_overview' },
      { text: '✍️ Register Now', payload: '/register' },
      { text: '📞 Request Demo', action: 'forward' },
    ],
  },

  {
    id: 'security_privacy',
    patterns: [
      'security', 'safe', 'data', 'privacy', 'secure', 'breach',
      'hack', 'data safe', 'is my data safe', 'privacy policy',
      'gdpr', 'data protection',
    ],
    answer: `Your data security is something we take very seriously. Here's what we do to protect it:

### 🔐 Data Security:

✔ **Full HTTPS encryption** — all data in transit is encrypted
✔ **End-to-end** — from your browser to our database
✔ **No third-party data sharing** — your school's data stays yours
✔ **Role-based access** — strict permissions, teachers can't see what admins see
✔ **Audit logs** — every action is tracked

### 🏗️ Infrastructure:

✔ **MongoDB Atlas** on AWS (enterprise-grade hosting)
✔ **Vercel** hosting — 99.9% uptime SLA
✔ **Daily automated backups**
✔ **Encryption at rest**
✔ **Geographic redundancy**

### 💳 Payments:

✔ Powered by **Razorpay** — PCI DSS Level 1 certified
✔ We never store card details
✔ 3D Secure for card transactions

### 🇮🇳 Compliance:

✔ GDPR-inspired data practices
✔ No spam or unsolicited marketing
✔ Consent-based data collection

### Your Rights:

✔ Export your data anytime
✔ Request permanent deletion
✔ Full control over your data

[Privacy Policy →](/privacy) | [Security Details →](/security)`,
    category: 'support',
    roles: ['admin', 'teacher', 'student', 'parent', 'guest'],
    quickReplies: [
      { text: '🗑️ Delete My Data', action: 'forward' },
      { text: '📜 Privacy Policy', payload: '/privacy' },
    ],
  },

  {
    id: 'skolify_for_school_size',
    patterns: [
      'small school', 'large school', 'how many students', 'school size',
      'single teacher school', 'big school', '100 students', '500 students',
      '1000 students', 'suits my school',
    ],
    answer: `Skolify works for schools of all sizes — here's a quick guide:

### Very Small Schools (under 100 students):
**Starter plan (₹499/month)** is perfect.
Even at ₹17/day, you get attendance, fee management, website, and parent communication.

### Small-Medium Schools (100–500 students):
**Starter** works well. Upgrade to **Growth** if you want online fee collection and exam management.

### Medium Schools (500–1,500 students):
**Growth plan (₹999/month)** — the most popular choice.
Great balance of features and price.

### Large Schools (1,500–5,000 students):
**Pro plan (₹1,999/month)** — handles high volume with LMS, library, and advanced reports.

### Multi-Branch or 5,000+ students:
**Enterprise (₹3,999/month)** — unlimited everything, plus HR, payroll, transport, and hostel.

Not sure which fits you? Tell me how many students your school has and I'll suggest the right plan! 😊`,
    category: 'general',
    roles: ['admin', 'guest'],
    quickReplies: [
      { text: '💰 See All Plans', payload: 'admin_plans_overview' },
      { text: '🎁 Start Free Trial', payload: 'trial_info' },
      { text: '📞 Ask Us', action: 'forward' },
    ],
    canForward: true,
  },

  {
    id: 'multi_branch',
    patterns: [
      'multiple branch', 'multi branch', 'two schools', 'chain school',
      'sister school', 'branch school', 'franchise', 'multiple schools',
    ],
    answer: `Running multiple branches? Skolify's **Enterprise plan** is designed for exactly that.

### What Enterprise Offers for Multi-Branch Schools:

✔ **Separate portals** for each branch with their own data
✔ **Unified dashboard** — see all branches from one admin view
✔ **Centralized reporting** — compare performance across branches
✔ **Shared resource management** — unified staff directory
✔ **Unlimited students, teachers, and storage**
✔ **10,000 credits/month** (never expire)
✔ **Dedicated account manager**

### Pricing:
₹3,999/month per portal, OR custom enterprise pricing for many branches.

For 3+ branches, we often work out custom pricing. Let's talk!

**Want a call to discuss your specific setup?**`,
    category: 'billing',
    roles: ['admin', 'guest'],
    quickReplies: [
      { text: '📞 Discuss Pricing', action: 'forward' },
      { text: '💰 Enterprise Plan', payload: 'admin_plans_overview' },
    ],
    canForward: true,
  },

  {
    id: 'usage_stats',
    patterns: [
      'usage', 'how many credits used', 'credit history', 'credit usage',
      'how much left', 'remaining credits', 'credit balance',
    ],
    answer: `Want to track your credit usage? Here's where to find everything:

### Admin Panel → Subscription → Credit History

### What you'll see:
✔ **Current balance** — credits remaining
✔ **Credits received** — monthly free + purchased
✔ **Credits used** — with date and action type
✔ **Upcoming expiry** — when old credits will expire
✔ **Usage breakdown** — SMS vs WhatsApp vs Email

### Usage Tips:
- Set up a **credit alert** in settings — get notified when balance drops below X
- Review which module uses the most credits (usually attendance SMS)
- Consider bulk credit packs if you're regularly running low

### Quick Balance Check:
Your credit balance also shows right on the **main admin dashboard** — top right area of the subscription section.`,
    category: 'credits',
    roles: ['admin'],
    quickReplies: [
      { text: '🛒 Buy More Credits', payload: 'buy_credits' },
      { text: '♻️ Rollover Policy', payload: 'credit_rollover_detail' },
    ],
  },

  {
    id: 'certificates',
    patterns: [
      'certificate', 'tc', 'transfer certificate', 'bonafide', 'cc',
      'character certificate', 'generate certificate', 'issue certificate',
    ],
    answer: `Skolify automates certificate generation — no more manual typing!

### Available Certificates:

✔ **Transfer Certificate (TC)**
✔ **Character Certificate (CC)**
✔ **Bonafide Certificate**
✔ **Custom certificates** (Pro plan+)

### How to Generate (Admin/Teacher):
**Admin Panel → Certificates → Select Type → Select Student → Generate**

The certificate is auto-filled with:
- Student's name, class, DOB
- Enrollment date, leaving date
- School name, principal's signature
- Official school letterhead

### Output:
✔ Instant PDF generation
✔ Download immediately
✔ Print-ready format
✔ Shareable digital copy
✔ Record saved in student's profile

### Who can generate?
- Admins can generate all certificates
- Teachers can generate based on permissions set by admin

### Available from: Growth plan onwards`,
    category: 'features',
    roles: ['admin', 'teacher'],
    quickReplies: [
      { text: '⬆️ Upgrade to Growth', payload: 'admin_upgrade' },
      { text: '📞 Help', action: 'forward' },
    ],
  },
]

// ══════════════════════════════════════════════════════════
// DEFAULT FALLBACK
// ══════════════════════════════════════════════════════════

export const FALLBACK_ANSWER: ChatAnswer = {
  id: 'fallback_default',
  patterns: ['__default__'],
  answer: `Hmm, I'm not quite sure about that one! 🤔

**Here's what I can definitely help with:**

• 💰 **Plans & Pricing** — which plan fits your school
• 🎁 **Free Trial** — 60 days, no credit card
• 📦 **Features** — what's included in each plan
• 💳 **Credits** — SMS, WhatsApp, email messaging
• 🔧 **Setup** — how to get started
• 📞 **Support** — talk to our team

Or just **type your question naturally** — I'll do my best! 😊

If I still can't help, I can connect you with a real person from our team right away.`,
  category: 'general',
  roles: ['admin', 'teacher', 'student', 'parent', 'guest'],
  quickReplies: [
    { text: '💰 See Plans', payload: 'admin_plans_overview' },
    { text: '🎁 Free Trial', payload: 'trial_info' },
    { text: '📦 Features', payload: 'features_overview' },
    { text: '📞 Talk to Team', action: 'forward' },
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

  const exactMatch = ALL_QA.find(
    qa => qa.id === msg && qa.roles.includes(userRole)
  )
  if (exactMatch) return exactMatch

  for (const qa of ALL_QA) {
    if (!qa.roles.includes(userRole)) continue
    if (qa.patterns.some(pattern => msg.includes(pattern))) {
      return qa
    }
  }

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
    qa =>
      question.relatedQuestions!.includes(qa.id) && qa.roles.includes(role)
  )
}