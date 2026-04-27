/* ═══════════════════════════════════════════════
   CourseVault — app.js
   All API calls, DOM rendering, and interactions
   Base URL: http://127.0.0.1:8000
═══════════════════════════════════════════════ */

'use strict';

/* ── Config ─────────────────────────────────── */
// const BASE      = 'http://127.0.0.1:8000';
// const BASE = 'https://courses-1-6cvi.onrender.com'; 

const BASE =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8000"
    : "https://courses-1-6cvi.onrender.com";

const PAGE_SIZE = 8;

/* ── State ──────────────────────────────────── */
let allCourses     = [];
let filteredCourses = [];
let currentPage    = 1;
let editingId      = null;

/* ── Form field definitions ─────────────────── */
const FIELDS = [
  { name: 'title',           label: 'Course Title',     type: 'text',   col: 'full', hint: '2–50 chars' },
  { name: 'instructor',      label: 'Instructor',        type: 'text',   col: 'half', hint: '2–30 chars' },
  { name: 'category',        label: 'Category',          type: 'text',   col: 'half', hint: '1–20 chars' },
  { name: 'price',           label: 'Price (₹)',         type: 'number', col: 'half', hint: '1 – 10,000' },
  { name: 'duration_hours',  label: 'Duration (hrs)',    type: 'number', col: 'half', hint: '1 – 500' },
  { name: 'discount_percent',label: 'Discount %',        type: 'number', col: 'half', hint: '0 – 50 (optional)' },
  { name: 'is_published',    label: 'Published',         type: 'toggle', col: 'half' },
];

const PANEL_META = {
  courses:  ['All Courses',      'Manage your course catalog'],
  add:      ['Add Course',       'Create a new course entry'],
  filter:   ['Filter Courses',   'Lookup by specific ID'],
  paginate: ['Pagination View',  'Browse with page controls'],
};

/* ════════════════════════════════════════════
   UTILITIES
════════════════════════════════════════════ */

/**
 * Show a temporary toast notification.
 * @param {string} msg  - Message to display
 * @param {'success'|'error'} type
 */
function toast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${type === 'success' ? '✓' : '✕'}</span>${msg}`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

/**
 * Returns HTML badge markup for price category.
 * @param {string} cat
 */
function priceBadge(cat) {
  if (!cat) return '—';
  if (cat.includes('Budget'))  return `<span class="badge badge-budget">${cat}</span>`;
  if (cat.includes('Mid'))     return `<span class="badge badge-mid">${cat}</span>`;
  return `<span class="badge badge-premium">${cat}</span>`;
}

/**
 * Returns HTML badge for published/unpublished.
 * @param {boolean} published
 */
function pubBadge(published) {
  return published
    ? `<span class="badge badge-pub">Published</span>`
    : `<span class="badge badge-unpub">Unpublished</span>`;
}

/**
 * Build a course detail grid HTML from a course object.
 * @param {Object} c - Course object
 */
function buildDetailHTML(c) {
  return `
    <div class="detail-item">
      <div class="detail-label">ID</div>
      <div class="detail-value"><span class="id-chip">#${c.id}</span></div>
    </div>
    <div class="detail-item">
      <div class="detail-label">Status</div>
      <div class="detail-value">${pubBadge(c.is_published)}</div>
    </div>
    <div class="detail-item detail-full">
      <div class="detail-label">Title</div>
      <div class="detail-value detail-title">${c.title}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">Instructor</div>
      <div class="detail-value">${c.instructor}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">Category</div>
      <div class="detail-value">${c.category}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">Price</div>
      <div class="detail-value price-cell">₹${c.price}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">Duration</div>
      <div class="detail-value">${c.duration_hours} hours</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">Discount</div>
      <div class="detail-value">${c.discount_percent != null ? c.discount_percent + '%' : 'None'}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">Price Tier</div>
      <div class="detail-value">${priceBadge(c.price_category)}</div>
    </div>
  `;
}

/* ════════════════════════════════════════════
   NAVIGATION
════════════════════════════════════════════ */

/**
 * Switch the visible panel and update the sidebar.
 * @param {string} name - Panel key: 'courses'|'add'|'filter'|'paginate'
 */
function showPanel(name) {
  // Toggle panels
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById(`panel-${name}`).classList.add('active');

  // Toggle nav items
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.panel === name);
  });

  // Update topbar title
  const [title, subtitle] = PANEL_META[name];
  const titleEl = document.getElementById('page-title');
  titleEl.childNodes[0].textContent = title + ' ';
  document.getElementById('page-subtitle').textContent = subtitle;

  // Render add form when switching to add panel
  if (name === 'add') renderAddForm();
}

/* ════════════════════════════════════════════
   API CALLS
════════════════════════════════════════════ */

/**
 * Fetch all courses from /data and refresh UI.
 */
async function loadCourses() {
  try {
    const res = await fetch(`${BASE}/data`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    allCourses = await res.json();
    filteredCourses = [];
    updateStats();
    populateCategoryFilter();
    renderTable();
  } catch (err) {
    console.error('loadCourses:', err);
    toast('Could not connect to API. Is the server running?', 'error');
    document.getElementById('course-tbody').innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center;padding:40px;color:var(--muted)">
          ⚠ API unreachable — make sure FastAPI is running on port 8000
        </td>
      </tr>`;
  }
}

/**
 * POST a new course to /new_course.
 * @param {Object} body - Course payload
 */
async function apiCreateCourse(body) {
  const res = await fetch(`${BASE}/new_course`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * PUT updated course to /update/{id}.
 * @param {number} id
 * @param {Object} body
 */
async function apiUpdateCourse(id, body) {
  const res = await fetch(`${BASE}/update/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * DELETE a course from /delete/{id}.
 * @param {number} id
 */
async function apiDeleteCourse(id) {
  const res = await fetch(`${BASE}/delete/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * GET /filter?id=
 * @param {number} id
 */
async function apiFetchById(id) {
  const res = await fetch(`${BASE}/filter?id=${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * GET /items?page=&limit=
 * @param {number} page
 * @param {number} limit
 */
async function apiFetchPage(page, limit) {
  const res = await fetch(`${BASE}/items?page=${page}&limit=${limit}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/* ════════════════════════════════════════════
   STATS
════════════════════════════════════════════ */

function updateStats() {
  document.getElementById('stat-total').textContent = allCourses.length;

  const published = allCourses.filter(c => c.is_published).length;
  document.getElementById('stat-pub').textContent = published;

  const avg = allCourses.length
    ? Math.round(allCourses.reduce((s, c) => s + c.price, 0) / allCourses.length)
    : 0;
  document.getElementById('stat-price').textContent = `₹${avg}`;

  const discounted = allCourses.filter(c => c.discount_percent && c.discount_percent > 0).length;
  document.getElementById('stat-disc').textContent = discounted;
}

/* ════════════════════════════════════════════
   TABLE — COURSES PANEL
════════════════════════════════════════════ */

function populateCategoryFilter() {
  const categories = [...new Set(allCourses.map(c => c.category))].sort();
  const sel = document.getElementById('cat-filter');
  sel.innerHTML = '<option value="">All Categories</option>';
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    sel.appendChild(opt);
  });
}

function applyFilters() {
  const q   = document.getElementById('search-input').value.toLowerCase();
  const cat = document.getElementById('cat-filter').value;
  const pub = document.getElementById('pub-filter').value;

  filteredCourses = allCourses.filter(c => {
    const matchQ   = !q   || c.title.toLowerCase().includes(q) || c.instructor.toLowerCase().includes(q);
    const matchCat = !cat || c.category === cat;
    const matchPub = pub === '' || String(c.is_published) === pub;
    return matchQ && matchCat && matchPub;
  });
  currentPage = 1;
  renderTable();
}

function renderTable() {
  const hasFilter = filteredCourses.length > 0 || document.getElementById('search-input').value;
  const data      = hasFilter ? filteredCourses : allCourses;
  const total     = data.length;
  const start     = (currentPage - 1) * PAGE_SIZE;
  const page      = data.slice(start, start + PAGE_SIZE);
  const tbody     = document.getElementById('course-tbody');

  if (!page.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9">
          <div class="empty">
            <div class="empty-icon">🗂</div>
            <h3>No courses found</h3>
            <p>Try adjusting your filters.</p>
          </div>
        </td>
      </tr>`;
    document.getElementById('table-pagination').style.display = 'none';
    return;
  }

  tbody.innerHTML = page.map(c => `
    <tr>
      <td><span class="id-chip">#${c.id}</span></td>
      <td class="title-cell">${c.title}</td>
      <td>${c.instructor}</td>
      <td><span class="badge badge-cat">${c.category}</span></td>
      <td class="price-cell">
        ₹${c.price}
        ${c.discount_percent ? `<br><span class="discount-tag">-${c.discount_percent}%</span>` : ''}
      </td>
      <td>${c.duration_hours}h</td>
      <td>${pubBadge(c.is_published)}</td>
      <td>${priceBadge(c.price_category)}</td>
      <td>
        <div class="actions">
          <button class="btn btn-outline btn-sm" data-action="view"   data-id="${c.id}">👁</button>
          <button class="btn btn-outline btn-sm" data-action="edit"   data-id="${c.id}">✏</button>
          <button class="btn btn-danger  btn-sm" data-action="delete" data-id="${c.id}">🗑</button>
        </div>
      </td>
    </tr>
  `).join('');

  renderTablePagination(total);
}

function renderTablePagination(total) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const pg         = document.getElementById('table-pagination');
  const start      = (currentPage - 1) * PAGE_SIZE;

  if (totalPages <= 1) { pg.style.display = 'none'; return; }

  pg.style.display = 'flex';
  pg.innerHTML = `
    <span>${start + 1}–${Math.min(start + PAGE_SIZE, total)} of ${total} courses</span>
    <div class="page-btns">
      <button class="page-btn" data-pg="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>‹</button>
      ${Array.from({ length: totalPages }, (_, i) =>
        `<button class="page-btn ${i + 1 === currentPage ? 'active' : ''}" data-pg="${i + 1}">${i + 1}</button>`
      ).join('')}
      <button class="page-btn" data-pg="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>›</button>
    </div>
  `;
}

function goPage(p) {
  const data = filteredCourses.length ? filteredCourses : allCourses;
  const max  = Math.ceil(data.length / PAGE_SIZE);
  if (p < 1 || p > max) return;
  currentPage = p;
  renderTable();
}

/* ════════════════════════════════════════════
   VIEW DETAIL MODAL
════════════════════════════════════════════ */

function openDetailModal(id) {
  const course = allCourses.find(c => c.id === id);
  if (!course) return;
  document.getElementById('detail-body').innerHTML = buildDetailHTML(course);
  document.getElementById('detail-overlay').classList.add('open');
}

/* ════════════════════════════════════════════
   FORM BUILDER
════════════════════════════════════════════ */

/**
 * Build form HTML from FIELDS definition.
 * @param {string} prefix  - ID prefix ('add' | 'modal')
 * @param {Object} values  - Pre-fill values (for edit)
 */
function buildFormHTML(prefix, values = {}) {
  return FIELDS.map(f => {
    const id  = `${prefix}-${f.name}`;
    const cls = `form-group${f.col === 'full' ? ' full' : ''}`;

    if (f.type === 'toggle') {
      const isOn = values[f.name] !== false;
      return `
        <div class="${cls}">
          <label class="form-label">${f.label}</label>
          <div class="toggle-wrap">
            <button class="toggle${isOn ? ' on' : ''}" id="${id}" type="button"></button>
            <span class="toggle-label">${isOn ? 'Yes' : 'No'}</span>
          </div>
        </div>`;
    }

    const val = values[f.name] != null ? values[f.name] : '';
    return `
      <div class="${cls}">
        <label class="form-label" for="${id}">${f.label}</label>
        <input
          type="${f.type}"
          class="form-control"
          id="${id}"
          value="${val}"
          placeholder="${f.hint}"
        >
        <span class="form-hint">${f.hint}</span>
      </div>`;
  }).join('');
}

/**
 * Collect form values by prefix.
 * @param {string} prefix
 * @returns {Object}
 */
function collectForm(prefix) {
  const obj = {};
  FIELDS.forEach(f => {
    const el = document.getElementById(`${prefix}-${f.name}`);
    if (!el) return;
    if (f.type === 'toggle') {
      obj[f.name] = el.classList.contains('on');
    } else if (f.type === 'number') {
      obj[f.name] = el.value !== '' ? parseFloat(el.value) : null;
    } else {
      obj[f.name] = el.value;
    }
  });
  return obj;
}

/* ════════════════════════════════════════════
   ADD PANEL
════════════════════════════════════════════ */

function renderAddForm(values = {}) {
  document.getElementById('add-form-grid').innerHTML = buildFormHTML('add', values);
}

async function submitNewCourse() {
  const body = collectForm('add');
  if (body.discount_percent === null) delete body.discount_percent;
  try {
    await apiCreateCourse(body);
    toast('Course created successfully!');
    renderAddForm();
    loadCourses();
  } catch (e) {
    toast(e.message || 'Failed to create course', 'error');
  }
}

/* ════════════════════════════════════════════
   EDIT / ADD MODAL
════════════════════════════════════════════ */

function openAddModal() {
  editingId = null;
  document.getElementById('modal-title').textContent = 'Add New Course';
  document.getElementById('modal-save-btn').textContent = 'Create Course';
  document.getElementById('modal-form-grid').innerHTML = buildFormHTML('modal');
  document.getElementById('modal-overlay').classList.add('open');
}

function openEditModal(id) {
  const course = allCourses.find(c => c.id === id);
  if (!course) return;
  editingId = id;
  document.getElementById('modal-title').textContent = `Edit Course #${id}`;
  document.getElementById('modal-save-btn').textContent = 'Save Changes';
  document.getElementById('modal-form-grid').innerHTML = buildFormHTML('modal', course);
  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

async function saveModal() {
  const body = collectForm('modal');
  if (body.discount_percent === null) delete body.discount_percent;
  try {
    if (editingId) {
      await apiUpdateCourse(editingId, body);
      toast('Course updated successfully!');
    } else {
      await apiCreateCourse(body);
      toast('Course created successfully!');
    }
    closeModal();
    loadCourses();
  } catch (e) {
    toast(e.message || 'Failed to save course', 'error');
  }
}

/* ════════════════════════════════════════════
   DELETE
════════════════════════════════════════════ */

async function deleteCourse(id) {
  if (!confirm(`Delete course #${id}? This cannot be undone.`)) return;
  try {
    await apiDeleteCourse(id);
    toast(`Course #${id} deleted.`);
    loadCourses();
  } catch (e) {
    toast(e.message || 'Delete failed', 'error');
  }
}

/* ════════════════════════════════════════════
   FILTER PANEL
════════════════════════════════════════════ */

async function filterById() {
  const id  = document.getElementById('filter-id-input').value.trim();
  const div = document.getElementById('filter-id-result');

  if (!id) { toast('Please enter a course ID', 'error'); return; }

  div.innerHTML = '<div class="spinner" style="margin:20px auto;"></div>';
  try {
    const json = await apiFetchById(id);
    const data = json.Data || [];
    if (!data.length) {
      div.innerHTML = `<p style="color:var(--muted);margin-top:8px">No course found with ID <strong>${id}</strong>.</p>`;
      return;
    }
    div.innerHTML = `<div class="result-card"><div class="detail-grid">${buildDetailHTML(data[0])}</div></div>`;
  } catch (e) {
    div.innerHTML = `<p style="color:var(--danger)">Error: ${e.message}</p>`;
  }
}

// ID filter clear
function clearFilterResult() {
  document.getElementById('filter-id-input').value = '';
  document.getElementById('filter-id-result').innerHTML = '';
}

// Category filter search
function filterByCategory() {
  const cat = document.getElementById('filter-cat-input').value.trim().toLowerCase();
  const div = document.getElementById('filter-cat-result');

  if (!cat) { toast('Please enter a category name', 'error'); return; }

  const data = allCourses.filter(c =>
    c.category.toLowerCase().includes(cat)
  );

  if (!data.length) {
    div.innerHTML = `<p style="color:var(--muted);margin-top:8px">No courses found in "<strong>${cat}</strong>".</p>`;
    return;
  }
  div.innerHTML = `
    <p style="color:var(--muted);font-size:12px;margin-bottom:12px">
      ${data.length} course(s) found in "<strong style="color:var(--text)">${cat}</strong>"
    </p>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>ID</th><th>Title</th><th>Instructor</th><th>Price</th><th>Status</th></tr>
        </thead>
        <tbody>
          ${data.map(c => `
            <tr>
              <td><span class="id-chip">#${c.id}</span></td>
              <td class="title-cell">${c.title}</td>
              <td>${c.instructor}</td>
              <td class="price-cell">₹${c.price}</td>
              <td>${pubBadge(c.is_published)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

// Category filter clear
function clearCategoryResult() {
  document.getElementById('filter-cat-input').value = '';
  document.getElementById('filter-cat-result').innerHTML = '';
}




/* ════════════════════════════════════════════
   PAGINATION PANEL
════════════════════════════════════════════ */

async function fetchPage() {
  const page  = document.getElementById('pg-page').value  || 1;
  const limit = document.getElementById('pg-limit').value || 10;
  const div   = document.getElementById('pg-result');

  div.innerHTML = '<div class="spinner" style="margin:20px auto;"></div>';
  try {
    const json = await apiFetchPage(page, limit);
    const data = json['Data'] || [];

    div.innerHTML = `
      <div style="display:flex;gap:20px;margin-bottom:14px;font-size:12px;color:var(--muted)">
        <span>Total: <strong style="color:var(--text)">${json['Total items']}</strong></span>
        <span>Page: <strong style="color:var(--text)">${json['Current page no.']}</strong></span>
        <span>Showing: <strong style="color:var(--text)">${json['records shown on this page']}</strong></span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Title</th><th>Instructor</th>
              <th>Category</th><th>Price</th><th>Duration</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(c => `
              <tr>
                <td><span class="id-chip">#${c.id}</span></td>
                <td class="title-cell">${c.title}</td>
                <td>${c.instructor}</td>
                <td><span class="badge badge-cat">${c.category}</span></td>
                <td class="price-cell">₹${c.price}</td>
                <td>${c.duration_hours}h</td>
                <td>${pubBadge(c.is_published)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (e) {
    div.innerHTML = `<p style="color:var(--danger)">Failed to fetch data: ${e.message}</p>`;
  }
}

/* ════════════════════════════════════════════
   EVENT DELEGATION & WIRING
════════════════════════════════════════════ */

function wireEvents() {

  // ── Sidebar navigation
  document.querySelectorAll('.nav-item[data-panel]').forEach(el => {
    el.addEventListener('click', () => showPanel(el.dataset.panel));
  });

  // ── Topbar buttons
  document.getElementById('btn-refresh').addEventListener('click', () => {
    loadCourses();
    toast('Data refreshed');
  });
  document.getElementById('btn-add-top').addEventListener('click', openAddModal);

  // ── Table: action buttons (delegated)
  document.getElementById('course-tbody').addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = parseInt(btn.dataset.id, 10);
    const action = btn.dataset.action;
    if (action === 'view')   openDetailModal(id);
    if (action === 'edit')   openEditModal(id);
    if (action === 'delete') deleteCourse(id);
  });

  // ── Table: pagination (delegated)
  document.getElementById('table-pagination').addEventListener('click', e => {
    const btn = e.target.closest('[data-pg]');
    if (!btn || btn.disabled) return;
    goPage(parseInt(btn.dataset.pg, 10));
  });

  // ── Table: search & filters
  document.getElementById('search-input').addEventListener('input', applyFilters);
  document.getElementById('cat-filter').addEventListener('change', applyFilters);
  document.getElementById('pub-filter').addEventListener('change', applyFilters);

  // ── Add panel
  document.getElementById('btn-reset-add').addEventListener('click',  () => renderAddForm());
  document.getElementById('btn-submit-add').addEventListener('click', submitNewCourse);

  // ── Filter panel
  document.getElementById('btn-filter-search').addEventListener('click', filterById);
  document.getElementById('btn-filter-clear').addEventListener('click',  clearFilterResult);
  document.getElementById('btn-cat-search').addEventListener('click', filterByCategory);
  document.getElementById('btn-cat-clear').addEventListener('click',  clearCategoryResult);
  document.getElementById('filter-id-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') filterById();
  });

  // ── Pagination panel
  document.getElementById('btn-pg-fetch').addEventListener('click', fetchPage);

  // ── Edit/Add modal
  document.getElementById('modal-close-btn').addEventListener('click',  closeModal);
  document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
  document.getElementById('modal-save-btn').addEventListener('click',   saveModal);
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });

  // ── Detail modal
  document.getElementById('detail-close-btn').addEventListener('click', () => {
    document.getElementById('detail-overlay').classList.remove('open');
  });
  document.getElementById('detail-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('detail-overlay')) {
      document.getElementById('detail-overlay').classList.remove('open');
    }
  });

  // ── Toggle buttons (delegated — works for dynamically rendered toggles)
  document.addEventListener('click', e => {
    if (e.target.classList.contains('toggle')) {
      e.target.classList.toggle('on');
      const label = e.target.nextElementSibling;
      if (label && label.classList.contains('toggle-label')) {
        label.textContent = e.target.classList.contains('on') ? 'Yes' : 'No';
      }
    }
  });

  // ── Keyboard: close modals with Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeModal();
      document.getElementById('detail-overlay').classList.remove('open');
    }
  });
}

/* ════════════════════════════════════════════
   INIT
════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  wireEvents();
  renderAddForm();
  loadCourses();
});
