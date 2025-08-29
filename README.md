# Pokemon TCG Inventory Tracker

A comprehensive web application for tracking Pokemon Trading Card Game inventory with profit/loss analysis and password protection.

## Features

- 🔐 **Password Protection**: Secure your inventory with password authentication
- 📊 **Profit/Loss Tracking**: Monitor your investment performance with ROI calculations
- 📦 **Inventory Management**: Track both individual cards and sealed products
- 💰 **Financial Analytics**: Real-time statistics on total investment, current value, and overall ROI
- 📁 **Data Export**: Export your inventory to CSV or JSON formats
- ✏️ **Edit Functionality**: Update item details with live profit preview
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices

## Getting Started

### Option 1: Direct Browser Opening
Simply open the `index.html` file in your web browser.

### Option 2: Using Python HTTP Server
```bash
cd pokemon-tcg-tracker
python3 -m http.server 8000
```
Then navigate to `http://localhost:8000` in your browser.

### Option 3: Using npm scripts
```bash
cd pokemon-tcg-tracker
npm run serve
```

## First Time Setup

1. Open the application in your browser
2. Enter a password of your choice (this will be your password for future logins)
3. The password is stored locally in your browser (hashed for security)
4. Start adding items to your inventory!

## Usage

### Adding Items
1. Select item type (Card or Sealed Product)
2. Enter item details (name, set, condition)
3. Specify quantity and prices
4. Click "Add Item to Inventory"

### Viewing Statistics
The dashboard displays:
- Total number of items
- Total amount invested
- Current total value
- Overall profit/loss
- ROI percentage

### Editing Items
1. Click the "Edit" button next to any item
2. Modify the details in the modal
3. View live profit preview
4. Save changes or cancel

### Exporting Data
- **CSV Export**: Creates a spreadsheet-compatible file
- **JSON Export**: Creates a structured data file for backup or integration

## Data Storage

All data is stored locally in your browser's localStorage:
- Inventory data persists between sessions
- Password is hashed and stored securely
- No data is sent to external servers

## Browser Compatibility

Works with all modern browsers:
- Chrome
- Firefox
- Safari
- Edge

## Project Structure

```
pokemon-tcg-tracker/
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # All styling
├── js/
│   └── app.js          # Application logic
├── package.json        # Project metadata
└── README.md          # Documentation
```

## Security Note

This application uses client-side password protection suitable for personal use. For enterprise or multi-user scenarios, consider implementing server-side authentication.

## License

MIT License - Feel free to use and modify as needed!