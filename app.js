// ==========================================================================
// 1. Data Store (LocalStorage & Dummy Initial)
// ==========================================================================
const STORAGE_KEY = "SYS_OPS_LOGS_2026";

// Ambil identitas user dari session login
const currentUser = JSON.parse(sessionStorage.getItem("active_user")) || { id: "000", name: "Guest" };

const defaultLogs = [
  { id: 1, date: "2026-09-02", type: "plus", unit: "game", amount: 65000, desc: "Jual Roblox Pet Huge" },
  { id: 2, date: "2026-09-05", type: "minus", unit: "operasional", amount: 35000, desc: "Beli kuota data tim" },
  { id: 3, date: "2026-09-10", type: "plus", unit: "hardware", amount: 150000, desc: "Repaste Thermal Paste ASUS TUF" },
  { id: 4, date: "2026-09-10", type: "minus", unit: "hardware", amount: 45000, desc: "Beli tube thermal paste" },
  { id: 5, date: "2026-09-15", type: "minus", unit: "game", amount: 80000, desc: "Restock Steam Wallet Code" },
  { id: 6, date: "2026-09-18", type: "plus", unit: "hardware", amount: 90000, desc: "Install Ulang Win 11 + Office" }
];

let logs = JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultLogs;

function saveLogs() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

// Helper: Format tanggal YYYY-MM-DD ke format Indo DD/MM/YYYY
function formatToIndo(dateStr) {
  if (!dateStr) return "-";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

// ==========================================================================
// 2. Global State Waktu & Filter Sinkron
// ==========================================================================
let currentYear = 2026;
let currentMonth = 8; // September (0-indexed: 0 = Jan, 8 = Sep)

const monthNames = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const monthSelect = document.getElementById("stat-month");
const yearSelect = document.getElementById("stat-year");
const monthLabel = document.getElementById("current-month-label");
const prevBtn = document.getElementById("prev-month");
const nextBtn = document.getElementById("next-month");

function syncSelectors() {
  if (monthSelect) monthSelect.value = currentMonth;
  if (yearSelect) yearSelect.value = currentYear;
  if (monthLabel) monthLabel.textContent = `${monthNames[currentMonth]} ${currentYear}`;
}

function updateAppView() {
  syncSelectors();
  renderCalendar();
  updateMetricsAndChart();

  // TAMBAHAN: Ganti tulisan ACTIVE TEAM jadi nama user yang login
  const userBadge = document.getElementById("user-badge");
  if (userBadge) {
    userBadge.textContent = `USER: ${currentUser.name} [${currentUser.id}]`;
  }
  const vaultBtn = document.getElementById("vault-nav-btn");
  if (vaultBtn && (currentUser.role === "evaluator" || currentUser.id === "001")) {
    vaultBtn.style.display = "none";
  }
}

// Listener dropdown filter bulan & tahun
if (monthSelect && yearSelect) {
  monthSelect.addEventListener("change", (e) => {
    currentMonth = parseInt(e.target.value, 10);
    updateAppView();
  });

  yearSelect.addEventListener("change", (e) => {
    currentYear = parseInt(e.target.value, 10);
    updateAppView();
  });
}

// Navigasi kalender (< dan >)
if (prevBtn && nextBtn) {
  prevBtn.addEventListener("click", () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    updateAppView();
  });

  nextBtn.addEventListener("click", () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    updateAppView();
  });
}

// ==========================================================================
// 3. Render Kalender (Blok Penuh: Hijau / Merah / Abu-abu)
// ==========================================================================
const daysContainer = document.getElementById("calendar-days-container");

function renderCalendar() {
  if (!daysContainer) return;
  daysContainer.innerHTML = "";

  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Padding hari kosong di awal bulan
  for (let i = 0; i < firstDayIndex; i++) {
    const empty = document.createElement("div");
    daysContainer.appendChild(empty);
  }

  // Render kotak tiap hari dengan Micro-LED Indicators
  for (let day = 1; day <= totalDays; day++) {
    const cell = document.createElement("div");
    cell.className = "calendar-day-cell";

    // Elemen angka hari (di atas)
    const dayNum = document.createElement("span");
    dayNum.className = "cell-day-num";
    dayNum.textContent = day;
    cell.appendChild(dayNum);

    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayLogs = logs.filter(item => item.date === dateStr);

    if (dayLogs.length > 0) {
      let dayIncome = 0;
      let dayExpense = 0;
      const unitSet = new Set(); // Himpunan unit unik biar LED gak dobel

      dayLogs.forEach(l => {
        if (l.type === "plus") dayIncome += l.amount;
        if (l.type === "minus") dayExpense += l.amount;
        if (l.unit) unitSet.add(l.unit.toLowerCase());
      });

      // Net calculation: Hijau jika Surplus, Merah jika Defisit
      if (dayIncome > dayExpense) {
        cell.classList.add("status-surplus");
      } else if (dayExpense > dayIncome) {
        cell.classList.add("status-deficit");
      }

      // Render Barisan Micro-LED di bawah tanggal
      const dotsContainer = document.createElement("div");
      dotsContainer.className = "cell-dots";

      if (unitSet.has("game")) {
        const dot = document.createElement("span");
        dot.className = "dot-unit dot-game";
        dot.title = "Unit 01: Game";
        dotsContainer.appendChild(dot);
      }
      if (unitSet.has("hardware")) {
        const dot = document.createElement("span");
        dot.className = "dot-unit dot-hardware";
        dot.title = "Unit 02: Hardware & Servis";
        dotsContainer.appendChild(dot);
      }
      if (unitSet.has("operasional")) {
        const dot = document.createElement("span");
        dot.className = "dot-unit dot-operasional";
        dot.title = "Operasional Tim";
        dotsContainer.appendChild(dot);
      }

      cell.appendChild(dotsContainer);
    } else {
      // Placeholder kosong transparan biar posisi angka tetap rapi di atas
      const emptySpacer = document.createElement("div");
      emptySpacer.className = "cell-dots";
      cell.appendChild(emptySpacer);
    }

    cell.addEventListener("click", () => openDateModal(dateStr));
    daysContainer.appendChild(cell);
  }
}
// ==========================================================================
// 4. Modal Popup & Fitur Hapus Log
// ==========================================================================
const modal = document.getElementById("date-modal");
const modalTitle = document.getElementById("modal-date-title");
const modalList = document.getElementById("modal-log-list");
const modalCloseBtn = document.getElementById("modal-close-btn");

function openDateModal(dateStr) {
  modalTitle.textContent = `Log Transaksi: ${formatToIndo(dateStr)}`;
  modalList.innerHTML = "";

  const dayLogs = logs.filter(item => item.date === dateStr);

  if (dayLogs.length === 0) {
    modalList.innerHTML = `<p style="color: #8b949e; font-size: 0.85rem; padding: 8px 0;">Tidak ada aktivitas transaksi di tanggal ini.</p>`;
  } else {
    dayLogs.forEach(item => {
      const itemRow = document.createElement("div");
      itemRow.style.cssText = "padding: 10px 0; border-bottom: 1px dashed rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center;";

      const isPlus = item.type === "plus";
      const sign = isPlus ? "+" : "-";
      const color = isPlus ? "#7ee787" : "#ff7b72";

itemRow.innerHTML = `
        <div style="font-size: 0.85rem; line-height: 1.4;">
          <strong style="color: #58a6ff;">[${item.unit.toUpperCase()}]</strong> ${item.desc}
          <div style="color: ${color}; font-weight: bold; margin-top: 2px;">
            ${sign}Rp ${item.amount.toLocaleString("id-ID")}
          </div>
          <div style="font-size: 0.75rem; color: #8b949e; margin-top: 2px;">
            Input by: ${item.author || "System"}
          </div>
        </div>
        <button class="btn-delete" data-id="${item.id}">[Hapus]</button>
      `;

      // Event listener tombol hapus
      itemRow.querySelector(".btn-delete").addEventListener("click", () => {
        deleteLogItem(item.id, dateStr);
      });

      modalList.appendChild(itemRow);
    });
  }

  modal.style.display = "flex";
}

function deleteLogItem(id, dateStr) {
  const targetItem = logs.find(item => item.id === id);
  const targetDesc = targetItem ? targetItem.desc : "transaksi";
  
  // Konfirmasi audit: tercatat siapa yang menghapus
  const yakin = confirm(`HAPUS LOG:\n"${targetDesc}"\n\nTindakan penghapusan ini dilakukan oleh: ${currentUser.name} [${currentUser.id}]. Lanjutkan?`);
  
  if (yakin) {
    logs = logs.filter(item => item.id !== id);
    saveLogs();
    openDateModal(dateStr);
    updateAppView();
  }
}

if (modalCloseBtn) {
  modalCloseBtn.addEventListener("click", () => modal.style.display = "none");
}
window.addEventListener("click", (e) => {
  if (e.target === modal) modal.style.display = "none";
});

// ==========================================================================
// 5. Form Input Data
// ==========================================================================
const logForm = document.getElementById("log-form");

if (logForm) {
  logForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const inputDate = document.getElementById("log-date").value;
    const newLog = {
      id: Date.now(),
      date: inputDate,
      type: document.getElementById("log-type").value,
      unit: document.getElementById("log-unit").value,
      amount: parseInt(document.getElementById("log-amount").value, 10),
      desc: document.getElementById("log-desc").value,
      author: `${currentUser.name} [${currentUser.id}]`
    };

    logs.push(newLog);
    saveLogs();
    logForm.reset();

    // Auto geser kalender & filter ke bulan transaksi yang baru diinput
    const [y, m] = inputDate.split("-");
    currentYear = parseInt(y, 10);
    currentMonth = parseInt(m, 10) - 1;

    updateAppView();
  });
}

// ==========================================================================
// 6. Metrics & Chart.js (Filtered by Month/Year)
// ==========================================================================
let chartInstance = null;

function updateMetricsAndChart() {
  const totalIncomeEl = document.getElementById("total-income");
  const totalExpenseEl = document.getElementById("total-expense");
  const statusEl = document.getElementById("traffic-status");
  const chartCanvas = document.getElementById("performanceChart");

  if (!chartCanvas) return;

  // Filter logs khusus bulan dan tahun yang lagi dipilih
  const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
  const filteredLogs = logs.filter(l => l.date.startsWith(prefix));

  let totalIncome = 0;
  let totalExpense = 0;

  // Agregasi harian untuk grafik
  const dailyMap = {};
  filteredLogs.forEach(l => {
    if (l.type === "plus") totalIncome += l.amount;
    if (l.type === "minus") totalExpense += l.amount;

    if (!dailyMap[l.date]) dailyMap[l.date] = { income: 0, expense: 0 };
    if (l.type === "plus") dailyMap[l.date].income += l.amount;
    if (l.type === "minus") dailyMap[l.date].expense += l.amount;
  });

  // Render nilai metrik
  if (totalIncomeEl) totalIncomeEl.textContent = `Rp ${totalIncome.toLocaleString("id-ID")}`;
  if (totalExpenseEl) totalExpenseEl.textContent = `Rp ${totalExpense.toLocaleString("id-ID")}`;

  if (statusEl) {
    const net = totalIncome - totalExpense;
    if (filteredLogs.length === 0) {
      statusEl.textContent = "Netral (Rp 0)";
      statusEl.style.color = "#8b949e";
    } else {
      statusEl.textContent = net >= 0 
        ? `Surplus (+Rp ${net.toLocaleString("id-ID")})` 
        : `Defisit (-Rp ${Math.abs(net).toLocaleString("id-ID")})`;
      statusEl.style.color = net >= 0 ? "#7ee787" : "#ff7b72";
    }
  }

  // Data point untuk Chart.js (hanya tanggal yang ada transaksi)
  const sortedDates = Object.keys(dailyMap).sort();
  const chartLabels = sortedDates.map(d => formatToIndo(d));
  const incomePoints = sortedDates.map(d => dailyMap[d].income);
  const expensePoints = sortedDates.map(d => dailyMap[d].expense);

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(chartCanvas, {
    type: "line",
    data: {
      labels: chartLabels.length > 0 ? chartLabels : ["Tidak ada data transaksi bulan ini"],
      datasets: [
        {
          label: "Pemasukan (Plus)",
          data: chartLabels.length > 0 ? incomePoints : [0],
          borderColor: "#3fb950",
          backgroundColor: "rgba(63, 185, 80, 0.15)",
          tension: 0.3,
          fill: true
        },
        {
          label: "Pengeluaran (Minus)",
          data: chartLabels.length > 0 ? expensePoints : [0],
          borderColor: "#f85149",
          backgroundColor: "rgba(248, 81, 73, 0.15)",
          tension: 0.3,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: "#c9d1d9", font: { family: "monospace" } } }
      },
      scales: {
        x: {
          ticks: { color: "#8b949e", font: { family: "monospace" } },
          grid: { color: "rgba(255, 255, 255, 0.05)" }
        },
        y: {
          ticks: { color: "#8b949e", font: { family: "monospace" } },
          grid: { color: "rgba(255, 255, 255, 0.05)" }
        }
      }
    }
  });
}

// ==========================================================================
// 7. Utility Controls: Backup JSON, Reset Data, & Logout
// ==========================================================================
const backupBtn = document.getElementById("backup-btn");
const resetBtn = document.getElementById("reset-btn");
const logoutBtn = document.getElementById("logout-btn");

if (backupBtn) {
  backupBtn.addEventListener("click", () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `Backup_Ops_${currentYear}_${currentMonth + 1}.json`);
    dlAnchor.click();
  });
}

if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    if (confirm("Reset ulang data transaksi ke data default awal?")) {
      logs = [...defaultLogs];
      saveLogs();
      updateAppView();
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem("ops_auth");
  });
}

// Inisialisasi awal pas DOM ready
document.addEventListener("DOMContentLoaded", () => {
  updateAppView();
});