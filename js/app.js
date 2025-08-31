let inventory = [];
let soldItems = [];
let nextId = 1;
let isLoggedIn = false;
let customSets = [];
let currentTab = 'cards';

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
    loadSets();
    updateSetDropdowns();
    updateStats();
    renderTable();
    
    // Set today's date as default
    document.getElementById('datePurchased').value = new Date().toISOString().split('T')[0];
    
    // Initialize grading options visibility based on default item type
    toggleGradingOptions();
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

// Toggle grading options visibility
function toggleGradingOptions() {
    const itemType = document.getElementById('itemType').value;
    const gradingRow = document.getElementById('gradingRow');
    const conditionGroup = document.getElementById('condition');
    
    if (itemType === 'card') {
        gradingRow.style.display = 'grid';
        // Hide sealed-specific condition options
        const sealedOptions = ['Sealed', 'Opened'];
        Array.from(conditionGroup.options).forEach(option => {
            if (sealedOptions.includes(option.value)) {
                option.style.display = 'none';
            } else {
                option.style.display = 'block';
            }
        });
    } else {
        gradingRow.style.display = 'none';
        // Reset grading fields
        document.getElementById('gradingStatus').value = 'raw';
        toggleGradeSelection();
        // Show all condition options
        Array.from(conditionGroup.options).forEach(option => {
            option.style.display = 'block';
        });
    }
}

function toggleGradeSelection() {
    const gradingStatus = document.getElementById('gradingStatus').value;
    const gradeCompanyGroup = document.getElementById('gradeCompanyGroup');
    const gradeValueGroup = document.getElementById('gradeValueGroup');
    
    if (gradingStatus === 'graded') {
        gradeCompanyGroup.style.display = 'block';
        gradeValueGroup.style.display = 'block';
    } else {
        gradeCompanyGroup.style.display = 'none';
        gradeValueGroup.style.display = 'none';
    }
}

function toggleEditGradingOptions() {
    const itemType = document.getElementById('editItemType').value;
    const gradingRow = document.getElementById('editGradingRow');
    const conditionGroup = document.getElementById('editCondition');
    
    if (itemType === 'card') {
        gradingRow.style.display = 'grid';
        // Hide sealed-specific condition options
        const sealedOptions = ['Sealed', 'Opened'];
        Array.from(conditionGroup.options).forEach(option => {
            if (sealedOptions.includes(option.value)) {
                option.style.display = 'none';
            } else {
                option.style.display = 'block';
            }
        });
    } else {
        gradingRow.style.display = 'none';
        // Reset grading fields
        document.getElementById('editGradingStatus').value = 'raw';
        toggleEditGradeSelection();
        // Show all condition options
        Array.from(conditionGroup.options).forEach(option => {
            option.style.display = 'block';
        });
    }
}

function toggleEditGradeSelection() {
    const gradingStatus = document.getElementById('editGradingStatus').value;
    const gradeCompanyGroup = document.getElementById('editGradeCompanyGroup');
    const gradeValueGroup = document.getElementById('editGradeValueGroup');
    
    if (gradingStatus === 'graded') {
        gradeCompanyGroup.style.display = 'block';
        gradeValueGroup.style.display = 'block';
    } else {
        gradeCompanyGroup.style.display = 'none';
        gradeValueGroup.style.display = 'none';
    }
}

function switchTab(tab) {
    currentTab = tab;
    
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Show/hide table containers
    document.getElementById('cardsTableContainer').style.display = 'none';
    document.getElementById('sealedTableContainer').style.display = 'none';
    document.getElementById('soldTableContainer').style.display = 'none';
    
    if (tab === 'cards') {
        document.getElementById('cardsTableContainer').style.display = 'block';
    } else if (tab === 'sealed') {
        document.getElementById('sealedTableContainer').style.display = 'block';
    } else if (tab === 'sold') {
        document.getElementById('soldTableContainer').style.display = 'block';
    }
    
    renderTable();
}

function renderTable() {
    if (!isLoggedIn) return;
    
    // Render cards table
    const cardsBody = document.getElementById('cardsTable');
    cardsBody.innerHTML = '';
    
    const cards = inventory.filter(item => item.type === 'card');
    cards.forEach(item => {
        const row = document.createElement('tr');
        const gainClass = item.totalGain > 0 ? 'profit' : item.totalGain < 0 ? 'loss' : '';
        const roi = item.buyPrice > 0 ? ((item.sellPrice - item.buyPrice) / item.buyPrice * 100) : 0;
        const roiClass = roi > 0 ? 'roi-positive' : roi < 0 ? 'roi-negative' : '';
        
        // Format grading info for display
        let conditionDisplay = item.condition;
        if (item.gradingStatus === 'graded') {
            conditionDisplay = `${item.gradeCompany} ${item.gradeValue}`;
        }
        
        row.innerHTML = `
            <td>${item.id.toString().padStart(4, '0')}</td>
            <td><strong>${item.name}</strong></td>
            <td>${item.set}</td>
            <td>${conditionDisplay}</td>
            <td>${item.quantity}</td>
            <td>${item.buyPrice.toFixed(2)}</td>
            <td>${item.sellPrice.toFixed(2)}</td>
            <td class="${gainClass}">${item.totalGain.toFixed(2)}</td>
            <td class="${roiClass}">${roi.toFixed(1)}%</td>
            <td>${item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</td>
            <td>
                <button class="btn btn-edit" onclick="editItem(${item.id})">Edit</button>
                <button class="btn btn-success" onclick="markAsSold(${item.id})">Sold</button>
                <button class="btn btn-danger" onclick="removeItem(${item.id})">Delete</button>
            </td>
        `;
        cardsBody.appendChild(row);
    });
    
    // Render sealed products table
    const sealedBody = document.getElementById('sealedTable');
    sealedBody.innerHTML = '';
    
    const sealedProducts = inventory.filter(item => item.type === 'sealed');
    sealedProducts.forEach(item => {
        const row = document.createElement('tr');
        const gainClass = item.totalGain > 0 ? 'profit' : item.totalGain < 0 ? 'loss' : '';
        const roi = item.buyPrice > 0 ? ((item.sellPrice - item.buyPrice) / item.buyPrice * 100) : 0;
        const roiClass = roi > 0 ? 'roi-positive' : roi < 0 ? 'roi-negative' : '';
        
        row.innerHTML = `
            <td>${item.id.toString().padStart(4, '0')}</td>
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
                <button class="btn btn-success" onclick="markAsSold(${item.id})">Sold</button>
                <button class="btn btn-danger" onclick="removeItem(${item.id})">Delete</button>
            </td>
        `;
        sealedBody.appendChild(row);
    });
    
    // Render sold items table
    const soldBody = document.getElementById('soldTable');
    soldBody.innerHTML = '';
    
    soldItems.forEach(item => {
        const row = document.createElement('tr');
        const gainClass = item.totalGain > 0 ? 'profit' : item.totalGain < 0 ? 'loss' : '';
        const roi = item.buyPrice > 0 ? ((item.sellPrice - item.buyPrice) / item.buyPrice * 100) : 0;
        const roiClass = roi > 0 ? 'roi-positive' : roi < 0 ? 'roi-negative' : '';
        
        // Format grading info for display
        let conditionDisplay = item.condition;
        if (item.type === 'card' && item.gradingStatus === 'graded') {
            conditionDisplay = `${item.gradeCompany} ${item.gradeValue}`;
        }
        
        row.innerHTML = `
            <td>${item.id.toString().padStart(4, '0')}</td>
            <td><span class="type-badge type-${item.type}">${item.type}</span></td>
            <td><strong>${item.name}</strong></td>
            <td>${item.set}</td>
            <td>${conditionDisplay}</td>
            <td>${item.quantity}</td>
            <td>${item.buyPrice.toFixed(2)}</td>
            <td>${item.sellPrice.toFixed(2)}</td>
            <td class="${gainClass}">${item.totalGain.toFixed(2)}</td>
            <td class="${roiClass}">${roi.toFixed(1)}%</td>
            <td>${item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</td>
            <td>${item.soldDate ? new Date(item.soldDate).toLocaleDateString() : 'N/A'}</td>
            <td>
                <button class="btn btn-secondary" onclick="moveBackToInventory(${item.id})">Unsold</button>
                <button class="btn btn-danger" onclick="removeSoldItem(${item.id})">Delete</button>
            </td>
        `;
        soldBody.appendChild(row);
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
    
    // Handle grading fields
    toggleEditGradingOptions();
    if (item.type === 'card') {
        document.getElementById('editGradingStatus').value = item.gradingStatus || 'raw';
        toggleEditGradeSelection();
        if (item.gradingStatus === 'graded') {
            document.getElementById('editGradeCompany').value = item.gradeCompany || 'PSA';
            document.getElementById('editGradeValue').value = item.gradeValue || '10';
        }
    }

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
    const itemType = document.getElementById('editItemType').value;
    const updatedItem = {
        id: id,
        type: itemType,
        name: itemName,
        set: document.getElementById('editSetName').value,
        condition: document.getElementById('editCondition').value,
        quantity: parseInt(document.getElementById('editQuantity').value),
        buyPrice: parseFloat(document.getElementById('editBuyPrice').value) || 0,
        sellPrice: parseFloat(document.getElementById('editSellPrice').value) || 0,
        date: document.getElementById('editDatePurchased').value,
        totalGain: (parseFloat(document.getElementById('editSellPrice').value) || 0 - parseFloat(document.getElementById('editBuyPrice').value) || 0) * parseInt(document.getElementById('editQuantity').value)
    };
    
    // Add grading info if it's a card
    if (itemType === 'card') {
        updatedItem.gradingStatus = document.getElementById('editGradingStatus').value;
        if (updatedItem.gradingStatus === 'graded') {
            updatedItem.gradeCompany = document.getElementById('editGradeCompany').value;
            updatedItem.gradeValue = document.getElementById('editGradeValue').value;
        }
    }
    
    inventory[itemIndex] = updatedItem;

    saveData();
    renderTable();
    updateStats();
    closeEditModal();
}

// Close modal when clicking outside
window.onclick = function(event) {
    const editModal = document.getElementById('editModal');
    const setModal = document.getElementById('setManagerModal');
    if (event.target === editModal) {
        closeEditModal();
    }
    if (event.target === setModal) {
        closeSetManager();
    }
}

function loadData() {
    if (!isLoggedIn) return;
    
    const savedData = localStorage.getItem('pokemonTCGInventory');
    if (savedData) {
        inventory = JSON.parse(savedData);
    }
    
    const savedSoldItems = localStorage.getItem('pokemonTCGSoldItems');
    if (savedSoldItems) {
        soldItems = JSON.parse(savedSoldItems);
    }
    
    // Calculate next ID from both inventory and sold items
    const allItems = [...inventory, ...soldItems];
    nextId = allItems.length > 0 ? Math.max(...allItems.map(item => item.id)) + 1 : 1;
}

function loadSets() {
    if (!isLoggedIn) return;
    
    const savedSets = localStorage.getItem('pokemonTCGSets');
    if (savedSets) {
        customSets = JSON.parse(savedSets);
    } else {
        // Initialize with default Pokemon TCG sets
        customSets = [
            'Stellar Crown',
            'Shrouded Fable',
            'Twilight Masquerade',
            'Temporal Forces',
            'Paldean Fates',
            'Paradox Rift',
            'Obsidian Flames',
            'Paldea Evolved',
            'Scarlet & Violet',
            'Crown Zenith',
            'Silver Tempest',
            'Lost Origin',
            'Astral Radiance',
            'Brilliant Stars',
            'Fusion Strike',
            'Celebrations',
            'Evolving Skies',
            'Chilling Reign',
            'Battle Styles',
            'Shining Fates',
            'Vivid Voltage',
            'Champions Path',
            'Darkness Ablaze',
            'Base Set',
            'Jungle',
            'Fossil',
            'Team Rocket',
            'Other/Custom'
        ];
        saveSets();
    }
}

function saveSets() {
    if (!isLoggedIn) return;
    localStorage.setItem('pokemonTCGSets', JSON.stringify(customSets));
}

function updateSetDropdowns() {
    const mainSelect = document.getElementById('setName');
    const editSelect = document.getElementById('editSetName');
    
    // Clear existing options
    mainSelect.innerHTML = '';
    editSelect.innerHTML = '';
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select a set...';
    mainSelect.appendChild(defaultOption);
    editSelect.appendChild(defaultOption.cloneNode(true));
    
    // Add all sets
    customSets.forEach(set => {
        const option = document.createElement('option');
        option.value = set;
        option.textContent = set;
        mainSelect.appendChild(option);
        editSelect.appendChild(option.cloneNode(true));
    });
}

function showSetManager() {
    const modal = document.getElementById('setManagerModal');
    modal.style.display = 'block';
    renderSetList();
}

function closeSetManager() {
    document.getElementById('setManagerModal').style.display = 'none';
}

function renderSetList() {
    const listContainer = document.getElementById('setList');
    listContainer.innerHTML = '';
    
    customSets.forEach((set, index) => {
        const setItem = document.createElement('div');
        setItem.className = 'set-item';
        setItem.innerHTML = `
            <span>${set}</span>
            <button class="btn btn-danger btn-sm" onclick="deleteSet(${index})">Delete</button>
        `;
        listContainer.appendChild(setItem);
    });
}

function addNewSet() {
    const input = document.getElementById('newSetInput');
    const setName = input.value.trim();
    
    if (!setName) {
        alert('Please enter a set name');
        return;
    }
    
    if (customSets.includes(setName)) {
        alert('This set already exists');
        return;
    }
    
    customSets.push(setName);
    customSets.sort();
    saveSets();
    updateSetDropdowns();
    renderSetList();
    input.value = '';
}

function deleteSet(index) {
    const setToDelete = customSets[index];
    
    // Check if any items use this set
    const itemsUsingSet = inventory.filter(item => item.set === setToDelete);
    
    if (itemsUsingSet.length > 0) {
        if (!confirm(`${itemsUsingSet.length} item(s) are using this set. Deleting it will clear the set field for these items. Continue?`)) {
            return;
        }
        // Clear the set field for items using this set
        inventory.forEach(item => {
            if (item.set === setToDelete) {
                item.set = '';
            }
        });
        saveData();
        renderTable();
    }
    
    customSets.splice(index, 1);
    saveSets();
    updateSetDropdowns();
    renderSetList();
}

function saveData() {
    if (!isLoggedIn) return;
    localStorage.setItem('pokemonTCGInventory', JSON.stringify(inventory));
    localStorage.setItem('pokemonTCGSoldItems', JSON.stringify(soldItems));
}

function addItem() {
    if (!isLoggedIn) return;
    
    const itemType = document.getElementById('itemType').value;
    const itemName = document.getElementById('itemName').value.trim();
    const setName = document.getElementById('setName').value;
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
    
    // Add grading info if it's a card
    if (itemType === 'card') {
        newItem.gradingStatus = document.getElementById('gradingStatus').value;
        if (newItem.gradingStatus === 'graded') {
            newItem.gradeCompany = document.getElementById('gradeCompany').value;
            newItem.gradeValue = document.getElementById('gradeValue').value;
        }
    }

    inventory.push(newItem);
    saveData();
    renderTable();
    updateStats();
    clearForm();
}

function clearForm() {
    document.getElementById('itemName').value = '';
    document.getElementById('setName').selectedIndex = 0;
    document.getElementById('quantity').value = '1';
    document.getElementById('buyPrice').value = '';
    document.getElementById('sellPrice').value = '';
    document.getElementById('datePurchased').value = new Date().toISOString().split('T')[0];
    document.getElementById('itemType').value = 'card';
    document.getElementById('gradingStatus').value = 'raw';
    toggleGradingOptions();
    toggleGradeSelection();
}

function markAsSold(id) {
    if (!isLoggedIn) return;
    
    const item = inventory.find(i => i.id === id);
    if (!item) return;
    
    if (confirm(`Mark "${item.name}" as sold?`)) {
        // Add sold date to the item
        item.soldDate = new Date().toISOString().split('T')[0];
        
        // Move from inventory to sold items
        soldItems.push(item);
        inventory = inventory.filter(i => i.id !== id);
        
        saveData();
        renderTable();
        updateStats();
    }
}

function moveBackToInventory(id) {
    if (!isLoggedIn) return;
    
    const item = soldItems.find(i => i.id === id);
    if (!item) return;
    
    if (confirm(`Move "${item.name}" back to inventory?`)) {
        // Remove sold date
        delete item.soldDate;
        
        // Move from sold items back to inventory
        inventory.push(item);
        soldItems = soldItems.filter(i => i.id !== id);
        
        saveData();
        renderTable();
        updateStats();
    }
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

function removeSoldItem(id) {
    if (!isLoggedIn) return;
    
    if (confirm('Are you sure you want to permanently delete this sold item?')) {
        soldItems = soldItems.filter(item => item.id !== id);
        saveData();
        renderTable();
        updateStats();
    }
}

function updateStats() {
    if (!isLoggedIn) return;
    
    // Active inventory stats
    const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const totalInvested = inventory.reduce((sum, item) => sum + (item.buyPrice * item.quantity), 0);
    const totalValue = inventory.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);
    const potentialProfit = totalValue - totalInvested;
    
    // Sold items stats
    const soldProfit = soldItems.reduce((sum, item) => sum + item.totalGain, 0);
    const soldInvested = soldItems.reduce((sum, item) => sum + (item.buyPrice * item.quantity), 0);
    const soldRevenue = soldItems.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);
    
    // Combined stats
    const totalProfit = potentialProfit + soldProfit;
    const overallInvested = totalInvested + soldInvested;
    const overallROI = overallInvested > 0 ? ((soldProfit / overallInvested) * 100) : 0;

    document.getElementById('totalItems').textContent = totalItems + soldItems.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('totalInvested').textContent = `$${overallInvested.toFixed(2)}`;
    document.getElementById('totalValue').textContent = `$${(totalValue + soldRevenue).toFixed(2)}`;
    document.getElementById('totalProfit').textContent = `$${soldProfit.toFixed(2)} (Realized)`;
    document.getElementById('totalROI').textContent = `${overallROI.toFixed(1)}%`;

    // Update profit card styling
    const profitCard = document.getElementById('profitCard');
    profitCard.className = 'stat-card';
    if (soldProfit > 0) {
        profitCard.classList.add('profit');
    } else if (soldProfit < 0) {
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