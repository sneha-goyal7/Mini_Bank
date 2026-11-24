# Mini_Bank
# 🏦 Mini Bank

A virtual banking app built with plain **HTML, CSS and JavaScript**. There is no framework and no backend. All the logic lives in JavaScript, and the project is designed to practise core JS concepts: classes, inheritance, error handling, async code and browser storage.

🔗 **Live Demo:** (https://mini-bank-sneha.netlify.app)

> ⚠️ This is a learning project. PINs are stored as plain text in `localStorage`, so never use real PINs or real data.

## Features

- Create a **Savings** or **Current** account (name, 4-digit PIN, starting balance)
- Login with Account ID and PIN
- Deposit, withdraw and transfer money to another account
- Clear error messages: invalid amount, insufficient balance, wrong PIN, account not found
- Account is **locked after 3 wrong PIN attempts**
- **Savings account:** add 0.5% monthly interest
- **Current account:** overdraft limit of ₹5,000
- Transaction history with filter (all / money in / money out) and sort (newest / oldest / highest)
- Total money in and total money out summary
- Transfer shows a "Processing..." delay, like a real bank
- Currency converter (USD, EUR, GBP) using live rates
- Data is saved in the browser, so it stays after refresh
- Responsive layout for mobile

## Project Structure

```
mini-bank/
├── index.html   # Page structure (forms, dashboard, history)
├── style.css    # Styling
├── script.js    # All the logic
└── README.md
```

## How to Run

1. Download or clone this repository.
2. Open `index.html` in any browser (double-click is enough).

No installation or build step needed.

## How to Use

1. Create an account. Note down the **Account ID** shown in the message.
2. Login with the Account ID and your PIN.
3. Try deposit, withdraw, transfer (create a second account to receive money), interest and the currency converter.
4. Enter a wrong PIN 3 times to see the account lock.

To reset all data: open DevTools (F12) → Application → Local Storage → delete `miniBankData`.

## JavaScript Concepts Covered

| Concept | Where it is used |
|---|---|
| Classes, `constructor` | `Account`, `Bank` |
| Inheritance (`extends`, `super`) | `SavingsAccount`, `CurrentAccount` |
| Method overriding | `availableFunds()` in `CurrentAccount` |
| Private fields and methods (`#`) | `#pin`, `#balance`, `#record()` |
| Getters | `balance` |
| Static methods | `Account.generateId()`, `Account.validateAmount()` |
| Custom errors, `throw`, `try/catch/finally` | `InsufficientFundsError`, `InvalidPinError`, `AccountLockedError` |
| `Map` | Storing accounts by ID |
| Array methods (`filter`, `sort`, `reduce`, `includes`) | Transaction history and totals |
| Destructuring, spread operator | `renderDashboard()`, copying transactions |
| Default parameters | `deposit(amount, type = "Deposit")` |
| Template literals | Messages and history items |
| Regular expressions | Name and PIN validation |
| `switch`, `if/else`, ternary | Button actions, filters |
| Closures | `createMessageShower()` keeps its timer |
| Event delegation | One click listener for all dashboard buttons |
| DOM (`createElement`, `classList`, `dataset`) | Building the UI |
| `setTimeout`, Promises, `async/await` | Transfer delay |
| `fetch` and JSON | Currency rates API |
| `localStorage`, `JSON.stringify/parse` | Saving accounts |
| `Intl` and `Date` | Currency and date formatting |
| Optional chaining and `??` | Loading saved data safely |

## Code Overview (`script.js`)

1. **Helpers:** `delay`, `formatMoney`, `formatDate`
2. **Custom errors**
3. **Classes:** `Account` → `SavingsAccount` / `CurrentAccount`, and `Bank`
4. **Screen:** DOM elements, rendering functions and event listeners

## Ideas to Extend

- Split `script.js` into modules (`account.js`, `bank.js`, `ui.js`) using `import/export` (needs a local server such as VS Code Live Server)
- Add a Fixed Deposit account type
- Add a monthly statement download
- Add dark mode
- Hash the PIN instead of storing plain text

## Tech Stack

HTML5, CSS3, JavaScript (ES6+). The currency feature uses the free [Frankfurter API](https://frankfurter.dev).
