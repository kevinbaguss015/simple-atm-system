// ==================== CONFIGURATION & CONSTANTS ====================
const DEFAULT_BALANCE = 5000000;
const DEFAULT_PIN = "123456";
const USER_ACCOUNT_NAME = "Budi Setiawan";

const SIMULATED_ACCOUNTS = [
  { account: "81203912", name: "Siti Rahmawati" },
  { account: "50293121", name: "Andi Saputra" },
  { account: "20193811", name: "Rian Hidayat" },
  { account: "12345678", name: "PT. Maju Bersama" }
];

const DEFAULT_HISTORY = [
  {
    id: "tx-initial-1",
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toLocaleString('id-ID'),
    type: 'income',
    desc: 'Saldo Awal Rekening',
    amount: 5000000
  },
  {
    id: "tx-initial-2",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleString('id-ID'),
    type: 'expense',
    desc: 'Transfer Ke Siti Rahmawati',
    amount: 350000
  },
  {
    id: "tx-initial-3",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toLocaleString('id-ID'),
    type: 'income',
    desc: 'Top Up LinkAja via ATM',
    amount: 150000
  }
];

// ==================== STATE MANAGEMENT ====================
let state = {
  balance: DEFAULT_BALANCE,
  pin: DEFAULT_PIN,
  history: [...DEFAULT_HISTORY],
  activeFilter: 'all'
};

let pendingTransaction = null;
let pinBuffer = "";

// ==================== INITIALIZATION ====================
document.addEventListener("DOMContentLoaded", () => {
  loadStateFromLocalStorage();
  updateClock();
  setInterval(updateClock, 1000);
  renderDashboard();
});

function loadStateFromLocalStorage() {
  const storedBalance = localStorage.getItem("atm_balance");
  const storedPin = localStorage.getItem("atm_pin");
  const storedHistory = localStorage.getItem("atm_history");

  if (storedBalance !== null) {
    state.balance = parseInt(storedBalance, 10);
  } else {
    localStorage.setItem("atm_balance", state.balance);
  }

  if (storedPin !== null) {
    state.pin = storedPin;
  } else {
    localStorage.setItem("atm_pin", state.pin);
  }

  if (storedHistory !== null) {
    state.history = JSON.parse(storedHistory);
  } else {
    localStorage.setItem("atm_history", JSON.stringify(state.history));
  }
}

function saveStateToLocalStorage() {
  localStorage.setItem("atm_balance", state.balance);
  localStorage.setItem("atm_pin", state.pin);
  localStorage.setItem("atm_history", JSON.stringify(state.history));
}

// ==================== RENDER FUNCTIONS ====================
function renderDashboard() {
  document.getElementById("user-name").innerText = USER_ACCOUNT_NAME;
  document.getElementById("user-balance").innerText = formatRupiah(state.balance);
  renderHistory();
  renderSummary();
}

function renderHistory() {
  const container = document.getElementById("history-container");
  const searchVal = document.getElementById("search-history").value.toLowerCase();
  
  let filtered = state.history;

  if (state.activeFilter === 'income') {
    filtered = filtered.filter(tx => tx.type === 'income');
  } else if (state.activeFilter === 'expense') {
    filtered = filtered.filter(tx => tx.type === 'expense');
  }

  if (searchVal.trim() !== "") {
    filtered = filtered.filter(tx => 
      tx.desc.toLowerCase().includes(searchVal) || 
      tx.amount.toString().includes(searchVal) ||
      tx.timestamp.includes(searchVal)
    );
  }

  document.getElementById("history-count").innerText = `${filtered.length} Transaksi`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-slate-400 text-xs">
        <i class="fa-regular fa-folder-open text-3xl mb-1.5 block text-slate-300"></i>
        Tidak ada riwayat transaksi ditemukan
      </div>
    `;
    return;
  }

  const displayList = [...filtered].reverse();

  container.innerHTML = displayList.map(tx => {
    const isIncome = tx.type === 'income';
    const colorClass = isIncome ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50';
    const sign = isIncome ? '+' : '-';
    const icon = isIncome ? 'fa-arrow-down-left' : 'fa-arrow-up-right';

    return `
      <div class="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
        <div class="flex items-center space-x-3">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center ${colorClass} text-sm">
            <i class="fa-solid ${icon}"></i>
          </div>
          <div class="space-y-0.5">
            <h5 class="text-xs font-bold text-slate-800">${tx.desc}</h5>
            <p class="text-[10px] text-slate-400">${tx.timestamp}</p>
          </div>
        </div>
        <div class="text-right">
          <span class="text-xs font-bold ${isIncome ? 'text-emerald-600' : 'text-rose-600'}">
            ${sign} Rp${formatRupiah(tx.amount)}
          </span>
        </div>
      </div>
    `;
  }).join('');
}

function renderSummary() {
  let totalIncome = 0;
  let totalExpense = 0;

  state.history.forEach(tx => {
    if (tx.type === 'income') {
      totalIncome += tx.amount;
    } else {
      totalExpense += tx.amount;
    }
  });

  document.getElementById("total-income").innerText = `Rp${formatRupiah(totalIncome)}`;
  document.getElementById("total-expense").innerText = `Rp${formatRupiah(totalExpense)}`;
}

// ==================== INTERACTION LOGIC ====================
function useQuickDestination() {
  const randomAccount = SIMULATED_ACCOUNTS[Math.floor(Math.random() * SIMULATED_ACCOUNTS.length)];
  document.getElementById("dest-account").value = randomAccount.account;
  document.getElementById("dest-name").value = randomAccount.name;
  showCustomNotification("success", "Rekening Ditemukan", `Berhasil menyalin data:\n${randomAccount.name}\nRek: ${randomAccount.account}`);
}

function setQuickAmount(amount) {
  document.getElementById("transfer-amount").value = amount;
}

function handleTransferSubmit(e) {
  e.preventDefault();

  const destAccount = document.getElementById("dest-account").value.trim();
  const destName = document.getElementById("dest-name").value.trim();
  const amount = parseInt(document.getElementById("transfer-amount").value, 10);

  if (!destAccount || !destName || isNaN(amount)) {
    showCustomNotification("error", "Error Input", "Semua kolom input wajib diisi!");
    return;
  }

  if (amount < 10000) {
    showCustomNotification("error", "Error Transfer", "Nominal transfer minimal adalah Rp10.000");
    return;
  }

  if (amount > state.balance) {
    showCustomNotification("error", "Saldo Tidak Cukup", "Saldo rekening Anda tidak mencukupi.");
    return;
  }

  pendingTransaction = {
    type: 'expense',
    desc: `Transfer ke ${destName} (${destAccount})`,
    amount: amount,
    action: () => {
      state.balance -= amount;
      state.history.push({
        id: 'tx-' + Date.now(),
        timestamp: new Date().toLocaleString('id-ID'),
        type: 'expense',
        desc: `Transfer ke ${destName}`,
        amount: amount
      });

      saveStateToLocalStorage();
      renderDashboard();
      document.getElementById("transfer-form").reset();

      showCustomNotification("success", "Transfer Berhasil", `Berhasil mentransfer Rp${formatRupiah(amount)}
Ke: ${destName}`);
    }
  };

  openPinVerification();
}

function handleTopupSubmit(e) {
  e.preventDefault();
  const amount = parseInt(document.getElementById("topup-amount").value, 10);
  const source = document.getElementById("topup-source").value;

  if (isNaN(amount) || amount < 10000) {
    showCustomNotification("error", "Error Pengisian", "Nominal minimal Rp10.000");
    return;
  }

  state.balance += amount;
  state.history.push({
    id: 'tx-' + Date.now(),
    timestamp: new Date().toLocaleString('id-ID'),
    type: 'income',
    desc: source,
    amount: amount
  });

  saveStateToLocalStorage();
  renderDashboard();
  closeModal('modal-topup');
  document.getElementById("topup-form").reset();
  showCustomNotification("success", "Tambah Saldo Berhasil", `Saldo Anda bertambah Rp${formatRupiah(amount)}`);
}

function handleChangePinSubmit(e) {
  e.preventDefault();
  const oldPin = document.getElementById("pin-old").value;
  const newPin = document.getElementById("pin-new").value;

  if (oldPin !== state.pin) {
    showCustomNotification("error", "PIN Lama Salah", "Verifikasi PIN lama tidak cocok.");
    return;
  }

  if (newPin.length !== 6 || isNaN(newPin)) {
    showCustomNotification("error", "PIN Baru Tidak Valid", "PIN harus 6 digit angka.");
    return;
  }

  state.pin = newPin;
  saveStateToLocalStorage();
  closeModal('modal-change-pin');
  document.getElementById("change-pin-form").reset();
  showCustomNotification("success", "PIN Berhasil Diubah", "PIN keamanan baru Anda telah aktif.");
}

function filterHistory(type) {
  state.activeFilter = type;
  const filters = ['all', 'income', 'expense'];
  filters.forEach(f => {
    const btn = document.getElementById(`filter-${f}`);
    if (f === type) {
      btn.className = "px-3 py-1 rounded-lg text-xs font-semibold transition-colors bg-blue-600 text-white";
    } else {
      btn.className = "px-3 py-1 rounded-lg text-xs font-semibold transition-colors bg-slate-100 text-slate-600 hover:bg-slate-200";
    }
  });
  renderHistory();
}

// ==================== PIN PROCESSOR ====================
function openPinVerification() {
  pinBuffer = "";
  updatePinDots();
  openModal('modal-pin');
  setTimeout(() => { document.getElementById("pin-input-field").focus(); }, 100);
}

document.getElementById("pin-input-field").addEventListener("input", (e) => {
  const val = e.target.value;
  if (/^\d*$/.test(val)) {
    pinBuffer = val.substring(0, 6);
    updatePinDots();
    if (pinBuffer.length === 6) verifyEnteredPin();
  } else {
    e.target.value = pinBuffer;
  }
});

function pressPin(num) {
  if (pinBuffer.length < 6) {
    pinBuffer += num;
    updatePinDots();
  }
  if (pinBuffer.length === 6) setTimeout(verifyEnteredPin, 150);
}

function backspacePin() {
  if (pinBuffer.length > 0) {
    pinBuffer = pinBuffer.slice(0, -1);
    updatePinDots();
    document.getElementById("pin-input-field").value = pinBuffer;
  }
}

function clearPin() {
  pinBuffer = "";
  updatePinDots();
  document.getElementById("pin-input-field").value = "";
}

function updatePinDots() {
  const dots = document.querySelectorAll(".pin-dot");
  dots.forEach((dot, index) => {
    if (index < pinBuffer.length) {
      dot.classList.remove("border-slate-300", "bg-white");
      dot.classList.add("bg-blue-600", "border-blue-600");
    } else {
      dot.classList.remove("bg-blue-600", "border-blue-600");
      dot.classList.add("border-slate-300", "bg-white");
    }
  });
}

function verifyEnteredPin() {
  if (pinBuffer === state.pin) {
    closeModal('modal-pin');
    if (pendingTransaction && pendingTransaction.action) pendingTransaction.action();
    pendingTransaction = null;
  } else {
    closeModal('modal-pin');
    pendingTransaction = null;
    showCustomNotification("error", "Transaksi Batal", "PIN salah. Transaksi dibatalkan.");
  }
  clearPin();
}

function cancelPinVerification() {
  closeModal('modal-pin');
  pendingTransaction = null;
  clearPin();
}

// ==================== HELPERS & UI MODALS ====================
function formatRupiah(number) {
  return new Intl.NumberFormat('id-ID').format(number);
}

function updateClock() {
  const clockEl = document.getElementById("digital-clock");
  const now = new Date();
  clockEl.innerText = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove("hidden");
    setTimeout(() => {
      modal.firstElementChild.classList.remove("scale-95");
      modal.firstElementChild.classList.add("scale-100");
    }, 10);
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.firstElementChild.classList.remove("scale-100");
    modal.firstElementChild.classList.add("scale-95");
    setTimeout(() => { modal.classList.add("hidden"); }, 200);
  }
}

function showCustomNotification(type, title, msg) {
  const modal = document.getElementById("modal-notif");
  const iconBox = document.getElementById("notif-icon-box");
  const icon = document.getElementById("notif-icon");
  const titleEl = document.getElementById("notif-title");
  const msgEl = document.getElementById("notif-msg");

  if (type === "success") {
    iconBox.className = "w-16 h-16 rounded-full flex items-center justify-center mx-auto text-3xl mb-4 bg-emerald-100 text-emerald-600";
    icon.className = "fa-solid fa-circle-check";
  } else {
    iconBox.className = "w-16 h-16 rounded-full flex items-center justify-center mx-auto text-3xl mb-4 bg-rose-100 text-rose-600";
    icon.className = "fa-solid fa-circle-xmark";
  }

  titleEl.innerText = title;
  msgEl.innerText = msg;
  openModal("modal-notif");
}

function resetData() {
  if (confirm("Apakah Anda yakin ingin mereset seluruh data simulasi ke pengaturan awal?")) {
    localStorage.clear();
    state.balance = DEFAULT_BALANCE;
    state.pin = DEFAULT_PIN;
    state.history = [...DEFAULT_HISTORY];
    state.activeFilter = 'all';
    saveStateToLocalStorage();
    renderDashboard();
    showCustomNotification("success", "Reset Berhasil", "Semua data dikembalikan ke default awal.");
  }
}
