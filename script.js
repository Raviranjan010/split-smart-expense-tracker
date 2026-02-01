  // Data Storage
let people = [];
let expenses = [];

// DOM Elements
const expenseForm = document.getElementById('expenseForm');
const personNameInput = document.getElementById('personName');
const addPersonBtn = document.getElementById('addPersonBtn');
const peopleList = document.getElementById('peopleList');
const expensesList = document.getElementById('expensesList');
const settlementSummary = document.getElementById('settlementSummary');
const totalBalanceEl = document.getElementById('totalBalance');
const paidBySelect = document.getElementById('paidBy');
const splitBetweenDiv = document.getElementById('splitBetween');
const clearAllBtn = document.getElementById('clearAllBtn');

// Category Icons
const categoryIcons = {
    food: '🍔',
    transport: '🚗',
    entertainment: '🎬',
    shopping: '🛍️',
    bills: '💡',
    other: '📦'
};

// Initialize App
function init() {
    loadData();
    renderPeople();
    renderExpenses();
    updateSettlement();
    updateTotalBalance();
    
    // Event Listeners
    addPersonBtn.addEventListener('click', addPerson);
    personNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addPerson();
    });
    expenseForm.addEventListener('submit', addExpense);
    clearAllBtn.addEventListener('click', clearAllData);
}

// Local Storage Functions
function saveData() {
    localStorage.setItem('splitSmartPeople', JSON.stringify(people));
    localStorage.setItem('splitSmartExpenses', JSON.stringify(expenses));
}

function loadData() {
    const savedPeople = localStorage.getItem('splitSmartPeople');
    const savedExpenses = localStorage.getItem('splitSmartExpenses');
    
    if (savedPeople) people = JSON.parse(savedPeople);
    if (savedExpenses) expenses = JSON.parse(savedExpenses);
}

// Person Management
function addPerson() {
    const name = personNameInput.value.trim();
    
    if (!name) {
        alert('Please enter a person name');
        return;
    }
    
    if (people.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        alert('Person already exists');
        return;
    }
    
    people.push({
        id: Date.now(),
        name: name,
        balance: 0
    });
    
    personNameInput.value = '';
    saveData();
    renderPeople();
    updatePaidBySelect();
    updateSplitBetween();
}

function removePerson(id) {
    if (confirm('Are you sure? This will remove all expenses related to this person.')) {
        people = people.filter(p => p.id !== id);
        expenses = expenses.filter(e => {
            return e.paidBy !== id && !e.splitBetween.includes(id);
        });
        saveData();
        renderPeople();
        renderExpenses();
        updateSettlement();
        updateTotalBalance();
        updatePaidBySelect();
        updateSplitBetween();
    }
}

function renderPeople() {
    if (people.length === 0) {
        peopleList.innerHTML = '<div class="no-data">No people added yet. Add someone to get started!</div>';
        return;
    }
    
    peopleList.innerHTML = people.map(person => {
        const balance = calculatePersonBalance(person.id);
        const balanceClass = balance > 0 ? 'positive' : balance < 0 ? 'negative' : 'neutral';
        const balanceText = balance > 0 ? `+$${balance.toFixed(2)}` : balance < 0 ? `-$${Math.abs(balance).toFixed(2)}` : '$0.00';
        
        return `
            <div class="person-card">
                <div class="person-info">
                    <div class="person-name">${person.name}</div>
                    <div class="person-balance ${balanceClass}">${balanceText}</div>
                </div>
                <button class="btn btn-danger" onclick="removePerson(${person.id})">×</button>
            </div>
        `;
    }).join('');
}

function updatePaidBySelect() {
    const currentValue = paidBySelect.value;
    paidBySelect.innerHTML = '<option value="">Select person</option>' +
        people.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    if (currentValue) paidBySelect.value = currentValue;
}

function updateSplitBetween() {
    splitBetweenDiv.innerHTML = people.map(p => `
        <div class="checkbox-item">
            <input type="checkbox" id="split_${p.id}" value="${p.id}" checked>
            <label for="split_${p.id}">${p.name}</label>
        </div>
    `).join('');
}

// Expense Management
function addExpense(e) {
    e.preventDefault();
    
    const description = document.getElementById('description').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const paidBy = parseInt(paidBySelect.value);
    const category = document.getElementById('category').value;
    
    const splitCheckboxes = document.querySelectorAll('#splitBetween input[type="checkbox"]:checked');
    const splitBetween = Array.from(splitCheckboxes).map(cb => parseInt(cb.value));
    
    if (!paidBy || splitBetween.length === 0) {
        alert('Please select who paid and who to split between');
        return;
    }
    
    const expense = {
        id: Date.now(),
        description,
        amount,
        paidBy,
        category,
        splitBetween,
        date: new Date().toISOString()
    };
    
    expenses.unshift(expense);
    saveData();
    expenseForm.reset();
    updateSplitBetween();
    renderExpenses();
    updateSettlement();
    updateTotalBalance();
    renderPeople();
}

function removeExpense(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        expenses = expenses.filter(e => e.id !== id);
        saveData();
        renderExpenses();
        updateSettlement();
        updateTotalBalance();
        renderPeople();
    }
}

function renderExpenses() {
    if (expenses.length === 0) {
        expensesList.innerHTML = '<div class="no-data">No expenses yet. Add your first expense above!</div>';
        return;
    }
    
    expensesList.innerHTML = expenses.map(expense => {
        const payer = people.find(p => p.id === expense.paidBy);
        const splitNames = expense.splitBetween.map(id => {
            const person = people.find(p => p.id === id);
            return person ? person.name : 'Unknown';
        }).join(', ');
        
        const date = new Date(expense.date);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        return `
            <div class="expense-item">
                <div class="expense-icon">${categoryIcons[expense.category]}</div>
                <div class="expense-details">
                    <div class="expense-description">${expense.description}</div>
                    <div class="expense-meta">Paid by ${payer ? payer.name : 'Unknown'} • ${dateStr}</div>
                    <div class="expense-split">Split between: ${splitNames}</div>
                </div>
                <div class="expense-right">
                    <div class="expense-amount">$${expense.amount.toFixed(2)}</div>
                    <button class="btn btn-danger" onclick="removeExpense(${expense.id})">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// Balance Calculations
function calculatePersonBalance(personId) {
    let balance = 0;
    
    expenses.forEach(expense => {
        // If person paid
        if (expense.paidBy === personId) {
            balance += expense.amount;
        }
        
        // If person is in split
        if (expense.splitBetween.includes(personId)) {
            balance -= expense.amount / expense.splitBetween.length;
        }
    });
    
    return balance;
}

function updateTotalBalance() {
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    totalBalanceEl.textContent = `$${total.toFixed(2)}`;
}

// Settlement Calculations
function updateSettlement() {
    const balances = people.map(person => ({
        id: person.id,
        name: person.name,
        balance: calculatePersonBalance(person.id)
    }));
    
    const debtors = balances.filter(p => p.balance < 0).sort((a, b) => a.balance - b.balance);
    const creditors = balances.filter(p => p.balance > 0).sort((a, b) => b.balance - a.balance);
    
    const settlements = [];
    
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
        const debtor = { ...debtors[i] };
        const creditor = { ...creditors[j] };
        
        const amount = Math.min(Math.abs(debtor.balance), creditor.balance);
        
        settlements.push({
            from: debtor.name,
            to: creditor.name,
            amount: amount
        });
        
        debtors[i].balance += amount;
        creditors[j].balance -= amount;
        
        if (Math.abs(debtors[i].balance) < 0.01) i++;
        if (Math.abs(creditors[j].balance) < 0.01) j++;
    }
    
    if (settlements.length === 0) {
        settlementSummary.innerHTML = '<div class="no-data">All settled up! 🎉</div>';
        return;
    }
    
    settlementSummary.innerHTML = settlements.map(s => `
        <div class="settlement-item">
            <div class="settlement-text">
                <strong>${s.from}</strong> pays <strong>${s.to}</strong>
            </div>
            <div class="settlement-arrow">→</div>
            <div class="settlement-amount">$${s.amount.toFixed(2)}</div>
        </div>
    `).join('');
}

// Clear All Data
function clearAllData() {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
        people = [];
        expenses = [];
        saveData();
        renderPeople();
        renderExpenses();
        updateSettlement();
        updateTotalBalance();
        updatePaidBySelect();
        updateSplitBetween();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
