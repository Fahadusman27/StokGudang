/**
 * ==============================================================================
 * JAVASCRIPT LOGIC - MODUL GUDANG (RESTOK & EDIT DATA)
 * ==============================================================================
 */

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzccVJDYZrx0vbDLSJO_cl517jKYZ8NHPtwoU3MMG6w4dCPh0ECUDm-VE8VKAVETVNt/exec";
const PENANDA_DIVISI = "Icang";
const STORAGE_KEY = "restok_history_icang";

// DAFTAR 21 PRODUK
const PRODUCTS = [
  "Selena",
  "D&g light blue",
  "Lacoste Sport",
  "Maid Prince",
  "Poloish",
  "Imperial",
  "White aoud",
  "Mia Tabac",
  "Coco Chanel",
  "Tobacco vanilla",
  "Al rehab lovely",
  "Indigo",
  "Vision",
  "Aqua kiss",
  "Roman 1a",
  "Pramugari air",
  "Purenol",
  "Body Wash (Tanpa Aroma)",
  "Body mist (Tanpa Aroma)",
  "Deodorant (Tanpa Aroma)",
  "Botol Parfum (Kosongan)"
];

// State Input Form
const quantities = {};

// State Riwayat Data Gudang
let stokHistoryData = [];
let currentMode = 'input'; // 'input' | 'riwayat'

// DOM Elements - Input Form
const grid = document.getElementById('productGrid');
const tanggalInput = document.getElementById('tanggalInput');
const lokasiInput = document.getElementById('lokasiInput');
const lokasiPreviewText = document.getElementById('lokasiPreviewText');
const lokasiPreviewBadge = document.getElementById('lokasiPreviewBadge');
const bottomLokasiBadge = document.getElementById('bottomLokasiBadge');
const searchBox = document.getElementById('searchBox');
const displayedCount = document.getElementById('displayedCount');
const filledCounterText = document.getElementById('filledCounterText');
const filledBadge = document.getElementById('filledBadge');
const summaryText = document.getElementById('summaryText');
const totalQtyText = document.getElementById('totalQtyText');
const btnSubmit = document.getElementById('btnSubmit');
const submitBtnText = document.getElementById('submitBtnText');
const submitSpinner = document.getElementById('submitSpinner');
const bottomBar = document.getElementById('bottomBar');
const alertBox = document.getElementById('alertBox');
const alertMessage = document.getElementById('alertMessage');
const alertIcon = document.getElementById('alertIcon');

// DOM Elements - Tab & Riwayat
const tabBtnInput = document.getElementById('tabBtnInput');
const tabBtnRiwayat = document.getElementById('tabBtnRiwayat');
const tabRiwayatBadge = document.getElementById('tabRiwayatBadge');
const viewInput = document.getElementById('viewInput');
const viewRiwayat = document.getElementById('viewRiwayat');
const riwayatTableBody = document.getElementById('riwayatTableBody');
const riwayatCardsContainer = document.getElementById('riwayatCardsContainer');
const riwayatEmptyState = document.getElementById('riwayatEmptyState');
const riwayatCountInfo = document.getElementById('riwayatCountInfo');
const riwayatSearchBox = document.getElementById('riwayatSearchBox');
const riwayatFilterLokasi = document.getElementById('riwayatFilterLokasi');
const riwayatFilterTanggal = document.getElementById('riwayatFilterTanggal');
const riwayatSyncSpinner = document.getElementById('riwayatSyncSpinner');
const riwayatSyncText = document.getElementById('riwayatSyncText');
const statRiwayatPcs = document.getElementById('statRiwayatPcs');
const statRiwayatBaris = document.getElementById('statRiwayatBaris');
const statRiwayatLokasi = document.getElementById('statRiwayatLokasi');

// DOM Elements - Edit Modal
const editModal = document.getElementById('editModal');
const editRowId = document.getElementById('editRowId');
const editOldTanggal = document.getElementById('editOldTanggal');
const editOldLokasi = document.getElementById('editOldLokasi');
const editOldProduk = document.getElementById('editOldProduk');
const editOldJumlah = document.getElementById('editOldJumlah');
const editTanggalInput = document.getElementById('editTanggalInput');
const editLokasiInput = document.getElementById('editLokasiInput');
const editLokasiPreviewBadge = document.getElementById('editLokasiPreviewBadge');
const editProdukSelect = document.getElementById('editProdukSelect');
const editQtyInput = document.getElementById('editQtyInput');
const btnSaveEdit = document.getElementById('btnSaveEdit');
const saveEditBtnText = document.getElementById('saveEditBtnText');
const saveEditSpinner = document.getElementById('saveEditSpinner');
const btnDeleteRow = document.getElementById('btnDeleteRow');
const modalAlertBox = document.getElementById('modalAlertBox');
const modalAlertMessage = document.getElementById('modalAlertMessage');

// =========================================================================
// INISIALISASI
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Inisialisasi Tanggal Hari Ini
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  if (tanggalInput) {
    tanggalInput.value = `${yyyy}-${mm}-${dd}`;
  }

  // Ambil lokasi terakhir dari penyimpanan lokal
  const savedLokasi = localStorage.getItem('last_gudang_lokasi') || '';
  if (savedLokasi && lokasiInput) {
    lokasiInput.value = savedLokasi;
  }
  handleLokasiChange(savedLokasi);

  // Inisialisasi State Form Produk
  PRODUCTS.forEach(p => {
    quantities[p] = 0;
  });
  renderProductGrid();

  // Inisialisasi Dropdown Produk pada Modal Edit
  populateEditProductSelect();

  // Muat Data Riwayat Awal dari Local Cache
  loadLocalHistory();

  // Ambil data terbaru dari spreadsheet secara background
  fetchGudangHistory(false);
});

// =========================================================================
// NAVIGASI MODE: INPUT vs RIWAYAT & EDIT
// =========================================================================
function switchTabMode(mode) {
  currentMode = mode;

  if (mode === 'input') {
    if (viewInput) viewInput.classList.remove('hidden');
    if (viewRiwayat) viewRiwayat.classList.add('hidden');
    if (bottomBar) bottomBar.classList.remove('hidden');

    if (tabBtnInput) tabBtnInput.className = "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition bg-white text-emerald-700 shadow-xs cursor-pointer";
    if (tabBtnRiwayat) tabBtnRiwayat.className = "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer";
  } else {
    if (viewInput) viewInput.classList.add('hidden');
    if (viewRiwayat) viewRiwayat.classList.remove('hidden');
    if (bottomBar) bottomBar.classList.add('hidden');

    if (tabBtnRiwayat) tabBtnRiwayat.className = "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition bg-white text-emerald-700 shadow-xs cursor-pointer";
    if (tabBtnInput) tabBtnInput.className = "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer";

    renderRiwayatList();
  }
}

// =========================================================================
// HELPER LOKASI
// =========================================================================
function getFormattedLokasi(rawVal) {
  const val = (rawVal || '').trim();
  if (!val) return '';
  if (val.toLowerCase().startsWith('gudang (')) {
    return val;
  } else if (val.toLowerCase().startsWith('gudang ')) {
    const sub = val.substring(7).trim();
    return sub ? `Gudang (${sub})` : 'Gudang';
  } else if (val.toLowerCase() === 'gudang') {
    return 'Gudang';
  }
  return `Gudang (${val})`;
}

function extractRawLokasi(formattedVal) {
  let val = (formattedVal || '').trim();
  if (val.toLowerCase().startsWith('gudang (')) {
    return val.slice(8, -1).trim();
  } else if (val.toLowerCase().startsWith('gudang ')) {
    return val.slice(7).trim();
  } else if (val.toLowerCase() === 'gudang') {
    return '';
  }
  return val;
}

function handleLokasiChange(val) {
  const trimmed = (val || '').trim();
  const formatted = getFormattedLokasi(trimmed);

  if (lokasiPreviewText) {
    lokasiPreviewText.textContent = formatted || 'Gudang (Belum diisi)';
  }

  if (lokasiPreviewBadge) {
    if (formatted) {
      lokasiPreviewBadge.className = "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 shadow-2xs";
    } else {
      lokasiPreviewBadge.className = "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-slate-500 bg-slate-100 border border-slate-200";
    }
  }

  if (bottomLokasiBadge) {
    bottomLokasiBadge.textContent = formatted || 'Gudang (-)';
  }
}

function handleEditLokasiInput(val) {
  const formatted = getFormattedLokasi(val);
  if (editLokasiPreviewBadge) {
    editLokasiPreviewBadge.textContent = formatted || 'Gudang (-)';
  }
}

// =========================================================================
// RENDER & LOGIKA FORM INPUT RESTOK
// =========================================================================
function renderProductGrid() {
  if (!grid) return;
  const keyword = (searchBox ? searchBox.value : '').toLowerCase().trim();
  grid.innerHTML = '';

  const filtered = PRODUCTS.filter(p => p.toLowerCase().includes(keyword));
  if (displayedCount) displayedCount.textContent = filtered.length;

  filtered.forEach((prod, idx) => {
    const qty = quantities[prod] || 0;
    const isFilled = qty > 0;

    const card = document.createElement('div');
    card.id = `card-${escapeId(prod)}`;
    card.className = `product-card bg-white rounded-xl border ${isFilled ? 'border-emerald-500 bg-emerald-50/20 shadow-xs ring-1 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'} p-3.5 transition flex items-center justify-between gap-3`;
    card.dataset.name = prod.toLowerCase();

    card.innerHTML = `
      <div class="flex-grow min-w-0">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">#${idx + 1}</span>
        <label for="prod-${escapeId(prod)}" class="text-xs font-bold text-slate-900 block truncate cursor-pointer leading-tight mt-0.5">
          ${prod}
        </label>
      </div>

      <!-- Input Manual Jumlah -->
      <div class="relative flex-shrink-0 w-28">
        <input 
          type="number" 
          min="0"
          id="prod-${escapeId(prod)}" 
          placeholder="0"
          value="${qty > 0 ? qty : ''}"
          oninput="handleQtyInput('${prod}', this.value)"
          class="w-full pl-3 pr-8 py-1.5 text-right text-xs font-bold text-slate-900 rounded-lg border ${isFilled ? 'border-emerald-500 bg-white focus:ring-2 focus:ring-emerald-500/20' : 'border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500'} outline-none transition"
        >
        <span class="absolute right-2.5 top-2 text-[10px] font-medium text-slate-400 pointer-events-none">pcs</span>
      </div>
    `;
    grid.appendChild(card);
  });

  updateSummaryBar();
}

function escapeId(str) {
  return str.replace(/[^a-zA-Z0-9]/g, '_');
}

function handleQtyInput(prodName, val) {
  const parsed = parseInt(val, 10);
  const qty = isNaN(parsed) || parsed < 0 ? 0 : parsed;
  quantities[prodName] = qty;

  const card = document.getElementById(`card-${escapeId(prodName)}`);
  const input = document.getElementById(`prod-${escapeId(prodName)}`);

  if (card && input) {
    if (qty > 0) {
      card.className = "product-card bg-white rounded-xl border border-emerald-500 bg-emerald-50/20 shadow-xs ring-1 ring-emerald-500/20 p-3.5 transition flex items-center justify-between gap-3";
      input.className = "w-full pl-3 pr-8 py-1.5 text-right text-xs font-bold text-slate-900 rounded-lg border border-emerald-500 bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition";
    } else {
      card.className = "product-card bg-white rounded-xl border border-slate-200 hover:border-slate-300 p-3.5 transition flex items-center justify-between gap-3";
      input.className = "w-full pl-3 pr-8 py-1.5 text-right text-xs font-bold text-slate-900 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none transition";
    }
  }

  updateSummaryBar();
}

function filterProducts(keyword) {
  const kw = keyword.toLowerCase().trim();
  const cards = document.querySelectorAll('.product-card');
  let visibleCount = 0;
  cards.forEach(c => {
    if (!kw || c.dataset.name.includes(kw)) {
      c.classList.remove('hidden');
      visibleCount++;
    } else {
      c.classList.add('hidden');
    }
  });
  if (displayedCount) displayedCount.textContent = visibleCount;
}

function updateSummaryBar() {
  let filledCount = 0;
  let totalQty = 0;

  Object.keys(quantities).forEach(k => {
    const q = quantities[k];
    if (q > 0) {
      filledCount++;
      totalQty += q;
    }
  });

  if (filledBadge) filledBadge.textContent = filledCount;
  if (summaryText) summaryText.textContent = `${filledCount} produk diisi`;
  if (totalQtyText) totalQtyText.textContent = `Total ${totalQty.toLocaleString('id-ID')} pcs`;
  if (filledCounterText) filledCounterText.textContent = `${filledCount} produk terisi`;
  if (btnSubmit) btnSubmit.disabled = filledCount === 0;
}

function resetAllInputs() {
  if (confirm('Kosongkan semua jumlah produk yang telah diisi?')) {
    PRODUCTS.forEach(p => {
      quantities[p] = 0;
      const input = document.getElementById(`prod-${escapeId(p)}`);
      if (input) input.value = '';
      const card = document.getElementById(`card-${escapeId(p)}`);
      if (card) {
        card.className = "product-card bg-white rounded-xl border border-slate-200 hover:border-slate-300 p-3.5 transition flex items-center justify-between gap-3";
      }
    });
    updateSummaryBar();
  }
}

// =========================================================================
// SUBMIT DATA RESTOK BARU
// =========================================================================
async function handleFormSubmit(e) {
  if (e) e.preventDefault();

  const tanggal = tanggalInput ? tanggalInput.value : '';
  if (!tanggal) {
    showAlert('Tanggal wajib diisi!', true);
    return;
  }

  const rawLokasi = ((lokasiInput && lokasiInput.value) || '').trim();
  if (!rawLokasi) {
    showAlert('Lokasi penyimpanan wajib diisi!', true);
    if (lokasiInput) lokasiInput.focus();
    return;
  }

  const outputLokasi = getFormattedLokasi(rawLokasi);
  localStorage.setItem('last_gudang_lokasi', rawLokasi);

  const itemsToSave = [];
  Object.keys(quantities).forEach(prod => {
    if (quantities[prod] > 0) {
      itemsToSave.push({ 
        namaProduk: prod, 
        jumlahProduk: quantities[prod],
        lokasi: outputLokasi 
      });
    }
  });

  if (itemsToSave.length === 0) {
    showAlert('Isi jumlah minimal pada salah satu produk!', true);
    return;
  }

  if (btnSubmit) btnSubmit.disabled = true;
  if (submitSpinner) submitSpinner.classList.remove('hidden');
  if (submitBtnText) submitBtnText.textContent = 'Menyimpan...';

  try {
    const payload = {
      penanda: PENANDA_DIVISI,
      tanggal: tanggal,
      lokasi: outputLokasi,
      namaLokasi: outputLokasi,
      items: itemsToSave
    };

    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    });

    const result = await res.json();

    if (result.status === 'success') {
      // Perbarui riwayat lokal
      syncNewItemsToHistory(itemsToSave, tanggal, outputLokasi, rawLokasi, result.data && result.data.items);

      // Reset nilai form kuantitas
      PRODUCTS.forEach(p => {
        quantities[p] = 0;
        const input = document.getElementById(`prod-${escapeId(p)}`);
        if (input) input.value = '';
        const card = document.getElementById(`card-${escapeId(p)}`);
        if (card) {
          card.className = "product-card bg-white rounded-xl border border-slate-200 hover:border-slate-300 p-3.5 transition flex items-center justify-between gap-3";
        }
      });

      updateSummaryBar();
      
      // Toast sukses dengan link cepat ke riwayat & edit
      showSuccessNotificationWithLink(
        `Berhasil mencatat ${itemsToSave.length} produk ke ${outputLokasi}!`,
        'Lihat & Edit Data →'
      );

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Fallback sequential jika batch gagal
      let successCount = 0;
      for (const item of itemsToSave) {
        try {
          const sRes = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
              penanda: PENANDA_DIVISI,
              tanggal: tanggal,
              lokasi: outputLokasi,
              namaLokasi: outputLokasi,
              namaProduk: item.namaProduk,
              jumlahProduk: item.jumlahProduk
            }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
          });
          const sData = await sRes.json();
          if (sData.status === 'success') successCount++;
        } catch (err) {
          console.error(err);
        }
      }

      syncNewItemsToHistory(itemsToSave, tanggal, outputLokasi, rawLokasi);
      PRODUCTS.forEach(p => {
        quantities[p] = 0;
        const input = document.getElementById(`prod-${escapeId(p)}`);
        if (input) input.value = '';
      });
      updateSummaryBar();
      showSuccessNotificationWithLink(
        `${successCount} produk berhasil dicatat ke ${outputLokasi}.`,
        'Buka Riwayat →'
      );
    }

  } catch (err) {
    console.error(err);
    showAlert('Gagal mengirim data: ' + err.message, true);
  } finally {
    if (btnSubmit) btnSubmit.disabled = false;
    if (submitSpinner) submitSpinner.classList.add('hidden');
    if (submitBtnText) submitBtnText.textContent = 'Simpan Restok';
  }
}

// =========================================================================
// RIWAYAT & EDIT DATA GUDANG
// =========================================================================
function loadLocalHistory() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (Array.isArray(stored)) {
      stokHistoryData = stored;
    }
  } catch (e) {
    stokHistoryData = [];
  }
  updateRiwayatStats();
  renderRiwayatList();
}

async function fetchGudangHistory(isManual = false) {
  if (isManual) {
    if (riwayatSyncSpinner) riwayatSyncSpinner.classList.add('animate-spin');
    if (riwayatSyncText) riwayatSyncText.textContent = 'Menyinkronkan...';
  }

  try {
    const res = await fetch(`${SCRIPT_URL}?action=getHistory&penanda=${PENANDA_DIVISI}`);
    const result = await res.json();

    if (result.status === 'success' && Array.isArray(result.data)) {
      stokHistoryData = result.data;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stokHistoryData));
      renderRiwayatList();
      updateRiwayatStats();
      if (isManual) {
        showAlert('Data restok gudang berhasil disinkronkan dengan spreadsheet!');
      }
    }
  } catch (err) {
    console.warn('Gagal sinkron data gudang:', err);
    if (isManual) {
      showAlert('Tidak dapat menyinkronkan: ' + err.message, true);
    }
  } finally {
    if (isManual) {
      if (riwayatSyncSpinner) riwayatSyncSpinner.classList.remove('animate-spin');
      if (riwayatSyncText) riwayatSyncText.textContent = 'Segarkan';
    }
  }
}

function syncNewItemsToHistory(newItems, tanggal, outputLokasi, rawLokasi, serverItems) {
  newItems.forEach((it, idx) => {
    const generatedId = (serverItems && serverItems[idx] && serverItems[idx].id) || Date.now() + idx;
    stokHistoryData.unshift({
      id: generatedId,
      tanggal: tanggal,
      lokasi: outputLokasi,
      namaSales: outputLokasi,
      namaProduk: it.namaProduk,
      jumlahProduk: it.jumlahProduk
    });
  });

  if (stokHistoryData.length > 200) {
    stokHistoryData = stokHistoryData.slice(0, 200);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stokHistoryData));
  updateRiwayatStats();
}

function updateRiwayatStats() {
  const count = stokHistoryData.length;
  if (tabRiwayatBadge) tabRiwayatBadge.textContent = count;

  const totalPcs = stokHistoryData.reduce((acc, c) => acc + (Number(c.jumlahProduk) || 0), 0);
  if (statRiwayatPcs) statRiwayatPcs.textContent = `${totalPcs.toLocaleString('id-ID')} pcs`;
  if (statRiwayatBaris) statRiwayatBaris.textContent = `${count} data`;

  const locs = [...new Set(stokHistoryData.map(s => (s.lokasi || s.namaSales || '').trim()).filter(Boolean))];
  if (statRiwayatLokasi) {
    statRiwayatLokasi.textContent = locs.length > 0 ? (locs[0] + (locs.length > 1 ? ` (+${locs.length - 1})` : '')) : '-';
  }

  updateLokasiFilterDropdown(locs);
}

function updateLokasiFilterDropdown(locs) {
  if (!riwayatFilterLokasi) return;
  const currentSelected = riwayatFilterLokasi.value;
  riwayatFilterLokasi.innerHTML = '<option value="">Semua Lokasi</option>';

  locs.forEach(l => {
    const opt = document.createElement('option');
    opt.value = l;
    opt.textContent = l;
    if (l === currentSelected) opt.selected = true;
    riwayatFilterLokasi.appendChild(opt);
  });
}

function resetRiwayatFilter() {
  if (riwayatSearchBox) riwayatSearchBox.value = '';
  if (riwayatFilterLokasi) riwayatFilterLokasi.value = '';
  if (riwayatFilterTanggal) riwayatFilterTanggal.value = '';
  renderRiwayatList();
}

function renderRiwayatList(highlightId = null) {
  const kw = (riwayatSearchBox ? riwayatSearchBox.value : '').toLowerCase().trim();
  const filterLoc = (riwayatFilterLokasi ? riwayatFilterLokasi.value : '').toLowerCase().trim();
  const filterTgl = (riwayatFilterTanggal ? riwayatFilterTanggal.value : '').trim();

  let filtered = stokHistoryData.filter(item => {
    const prod = (item.namaProduk || '').toLowerCase();
    const loc = (item.lokasi || item.namaSales || '').toLowerCase();
    const tgl = normalizeDateForInput(item.tanggal || '');

    if (filterLoc && !loc.includes(filterLoc)) return false;
    if (filterTgl && !tgl.includes(filterTgl)) return false;

    if (kw) {
      return prod.includes(kw) || loc.includes(kw) || tgl.includes(kw);
    }
    return true;
  });

  if (riwayatCountInfo) {
    riwayatCountInfo.textContent = `Menampilkan ${filtered.length} dari ${stokHistoryData.length} data restok`;
  }

  if (filtered.length === 0) {
    if (riwayatTableBody) riwayatTableBody.innerHTML = '';
    if (riwayatCardsContainer) riwayatCardsContainer.innerHTML = '';
    if (riwayatEmptyState) riwayatEmptyState.classList.remove('hidden');
    return;
  }

  if (riwayatEmptyState) riwayatEmptyState.classList.add('hidden');

  // 1. RENDER TABEL DESKTOP
  if (riwayatTableBody) {
    riwayatTableBody.innerHTML = filtered.map((row, idx) => {
      const isHighlight = highlightId && (row.id == highlightId);
      const locDisplay = row.lokasi || row.namaSales || 'Gudang';
      const formattedDate = formatDisplayDate(row.tanggal);
      const qty = Number(row.jumlahProduk) || 0;

      return `
        <tr id="row-${row.id}" class="hover:bg-slate-50/80 transition ${isHighlight ? 'highlight-edit' : ''}">
          <td class="px-4 py-3 text-center text-slate-400 font-mono text-[11px]">${idx + 1}</td>
          <td class="px-4 py-3 font-medium text-slate-600 whitespace-nowrap">${escapeHtml(formattedDate)}</td>
          <td class="px-4 py-3">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <svg class="w-3 h-3 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span class="truncate max-w-[160px]">${escapeHtml(locDisplay)}</span>
            </span>
          </td>
          <td class="px-4 py-3 font-bold text-slate-900">${escapeHtml(row.namaProduk || '-')}</td>
          <td class="px-4 py-3 text-right">
            <span class="inline-flex items-center px-2 py-0.5 rounded-md font-extrabold text-emerald-700 bg-emerald-100 text-xs">
              ${qty.toLocaleString('id-ID')} pcs
            </span>
          </td>
          <td class="px-4 py-3 text-center">
            <button 
              type="button" 
              onclick="openEditModal('${row.id}')"
              class="inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-600 hover:text-white text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
              title="Edit data ini tanpa hapus database"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Edit</span>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // 2. RENDER KARTU MOBILE
  if (riwayatCardsContainer) {
    riwayatCardsContainer.innerHTML = filtered.map((row, idx) => {
      const isHighlight = highlightId && (row.id == highlightId);
      const locDisplay = row.lokasi || row.namaSales || 'Gudang';
      const formattedDate = formatDisplayDate(row.tanggal);
      const qty = Number(row.jumlahProduk) || 0;

      return `
        <div class="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3 ${isHighlight ? 'highlight-edit' : ''}">
          <div class="min-w-0 flex-grow">
            <div class="flex items-center gap-1.5 mb-1">
              <span class="text-[10px] font-bold text-slate-400">#${idx + 1}</span>
              <span class="text-[10px] text-slate-300">•</span>
              <span class="text-[10px] font-semibold text-slate-500">${escapeHtml(formattedDate)}</span>
            </div>
            <h4 class="text-xs font-bold text-slate-900 truncate leading-tight">${escapeHtml(row.namaProduk || '-')}</h4>
            <div class="mt-1 flex items-center gap-1.5 flex-wrap">
              <span class="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <svg class="w-2.5 h-2.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span class="truncate max-w-[120px]">${escapeHtml(locDisplay)}</span>
              </span>
              <span class="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                ${qty.toLocaleString('id-ID')} pcs
              </span>
            </div>
          </div>

          <!-- Tombol Edit Mobile -->
          <button 
            type="button" 
            onclick="openEditModal('${row.id}')"
            class="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-xs active:bg-emerald-600 active:text-white transition cursor-pointer"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Edit</span>
          </button>
        </div>
      `;
    }).join('');
  }
}

// =========================================================================
// MODAL EDIT LOGIC
// =========================================================================
function populateEditProductSelect() {
  if (!editProdukSelect) return;
  editProdukSelect.innerHTML = '';
  PRODUCTS.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p;
    opt.textContent = p;
    editProdukSelect.appendChild(opt);
  });
}

function openEditModal(id) {
  const item = stokHistoryData.find(i => String(i.id) === String(id));
  if (!item) {
    showAlert('Data tidak ditemukan.', true);
    return;
  }

  if (modalAlertBox) modalAlertBox.classList.add('hidden');

  if (editRowId) editRowId.value = item.id || '';
  if (editOldTanggal) editOldTanggal.value = item.tanggal || '';
  if (editOldLokasi) editOldLokasi.value = item.lokasi || item.namaSales || '';
  if (editOldProduk) editOldProduk.value = item.namaProduk || '';
  if (editOldJumlah) editOldJumlah.value = item.jumlahProduk || '';

  if (editTanggalInput) editTanggalInput.value = normalizeDateForInput(item.tanggal);

  const rawLoc = extractRawLokasi(item.lokasi || item.namaSales || '');
  if (editLokasiInput) {
    editLokasiInput.value = rawLoc;
    handleEditLokasiInput(rawLoc);
  }

  if (editProdukSelect) {
    let found = false;
    for (let i = 0; i < editProdukSelect.options.length; i++) {
      if (editProdukSelect.options[i].value === item.namaProduk) {
        editProdukSelect.selectedIndex = i;
        found = true;
        break;
      }
    }
    if (!found && item.namaProduk) {
      const opt = document.createElement('option');
      opt.value = item.namaProduk;
      opt.textContent = item.namaProduk;
      opt.selected = true;
      editProdukSelect.appendChild(opt);
    }
  }

  if (editQtyInput) editQtyInput.value = Number(item.jumlahProduk) || 1;

  if (editModal) editModal.classList.remove('hidden');
}

function closeEditModal() {
  if (editModal) editModal.classList.add('hidden');
  if (modalAlertBox) modalAlertBox.classList.add('hidden');
}

function stepEditQty(delta) {
  if (!editQtyInput) return;
  let cur = parseInt(editQtyInput.value, 10);
  if (isNaN(cur)) cur = 1;
  cur += delta;
  if (cur < 1) cur = 1;
  editQtyInput.value = cur;
}

// Simpan Perubahan Edit ke Google Spreadsheet
async function handleSaveEdit() {
  const rowId = editRowId ? editRowId.value : '';
  const tanggal = editTanggalInput ? editTanggalInput.value : '';
  const rawLokasi = ((editLokasiInput && editLokasiInput.value) || '').trim();
  const namaProduk = editProdukSelect ? editProdukSelect.value : '';
  const qty = parseInt(editQtyInput ? editQtyInput.value : '0', 10);

  if (!tanggal) {
    showModalAlert('Tanggal wajib diisi!', true);
    return;
  }
  if (!rawLokasi) {
    showModalAlert('Lokasi penyimpanan wajib diisi!', true);
    if (editLokasiInput) editLokasiInput.focus();
    return;
  }
  if (!namaProduk) {
    showModalAlert('Pilih salah satu produk!', true);
    return;
  }
  if (isNaN(qty) || qty <= 0) {
    showModalAlert('Jumlah restok harus lebih dari 0!', true);
    if (editQtyInput) editQtyInput.focus();
    return;
  }

  const formattedLokasi = getFormattedLokasi(rawLokasi);

  if (btnSaveEdit) btnSaveEdit.disabled = true;
  if (saveEditSpinner) saveEditSpinner.classList.remove('hidden');
  if (saveEditBtnText) saveEditBtnText.textContent = 'Menyimpan...';

  try {
    const payload = {
      action: 'update',
      penanda: PENANDA_DIVISI,
      rowId: rowId,
      tanggal: tanggal,
      lokasi: formattedLokasi,
      namaLokasi: formattedLokasi,
      namaProduk: namaProduk,
      jumlahProduk: qty,
      oldTanggal: editOldTanggal ? editOldTanggal.value : '',
      oldLokasi: editOldLokasi ? editOldLokasi.value : '',
      oldNamaProduk: editOldProduk ? editOldProduk.value : '',
      oldJumlahProduk: editOldJumlah ? editOldJumlah.value : ''
    };

    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    });

    const result = await res.json();

    if (result.status === 'success') {
      const idx = stokHistoryData.findIndex(i => String(i.id) === String(rowId));
      if (idx !== -1) {
        stokHistoryData[idx] = {
          ...stokHistoryData[idx],
          tanggal: tanggal,
          lokasi: formattedLokasi,
          namaSales: formattedLokasi,
          namaProduk: namaProduk,
          jumlahProduk: qty
        };
      } else {
        const oldProdVal = editOldProduk ? editOldProduk.value : '';
        const oldTglVal = editOldTanggal ? editOldTanggal.value : '';
        const fallbackIdx = stokHistoryData.findIndex(i => i.namaProduk === oldProdVal && String(i.tanggal).includes(oldTglVal));
        if (fallbackIdx !== -1) {
          stokHistoryData[fallbackIdx] = {
            ...stokHistoryData[fallbackIdx],
            tanggal: tanggal,
            lokasi: formattedLokasi,
            namaSales: formattedLokasi,
            namaProduk: namaProduk,
            jumlahProduk: qty
          };
        }
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(stokHistoryData));
      updateRiwayatStats();
      closeEditModal();
      renderRiwayatList(rowId);

      showAlert(`✓ Berhasil memperbarui "${namaProduk}" (${qty.toLocaleString('id-ID')} pcs) di ${formattedLokasi}!`);
    } else {
      showModalAlert('Gagal update: ' + (result.message || 'Terjadi kesalahan.'), true);
    }

  } catch (err) {
    console.error(err);
    showModalAlert('Gagal mengirim pembaruan: ' + err.message, true);
  } finally {
    if (btnSaveEdit) btnSaveEdit.disabled = false;
    if (saveEditSpinner) saveEditSpinner.classList.add('hidden');
    if (saveEditBtnText) saveEditBtnText.textContent = 'Simpan Perubahan';
  }
}

// Hapus Baris dari Database jika Diperlukan
async function handleDeleteFromModal() {
  const rowId = editRowId ? editRowId.value : '';
  const prodName = editOldProduk ? editOldProduk.value : '';
  const qty = editOldJumlah ? editOldJumlah.value : '';

  if (!confirm(`Yakin ingin menghapus data restok "${prodName}" (${qty} pcs) dari database spreadsheet?`)) {
    return;
  }

  if (btnDeleteRow) {
    btnDeleteRow.disabled = true;
    btnDeleteRow.innerHTML = '<span class="animate-pulse">Menghapus...</span>';
  }

  try {
    const payload = {
      action: 'delete',
      penanda: PENANDA_DIVISI,
      rowId: rowId,
      namaProduk: prodName,
      oldNamaProduk: prodName
    };

    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    });

    const result = await res.json();

    if (result.status === 'success') {
      stokHistoryData = stokHistoryData.filter(i => String(i.id) !== String(rowId));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stokHistoryData));
      updateRiwayatStats();
      closeEditModal();
      renderRiwayatList();
      showAlert(`✓ Data "${prodName}" berhasil dihapus dari database.`);
    } else {
      showModalAlert('Gagal menghapus: ' + (result.message || 'Terjadi kesalahan.'), true);
    }

  } catch (err) {
    showModalAlert('Gagal menghubungi server: ' + err.message, true);
  } finally {
    if (btnDeleteRow) {
      btnDeleteRow.disabled = false;
      btnDeleteRow.innerHTML = `
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <span>Hapus</span>
      `;
    }
  }
}

function showModalAlert(msg, isError = false) {
  if (!modalAlertBox || !modalAlertMessage) return;
  modalAlertBox.classList.remove('hidden');
  modalAlertMessage.textContent = msg;
  if (isError) {
    modalAlertBox.className = 'mx-5 mt-4 p-3 rounded-xl text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between';
  } else {
    modalAlertBox.className = 'mx-5 mt-4 p-3 rounded-xl text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between';
  }
}

// =========================================================================
// HELPER DATE & NOTIFIKASI
// =========================================================================
function normalizeDateForInput(dateStr) {
  if (!dateStr) return '';
  const s = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    return s.substring(0, 10);
  }
  const parts = s.split(/[\/\-\.]/);
  if (parts.length === 3) {
    if (parts[2].length === 4) {
      const dd = parts[0].padStart(2, '0');
      const mm = parts[1].padStart(2, '0');
      const yyyy = parts[2];
      return `${yyyy}-${mm}-${dd}`;
    }
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return s;
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return '-';
  const norm = normalizeDateForInput(dateStr);
  if (/^\d{4}-\d{2}-\d{2}$/.test(norm)) {
    const [y, m, d] = norm.split('-');
    return `${d}/${m}/${y}`;
  }
  return String(dateStr);
}

function showAlert(msg, isError = false) {
  if (!alertBox || !alertMessage) return;
  alertBox.classList.remove('hidden');
  alertMessage.textContent = msg;
  if (isError) {
    alertBox.className = 'mb-5 p-4 rounded-xl text-sm font-medium fade-in shadow-xs bg-rose-50 border border-rose-200 text-rose-950 flex items-center justify-between';
    if (alertIcon) alertIcon.innerHTML = `<span class="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">!</span>`;
  } else {
    alertBox.className = 'mb-5 p-4 rounded-xl text-sm font-medium fade-in shadow-xs bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between';
    if (alertIcon) alertIcon.innerHTML = `<span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">✓</span>`;
  }
}

function showSuccessNotificationWithLink(msg, linkText) {
  if (!alertBox || !alertMessage) return;
  alertBox.classList.remove('hidden');
  alertBox.className = 'mb-5 p-4 rounded-xl text-sm font-medium fade-in shadow-xs bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between';
  if (alertIcon) alertIcon.innerHTML = `<span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">✓</span>`;
  
  alertMessage.innerHTML = `
    <span>${escapeHtml(msg)}</span>
    <button type="button" onclick="switchTabMode('riwayat')" class="ml-2 font-bold text-emerald-800 underline hover:text-emerald-950 cursor-pointer">
      ${escapeHtml(linkText)}
    </button>
  `;
}

function closeAlert() {
  if (alertBox) alertBox.classList.add('hidden');
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
