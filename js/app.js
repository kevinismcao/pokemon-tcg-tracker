let inventory = [];
let nextId = 1;
let isLoggedIn = false;

// Simple password hashing (for client-side only)
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
}

// Load data from localStorage on page load
window.onload = function() {
    checkLoginStatus();
};

function checkLoginStatus() {
    // Check if user is already logged in (session storage)
    const sessionLogin = sessionStorage.getItem('pokemonTCGLoggedIn');
    if (sessionLogin === 'true') {
        showMainApp();
    } else {
        showLoginScreen();
    }
}

function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'block';
    document.getElementById('mainApp').style.display = 'none';
    isLoggedIn = false;
}

function showMainApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    isLoggedIn = true;
    
    // Initialize app data
    loadData();
    updateStats();
    renderTable();
    
    // Set today's date as default
    document.getElementById('datePurchased').value = new Date().toISOString().split('T')[0];
}

function login() {
    const password = document.getElementById('passwordInput').value;
    const errorDiv = document.getElementById('loginError');
    
    if (!password) {
        showError('Please enter a password');
        return;
    }

    // Check if this is first time setup
    const storedPassword = localStorage.getItem('pokemonTCGPassword');
    
    if (!storedPassword) {
        // First time setup - save the password
        localStorage.setItem('pokemonTCGPassword', simpleHash(password));
        sessionStorage.setItem('pokemonTCGLoggedIn', 'true');
        showMainApp();
    } else {
        // Verify existing password
        if (simpleHash(password) === storedPassword) {
            sessionStorage.setItem('pokemonTCGLoggedIn', 'true');
            showMainApp();
        } else {
            showError('Incorrect password. Please try again.');
            document.getElementById('passwordInput').value = '';
        }
    }
}

function logout() {
    sessionStorage.removeItem('pokemonTCGLoggedIn');
    document.getElementById('passwordInput').value = '';
    document.getElementById('loginError').textContent = '';
    document.getElementById('loginError').classList.remove('show');
    showLoginScreen();
}

function showError(message) {
    const errorDiv = document.getElementById('loginError');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
    setTimeout(() => {
        errorDiv.classList.remove('show');
    }, 3000);
}

function renderTable() {
    if (!isLoggedIn) return;
    
    const tbody = document.getElementById('inventoryTable');
    tbody.innerHTML = '';

    inventory.forEach(item => {
        const row = document.createElement('tr');
        const gainClass = item.totalGain > 0 ? 'profit' : item.totalGain < 0 ? 'loss' : '';
        const roi = item.buyPrice > 0 ? ((item.sellPrice - item.buyPrice) / item.buyPrice * 100) : 0;
        const roiClass = roi > 0 ? 'roi-positive' : roi < 0 ? 'roi-negative' : '';
        
        row.innerHTML = `
            <td>${item.id.toString().padStart(4, '0')}</td>
            <td><span class="type-badge type-${item.type}">${item.type}</span></td>
            <td><strong>${item.name}</strong></td>
            <td>${item.set}</td>
            <td>${item.condition}</td>
            <td>${item.quantity}</td>
            <td>${item.buyPrice.toFixed(2)}</td>
            <td>${item.sellPrice.toFixed(2)}</td>
            <td class="${gainClass}">${item.totalGain.toFixed(2)}</td>
            <td class="${roiClass}">${roi.toFixed(1)}%</td>
            <td>${item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</td>
            <td>
                <button class="btn btn-edit" onclick="editItem(${item.id})">Edit</button>
                <button class="btn btn-danger" onclick="removeItem(${item.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function editItem(id) {
    const item = inventory.find(i => i.id === id);
    if (!item) return;

    // Populate edit form
    document.getElementById('editItemId').value = item.id;
    document.getElementById('editItemType').value = item.type;
    document.getElementById('editItemName').value = item.name;
    document.getElementById('editSetName').value = item.set;
    document.getElementById('editCondition').value = item.condition;
    document.getElementById('editQuantity').value = item.quantity;
    document.getElementById('editBuyPrice').value = item.buyPrice;
    document.getElementById('editSellPrice').value = item.sellPrice;
    document.getElementById('editDatePurchased').value = item.date;

    // Show modal
    document.getElementById('editModal').style.display = 'block';
    updateProfitPreview();
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

function updateProfitPreview() {
    const quantity = parseInt(document.getElementById('editQuantity').value) || 0;
    const buyPrice = parseFloat(document.getElementById('editBuyPrice').value) || 0;
    const sellPrice = parseFloat(document.getElementById('editSellPrice').value) || 0;
    const profit = (sellPrice - buyPrice) * quantity;
    const roi = buyPrice > 0 ? ((sellPrice - buyPrice) / buyPrice * 100) : 0;

    const profitClass = profit > 0 ? 'profit' : profit < 0 ? 'loss' : '';
    const roiClass = roi > 0 ? 'roi-positive' : roi < 0 ? 'roi-negative' : '';
    
    document.getElementById('profitPreview').innerHTML = `
        <span class="${profitClass}">${profit.toFixed(2)}</span> 
        (<span class="${roiClass}">${roi.toFixed(1)}% ROI</span>)
    `;
}

// Add event listeners for live calculation updates
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('passwordInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });

    // Add listeners for profit preview updates
    const editInputs = ['editQuantity', 'editBuyPrice', 'editSellPrice'];
    editInputs.forEach(id => {
        document.addEventListener('input', function(e) {
            if (e.target && e.target.id === id) {
                updateProfitPreview();
            }
        });
    });
});

function saveEditedItem() {
    const id = parseInt(document.getElementById('editItemId').value);
    const itemIndex = inventory.findIndex(i => i.id === id);
    
    if (itemIndex === -1) return;

    const itemName = document.getElementById('editItemName').value.trim();
    if (!itemName) {
        alert('Please enter an item name');
        return;
    }

    // Update the item
    inventory[itemIndex] = {
        id: id,
        type: document.getElementById('editItemType').value,
        name: itemName,
        set: document.getElementById('editSetName').value.trim(),
        condition: document.getElementById('editCondition').value,
        quantity: parseInt(document.getElementById('editQuantity').value),
        buyPrice: parseFloat(document.getElementById('editBuyPrice').value) || 0,
        sellPrice: parseFloat(document.getElementById('editSellPrice').value) || 0,
        date: document.getElementById('editDatePurchased').value,
        totalGain: (parseFloat(document.getElementById('editSellPrice').value) || 0 - parseFloat(document.getElementById('editBuyPrice').value) || 0) * parseInt(document.getElementById('editQuantity').value)
    };

    saveData();
    renderTable();
    updateStats();
    closeEditModal();
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('editModal');
    if (event.target === modal) {
        closeEditModal();
    }
}

function loadData() {
    if (!isLoggedIn) return;
    
    const savedData = localStorage.getItem('pokemonTCGInventory');
    if (savedData) {
        inventory = JSON.parse(savedData);
        nextId = inventory.length > 0 ? Math.max(...inventory.map(item => item.id)) + 1 : 1;
    }
}

function saveData() {
    if (!isLoggedIn) return;
    localStorage.setItem('pokemonTCGInventory', JSON.stringify(inventory));
}

function addItem() {
    if (!isLoggedIn) return;
    
    const itemType = document.getElementById('itemType').value;
    const itemName = document.getElementById('itemName').value.trim();
    const setName = document.getElementById('setName').value.trim();
    const condition = document.getElementById('condition').value;
    const quantity = parseInt(document.getElementById('quantity').value);
    const buyPrice = parseFloat(document.getElementById('buyPrice').value) || 0;
    const sellPrice = parseFloat(document.getElementById('sellPrice').value) || 0;
    const datePurchased = document.getElementById('datePurchased').value;

    if (!itemName) {
        alert('Please enter an item name');
        return;
    }

    const newItem = {
        id: nextId++,
        type: itemType,
        name: itemName,
        set: setName,
        condition: condition,
        quantity: quantity,
        buyPrice: buyPrice,
        sellPrice: sellPrice,
        date: datePurchased,
        totalGain: (sellPrice - buyPrice) * quantity
    };

    inventory.push(newItem);
    saveData();
    renderTable();
    updateStats();
    clearForm();
}

function clearForm() {
    document.getElementById('itemName').value = '';
    document.getElementById('setName').value = '';
    document.getElementById('quantity').value = '1';
    document.getElementById('buyPrice').value = '';
    document.getElementById('sellPrice').value = '';
    document.getElementById('datePurchased').value = new Date().toISOString().split('T')[0];
}

function removeItem(id) {
    if (!isLoggedIn) return;
    
    if (confirm('Are you sure you want to remove this item?')) {
        inventory = inventory.filter(item => item.id !== id);
        saveData();
        renderTable();
        updateStats();
    }
}

function updateStats() {
    if (!isLoggedIn) return;
    
    const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const totalInvested = inventory.reduce((sum, item) => sum + (item.buyPrice * item.quantity), 0);
    const totalValue = inventory.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);
    const totalProfit = totalValue - totalInvested;
    const overallROI = totalInvested > 0 ? ((totalProfit / totalInvested) * 100) : 0;

    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('totalInvested').textContent = `$${totalInvested.toFixed(2)}`;
    document.getElementById('totalValue').textContent = `$${totalValue.toFixed(2)}`;
    document.getElementById('totalProfit').textContent = `$${totalProfit.toFixed(2)}`;
    document.getElementById('totalROI').textContent = `${overallROI.toFixed(1)}%`;

    // Update profit card styling
    const profitCard = document.getElementById('profitCard');
    profitCard.className = 'stat-card';
    if (totalProfit > 0) {
        profitCard.classList.add('profit');
    } else if (totalProfit < 0) {
        profitCard.classList.add('loss');
    }

    // Update ROI card styling
    const roiCard = document.getElementById('roiCard');
    roiCard.className = 'stat-card';
    if (overallROI > 0) {
        roiCard.classList.add('profit');
    } else if (overallROI < 0) {
        roiCard.classList.add('loss');
    }
}

function exportToCSV() {
    if (!isLoggedIn) return;
    
    const headers = ['ID', 'Type', 'Item Name', 'Set/Product', 'Condition', 'Quantity', 'Buy Price', 'Sell Price', 'Total Gain/Loss', 'ROI %', 'Date'];
    const csvContent = [
        headers.join(','),
        ...inventory.map(item => {
            const roi = item.buyPrice > 0 ? ((item.sellPrice - item.buyPrice) / item.buyPrice * 100) : 0;
            return [
                item.id,
                item.type,
                `"${item.name}"`,
                `"${item.set}"`,
                item.condition,
                item.quantity,
                item.buyPrice.toFixed(2),
                item.sellPrice.toFixed(2),
                item.totalGain.toFixed(2),
                roi.toFixed(1),
                item.date
            ].join(',');
        })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pokemon-tcg-inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

function exportToJSON() {
    if (!isLoggedIn) return;
    
    const jsonContent = JSON.stringify(inventory, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pokemon-tcg-inventory-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
}