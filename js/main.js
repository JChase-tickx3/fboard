
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

