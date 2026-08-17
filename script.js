/* ============================================================
   Your Services — script.js
   ملف واحد يجمع: الراوتر + كل الصفحات + لوحة التحكم + Supabase
   الصفحات: index.html (الموقع) — admin.html (اللوحة) — qr-code.html (QR)
   ============================================================ */

/* ============================================================
   Your Services — app.js
   دليل الشركات والخبراء (نسخة HTML/CSS/JS خالصة، بدون React)
   البيانات من Supabase REST API
   ============================================================ */

/* ---------- 1) إعدادات Supabase — ضع بياناتك هنا ---------- */
const SUPABASE_URL = 'https://xkzizjwpiygwhookesgn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_aX2cyDXfBHMA6RO3xWlRcQ_cmar6-wd';

/* ---------- 1.5) رابط الموقع لصفحة QR — ضع رابط موقعك هنا ---------- */
/* مثال: const SITE_URL = 'https://your-services.com'; */
const SITE_URL = '';

/* ---------- 2) أدوات مساعدة ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cleanPhone = (phone) => String(phone ?? '').replace(/[^\d]/g, '');
const initials = (name) => String(name ?? '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0] ?? '').join('').toUpperCase() || '?';
const stars = (value) => { const n = Math.round(Number(value) || 0); return '★'.repeat(n) + '☆'.repeat(Math.max(0, 5 - n)); };

function normalizeSettings(rows) {
  const out = {};
  if (!rows) return out;
  const list = Array.isArray(rows) ? rows : [rows];
  list.forEach((row) => {
    if (!row || typeof row !== 'object') return;
    if ('key' in row) out[row.key] = row.value ?? row.val ?? '';
    else Object.assign(out, row);
  });
  return out;
}

async function supabaseRest(table, options = {}) {
  const { method = 'GET', body, query = '', headers = {} } = options;
  const url = `${SUPABASE_URL}/rest/v1/${table}${query ? `?${query}` : ''}`;
  const response = await fetch(url, {
    method,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: method === 'POST' ? 'return=representation' : method === 'PATCH' ? 'return=representation' : '',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new Error(await response.text() || `خطأ ${response.status}`);
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
window.supabaseRest = supabaseRest;

/* ---------- 3) الأيقونات (نفس أيقونات lucide المستخدمة) ---------- */
const ICON_PATHS = {
  'arrow-left': '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
  'arrow-up-right': '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
  briefcase: '<rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  building: '<rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  sparkles: '<path d="m12 3-1.9 5.8L4 10.5l6.1 1.7L12 18l1.9-5.8L20 10.5l-6.1-1.7L12 3Z"/><path d="M5 3v4M3 5h4M19 17v4M17 19h4"/>',
  star: '<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2Z"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  'map-pin': '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-10 6L2 7"/>',
  'message-circle': '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  'shield-check': '<path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V6l8-3 8 3Z"/><path d="m9 12 2 2 4-4"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  'file-text': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h6"/><path d="M8 13h8M8 17h8"/>',
  'circle-alert': '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  'qr-code': '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/><path d="M14 14h3v3h-3zM19 19h2v2h-2zM14 19h2v2h-2zM19 14h2v2h-2z"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  'eye-off': '<path d="M9.9 4.2A10.9 10.9 0 0 1 12 4c6.4 0 10 7 10 7a18 18 0 0 1-3.2 4.2M6.6 6.6A18 18 0 0 0 2 11s3.6 7 10 7a10.9 10.9 0 0 0 4.3-.9"/><path d="m2 2 20 20"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  'log-out': '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 15a1.7 1.7 0 0 0-1.6-1H1a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 3 9a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 9 3V3a2 2 0 1 1 4 0v.1A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 21 9h.1a2 2 0 1 1 0 4H21a1.7 1.7 0 0 0-1.6 1Z"/>',
};
function icon(name, size = 16, style = '') {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="${style}">${ICON_PATHS[name] || ''}</svg>`;
}
window.icon = icon;

/* ---------- 4) طبقة البيانات ---------- */
const store = {
  data: { categories: [], companies: [], employees: [], reviews: [], settings: [] },
  adminUsers: [],
  loading: true,
  error: '',
  loaded: false,
};
window.store = store;

async function loadDirectory(force = false) {
  if (store.loaded && !force) return store.data;
  store.loading = true;
  store.error = '';
  try {
    const [categories, companies, employees, reviews, settings] = await Promise.all([
      supabaseRest('categories', { query: 'select=*' }).catch(() => []),
      supabaseRest('companies', { query: 'select=*' }),
      supabaseRest('employees', { query: 'select=*' }),
      supabaseRest('reviews', { query: 'select=*&order=created_at.desc' }).catch(() => []),
      supabaseRest('settings', { query: 'select=*' }).catch(() => []),
    ]);
    store.adminUsers = await supabaseRest('admin_users', { query: 'select=*' }).catch(() => []);
    store.data = {
      categories: categories || [],
      companies: companies || [],
      employees: employees || [],
      reviews: reviews || [],
      settings: settings || [],
    };
    store.loaded = true;
  } catch (error) {
    store.error = error?.message || 'تعذر الاتصال بقاعدة البيانات.';
  } finally {
    store.loading = false;
  }
  return store.data;
}
window.loadDirectory = loadDirectory;

async function reload() {
  await loadDirectory(true);
  render();
}
window.reloadDirectory = reload;

/* ---------- 5) دوال مشتركة ---------- */
const categoryFor = (id) => store.data.categories.find((c) => String(c.id) === String(id));
const reviewsFor = (id) => store.data.reviews.filter((r) => String(r.employee_id) === String(id) && !r.is_hidden);
const averageFor = (list) => (list.length ? list.reduce((sum, r) => sum + Number(r.rating_stars ?? r.stars ?? 0), 0) / list.length : 0);
const visibleCompanies = () => store.data.companies.filter((c) => !c.is_hidden);
const visibleEmployees = () => store.data.employees.filter((e) => !e.is_hidden);

function setSeo(title, description) {
  document.title = `${title} | Your Services`;
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute('content', description);
}

/* ---------- 6) مكوّنات HTML ---------- */
const dataError = (message) => `
  <div class="error-state" role="alert" data-testid="state-data-error">
    <div class="state-icon">${icon('circle-alert', 21)}</div>
    <div class="state-title">تعذر تحميل الدليل الآن</div>
    <p class="state-copy">${esc(message || 'تحقق من اتصالك ثم حاول مرة أخرى.')}</p>
    <button class="btn-secondary" data-action="retry" data-testid="button-retry-data">${icon('refresh', 15)} إعادة المحاولة</button>
  </div>`;

const loadingCards = (people = false) => `
  <div class="skeleton-grid" aria-label="جاري تحميل البيانات">
    ${[1, 2, 3].map((v) => `<div class="skeleton-card" data-testid="skeleton-card-${people ? 'people' : 'companies'}-${v}"></div>`).join('')}
  </div>`;

const emptyState = (people = false) => `
  <div class="empty-state" data-testid="state-empty-results">
    <div class="state-icon">${icon(people ? 'users' : 'building', 21)}</div>
    <div class="state-title">لا توجد نتائج مطابقة</div>
    <p class="state-copy">جرّب كلمة بحث مختلفة أو أزل أحد الفلاتر للوصول إلى نتائج أكثر.</p>
  </div>`;

const logoTile = (src, name, avatar = false) =>
  `<div class="${avatar ? 'avatar-tile' : 'logo-tile'}">${src ? `<img src="${esc(src)}" alt="" />` : esc(initials(name))}</div>`;

const starsHtml = (value) =>
  `<span class="stars" aria-label="التقييم ${value.toFixed(1)} من 5"><span>${stars(value)}</span><span class="rating-text">${value ? value.toFixed(1) : 'جديد'}</span></span>`;

function companyCard(company) {
  const category = categoryFor(company.category_id);
  const team = visibleEmployees().filter((e) => String(e.company_id) === String(company.id));
  return `
  <article class="company-card fade-up" data-testid="card-company-${esc(company.id)}">
    <div class="company-card-top">
      ${logoTile(company.logo_url || company.image_url, company.name)}
      <span class="card-label">${esc(category?.name || 'خدمات مهنية')}</span>
    </div>
    <a href="#/companies/${esc(company.id)}" data-testid="link-company-${esc(company.id)}"><h3>${esc(company.name)}</h3></a>
    <div class="card-meta">${icon('map-pin', 13)} ${esc(company.city || 'السعودية')}</div>
    <p class="card-description">${esc(company.description || company.desc || 'ملف مهني موثوق يضم خدمات الشركة وفريقها وخبراتها.')}</p>
    <div class="card-footer">
      <span>${icon('users', 13, 'vertical-align:middle;margin-inline-end:4px')} ${team.length} خبير</span>
      <a class="text-link" href="#/companies/${esc(company.id)}" data-testid="link-company-details-${esc(company.id)}">عرض الملف ${icon('arrow-left', 14)}</a>
    </div>
  </article>`;
}

function employeeCard(employee) {
  const company = store.data.companies.find((c) => String(c.id) === String(employee.company_id));
  const average = averageFor(reviewsFor(employee.id));
  return `
  <article class="person-card fade-up" data-testid="card-employee-${esc(employee.id)}">
    ${logoTile(employee.image_url || employee.image, employee.name, true)}
    <a href="#/employees/${esc(employee.id)}" data-testid="link-employee-${esc(employee.id)}"><h3>${esc(employee.name)}</h3></a>
    <div class="person-role">${esc(employee.title || employee.role || 'خبير متخصص')}</div>
    <div class="person-company">${esc(company?.name || 'عضو في شبكة Your Services')}</div>
    <div style="margin-top:10px">${starsHtml(average)}</div>
    <div class="card-footer"><a class="text-link" href="#/employees/${esc(employee.id)}" data-testid="link-employee-profile-${esc(employee.id)}">فتح الملف ${icon('arrow-left', 14)}</a></div>
  </article>`;
}

const pageIntro = (title, description, action = '') => `
  <section class="page-hero"><div class="container-wide page-hero-row">
    <div>
      <span class="section-kicker">YOUR SERVICES / DIRECTORY</span>
      <h1 class="page-title">${esc(title)}</h1>
      <p class="page-description">${esc(description)}</p>
    </div>${action}
  </div></section>`;

const notFoundInline = (title, copy) => `
  <main class="not-found"><div>
    <div class="state-icon">${icon('x', 22)}</div>
    <h1 class="page-title" style="font-size:2rem">${esc(title)}</h1>
    <p class="section-desc" style="margin:10px auto 20px">${esc(copy)}</p>
    <a href="#/companies" class="btn-primary" data-testid="link-not-found-back">العودة إلى الدليل ${icon('arrow-left', 15)}</a>
  </div></main>`;

/* ---------- 7) الصفحات ---------- */
const pages = {};
window.pages = pages;

pages.home = () => {
  setSeo('دليلك للشركات والخبراء', 'اعثر على الشركة أو الخبير المناسب لخدمتك بسرعة، مع ملفات واضحة وتقييمات حقيقية.');
  const { loading, error } = store;
  const companies = visibleCompanies().slice(0, 3);
  const employees = visibleEmployees().slice(0, 4);
  const categories = store.data.categories.slice(0, 8);
  const average = averageFor(store.data.reviews.filter((r) => !r.is_hidden));
  const stat = (value, label, ic) => `<div class="stat-block" data-testid="stat-${esc(label)}"><span class="stat-icon">${icon(ic, 18)}</span><strong>${esc(value)}</strong><span>${esc(label)}</span></div>`;
  const trustPoint = (ic, title, copy) => `<div class="trust-point">${icon(ic, 20)}<h3>${esc(title)}</h3><p>${esc(copy)}</p></div>`;

  return `
  <main>
    <section class="hero-section">
      <div class="hero-media" aria-hidden="true">
        <video id="hero-video" poster="hero-poster.jpg" autoplay muted loop playsinline preload="none" disablepictureinpicture tabindex="-1">
          <source src="hero-bg.mp4" type="video/mp4" />
        </video>
      </div>
      <div class="container-wide hero-layout">
        <div class="fade-in-right">
          <div class="eyebrow"><span class="eyebrow-dot"></span> شبكة مهنية أقرب لاحتياجك</div>
          <h1 class="hero-title">لا تبحث طويلاً.<br /><span>ابدأ من الشخص المناسب.</span></h1>
          <p class="hero-copy">دليل عربي يجمع الشركات والموظفين المتخصصين في مكان واحد. استكشف الملفات، قارن الخبرات، واتخذ قرارك بثقة.</p>
          <div class="hero-actions">
            <a href="#/companies" class="btn-primary" data-testid="link-hero-companies">استكشف الشركات ${icon('arrow-left', 17)}</a>
            <a href="#/employees" class="btn-secondary" data-testid="link-hero-employees">تعرّف على الخبراء</a>
          </div>
          <div class="hero-note">${icon('shield-check', 15)} ملفات عامة واضحة، وتواصل مباشر عند الحاجة.</div>
        </div>
        <div class="hero-art fade-in-scale" aria-label="شبكة Your Services">
          <div class="orbit"></div><div class="orbit orbit-two"></div>
          <div class="hero-center-card">
            <div class="center-brand"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="8"/><path d="m14.8 9.2-2.1 4.5-4.5 2.1 2.1-4.5 4.5-2.1Z"/></svg></div>
            <div class="center-lines"><i></i><i></i><i></i></div>
          </div>
          <div class="floating-tag tag-one">${icon('search', 14)} بحث أذكى</div>
          <div class="floating-tag tag-two">${icon('star', 14)} تقييمات حقيقية</div>
          <div class="floating-tag tag-three">${icon('message-circle', 14)} تواصل مباشر</div>
        </div>
      </div>
      <div class="container-wide">
        <div class="search-panel">
          ${icon('search', 19)}
          <input id="hero-search" placeholder="ابحث عن شركة، خدمة، أو خبير..." aria-label="بحث عام" data-testid="input-hero-search" />
          <button class="btn-primary" data-action="hero-search" data-testid="button-hero-search">ابحث ${icon('arrow-left', 15)}</button>
        </div>
      </div>
    </section>

    <section class="section section-tint" aria-labelledby="stats-title">
      <div class="container-wide">
        <div class="section-head"><div><span class="section-kicker">نظرة سريعة</span><h2 class="section-title" id="stats-title">دليل ينمو مع احتياجك</h2></div><span class="section-desc">آخر تحديث للبيانات عند فتح الصفحة</span></div>
        <div class="stats-grid">
          ${stat(loading ? '—' : String(visibleCompanies().length), 'شركة وخدمة', 'building')}
          ${stat(loading ? '—' : String(visibleEmployees().length), 'خبير متاح', 'users')}
          ${stat(loading ? '—' : String(store.data.reviews.filter((r) => !r.is_hidden).length), 'تقييم منشور', 'star')}
          ${stat(loading ? '—' : average ? average.toFixed(1) : '—', 'متوسط التقييم', 'sparkles')}
        </div>
      </div>
    </section>

    <section class="section" aria-labelledby="categories-title">
      <div class="container-wide">
        <div class="section-head"><div><span class="section-kicker">اختر مسارك</span><h2 class="section-title" id="categories-title">تخصصات تبدأ منها</h2><p class="section-desc">نظرة أسرع على المجالات التي يخدمها الدليل.</p></div><a class="text-link" href="#/companies" data-testid="link-home-all-categories">كل التصنيفات ${icon('arrow-left', 15)}</a></div>
        ${error ? dataError(error) : loading ? loadingCards() : `<div class="category-grid">${categories.map(categoryCard).join('')}</div>`}
      </div>
    </section>

    <section class="section section-tint" aria-labelledby="companies-title">
      <div class="container-wide">
        <div class="section-head"><div><span class="section-kicker">شركاء موثوقون</span><h2 class="section-title" id="companies-title">شركات تستحق أن تبدأ بها</h2></div><a class="text-link" href="#/companies" data-testid="link-home-all-companies">فتح دليل الشركات ${icon('arrow-left', 15)}</a></div>
        ${loading ? loadingCards() : error ? dataError(error) : companies.length ? `<div class="company-grid">${companies.map(companyCard).join('')}</div>` : emptyState()}
      </div>
    </section>

    <section class="section" aria-labelledby="experts-title">
      <div class="container-wide">
        <div class="section-head"><div><span class="section-kicker">أشخاص خلف الخدمة</span><h2 class="section-title" id="experts-title">خبراء يمكنك التعرف عليهم</h2></div><a class="text-link" href="#/employees" data-testid="link-home-all-employees">كل الخبراء ${icon('arrow-left', 15)}</a></div>
        ${loading ? loadingCards(true) : error ? dataError(error) : employees.length ? `<div class="company-grid">${employees.map(employeeCard).join('')}</div>` : emptyState(true)}
      </div>
    </section>

    <section class="section">
      <div class="container-wide trust-strip">
        <div class="trust-grid">
          <div><span class="section-kicker" style="color:#9fc0ff">لماذا Your Services</span><h2 class="section-title">معلومات أقل ضجيجاً، وقرار أوضح.</h2><p>نصمم التجربة حول ما يحتاجه العميل فعلاً: ملف يمكن فهمه، تواصل قريب، وتقييم يساعد على المقارنة.</p></div>
          <div class="trust-points">
            ${trustPoint('shield-check', 'وضوح قبل التواصل', 'اقرأ التخصص والخبرة ومعلومات الشركة في صفحة واحدة.')}
            ${trustPoint('clock', 'طريق أقصر', 'انتقل من البحث إلى قناة التواصل المناسبة دون تعقيد.')}
            ${trustPoint('check', 'تقييمات مرئية', 'آراء العملاء جزء أساسي من الصورة، وليست تفصيلاً مخفياً.')}
          </div>
        </div>
      </div>
    </section>
  </main>`;
};

const ICON_MAP = { briefcase: 'briefcase', building: 'building', users: 'users', sparkles: 'sparkles' };
function categoryCard(category) {
  const name = ICON_MAP[category.icon] || 'briefcase';
  const count = visibleCompanies().filter((c) => String(c.category_id) === String(category.id)).length;
  return `<a href="#/companies?category=${esc(category.id)}" class="category-card" data-testid="card-category-${esc(category.id)}"><span class="category-icon">${icon(name, 19)}</span><h3>${esc(category.name)}</h3><p>${esc(category.description || category.desc || 'خدمات متخصصة وملفات مهنية جاهزة للاستكشاف.')}</p><span class="category-count">${count} شركات في هذا المجال</span></a>`;
}

/* --- الشركات --- */
const state = { companySearch: '', companyCategory: 'all', companySort: 'name', employeeSearch: '', employeeCompany: 'all', employeeCategory: 'all', employeeSort: 'rating' };

pages.companies = (params) => {
  setSeo('دليل الشركات', 'تصفح الشركات والخدمات المهنية في Your Services مع البحث حسب المجال والمدينة.');
  if (params.search !== undefined) { state.companySearch = params.search; }
  if (params.category !== undefined) { state.companyCategory = params.category; }
  const { loading, error } = store;
  const search = state.companySearch.toLowerCase().trim();
  const list = visibleCompanies()
    .filter((c) => state.companyCategory === 'all' || String(c.category_id) === state.companyCategory)
    .filter((c) => !search || `${c.name} ${c.description ?? c.desc ?? ''} ${c.city ?? ''}`.toLowerCase().includes(search))
    .sort((a, b) => (state.companySort === 'city' ? (a.city ?? '').localeCompare(b.city ?? '', 'ar') : a.name.localeCompare(b.name, 'ar')));

  return `
    ${pageIntro('دليل الشركات', 'تصفح ملفات الشركات، مجالاتها، فريقها، وطرق التواصل معها. استخدم الفلاتر للوصول إلى ما يناسبك.', `<a href="#/contact" class="btn-primary" data-testid="link-companies-contact">أحتاج مساعدة في الاختيار ${icon('arrow-left', 16)}</a>`)}
    <main class="directory-section"><div class="container-wide">
      <div class="filter-bar">
        <div class="filter-search">${icon('search', 17)}<input id="company-search" value="${esc(state.companySearch)}" placeholder="ابحث باسم الشركة أو المدينة..." aria-label="بحث الشركات" data-testid="input-company-search" /></div>
        <select id="company-sort" aria-label="ترتيب الشركات" data-testid="select-company-sort">
          <option value="name" ${state.companySort === 'name' ? 'selected' : ''}>الاسم أبجدياً</option>
          <option value="city" ${state.companySort === 'city' ? 'selected' : ''}>حسب المدينة</option>
        </select>
      </div>
      <div class="chips">
        <button class="chip ${state.companyCategory === 'all' ? 'active' : ''}" data-company-cat="all" data-testid="button-company-category-all">كل المجالات</button>
        ${store.data.categories.map((c) => `<button class="chip ${state.companyCategory === String(c.id) ? 'active' : ''}" data-company-cat="${esc(c.id)}" data-testid="button-company-category-${esc(c.id)}">${esc(c.name)}</button>`).join('')}
      </div>
      ${error ? dataError(error) : loading ? loadingCards() : `<div class="results-note">${list.length} نتيجة متاحة</div><div class="company-grid">${list.length ? list.map(companyCard).join('') : emptyState()}</div>`}
    </div></main>`;
};

/* --- الخبراء --- */
pages.employees = () => {
  setSeo('دليل الخبراء', 'اكتشف الموظفين والخبراء في شبكة Your Services حسب الشركة والتخصص والتقييم.');
  const { loading, error } = store;
  const search = state.employeeSearch.toLowerCase().trim();
  const list = visibleEmployees()
    .filter((e) => state.employeeCompany === 'all' || String(e.company_id) === state.employeeCompany)
    .filter((e) => state.employeeCategory === 'all' || String(store.data.companies.find((c) => String(c.id) === String(e.company_id))?.category_id) === state.employeeCategory)
    .filter((e) => `${e.name} ${e.title ?? e.role ?? ''} ${e.bio ?? ''}`.toLowerCase().includes(search))
    .sort((a, b) => (state.employeeSort === 'name' ? a.name.localeCompare(b.name, 'ar') : averageFor(reviewsFor(b.id)) - averageFor(reviewsFor(a.id))));

  return `
    ${pageIntro('دليل الخبراء', 'ملفات مهنية تساعدك على معرفة الشخص خلف الخدمة، من تخصصه إلى تقييمات العملاء.', `<a href="#/companies" class="btn-secondary" data-testid="link-employees-companies">تصفح الشركات ${icon('building', 16)}</a>`)}
    <main class="directory-section"><div class="container-wide">
      <div class="filter-bar">
        <div class="filter-search">${icon('search', 17)}<input id="employee-search" value="${esc(state.employeeSearch)}" placeholder="ابحث باسم الخبير أو تخصصه..." aria-label="بحث الخبراء" data-testid="input-employee-search" /></div>
        <select id="employee-company" aria-label="فلترة الشركة" data-testid="select-employee-company">
          <option value="all">كل الشركات</option>
          ${visibleCompanies().map((c) => `<option value="${esc(c.id)}" ${state.employeeCompany === String(c.id) ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}
        </select>
        <select id="employee-sort" aria-label="ترتيب الخبراء" data-testid="select-employee-sort">
          <option value="rating" ${state.employeeSort === 'rating' ? 'selected' : ''}>الأعلى تقييماً</option>
          <option value="name" ${state.employeeSort === 'name' ? 'selected' : ''}>الاسم أبجدياً</option>
        </select>
      </div>
      <div class="chips">
        <button class="chip ${state.employeeCategory === 'all' ? 'active' : ''}" data-employee-cat="all" data-testid="button-employee-category-all">كل التخصصات</button>
        ${store.data.categories.map((c) => `<button class="chip ${state.employeeCategory === String(c.id) ? 'active' : ''}" data-employee-cat="${esc(c.id)}" data-testid="button-employee-category-${esc(c.id)}">${esc(c.name)}</button>`).join('')}
      </div>
      ${error ? dataError(error) : loading ? loadingCards(true) : `<div class="results-note">${list.length} خبير في النتائج</div><div class="company-grid">${list.length ? list.map(employeeCard).join('') : emptyState(true)}</div>`}
    </div></main>`;
};

/* --- ملف الشركة --- */
pages.company = (params, id) => {
  const { loading, error } = store;
  if (loading) return `<main class="profile-wrap container-wide">${loadingCards()}</main>`;
  if (error) return `<main class="profile-wrap container-wide">${dataError(error)}</main>`;
  const company = visibleCompanies().find((c) => String(c.id) === String(id));
  if (!company) return notFoundInline('الشركة غير موجودة', 'ربما تم إخفاء الملف أو أن الرابط غير صحيح.');
  setSeo(company.name, company.description || company.desc || 'ملف الشركة وفريقها وطرق التواصل عبر Your Services.');
  const team = visibleEmployees().filter((e) => String(e.company_id) === String(id));
  return `
  <main class="profile-wrap"><div class="container-wide">
    <div class="profile-cover"><div class="profile-heading">
      ${logoTile(company.logo_url || company.image_url, company.name)}
      <div>
        <div class="eyebrow" style="color:#9fc0ff"><span class="eyebrow-dot"></span> ${esc(categoryFor(company.category_id)?.name || 'خدمات مهنية')}</div>
        <h1>${esc(company.name)}</h1>
        <p>${icon('map-pin', 13, 'vertical-align:middle;margin-inline-end:4px')} ${esc(company.city || 'السعودية')}</p>
      </div>
      <div class="profile-actions">
        <a href="#/contact" class="btn-primary" data-testid="link-company-book">${icon('message-circle', 15)} تواصل معنا</a>
        ${company.manager_phone ? `<a href="https://wa.me/${cleanPhone(company.manager_phone)}" class="btn-secondary" target="_blank" rel="noreferrer" data-testid="link-company-whatsapp">${icon('message-circle', 15)} واتساب</a>` : ''}
      </div>
    </div></div>
    <div class="profile-grid">
      <div style="display:grid;gap:20px">
        <section class="profile-card">
          <h2>عن الشركة</h2>
          <p>${esc(company.description || company.desc || 'لا يوجد وصف منشور لهذه الشركة بعد.')}</p>
          ${company.manager_name ? `<div class="manager-box"><div class="manager-avatar">${company.manager_image ? `<img src="${esc(company.manager_image)}" alt="" />` : esc(initials(company.manager_name))}</div><div><h3>${esc(company.manager_name)}</h3><p>${esc(company.manager_title || 'المدير التنفيذي')}</p></div>${company.manager_cv ? `<a class="text-link" href="${esc(company.manager_cv)}" target="_blank" rel="noreferrer" data-testid="link-manager-cv">${icon('file-text', 14)} السيرة</a>` : ''}</div>` : ''}
        </section>
        <section class="profile-card">
          <div class="section-head" style="margin-bottom:14px"><div><span class="section-kicker">الفريق</span><h2 style="margin:0">الخبراء والموظفون</h2></div><span class="results-note" style="margin:0">${team.length} ملفات</span></div>
          ${team.length ? `<div class="employee-list">${team.map((e) => `<div class="employee-row">${logoTile(e.image_url || e.image, e.name, true)}<div><h3>${esc(e.name)}</h3><p>${esc(e.title || e.role || 'خبير متخصص')}</p></div><a class="text-link" href="#/employees/${esc(e.id)}" data-testid="link-company-employee-${esc(e.id)}">الملف ${icon('arrow-left', 14)}</a></div>`).join('')}</div>` : emptyState(true)}
        </section>
      </div>
      <aside style="display:grid;gap:20px;align-content:start">
        <section class="profile-card"><h2>معلومات التواصل</h2><div class="info-list">
          <div class="info-item">${icon('map-pin', 16)} ${esc(company.city || 'المملكة العربية السعودية')}</div>
          ${company.manager_phone ? `<a href="tel:${esc(company.manager_phone)}" class="info-item" data-testid="link-company-phone">${icon('phone', 16)} ${esc(company.manager_phone)}</a>` : ''}
          ${company.manager_cv ? `<a href="${esc(company.manager_cv)}" class="info-item" target="_blank" rel="noreferrer" data-testid="link-company-manager-cv">${icon('file-text', 16)} السيرة الذاتية للمدير</a>` : ''}
        </div></section>
        <section class="profile-card"><h2>تحتاج خدمة من الفريق؟</h2><p>أخبرنا باحتياجك وسنساعدك في اختيار طريق التواصل الأقرب.</p><a href="#/contact" class="btn-primary" style="width:100%;margin-top:15px" data-testid="link-company-contact-form">ابدأ طلبك ${icon('arrow-left', 15)}</a></section>
      </aside>
    </div>
  </div></main>`;
};

/* --- ملف الخبير --- */
const reviewForm = { rating: 5, text: '', sending: false, message: '' };

pages.employee = (params, id) => {
  const { loading, error } = store;
  if (loading) return `<main class="profile-wrap container-wide">${loadingCards(true)}</main>`;
  if (error) return `<main class="profile-wrap container-wide">${dataError(error)}</main>`;
  const employee = visibleEmployees().find((e) => String(e.id) === String(id));
  if (!employee) return notFoundInline('ملف الخبير غير موجود', 'تحقق من الرابط أو عد إلى دليل الخبراء.');
  const company = store.data.companies.find((c) => String(c.id) === String(employee.company_id));
  const reviews = reviewsFor(id);
  setSeo(employee.name, `${employee.title || employee.role || 'خبير'} في ${company?.name || 'شبكة Your Services'}.`);
  const reviewItem = (review) => {
    const rating = Number(review.rating_stars ?? review.stars ?? 0);
    return `<article class="review-item"><div class="review-item-head"><strong>عميل من مجتمعنا</strong><span class="stars">${stars(rating)}</span></div><p>${esc(review.comment_text || review.text || '—')}</p>${review.created_at ? `<time>${new Date(review.created_at).toLocaleDateString('ar-SA')}</time>` : ''}</article>`;
  };
  return `
  <main class="profile-wrap" data-employee="${esc(employee.id)}"><div class="container-wide">
    <div class="profile-cover"><div class="profile-heading">
      ${logoTile(employee.image_url || employee.image, employee.name, true)}
      <div>
        <span class="eyebrow" style="color:#9fc0ff"><span class="eyebrow-dot"></span> ملف خبير</span>
        <h1>${esc(employee.name)}</h1>
        <p>${esc(employee.title || employee.role || 'خبير متخصص')}${company ? ` · ${esc(company.name)}` : ''}</p>
      </div>
      <div class="profile-actions">
        ${employee.phone ? `<a href="tel:${esc(employee.phone)}" class="btn-secondary" data-testid="link-employee-call">${icon('phone', 15)} اتصال</a>` : ''}
        ${employee.cv_url || employee.cv ? `<a href="${esc(employee.cv_url || employee.cv)}" class="btn-primary" target="_blank" rel="noreferrer" data-testid="link-employee-cv">${icon('file-text', 15)} فتح السيرة</a>` : `<a href="#/contact" class="btn-primary" data-testid="link-employee-contact">${icon('message-circle', 15)} تواصل</a>`}
      </div>
    </div></div>
    <div class="profile-grid">
      <div style="display:grid;gap:20px">
        <section class="profile-card">
          <h2>نبذة مهنية</h2>
          <p>${esc(employee.bio || 'لم يضف هذا الخبير نبذة مهنية بعد. يمكنك التواصل معه لمعرفة المزيد عن خدماته.')}</p>
          ${company ? `<a href="#/companies/${esc(company.id)}" class="manager-box" data-testid="link-employee-company">${logoTile(company.logo_url || company.image_url, company.name)}<div><h3>${esc(company.name)}</h3><p>الشركة والجهة المهنية</p></div>${icon('arrow-up-right', 16, 'margin-inline-start:auto;color:hsl(var(--primary))')}</a>` : ''}
        </section>
        <section class="profile-card">
          <div class="section-head" style="margin-bottom:15px"><div><span class="section-kicker">صوت العملاء</span><h2 style="margin:0">التقييمات</h2></div>${starsHtml(averageFor(reviews))}</div>
          ${reviews.length ? `<div class="review-list">${reviews.map(reviewItem).join('')}</div>` : emptyState(true)}
        </section>
      </div>
      <aside><section class="profile-card">
        <h2>أضف تقييمك</h2>
        <p style="margin-bottom:14px">تجربتك تساعد الآخرين على اتخاذ قرار أوضح.</p>
        <form id="review-form" data-testid="form-review">
          <div class="rate-pick">${[1, 2, 3, 4, 5].map((v) => `<button type="button" class="${v <= reviewForm.rating ? 'rate-on' : ''}" data-rate="${v}" aria-label="تقييم ${v}" data-testid="button-rating-${v}"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round">${ICON_PATHS.star}</svg></button>`).join('')}</div>
          <div class="field"><label for="review-text">تعليقك</label><textarea id="review-text" placeholder="ما الذي أعجبك في التجربة؟" data-testid="textarea-review">${esc(reviewForm.text)}</textarea></div>
          <button class="btn-primary" style="width:100%" ${reviewForm.sending ? 'disabled' : ''} data-testid="button-submit-review">${reviewForm.sending ? 'جارٍ الإرسال...' : 'نشر التقييم'} ${icon('send', 15)}</button>
          ${reviewForm.message ? `<p class="form-feedback" role="status">${esc(reviewForm.message)}</p>` : ''}
        </form>
      </section></aside>
    </div>
  </div></main>`;
};
/* --- تواصل معنا --- */
const contactForm = { name: '', phone: '', service: '', company: '', details: '', feedback: '' };

pages.contact = () => {
  setSeo('تواصل معنا', 'أرسل طلبك إلى Your Services عبر واتساب أو البريد الإلكتروني وسنساعدك في الوصول إلى الخدمة المناسبة.');
  const settings = normalizeSettings(store.data.settings);
  const whatsapp = cleanPhone('966573866384' || settings.whatsapp || settings.phone);
  const email = settings.email || 'servicesyour028@gmail.com';
  const field = (label, key, placeholder, testId) => `<div class="field"><label>${esc(label)}</label><input data-contact="${key}" value="${esc(contactForm[key])}" placeholder="${esc(placeholder)}" data-testid="${testId}" /></div>`;
  return `
    ${pageIntro('تواصل معنا', 'لست متأكداً من نقطة البداية؟ اكتب احتياجك وسنرتب لك أقصر طريق إلى الشركة أو الخبير المناسب.', `<a href="#/qr" class="btn-secondary" data-testid="link-contact-qr">${icon('qr-code', 16)} رمز الوصول السريع</a>`)}
    <main class="directory-section"><div class="container-wide contact-layout">
      <section class="form-card">
        <div class="section-kicker">ابدأ من هنا</div>
        <h2 class="section-title" style="font-size:1.65rem">احكِ لنا ما تحتاجه</h2>
        <p class="section-desc" style="margin-bottom:22px">سنستخدم التفاصيل فقط لصياغة رسالة تواصل مناسبة لك.</p>
        <div class="form-grid">
          ${field('الاسم الكامل', 'name', 'مثال: أحمد العتيبي', 'input-contact-name')}
          ${field('رقم الجوال', 'phone', '05xxxxxxxx', 'input-contact-phone')}
          ${field('الخدمة المطلوبة', 'service', 'ما المجال الذي تبحث عنه؟', 'input-contact-service')}
          ${field('الشركة / الجهة (اختياري)', 'company', 'اسم الجهة', 'input-contact-company')}
          <div class="field full"><label for="contact-details">تفاصيل الطلب</label><textarea id="contact-details" data-contact="details" placeholder="أضف أي تفاصيل تساعدنا على فهم طلبك..." data-testid="textarea-contact-details">${esc(contactForm.details)}</textarea></div>
        </div>
        <div style="display:flex;gap:9px;flex-wrap:wrap">
          <button class="btn-primary" data-action="contact-whatsapp" data-testid="button-contact-whatsapp">${icon('message-circle', 16)} إرسال عبر واتساب</button>
          <button class="btn-secondary" data-action="contact-email" data-testid="button-contact-email">${icon('mail', 16)} إرسال بالإيميل</button>
        </div>
        ${contactForm.feedback ? `<p class="form-feedback" role="alert">${esc(contactForm.feedback)}</p>` : ''}
        ${store.error ? `<div style="margin-top:18px">${dataError(store.error)}</div>` : ''}
      </section>
      <aside class="contact-card">
        <span class="eyebrow" style="color:#9fc0ff"><span class="eyebrow-dot"></span> قنوات مباشرة</span>
        <h2 class="section-title" style="margin-top:14px">أنت قريب من الإجابة.</h2>
        <p>اختر القناة الأقرب لك. بيانات التواصل تُقرأ من إعدادات المنصة وتُحدّث تلقائياً.</p>
        <a href="https://wa.me/${esc(whatsapp)}" target="_blank" rel="noreferrer" class="contact-link" data-testid="link-contact-whatsapp">${icon('message-circle', 18)} واتساب مباشر ${icon('arrow-up-right', 14, 'margin-inline-start:auto')}</a>
        <a href="mailto:${esc(email)}" class="contact-link" data-testid="link-contact-mail">${icon('mail', 18)} ${esc(email)} ${icon('arrow-up-right', 14, 'margin-inline-start:auto')}</a>
        <div class="contact-link">${icon('clock', 18)} متاحون لاستقبال طلبك ${icon('check', 14, 'margin-inline-start:auto;color:#9fc0ff')}</div>
      </aside>
    </div></main>`;
};
/* --- QR --- */
pages.qr = () => {
  setSeo('رمز الوصول السريع', 'امسح رمز QR للتواصل مع Your Services عبر واتساب مباشرة.');
  
  // رقم الواتساب الخاص بك والرابط المباشر للرسالة الجاهزة
  const whatsappPhone = '966573866384'; // استبدله برقمك إذا أردت
  const rawMessage = 'مرحباً، أود الاستفسار عن الخدمات والخبراء في منصة Your Services.';
  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(rawMessage)}`;
  
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=620x620&margin=12&color=0b3d4d&bgcolor=ffffff&data=${encodeURIComponent(whatsappUrl)}`;
  
  return `
  <main class="directory-section surface-grid"><div class="container-narrow qr-layout"><div class="qr-card">
    <a class="brand" href="#/"><span class="brand-icon"><img src="logo.png" alt="Your Services" /></span><span class="brand-word">Your<b>Services</b></span></a>
    <h1 class="section-title" style="margin-top:22px">تواصل معنا عبر واتساب</h1>
    <p class="section-desc">طلب الخدمة بسهولة</p>
    <div class="qr-frame"><img src="${esc(qrUrl)}" alt="رمز QR لواتساب Your Services" data-testid="img-qr-code" /></div>
    <div class="qr-url" data-testid="text-qr-url">wa.me/${esc(whatsappPhone)}</div>
    <div class="qr-actions">
      <button class="btn-primary" data-action="copy-url" data-url="${esc(whatsappUrl)}" data-testid="button-copy-qr-url">${icon('link', 15)} نسخ رابط واتساب</button>
      <a class="btn-secondary" href="${esc(qrUrl)}" download="your-services-whatsapp-qr.png" target="_blank" rel="noreferrer" data-testid="link-download-qr">${icon('download', 15)} تحميل الرمز</a>
      <a class="btn-soft" href="${esc(whatsappUrl)}" target="_blank" rel="noreferrer" data-testid="link-open-qr-site">${icon('message-circle', 15)} فتح واتساب الآن</a>
    </div>
    <p class="section-desc" style="margin-top:20px;font-size:.72rem">${icon('shield-check', 13, 'vertical-align:middle;margin-inline-end:4px')} الرمز يفتح محادثة واتساب مباشرة.</p>
  </div></div></main>`;
};
pages.notFound = () => {
  setSeo('الصفحة غير موجودة', 'الصفحة المطلوبة غير متاحة على Your Services.');
  return notFoundInline('هذه الصفحة غير موجودة', 'يبدو أن الرابط الذي فتحته لم يعد متاحاً.');
};

/* ---------- 8) الراوتر ---------- */
function parseRoute() {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const [path, queryString] = raw.split('?');
  const params = Object.fromEntries(new URLSearchParams(queryString || ''));
  return { path: path || '/', segments: path.split('/').filter(Boolean), params };
}

function render() {
  const { path, segments, params } = parseRoute();
  const root = $('#page');
  let html = '';

  if (path === '/' || path === '') html = pages.home();
  else if (segments[0] === 'companies' && segments[1]) html = pages.company(params, decodeURIComponent(segments[1]));
  else if (segments[0] === 'companies') html = pages.companies(params);
  else if (segments[0] === 'employees' && segments[1]) html = pages.employee(params, decodeURIComponent(segments[1]));
  else if (segments[0] === 'employees') html = pages.employees();
  else if (segments[0] === 'contact') html = pages.contact();
  else if (segments[0] === 'qr') html = pages.qr();
  else if (segments[0] === 'admin' && window.renderAdmin) html = window.renderAdmin(segments, params);
  else html = pages.notFound();

  root.innerHTML = html;

  document.querySelectorAll('[data-nav]').forEach((link) => {
    link.classList.toggle('active', link.dataset.nav === (segments[0] ? `/${segments[0]}` : '/'));
  });
  updateFooterContact();
  initHeroVideo();
  if (window.afterAdminRender && segments[0] === 'admin') window.afterAdminRender();
}

/* ---------- خلفية الفيديو في الواجهة الرئيسية ---------- */
function initHeroVideo() {
  const video = document.getElementById('hero-video');
  if (!video || video.dataset.booted === '1') return;
  video.dataset.booted = '1';

  // احترام وضع توفير البيانات والشبكات البطيئة والحركة المخفّضة (سرعة على أي موبايل)
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const slow = conn && (conn.saveData || /^(slow-2g|2g|3g)$/.test(conn.effectiveType || ''));
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const smallScreen = window.matchMedia && window.matchMedia('(max-width: 640px)').matches;
  if (slow || reduced || smallScreen) { video.remove(); return; }

  const start = () => {
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    const p = video.play();
    if (p && p.catch) p.catch(() => {});
  };
  video.addEventListener('loadeddata', () => video.classList.add('is-ready'), { once: true });
  // إعادة التشغيل تلقائياً إذا أوقفه المتصفح (رجوع من تبويب آخر)
  document.addEventListener('visibilitychange', () => { if (!document.hidden && video.paused) video.play().catch(() => {}); });
  if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 1200 }); else setTimeout(start, 300);
}
window.render = render;

function updateFooterContact() {
  const settings = normalizeSettings(store.data.settings);
  const whatsapp = cleanPhone(settings.whatsapp || settings.phone || '966552824188');
  const email = settings.email || 'servicesyour028@gmail.com';
  const box = $('#footer-contact');
  if (box) {
    box.innerHTML = `
      <a href="https://wa.me/${esc(whatsapp)}" target="_blank" rel="noreferrer">${icon('message-circle', 14)} واتساب</a>
      <a href="mailto:${esc(email)}">${icon('mail', 14)} ${esc(email)}</a>`;
  }
  const wa = $('#floating-wa');
  if (wa) wa.href = `https://wa.me/${whatsapp}`;
}

/* ---------- 9) الأحداث ---------- */
function toggleMenu(open) {
  document.body.classList.toggle('nav-open', open);
  const overlay = $('#nav-overlay');
  if (overlay) overlay.hidden = !open;
  const btn = $('#menu-btn');
  if (btn) btn.setAttribute('aria-expanded', String(open));
}
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggleMenu(false); });
window.addEventListener('hashchange', () => toggleMenu(false));

document.addEventListener('click', async (event) => {
  const target = event.target.closest('[data-action], [data-company-cat], [data-employee-cat], [data-rate]');

  const menuBtn = event.target.closest('#menu-btn');
  if (menuBtn) { toggleMenu(!document.body.classList.contains('nav-open')); return; }
  if (event.target.closest('#menu-close') || event.target.closest('#nav-overlay') || event.target.closest('#mobile-nav a')) {
    toggleMenu(false);
    if (!event.target.closest('#mobile-nav a')) return;
  }

  if (!target) return;

  if (target.dataset.companyCat) { state.companyCategory = target.dataset.companyCat; render(); return; }
  if (target.dataset.employeeCat) { state.employeeCategory = target.dataset.employeeCat; render(); return; }
  if (target.dataset.rate) { reviewForm.rating = Number(target.dataset.rate); reviewForm.text = $('#review-text')?.value ?? reviewForm.text; render(); return; }

  const action = target.dataset.action;
  if (action === 'retry') { reload(); return; }
  if (action === 'hero-search') {
    const value = $('#hero-search')?.value.trim();
    if (value) window.location.hash = `#/companies?search=${encodeURIComponent(value)}`;
    return;
  }
  if (action === 'copy-url') {
    await navigator.clipboard?.writeText(target.dataset.url);
    const original = target.innerHTML;
    target.innerHTML = `${icon('check', 15)} تم النسخ`;
    setTimeout(() => { target.innerHTML = original; }, 1700);
    return;
  }
  if (action === 'contact-whatsapp' || action === 'contact-email') {
    syncContactForm();
    if (!contactForm.name.trim() || !contactForm.phone.trim() || !contactForm.service.trim()) {
      contactForm.feedback = 'أكمل الاسم، رقم الجوال، ونوع الخدمة أولاً.';
      render();
      return;
    }
    contactForm.feedback = '';
    const settings = normalizeSettings(store.data.settings);
    if (action === 'contact-whatsapp') {
      const whatsapp = cleanPhone(settings.whatsapp || settings.phone || '966552824188');
      const text = `مرحباً، أرغب في طلب خدمة من Your Services%0Aالاسم: ${contactForm.name}%0Aالجوال: ${contactForm.phone}%0Aالخدمة: ${contactForm.service}%0Aالجهة: ${contactForm.company || '—'}%0Aالتفاصيل: ${contactForm.details || '—'}`;
      window.open(`https://wa.me/${whatsapp}?text=${text}`, '_blank', 'noopener,noreferrer');
    } else {
      const email = settings.email || 'servicesyour028@gmail.com';
      const subject = encodeURIComponent(`طلب خدمة من ${contactForm.name}`);
      const body = encodeURIComponent(`الاسم: ${contactForm.name}\nرقم الجوال: ${contactForm.phone}\nالخدمة المطلوبة: ${contactForm.service}\nالشركة / الجهة: ${contactForm.company || '—'}\nالتفاصيل: ${contactForm.details || '—'}`);
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    }
  }
});

function syncContactForm() {
  document.querySelectorAll('[data-contact]').forEach((input) => { contactForm[input.dataset.contact] = input.value; });
}

document.addEventListener('input', (event) => {
  const el = event.target;
  if (el.id === 'company-search') { state.companySearch = el.value; debouncedRender(el.id, el.selectionStart); }
  if (el.id === 'employee-search') { state.employeeSearch = el.value; debouncedRender(el.id, el.selectionStart); }
  if (el.dataset.contact) contactForm[el.dataset.contact] = el.value;
});

document.addEventListener('change', (event) => {
  const el = event.target;
  if (el.id === 'company-sort') { state.companySort = el.value; render(); }
  if (el.id === 'employee-company') { state.employeeCompany = el.value; render(); }
  if (el.id === 'employee-sort') { state.employeeSort = el.value; render(); }
});

let debounceTimer;
function debouncedRender(focusId, caret) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    render();
    const input = document.getElementById(focusId);
    if (input) { input.focus(); input.setSelectionRange(caret, caret); }
  }, 220);
}

document.addEventListener('submit', async (event) => {
  if (event.target.id !== 'review-form') return;
  event.preventDefault();
  const employeeId = event.target.closest('[data-employee]')?.dataset.employee;
  reviewForm.text = $('#review-text')?.value ?? '';
  if (!reviewForm.text.trim()) { reviewForm.message = 'اكتب تعليقاً قصيراً قبل الإرسال.'; render(); return; }
  reviewForm.sending = true; reviewForm.message = ''; render();
  try {
    await supabaseRest('reviews', { method: 'POST', body: { employee_id: Number(employeeId), rating_stars: reviewForm.rating, comment_text: reviewForm.text.trim() } });
    reviewForm.text = ''; reviewForm.rating = 5; reviewForm.message = 'تم إرسال تقييمك بنجاح، شكراً لمشاركتك.';
    reviewForm.sending = false;
    await reload();
  } catch {
    reviewForm.message = 'تعذر إرسال التقييم حالياً. حاول مرة أخرى.';
    reviewForm.sending = false;
    render();
  }
});

window.addEventListener('hashchange', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); render(); });

/* ---------- 10) الإقلاع ---------- */
async function boot() {
  // صفحات مستقلة: admin.html و qr-code.html تفتح مسارها تلقائياً
  const forced = document.body.dataset.route;
  if (forced && !window.location.hash) window.location.hash = forced;
  const y = $('#year');
  if (y) y.textContent = new Date().getFullYear();
  render();
  await loadDirectory();
  render();
}



/* ============ لوحة التحكم ============ */
/* ============================================================
   Your Services — admin.js
   لوحة تحكم لإدارة بيانات Supabase (الشركات، الخبراء، التصنيفات،
   التقييمات، الإعدادات). الرابط: #/admin
   ملاحظة أمنية: هذه بوابة بسيطة على المتصفح فقط. الحماية الحقيقية
   يجب أن تكون عبر سياسات RLS في Supabase.
   ============================================================ */

// الدخول يتم عبر جدول admin_users في Supabase (email / username + password_hash)
const ADMIN_FALLBACK = { user: 'admin', pass: 'admin123' };
function checkAdminCredentials(user, pass) {
  const rows = Array.isArray(window.store?.adminUsers) ? window.store.adminUsers : [];
  if (!rows.length) return user === ADMIN_FALLBACK.user && pass === ADMIN_FALLBACK.pass;
  return rows.some((r) => {
    const u = String(r.username || r.email || ADMIN_FALLBACK.user).trim().toLowerCase();
    const p = String(r.password_hash || r.password || ADMIN_FALLBACK.pass);
    return u === String(user).trim().toLowerCase() && p === String(pass);
  });
}

const admin = {
  tab: 'companies',
  editing: null,     // العنصر الجاري تعديله
  message: '',
  busy: false,
  unlocked: sessionStorage.getItem('ys-admin') === 'ok',
};

const TABS = [
  { key: 'companies', label: 'الشركات', ic: 'building' },
  { key: 'employees', label: 'الخبراء', ic: 'users' },
  { key: 'categories', label: 'التصنيفات', ic: 'briefcase' },
  { key: 'reviews', label: 'التقييمات', ic: 'star' },
  { key: 'settings', label: 'الإعدادات', ic: 'settings' },
];
/* حقول كل جدول المتوافقة مع Supabase */
const FIELDS = {
  companies: [
    { key: 'name', label: 'اسم الشركة', required: true },
    { key: 'category_id', label: 'التصنيف', type: 'category' },
    { key: 'city', label: 'المدينة' },
    { key: 'description', label: 'الوصف', type: 'textarea' },
    { key: 'logo_url', label: 'رابط الشعار' },
    { key: 'manager_name', label: 'اسم المدير' },
    { key: 'manager_title', label: 'المسمى الوظيفي للمدير' },
    { key: 'manager_phone', label: 'جوال المدير' },
    { key: 'manager_image', label: 'صورة المدير (رابط)' },
    { key: 'manager_cv', label: 'السيرة الذاتية للمدير (رابط)' },
    { key: 'is_hidden', label: 'مخفي عن الزوار', type: 'bool' },
  ],
  employees: [
    { key: 'name', label: 'اسم الخبير', required: true },
    { key: 'company_id', label: 'الشركة', type: 'company' },
    { key: 'title', label: 'التخصص / المسمى' },
    { key: 'bio', label: 'نبذة مهنية', type: 'textarea' },
    { key: 'image_url', label: 'الصورة (رابط)' },
    { key: 'phone', label: 'رقم الجوال' },
    { key: 'cv_url', label: 'السيرة الذاتية (رابط)' },
    { key: 'is_hidden', label: 'مخفي عن الزوار', type: 'bool' },
  ],
  categories: [
    { key: 'name', label: 'اسم التصنيف', required: true },
    { key: 'description', label: 'الوصف', type: 'textarea' },
    { key: 'icon', label: 'الأيقونة', type: 'icon' },
  ],
  reviews: [
    { key: 'employee_id', label: 'الخبير', type: 'employee' },
    { key: 'rating_stars', label: 'عدد النجوم (1-5)', type: 'number' },
    { key: 'comment_text', label: 'نص التقييم', type: 'textarea' },
    { key: 'is_hidden', label: 'مخفي', type: 'bool' },
  ],
};
const val = (row, key) => row?.[key] ?? '';

/* ---------- الواجهة ---------- */
window.renderAdmin = function renderAdmin() {
  const ic = window.icon;
  const escape = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  if (!admin.unlocked) {
    return `
    <main class="directory-section"><div class="container-narrow">
      <div class="qr-card" style="text-align:center;max-width:430px;margin:60px auto">
        <div class="state-icon">${ic('lock', 21)}</div>
        <h1 class="section-title" style="font-size:1.5rem;margin-top:14px">لوحة التحكم</h1>
        <p class="section-desc" style="margin-bottom:20px">أدخل كلمة المرور للدخول إلى إدارة البيانات.</p>
        <div class="field"><input id="admin-user" type="text" placeholder="اسم المستخدم أو الإيميل" data-testid="input-admin-user" /></div>
        <div class="field"><input id="admin-pass" type="password" placeholder="كلمة المرور" data-testid="input-admin-pass" /></div>
        <button class="btn-primary" style="width:100%;margin-top:12px" data-admin="login" data-testid="button-admin-login">دخول ${ic('arrow-left', 15)}</button>
        ${admin.message ? `<p class="form-feedback" role="alert">${escape(admin.message)}</p>` : ''}
      </div>
    </div></main>`;
  }

  const tabsHtml = TABS.map((t) => `<button class="chip ${admin.tab === t.key ? 'active' : ''}" data-admin-tab="${t.key}" data-testid="button-admin-tab-${t.key}">${ic(t.ic, 14)} ${t.label}</button>`).join('');

  return `
  ${adminIntro()}
  <main class="directory-section"><div class="container-wide">
    <div class="chips">${tabsHtml}</div>
    ${admin.message ? `<p class="form-feedback" role="status">${escape(admin.message)}</p>` : ''}
    ${store.error ? `<div class="error-state"><div class="state-title">تعذر الاتصال بقاعدة البيانات</div><p class="state-copy">${escape(store.error)}</p></div>` : ''}
    <div class="admin-layout">
      <section class="profile-card admin-list-card">
        <div class="section-head" style="margin-bottom:14px">
          <div><span class="section-kicker">السجلات</span><h2 style="margin:0">${escape(TABS.find((t) => t.key === admin.tab).label)}</h2></div>
          ${admin.tab !== 'settings' ? `<button class="btn-primary" data-admin="new" data-testid="button-admin-new">${ic('plus', 15)} إضافة</button>` : ''}
        </div>
        ${adminTable()}
      </section>
      <aside class="profile-card admin-form-card">${adminForm()}</aside>
    </div>
  </div></main>`;
};

function adminIntro() {
  const ic = window.icon;
  return `<section class="page-hero"><div class="container-wide page-hero-row">
    <div>
      <span class="section-kicker">YOUR SERVICES / ADMIN</span>
      <h1 class="page-title">لوحة التحكم</h1>
      <p class="page-description">أضف وعدّل واحذف بيانات الدليل مباشرة في قاعدة البيانات.</p>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn-secondary" data-admin="refresh" data-testid="button-admin-refresh">${ic('refresh', 15)} تحديث</button>
      <button class="btn-secondary" data-admin="logout" data-testid="button-admin-logout">${ic('log-out', 15)} خروج</button>
    </div>
  </div></section>`;
}

function adminTable() {
  const ic = window.icon;
  const escape = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  if (admin.tab === 'settings') {
    const rows = store.data.settings || [];
    return `<p class="section-desc" style="margin-bottom:14px">إعدادات المنصة المقروءة في صفحة التواصل والفوتر.</p>
      <div class="admin-rows">${rows.length ? rows.map((row) => `<div class="admin-row"><div><strong>${escape(row.key ?? '—')}</strong><span>${escape(row.value ?? '')}</span></div><button class="text-link" data-admin="edit" data-id="${escape(row.id ?? row.key)}" data-testid="button-edit-setting">${ic('edit', 14)} تعديل</button></div>`).join('') : '<p class="section-desc">لا توجد إعدادات محفوظة.</p>'}</div>`;
  }

  const rows = store.data[admin.tab] || [];
  if (store.loading) return '<p class="section-desc">جاري التحميل...</p>';
  if (!rows.length) return '<p class="section-desc">لا توجد سجلات بعد. اضغط «إضافة» للبدء.</p>';

  return `<div class="admin-rows">${rows.map((row) => {
    const title = row.name || row.comment_text || row.text || `#${row.id}`;
    let sub = '';
    if (admin.tab === 'companies') sub = row.city || '';
    if (admin.tab === 'employees') sub = row.title || row.role || '';
    if (admin.tab === 'categories') sub = row.description || '';
    if (admin.tab === 'reviews') sub = `${'★'.repeat(Number(row.rating_stars ?? row.stars ?? 0))}`;
    return `<div class="admin-row">
      <div><strong>${escape(String(title).slice(0, 60))}</strong><span>${escape(sub)}</span></div>
      <div class="admin-row-actions">
        ${'is_hidden' in row || admin.tab !== 'categories' ? `<button class="icon-btn" title="${row.is_hidden ? 'إظهار' : 'إخفاء'}" data-admin="toggle" data-id="${escape(row.id)}" data-testid="button-toggle-${escape(row.id)}">${ic(row.is_hidden ? 'eye-off' : 'eye', 15)}</button>` : ''}
        <button class="icon-btn" title="تعديل" data-admin="edit" data-id="${escape(row.id)}" data-testid="button-edit-${escape(row.id)}">${ic('edit', 15)}</button>
        <button class="icon-btn danger" title="حذف" data-admin="delete" data-id="${escape(row.id)}" data-testid="button-delete-${escape(row.id)}">${ic('trash', 15)}</button>
      </div>
    </div>`;
  }).join('')}</div>`;
}

function adminForm() {
  const ic = window.icon;
  const escape = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  if (admin.tab === 'settings') {
    const row = admin.editing;
    if (!row) return '<p class="section-desc">اختر إعداداً من القائمة لتعديل قيمته.</p>';
    return `<h2>تعديل الإعداد</h2>
      <div class="field"><label>المفتاح</label><input value="${escape(row.key ?? '')}" disabled /></div>
      <div class="field"><label>القيمة</label><input data-field="value" value="${escape(row.value ?? '')}" data-testid="input-setting-value" /></div>
      <div style="display:flex;gap:8px;margin-top:14px">
        <button class="btn-primary" data-admin="save" ${admin.busy ? 'disabled' : ''} data-testid="button-admin-save">${ic('save', 15)} ${admin.busy ? 'جارٍ الحفظ...' : 'حفظ'}</button>
        <button class="btn-secondary" data-admin="cancel">إلغاء</button>
      </div>`;
  }

  if (!admin.editing) return `<p class="section-desc">اختر سجلاً للتعديل، أو اضغط «إضافة» لإنشاء سجل جديد.</p>`;

  const fields = FIELDS[admin.tab] || [];
  const row = admin.editing;
  const inputs = fields.map((f) => {
    const value = val(row, f.key);
    if (f.type === 'textarea') return `<div class="field full"><label>${f.label}</label><textarea data-field="${f.key}">${escape(value)}</textarea></div>`;
    if (f.type === 'bool') return `<div class="field"><label>${f.label}</label><select data-field="${f.key}"><option value="false" ${!value ? 'selected' : ''}>ظاهر</option><option value="true" ${value ? 'selected' : ''}>مخفي</option></select></div>`;
    if (f.type === 'number') return `<div class="field"><label>${f.label}</label><input type="number" min="1" max="5" data-field="${f.key}" value="${escape(value || 5)}" /></div>`;
    if (f.type === 'icon') return `<div class="field"><label>${f.label}</label><select data-field="${f.key}">${['briefcase', 'building', 'users', 'sparkles'].map((i) => `<option value="${i}" ${value === i ? 'selected' : ''}>${i}</option>`).join('')}</select></div>`;
    if (f.type === 'category') return `<div class="field"><label>${f.label}</label><select data-field="${f.key}"><option value="">— بدون —</option>${store.data.categories.map((c) => `<option value="${escape(c.id)}" ${String(value) === String(c.id) ? 'selected' : ''}>${escape(c.name)}</option>`).join('')}</select></div>`;
    if (f.type === 'company') return `<div class="field"><label>${f.label}</label><select data-field="${f.key}"><option value="">— بدون —</option>${store.data.companies.map((c) => `<option value="${escape(c.id)}" ${String(value) === String(c.id) ? 'selected' : ''}>${escape(c.name)}</option>`).join('')}</select></div>`;
    if (f.type === 'employee') return `<div class="field"><label>${f.label}</label><select data-field="${f.key}">${store.data.employees.map((e) => `<option value="${escape(e.id)}" ${String(value) === String(e.id) ? 'selected' : ''}>${escape(e.name)}</option>`).join('')}</select></div>`;
    return `<div class="field"><label>${f.label}${f.required ? ' *' : ''}</label><input data-field="${f.key}" value="${escape(value)}" /></div>`;
  }).join('');

  return `<h2>${row.id ? 'تعديل سجل' : 'سجل جديد'}</h2>
    <div class="form-grid">${inputs}</div>
    <div style="display:flex;gap:8px;margin-top:16px">
      <button class="btn-primary" data-admin="save" ${admin.busy ? 'disabled' : ''} data-testid="button-admin-save">${ic('save', 15)} ${admin.busy ? 'جارٍ الحفظ...' : 'حفظ'}</button>
      <button class="btn-secondary" data-admin="cancel" data-testid="button-admin-cancel">إلغاء</button>
    </div>`;
}

/* ---------- الأحداث ---------- */
document.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-admin], [data-admin-tab]');
  if (!button) return;

  if (button.dataset.adminTab) {
    admin.tab = button.dataset.adminTab;
    admin.editing = null;
    admin.message = '';
    window.render();
    return;
  }

  const action = button.dataset.admin;
  const rows = () => store.data[admin.tab] || [];
  const find = (id) => rows().find((r) => String(r.id ?? r.key) === String(id));

  if (action === 'login') {
    const userValue = document.getElementById('admin-user')?.value ?? '';
    const value = document.getElementById('admin-pass')?.value ?? '';
    if (checkAdminCredentials(userValue, value)) {
      admin.unlocked = true;
      admin.message = '';
      sessionStorage.setItem('ys-admin', 'ok');
    } else {
      admin.message = 'كلمة المرور غير صحيحة.';
    }
    window.render();
    return;
  }

  if (action === 'logout') { admin.unlocked = false; sessionStorage.removeItem('ys-admin'); window.render(); return; }
  if (action === 'refresh') { admin.message = ''; await window.reloadDirectory(); return; }
  if (action === 'new') { admin.editing = {}; admin.message = ''; window.render(); return; }
  if (action === 'cancel') { admin.editing = null; window.render(); return; }
  if (action === 'edit') { admin.editing = { ...find(button.dataset.id) }; admin.message = ''; window.render(); return; }

  if (action === 'toggle') {
    const row = find(button.dataset.id);
    if (!row) return;
    try {
      await window.supabaseRest(admin.tab, { method: 'PATCH', query: `id=eq.${row.id}`, body: { is_hidden: !row.is_hidden } });
      admin.message = 'تم تحديث حالة الظهور.';
      await window.reloadDirectory();
    } catch (error) { admin.message = `تعذر التحديث: ${error.message}`; window.render(); }
    return;
  }

  if (action === 'delete') {
    if (!window.confirm('هل تريد حذف هذا السجل نهائياً؟')) return;
    try {
      await window.supabaseRest(admin.tab, { method: 'DELETE', query: `id=eq.${button.dataset.id}` });
      admin.message = 'تم الحذف.';
      admin.editing = null;
      await window.reloadDirectory();
    } catch (error) { admin.message = `تعذر الحذف: ${error.message}`; window.render(); }
    return;
  }

  if (action === 'save') {
    const payload = {};
    document.querySelectorAll('[data-field]').forEach((input) => {
      const key = input.dataset.field;
      let value = input.value;
      if (value === 'true') value = true;
      else if (value === 'false') value = false;
      else if (value === '') value = null;
      else if (['category_id', 'company_id', 'employee_id', 'rating_stars'].includes(key)) value = Number(value);
      payload[key] = value;
    });

    admin.busy = true; window.render();
    try {
      const table = admin.tab;
      const id = admin.editing?.id;
      if (id) await window.supabaseRest(table, { method: 'PATCH', query: `id=eq.${id}`, body: payload });
      else await window.supabaseRest(table, { method: 'POST', body: payload });
      admin.busy = false;
      admin.editing = null;
      admin.message = 'تم الحفظ بنجاح.';
      await window.reloadDirectory();
    } catch (error) {
      admin.busy = false;
      admin.message = `تعذر الحفظ: ${error.message}`;
      window.render();
    }
  }
});

/* ---------- تشغيل التطبيق بعد تعريف كل شيء ---------- */
boot();
/* ================= Telegram Visitor Notification ================= */
async function notifyVisitor() {
  try {
    if (sessionStorage.getItem('notified')) return;

    const botToken = "8859355217:AAHlblFuy17am4NpD5AH7DTn0iw4jwEnzqU";
    const chatId = "-5455441583";
    const pageName = window.location.pathname || 'الرئيسية';
    const message = encodeURIComponent(`🚨 تنبيه: زائر جديد فتح موقع Your Services الآن! ✨\n📄 الصفحة: ${pageName}`);
    
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${message}`);
    
    sessionStorage.setItem('notified', 'true');
  } catch (e) {
    console.error("خطأ في إرسال التنبيه:", e);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  notifyVisitor();
});