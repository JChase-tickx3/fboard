"use strict";
alert("Ура, JavaScript работает я так этому рад, а то он не хотел работать!");
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