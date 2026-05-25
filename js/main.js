
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

