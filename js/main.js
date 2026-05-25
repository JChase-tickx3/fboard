
class StorageService {
  constructor() {
    this.txKey = 'fin_transactions';
    this.themeKey = 'fin_theme';
    this.currencyKey = 'fin_currency'; // Ключ для валюты
  }

  getTheme() {
    return localStorage.getItem(this.themeKey) || 'light';
  }

  setTheme(theme) {
    localStorage.setItem(this.themeKey, theme);
  }

  getCurrency() {
    return localStorage.getItem(this.currencyKey) || 'KZT';
  }

  setCurrency(currency) {
    localStorage.setItem(this.currencyKey, currency);
  }

  getTransactions() {
    const data = localStorage.getItem(this.txKey);
    if (!data) return [];
    return JSON.parse(data, (key, value) => {
      if (key === 'date') return new Date(value);
      return value;
    });
  }

  addTransaction(tx) {
    const transactions = this.getTransactions();
    tx.id = Date.now();
    tx.date = new Date();
    transactions.push(tx);
    localStorage.setItem(this.txKey, JSON.stringify(transactions));
  }

  deleteTransaction(id) {
    let transactions = this.getTransactions();
    transactions = transactions.filter(tx => tx.id !== id);
    localStorage.setItem(this.txKey, JSON.stringify(transactions));
  }
}

class Validator {
  static validateAmount(value) {
    const num = Number(value);
    if (!value || isNaN(num) || num <= 0) {
      return { isValid: false, message: 'Введите корректную сумму больше 0' };
    }
    return { isValid: true, message: '' };
  }

  static validateCategory(value) {
    if (!value || value.trim().length < 2) {
      return { isValid: false, message: 'Минимум 2 символа для названия' };
    }
    return { isValid: true, message: '' };
  }

  static validatePhone(value) {
    if (!value) return { isValid: true, message: '' }; // Необязательное поле
    const phoneRegex = /^\+7\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}$/;
    if (!phoneRegex.test(value)) {
      return { isValid: false, message: 'Формат: +7 (XXX) XXX-XX-XX' };
    }
    return { isValid: true, message: '' };
  }
}
class TransactionForm {
  constructor(formElement, onSubmitSuccess) {
    this.form = formElement;
    this.onSubmitSuccess = onSubmitSuccess;
    this.amountInput = document.getElementById('tx-amount');
    this.categoryInput = document.getElementById('tx-category');
    this.phoneInput = document.getElementById('tx-phone');
    this.typeSelect = document.getElementById('tx-type');

    this.initEvents();
  }

  initEvents() {
    this.phoneInput.addEventListener('input', (e) => {
      let matrix = '+7 (___) ___-__-__',
          i = 0,
          def = matrix.replace(/\D/g, ''),
          val = e.target.value.replace(/\D/g, '');
      if (def.length >= val.length) val = def;
      e.target.value = matrix.replace(/./g, function(a) {
          return /[_\d]/.test(a) && i < val.length ? val.charAt(i++) : i >= val.length ? '' : a;
      });
    });

    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  showError(input, message) {
    input.classList.add('form-input--error');
    const errSpan = input.nextElementSibling;
    if (errSpan && errSpan.classList.contains('form__error-message')) {
      errSpan.textContent = message;
    }
  }

  clearErrors() {
    this.form.querySelectorAll('.form-input').forEach(i => i.classList.remove('form-input--error'));
    this.form.querySelectorAll('.form__error-message').forEach(s => s.textContent = '');
  }

  handleSubmit(e) {
    e.preventDefault();
    this.clearErrors();

    const amountVal = this.amountInput.value.trim();
    const catVal = this.categoryInput.value.trim();
    const phoneVal = this.phoneInput.value.trim();

    const amountRes = Validator.validateAmount(amountVal);
    const catRes = Validator.validateCategory(catVal);
    const phoneRes = Validator.validatePhone(phoneVal);

    let isFormValid = true;

    if (!amountRes.isValid) { this.showError(this.amountInput, amountRes.message); isFormValid = false; }
    if (!catRes.isValid) { this.showError(this.categoryInput, catRes.message); isFormValid = false; }
    if (!phoneRes.isValid) { this.showError(this.phoneInput, phoneRes.message); isFormValid = false; }

    if (isFormValid) {
      this.onSubmitSuccess({
        amount: Number(amountVal),
        type: this.typeSelect.value,
        category: catVal,
        phone: phoneVal
      });
    }
  }
}
class Dashboard {
  constructor(storageService) {
    this.storage = storageService;
    
    this.elBalance = document.getElementById('val-balance');
    this.elIncome = document.getElementById('val-income');
    this.elExpense = document.getElementById('val-expense');
    this.elList = document.getElementById('transaction-list');
    this.elFilterCategory = document.getElementById('filter-category');

    this.fType = document.getElementById('filter-type');
    this.fCategory = document.getElementById('filter-category');
    this.fSearch = document.getElementById('filter-search');

    this.formatter = new Intl.NumberFormat('ru-KZ', { style: 'currency', currency: 'KZT', minimumFractionDigits: 0 });

    this.initFilters();
    this.updateDashboard();
  }

  initFilters() {
    const triggerUpdate = () => this.updateDashboard();
    if (this.fType) this.fType.addEventListener('change', triggerUpdate);
    if (this.fCategory) this.fCategory.addEventListener('change', triggerUpdate);
    if (this.fSearch) this.fSearch.addEventListener('input', triggerUpdate);
  }

  updateDashboard() {
    const transactions = this.storage.getTransactions();
    this.updateCategoriesDropdown(transactions);


    const filtered = transactions.filter(tx => {
      const typeMatch = !this.fType || this.fType.value === 'all' || tx.type === this.fType.value;
      const catMatch = !this.fCategory || this.fCategory.value === 'all' || tx.category === this.fCategory.value;
      
      let searchMatch = true;
      if (this.fSearch && this.fSearch.value.trim() !== '') {
        const query = this.fSearch.value.toLowerCase();
        searchMatch = tx.category.toLowerCase().includes(query);
      }
      return typeMatch && catMatch && searchMatch;
    });


    let total = 0, income = 0, expense = 0;
    transactions.forEach(tx => {
      if (tx.type === 'income') {
        income += tx.amount;
        total += tx.amount;
      } else {
        expense += tx.amount;
        total -= tx.amount;
      }
    });

    if (this.elBalance) this.elBalance.textContent = this.formatter.format(total);
    if (this.elIncome) this.elIncome.textContent = this.formatter.format(income);
    if (this.elExpense) this.elExpense.textContent = this.formatter.format(expense);

    this.renderTable(filtered);
  }

  updateCategoriesDropdown(transactions) {
    if (!this.elFilterCategory) return;
    const currentVal = this.elFilterCategory.value;
    
    const categories = new Set();
    transactions.forEach(tx => { if (tx.category) categories.add(tx.category); });

    this.elFilterCategory.innerHTML = '<option value="all">Все категории</option>';
    categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      this.elFilterCategory.appendChild(opt);
    });

    this.elFilterCategory.value = currentVal;
    if (!this.elFilterCategory.value) this.elFilterCategory.value = 'all';
  }

  renderTable(list) {
    if (!this.elList) return;
    this.elList.innerHTML = '';

    if (list.length === 0) {
      this.elList.innerHTML = `
        <tr class="transaction-table__row">
          <td colspan="5" class="transaction-table__cell" style="text-align:center; color: var(--color-text-muted);">
            Список транзакций пуст
          </td>
        </tr>`;
      return;
    }

    list.forEach(tx => {
      const row = document.createElement('tr');
      row.classList.add('transaction-table__row');

      const dateStr = tx.date ? new Date(tx.date).toLocaleDateString('ru-RU') : '-';
      const prefix = tx.type === 'income' ? '+' : '-';
      const valClass = tx.type === 'income' ? 'stats-card__amount--positive' : 'stats-card__amount--negative';
      const descStr = tx.phone ? `Перевод ${tx.phone}` : 'Электронный платёж';

      row.innerHTML = `
        <td class="transaction-table__cell" style="color: var(--color-text-muted); font-size:14px;">${dateStr}</td>
        <td class="transaction-table__cell" style="font-weight: 500;">${descStr}</td>
        <td class="transaction-table__cell"><span style="background: var(--color-bg-secondary); padding: 4px 8px; border-radius:4px; font-size:13px;">${tx.category}</span></td>
        <td class="transaction-table__cell transaction-table__cell--right ${valClass}">
          ${prefix} ${this.formatter.format(tx.amount)}
        </td>
        <td class="transaction-table__cell" style="text-align:center;">
          <button class="btn-delete" data-id="${tx.id}">Удалить</button>
        </td>
      `;
      this.elList.appendChild(row);
    });


    this.elList.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = Number(e.target.getAttribute('data-id'));
        this.storage.deleteTransaction(id);
        this.updateDashboard();
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const storage = new StorageService();
  const dashboard = new Dashboard(storage);

  const themeToggleBtn = document.getElementById('theme-toggle');
  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
  };
  applyTheme(storage.getTheme());

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = storage.getTheme();
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      storage.setTheme(newTheme);
      applyTheme(newTheme);
    });
  }

  const navLinks = document.querySelectorAll('.sidebar__link');
  const pageTitle = document.getElementById('page-title');
  const btnOpenModalHeader = document.getElementById('btn-open-modal');
  const sections = document.querySelectorAll('.view-section');

  const titles = {
    'overview': 'Обзор финансов',
    'transactions': 'История транзакций',
    'settings': 'Настройки системы'
  };

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = link.getAttribute('data-view');
      
      const targetSection = document.getElementById('view-' + targetView);
      if (!targetSection) return;

      sections.forEach(s => s.style.display = 'none');
      targetSection.style.display = 'block';

      navLinks.forEach(l => l.classList.remove('sidebar__link--active'));
      link.classList.add('sidebar__link--active');

      if (pageTitle) pageTitle.textContent = titles[targetView];
      if (btnOpenModalHeader) {
        btnOpenModalHeader.style.display = targetView === 'settings' ? 'none' : 'block';
      }
    });
  });

  const modal = document.getElementById('modal-transaction');
  const btnOpenModal = document.getElementById('btn-open-modal');
  const btnCancel = document.getElementById('btn-cancel');
  const btnCloseX = document.getElementById('btn-close-x');
  const formElement = document.getElementById('form-transaction');

  if (btnOpenModal && modal) btnOpenModal.addEventListener('click', () => modal.showModal());

  const closeModal = () => {
    if (formElement) formElement.reset();
    modal.querySelectorAll('.form__error-message').forEach(s => s.textContent = '');
    modal.querySelectorAll('.form-input').forEach(i => i.classList.remove('form-input--error'));
    modal.close();
  };

  if (btnCancel) btnCancel.addEventListener('click', closeModal);
  if (btnCloseX) btnCloseX.addEventListener('click', closeModal);

  if (formElement) {
    new TransactionForm(formElement, (formData) => {
      storage.addTransaction(formData);
      closeModal();
      dashboard.updateDashboard();
    });
  }
});