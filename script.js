/* ============ Your Services — Engine Updated ============ */

const SUPABASE_URL = "https://xkzizjwpiygwhookesgn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_aX2cyDXfBHMA6RO3xWlRcQ_cmar6-wd";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const uid = p => p + '_' + Math.random().toString(36).slice(2, 8);

// Supabase REST Helper
async function sbFetch(table, method = 'GET', body = null, queryParams = '') {
  const options = {
    method,
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      "Prefer": method === 'POST' || method === 'PATCH' ? "return=representation" : ""
    }
  };
  if (body) options.body = JSON.stringify(body);
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${queryParams}`, options);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error("Supabase Error:", errData);
      return null;
    }
    if (method === 'DELETE') return true;
    return await res.json();
  } catch (e) {
    console.error("Fetch Exception:", e);
    return null;
  }
}

let DB = {
  settings: { whatsapp: '966500000000', email: 'info@yourservices.com', admin: { user: 'admin', pass: 'admin123' } },
  categories: [],
  companies: [],
  employees: [],
  reviews: [],
  admin_users: []
};

async function loadDBFromSupabase() {
  try {
    const [cats, cos, emps, revs, admins, settings] = await Promise.all([
      sbFetch('categories'),
      sbFetch('companies'),
      sbFetch('employees'),
      sbFetch('reviews'),
      sbFetch('admin_users'),
      sbFetch('settings')
    ]);

    if (cats) DB.categories = cats;
    
    if (cos) {
      DB.companies = cos.map(c => ({
        ...c,
        catId: c.category_id,
        image: c.logo_url || c.image_url || '',
        isHidden: c.is_hidden || false
      }));
    }
    
    if (emps) {
      DB.employees = emps.map(e => ({
        ...e,
        companyId: e.company_id,
        role: e.title || '',
        cv: e.cv_url || '',
        image: e.image_url || '',
        isHidden: e.is_hidden || false
      }));
    }
    
    if (revs) {
      DB.reviews = revs.map(r => ({
        ...r,
        empId: r.employee_id,
        name: 'عميل',
        stars: r.rating_stars !== undefined ? r.rating_stars : 5,
        text: r.comment_text || '—',
        hidden: r.is_hidden !== undefined ? r.is_hidden : false
      }));
    }

    if (admins) DB.admin_users = admins;
    
    // جلب الإعدادات ومعالجة شكل البيانات سواء كانت مصفوفة أو كائن
    if (settings) {
      if (Array.isArray(settings) && settings.length > 0) {
        DB.settings = settings[0];
      } else if (!Array.isArray(settings)) {
        DB.settings = settings;
      }
    }

    // تحديث روابط الواتساب في الموقع فور جلب البيانات
    updateWhatsAppLinks();

  } catch (e) {
    console.error("خطأ في تحميل البيانات من Supabase:", e);
  }
}

// دالة لتحديث روابط الواتساب ديناميكياً بناءً على جدول settings بشكل آمن
function updateWhatsAppLinks() {
  let activeWa = "966500000000";
  
  if (DB.settings) {
    if (Array.isArray(DB.settings) && DB.settings.length > 0) {
      activeWa = DB.settings[0].whatsapp || DB.settings[0].phone || activeWa;
    } else if (typeof DB.settings === 'object' && DB.settings !== null) {
      activeWa = DB.settings.whatsapp || DB.settings.phone || activeWa;
    }
  }

  // تنظيف الرقم من أي رموز زائدة ليعمل الرابط بدقة
  activeWa = String(activeWa).replace(/\D/g, '');
  
  const waLink = document.getElementById('waLink');
  const fabWa = document.getElementById('fabWa');
  const socWa = document.getElementById('socWa');
  const socMail = document.getElementById('socMail');
  
  if (waLink) waLink.href = `https://wa.me/${activeWa}`;
  if (fabWa) fabWa.href = `https://wa.me/${activeWa}`;
  if (socWa) socWa.href = `https://wa.me/${activeWa}`;
  
  if (socMail) {
    const emailVal = Array.isArray(DB.settings) ? DB.settings[0]?.email : DB.settings?.email;
    socMail.href = `mailto:${emailVal || 'info@yourservices.com'}`;
  }
}

// دوال مساعدة
const empsOf = id => DB.employees.filter(e => String(e.companyId || e.company_id || '') === String(id) && !e.isHidden);
const revsOf = id => DB.reviews.filter(r => String(r.empId || r.employee_id || '') === String(id) && !r.hidden);
const avgOf = id => { const r = revsOf(id); return r.length ? (r.reduce((s, x) => s + Number(x.stars || 0), 0) / r.length) : 0; };
const starsHTML = n => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));
const initials = n => n ? n.replace(/^(م\.|د\.|أ\.)\s*/, '').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('') : '';

/* ================= Public Site Logics ================= */
if (document.getElementById('companiesGrid')) {
  let activeCat = 'all', activeCo = 'all', query = '';
  const $ = s => document.querySelector(s);

  async function initSite() {
    await loadDBFromSupabase();
    renderCategories();
    renderCompanies();
    renderExperts();
    setupSearchAndFilters();
  }

  function setupSearchAndFilters() {
    const searchInput = document.getElementById('searchInput') || document.querySelector('input[type="search"]') || document.querySelector('.search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        query = e.target.value;
        renderCompanies();
      });
    }
  }

  function renderCategories() {}

  function matches(k) {
    if (!query) return true;
    const q = query.trim().toLowerCase();
    const nameMatch = (k.name || '').toLowerCase().includes(q);
    const descMatch = (k.desc || k.description || '').toLowerCase().includes(q);
    const empMatch = empsOf(k.id).some(e => ((e.name || '') + (e.role || e.title || '')).toLowerCase().includes(q));
    return nameMatch || descMatch || empMatch;
  }

  function renderCompanies() {
    const list = DB.companies.filter(k => !k.isHidden && (activeCat === 'all' || String(k.category_id || k.catId) === String(activeCat)) && matches(k));
    
    const grid = $('#companiesGrid');
    if (!grid) return;

    grid.innerHTML = list.length ? list.map(k => {
      const emps = empsOf(k.id);
      return `<article class="card company" id="co-${k.id}" style="cursor:pointer" onclick="scrollToCompanyEmployees('${k.id}')">
        <div class="company-top" style="display:flex;align-items:center;gap:12px">
          ${k.image ? `<img src="${k.image}" alt="${k.name}" style="width:48px;height:48px;border-radius:12px;object-fit:cover">` : ''}
          <div>
            <h3>${k.name}</h3>
          </div>
        </div>
        <p style="margin-top:10px">${k.desc || k.description || ''}</p>
        <div class="emp-row" style="margin-top:12px">${
          emps.length ? emps.map(e => `<span class="emp-mini" data-emp="${e.id}">
            ${e.image ? `<img src="${e.image}" class="avatar" style="object-fit:cover">` : `<span class="avatar">${initials(e.name)}</span>`}${e.name}</span>`).join('')
          : '<span style="color:var(--mut);font-size:.85rem">لا يوجد موظفون حالياً</span>'}</div>
        <div class="company-foot">
          <span><i class="fa-solid fa-location-dot"></i> ${k.city || 'السعودية'}</span>
          <span>${emps.length} موظف/خبير</span>
        </div>
      </article>`;
    }).join('') : `<p style="color:var(--mut);text-align:center;grid-column:1/-1">لا توجد نتائج مطابقة.</p>`;
  }

  window.scrollToCompanyEmployees = function(coId) {
    activeCo = coId;
    renderExperts();
    const expertsSec = document.getElementById('experts') || document.getElementById('expertsGrid');
    if (expertsSec) expertsSec.scrollIntoView({ behavior: 'smooth' });
  };

  function renderExperts() {
    let filteredEmps = DB.employees.filter(e => !e.isHidden);
    
    if (activeCo !== 'all') {
      filteredEmps = filteredEmps.filter(e => {
        const empCoId = String(e.company_id || e.companyId || '');
        return empCoId === String(activeCo);
      });
    }

    const expertsGrid = $('#expertsGrid');
    if (!expertsGrid) return;

    expertsGrid.innerHTML = filteredEmps.length ? filteredEmps.map(e => {
      const co = DB.companies.find(k => String(k.id) === String(e.company_id || e.companyId));
      const a = avgOf(e.id);
      return `<article class="card expert">
        ${e.image ?
          `<img class="ava" src="${e.image}" alt="${e.name}">` :
          `<div class="avatar ava">${initials(e.name)}</div>`
        }
        <div class="expert-body">
          <h3>${e.name}</h3>
          <div class="role">${e.title || e.role || ''}</div>
          <div class="co">${co ? co.name : ''}</div>
          <div class="stars">${starsHTML(a)}</div>
          <small>${a ? a.toFixed(1) : 'جديد'} · ${revsOf(e.id).length} تقييم</small>
        </div>
        <button class="btn btn-glow btn-sm" onclick="openEmpModal('${e.id}')">عرض الملف والتقييمات</button>
      </article>`;
    }).join('') : `<p style="color:var(--mut);text-align:center;grid-column:1/-1">لا يوجد موظفون مرتبطون حالياً.</p>`;
  }

  window.openEmpModal = function(id) {
    const e = DB.employees.find(x => String(x.id) === String(id)); if (!e) return;
    const co = DB.companies.find(k => String(k.id) === String(e.company_id || e.companyId));
    const card = document.getElementById('modalCard');
    if (!card) return;
    
    const empRevs = revsOf(e.id);
    const empAvg = avgOf(e.id);

    card.innerHTML = `
      <div class="modal-head" style="display:flex;justify-content:space-between;align-items:center">
        <div style="display:flex;gap:12px;align-items:center">
          ${e.image ? 
            `<img src="${e.image}" style="width:50px;height:50px;border-radius:50%;object-fit:cover">` : 
            `<div class="avatar" style="width:50px;height:50px;border-radius:50%;background:var(--grad);display:flex;align-items:center;justify-content:center;font-weight:bold;color:#fff">${initials(e.name)}</div>`
          }
          <div>
            <h3 style="font-size:1.1rem;margin:0">${e.name}</h3>
            <div style="color:var(--c3);font-size:.85rem">${e.title || e.role || ''}</div>
            <div style="color:var(--mut);font-size:.8rem">${co ? co.name : ''}</div>
          </div>
        </div>
        <button class="x" id="closeModal" style="background:none;border:none;color:var(--txt);font-size:1.2rem;cursor:pointer">✕</button>
      </div>
      
      <div class="mblock" style="margin-top:15px">
        <h4>السيرة الذاتية والخبرات</h4>
        <p>${e.cv_url || e.cv ? `<a href="${e.cv_url || e.cv}" target="_blank" style="color:var(--c3)">عرض الرابط / السيرة الذاتية</a>` : 'لا توجد تفاصيل إضافية.'}</p>
        ${e.phone ? `<p style="margin-top:5px;font-size:.85rem;color:var(--mut)">الهاتف: ${e.phone}</p>` : ''}
      </div>

      <div class="mblock" style="margin-top:15px">
        <h4>التقييمات والتعليقات المباشرة (${empRevs.length})</h4>
        <div class="stars" style="color:var(--warn)">${starsHTML(empAvg)} <small style="color:var(--mut)">${empAvg ? empAvg.toFixed(1) : 'لا يوجد'}</small></div>
        <div id="revList" style="max-height:200px;overflow-y:auto;margin-top:10px">
          ${empRevs.map(r => `
            <div class="review" style="background:rgba(255,255,255,0.05);padding:10px;border-radius:8px;margin-bottom:8px">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <b>${r.name}</b>
                <div class="stars" style="color:var(--warn)">${starsHTML(r.stars)}</div>
              </div>
              <p style="margin:5px 0">${r.text || '—'}</p>
              <small style="color:var(--mut);font-size:.7rem">${r.created_at ? new Date(r.created_at).toLocaleString('ar-EG') : 'الآن'}</small>
            </div>
          `).join('') || '<p style="color:var(--mut)">لا توجد تقييمات حالياً. كن أول من يقيّم!</p>'}
        </div>
      </div>

      <div class="mblock" style="margin-top:15px">
        <h4>أضف تقييمك وتعليقك</h4>
        <div class="rate-pick" id="ratePick" style="color:var(--warn);font-size:1.5rem;cursor:pointer">
          ${[1, 2, 3, 4, 5].map(i => `<i class="fa-solid fa-star" data-s="${i}">★</i>`).join('')}
        </div>
        <div style="display:grid;gap:10px;margin-top:10px">
          <textarea id="rText" rows="3" style="padding:8px;border-radius:8px;border:1px solid var(--stroke);background:var(--card);color:var(--txt)" placeholder="اكتب تعليقك وتقييمك هنا..."></textarea>
          <button class="btn btn-glow" id="rSend" style="padding:10px;border-radius:8px;background:var(--grad);color:#fff;border:none;cursor:pointer">إرسال التقييم ليظهر للجميع</button>
        </div>
      </div>`;
      
    const modalEl = document.getElementById('modal');
    if (modalEl) modalEl.classList.add('on');
    
    const closeBtn = document.getElementById('closeModal');
    if (closeBtn) closeBtn.onclick = closeModal;

    let picked = 5;
    const pick = card.querySelectorAll('#ratePick i');
    pick.forEach(st => st.onclick = () => {
      picked = +st.dataset.s;
      pick.forEach((o, idx) => o.style.opacity = (idx < picked) ? '1' : '0.3');
    });
    
    const rSendBtn = document.getElementById('rSend');
    if (rSendBtn) {
      rSendBtn.onclick = async () => {
        const textVal = document.getElementById('rText').value.trim();
        
        rSendBtn.disabled = true;
        rSendBtn.textContent = 'جاري الإرسال...';
        
        const payload = { 
          employee_id: Number(e.id), 
          rating_stars: Number(picked), 
          comment_text: textVal || '—'
        };
        
        const success = await sbFetch('reviews', 'POST', payload);

        if (!success) {
          alert("حدث خطأ أثناء إرسال التقييم. تأكد من اتصال الإنترنت.");
          rSendBtn.disabled = false;
          rSendBtn.textContent = 'إرسال التقييم ليظهر للجميع';
          return;
        }

        await loadDBFromSupabase();
        renderExperts();
        openEmpModal(e.id);
      };
    }
  };

  function closeModal() { 
    const modalEl = document.getElementById('modal');
    if (modalEl) modalEl.classList.remove('on'); 
  }

  initSite();
}

/* ================= Booking & Contact Actions ================= */
document.addEventListener('DOMContentLoaded', () => {
  const sendWaBtn = document.getElementById('sendWa');
  const sendMailBtn = document.getElementById('sendMail');
  const bookForm = document.getElementById('bookForm');

  const mailLink = document.getElementById('mailLink');
  const defaultEmail = "info@yourservices.com"; 

  if (mailLink) mailLink.href = `mailto:${defaultEmail}`;

  if (sendWaBtn && bookForm) {
    // إزالة الأحداث المتراكمة لضمان عدم تكرار النقر
    const newSendWaBtn = sendWaBtn.cloneNode(true);
    sendWaBtn.parentNode.replaceChild(newSendWaBtn, sendWaBtn);

    newSendWaBtn.addEventListener('click', () => {
      const name = bookForm.querySelector('[name="name"]').value.trim();
      const phone = bookForm.querySelector('[name="phone"]').value.trim();
      const service = bookForm.querySelector('[name="service"]').value;
      const details = bookForm.querySelector('[name="details"]').value.trim();

      if (!name || !phone) {
        alert("يرجى إدخال الاسم ورقم الجوال على الأقل.");
        return;
      }

      // سحب وتنظيف رقم الواتساب المحدث مباشرة من قاعدة البيانات
      let currentWa = "966500000000";
      if (DB.settings) {
        if (Array.isArray(DB.settings) && DB.settings.length > 0) {
          currentWa = DB.settings[0].whatsapp || DB.settings[0].phone || currentWa;
        } else if (typeof DB.settings === 'object' && DB.settings !== null) {
          currentWa = DB.settings.whatsapp || DB.settings.phone || currentWa;
        }
      }
      currentWa = String(currentWa).replace(/\D/g, '');

      const text = `مرحباً، أرغب في حجز خدمة:%0A- الاسم: ${name}%0A- الجوال: ${phone}%0A- الخدمة: ${service}%0A- التفاصيل: ${details || 'لا توجد تفاصيل إضافية'}`;
      window.open(`https://wa.me/${currentWa}?text=${text}`, '_blank');
    });
  }

  if (sendMailBtn && bookForm) {
    sendMailBtn.addEventListener('click', () => {
      const name = bookForm.querySelector('[name="name"]').value.trim();
      const phone = bookForm.querySelector('[name="phone"]').value.trim();
      const service = bookForm.querySelector('[name="service"]').value;
      const details = bookForm.querySelector('[name="details"]').value.trim();

      if (!name || !phone) {
        alert("يرجى إدخال الاسم ورقم الجوال على الأقل.");
        return;
      }

      const subject = encodeURIComponent(`طلب حجز جديد من: ${name}`);
      const body = encodeURIComponent(`الاسم: ${name}\nرقم الجوال: ${phone}\nالخدمة المطلوبة: ${service}\nالتفاصيل: ${details || '—'}`);
      
      window.location.href = `mailto:${defaultEmail}?subject=${subject}&body=${body}`;
    });
  }
});

/* ================= Mobile menu + year ================= */
document.addEventListener('DOMContentLoaded', () => {
  const burger = document.getElementById('burger');
  const menu = document.getElementById('menu');
  if (burger && menu) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('on');
      menu.classList.toggle('on');
    });
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      burger.classList.remove('on'); menu.classList.remove('on');
    }));
  }
  const yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  // active link on scroll
  const links = document.querySelectorAll('.menu a[href^="#"]');
  const secs = [...links].map(l => document.querySelector(l.getAttribute('href'))).filter(Boolean);
  if (secs.length) {
    const io = new IntersectionObserver(es => {
      es.forEach(e => {
        if (e.isIntersecting) {
          links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach(s => io.observe(s));
  }
});

/* ================= Extras: live stats + hide empty sections ================= */
document.addEventListener('DOMContentLoaded', () => {
  const statsEl = document.getElementById('stats');
  const catsSec = document.getElementById('cats');
  const catsGrid = document.getElementById('catsGrid');
  if (!statsEl && !catsSec) return;

  const paint = () => {
    if (statsEl && (DB.companies.length || DB.employees.length)) {
      const avg = DB.reviews.length
        ? (DB.reviews.reduce((s, r) => s + Number(r.stars || 0), 0) / DB.reviews.length).toFixed(1)
        : '5.0';
      statsEl.innerHTML = `
        <div class="stat"><b data-count="${DB.companies.length}">0</b><span>شركة مسجلة</span></div>
        <div class="stat"><b data-count="${DB.employees.length}">0</b><span>موظف وخبير</span></div>
        <div class="stat"><b data-count="${DB.reviews.length}">0</b><span>تقييم حقيقي</span></div>
        <div class="stat"><b>${avg}</b><span>متوسط التقييم</span></div>`;
      statsEl.querySelectorAll('[data-count]').forEach(el => {
        const to = Number(el.dataset.count) || 0;
        let cur = 0;
        const step = Math.max(1, Math.round(to / 28));
        const t = setInterval(() => {
          cur += step;
          if (cur >= to) { cur = to; clearInterval(t); }
          el.textContent = cur;
        }, 32);
      });
    }
    if (catsSec && catsGrid && !catsGrid.children.length) catsSec.style.display = 'none';
  };

  let tries = 0;
  const iv = setInterval(() => {
    tries++;
    if (typeof DB !== 'undefined' && (DB.companies.length || DB.employees.length || tries > 20)) {
      clearInterval(iv); paint();
    }
  }, 300);
});
