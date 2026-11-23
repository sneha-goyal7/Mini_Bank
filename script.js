// =====================================================
//  MINI BANK  -  script.js
//  Part 1: Helpers
//  Part 2: Custom errors
//  Part 3: Classes (Account, SavingsAccount, CurrentAccount, Bank)
//  Part 4: Screen (DOM + events)
// =====================================================


// ---------- Part 1: Helpers ----------

// Promise wala delay: await delay(1000) = 1 second ruko
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 125000 -> ₹1,25,000.00
const formatMoney = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);

const formatDate = (isoText) =>
  new Date(isoText).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

// In transaction types mein paisa aata hai (baaki sab mein jaata hai)
const CREDIT_TYPES = ["Deposit", "Opening Deposit", "Interest", "Transfer In"];
const isCredit = (transaction) => CREDIT_TYPES.includes(transaction.type);


// ---------- Part 2: Custom errors ----------

class InsufficientFundsError extends Error {
  constructor(message) {
    super(message);
    this.name = "InsufficientFundsError";
  }
}

class InvalidPinError extends Error {
  constructor(message) {
    super(message);
    this.name = "InvalidPinError";
  }
}

class AccountLockedError extends Error {
  constructor(message) {
    super(message);
    this.name = "AccountLockedError";
  }
}


// ---------- Part 3: Classes ----------

class Account {
  // # wale fields private hain: class ke bahar se seedha nahi badal sakte
  #pin;
  #balance;

  constructor(name, pin, balance = 0, id = Account.generateId()) {
    this.id = id;
    this.name = name;
    this.type = "Basic";
    this.transactions = [];
    this.failedAttempts = 0;
    this.locked = false;
    this.#pin = pin;
    this.#balance = balance;
  }

  // static method: class ka apna kaam, object ke bina chalta hai
  static generateId() {
    return "AC" + Math.floor(1000 + Math.random() * 9000);
  }

  // amount sahi hai ya nahi check karta hai, aur 2 decimal tak round karta hai
  static validateAmount(amount) {
    if (typeof amount !== "number" || isNaN(amount) || amount <= 0) {
      throw new Error("Please enter a valid amount greater than 0");
    }
    return Math.round(amount * 100) / 100;
  }

  // getter: account.balance se balance padh sakte ho, par badal nahi sakte
  get balance() {
    return this.#balance;
  }

  // Kitna paisa nikal sakte hain (Current account isko badal dega)
  availableFunds() {
    return this.#balance;
  }

  checkPin(pin) {
    if (this.locked) {
      throw new AccountLockedError("This account is locked (3 wrong PINs)");
    }

    if (pin !== this.#pin) {
      this.failedAttempts++;

      if (this.failedAttempts >= 3) {
        this.locked = true;
        throw new AccountLockedError("Too many wrong PINs. Account locked!");
      }

      throw new InvalidPinError(`Wrong PIN. ${3 - this.failedAttempts} attempt(s) left`);
    }

    this.failedAttempts = 0;
    return true;
  }

  // type ka default value "Deposit" hai
  deposit(amount, type = "Deposit") {
    amount = Account.validateAmount(amount);
    this.#balance += amount;
    this.#record(type, amount);
  }

  withdraw(amount, type = "Withdraw") {
    amount = Account.validateAmount(amount);

    if (amount > this.availableFunds()) {
      throw new InsufficientFundsError(
        `Not enough balance. You can use up to ${formatMoney(this.availableFunds())}`
      );
    }

    this.#balance -= amount;
    this.#record(type, amount);
  }

  // private method: transaction history mein ek entry add karta hai
  #record(type, amount) {
    this.transactions.push({
      type: type,
      amount: amount,
      date: new Date().toISOString(),
      balanceAfter: this.#balance,
    });
  }

  // JSON.stringify isko khud chalata hai (localStorage mein save karne ke liye)
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      pin: this.#pin,
      balance: this.#balance,
      transactions: this.transactions,
      failedAttempts: this.failedAttempts,
      locked: this.locked,
    };
  }

  // Saved data se wapas sahi type ka account banata hai
  static fromData(data) {
    let account;

    if (data.type === "Savings") {
      account = new SavingsAccount(data.name, data.pin, data.balance, data.id);
    } else if (data.type === "Current") {
      account = new CurrentAccount(data.name, data.pin, data.balance, data.id);
    } else {
      account = new Account(data.name, data.pin, data.balance, data.id);
    }

    account.transactions = data.transactions ?? [];
    account.failedAttempts = data.failedAttempts ?? 0;
    account.locked = data.locked ?? false;
    return account;
  }
}


// extends = Account ki saari cheezein mil gayi, aur kuch naya jod diya
class SavingsAccount extends Account {
  constructor(name, pin, balance, id) {
    super(name, pin, balance, id); // pehle parent ka constructor chalao
    this.type = "Savings";
    this.interestRate = 0.005; // 0.5% har mahine
  }

  addInterest() {
    const interest = Math.round(this.balance * this.interestRate * 100) / 100;

    if (interest <= 0) {
      throw new Error("No interest to add yet. Deposit some money first");
    }

    this.deposit(interest, "Interest");
    return interest;
  }
}


class CurrentAccount extends Account {
  constructor(name, pin, balance, id) {
    super(name, pin, balance, id);
    this.type = "Current";
    this.overdraftLimit = 5000;
  }

  // Parent ka method badal diya (override): balance ke upar 5000 tak aur nikal sakte hain
  availableFunds() {
    return this.balance + this.overdraftLimit;
  }
}


class Bank {
  constructor() {
    this.accounts = new Map(); // id -> account
    this.load();
  }

  load() {
    try {
      const data = JSON.parse(localStorage.getItem("miniBankData")) ?? [];

      for (const item of data) {
        this.accounts.set(item.id, Account.fromData(item));
      }
    } catch (error) {
      console.error("Saved data kharab hai:", error);
      this.accounts = new Map();
    }
  }

  save() {
    // [...map.values()] Map ke saare accounts ko array bana deta hai
    localStorage.setItem("miniBankData", JSON.stringify([...this.accounts.values()]));
  }

  createAccount(name, pin, startAmount, type) {
    name = name.trim();

    // Regex se check
    if (!/^[A-Za-z ]{2,30}$/.test(name)) {
      throw new Error("Name should have only letters (at least 2)");
    }
    if (!/^\d{4}$/.test(pin)) {
      throw new Error("PIN must be exactly 4 digits");
    }
    if (isNaN(startAmount) || startAmount < 0) {
      throw new Error("Starting balance cannot be negative");
    }

    // Unique id banao
    let id;
    do {
      id = Account.generateId();
    } while (this.accounts.has(id));

    let account;
    if (type === "Current") {
      account = new CurrentAccount(name, pin, 0, id);
    } else {
      account = new SavingsAccount(name, pin, 0, id);
    }

    if (startAmount > 0) {
      account.deposit(startAmount, "Opening Deposit");
    }

    this.accounts.set(id, account);
    this.save();
    return account;
  }

  login(id, pin) {
    const account = this.accounts.get(id.trim().toUpperCase());

    if (!account) {
      throw new Error("Account not found");
    }

    account.checkPin(pin);
    return account;
  }

  // async function: andar await use kar sakte hain
  async transfer(fromAccount, toId, amount) {
    const toAccount = this.accounts.get(toId.trim().toUpperCase());

    if (!toAccount) {
      throw new Error("Receiver account not found");
    }
    if (toAccount.id === fromAccount.id) {
      throw new Error("You cannot transfer to your own account");
    }

    await delay(1500); // "Processing..." jaisa asli bank mein hota hai

    fromAccount.withdraw(amount, "Transfer Out"); // paisa kam ho (galat ho to yahin error)
    toAccount.deposit(amount, "Transfer In"); // phir dusre ko mile
    this.save();
  }
}


// ---------- Part 4: Screen (DOM + events) ----------

const bank = new Bank();
let currentAccount = null; // abhi kaun login hai
let currencyRates = null; // internet se aaye rates yahan rakhenge

// Elements pakadna
const messageBox = document.getElementById("message");
const authSection = document.getElementById("authSection");
const dashboard = document.getElementById("dashboard");

const createForm = document.getElementById("createForm");
const newName = document.getElementById("newName");
const newPin = document.getElementById("newPin");
const newBalance = document.getElementById("newBalance");
const newType = document.getElementById("newType");

const loginForm = document.getElementById("loginForm");
const loginId = document.getElementById("loginId");
const loginPin = document.getElementById("loginPin");

const welcomeText = document.getElementById("welcomeText");
const accountInfo = document.getElementById("accountInfo");
const balanceText = document.getElementById("balanceText");
const overdraftText = document.getElementById("overdraftText");
const interestBtn = document.getElementById("interestBtn");

const amountInput = document.getElementById("amountInput");
const transferTo = document.getElementById("transferTo");
const transferAmount = document.getElementById("transferAmount");
const transferBtn = document.getElementById("transferBtn");

const currencySelect = document.getElementById("currencySelect");
const convertedText = document.getElementById("convertedText");

const filterSelect = document.getElementById("filterSelect");
const sortSelect = document.getElementById("sortSelect");
const summaryText = document.getElementById("summaryText");
const historyList = document.getElementById("historyList");


// Closure: timer variable function ke andar chhupa hai, par yaad rehta hai
function createMessageShower(element) {
  let timer;

  return function (text, type = "success") {
    clearTimeout(timer); // purana timer band
    element.textContent = text;
    element.className = "message " + type;

    timer = setTimeout(function () {
      element.textContent = "";
      element.className = "message";
    }, 4000);
  };
}

const showMessage = createMessageShower(messageBox);


// Dashboard ko screen pe dikhana
function renderDashboard() {
  const { name, id, type, balance } = currentAccount; // destructuring

  welcomeText.textContent = `Welcome, ${name}`;
  accountInfo.textContent = `${type} Account • ${id}`;
  balanceText.textContent = formatMoney(balance);

  // Savings account ho tabhi interest button dikhao
  interestBtn.classList.toggle("hidden", !(currentAccount instanceof SavingsAccount));

  // Current account ho to overdraft limit dikhao
  overdraftText.textContent =
    currentAccount instanceof CurrentAccount
      ? `Overdraft limit: ${formatMoney(currentAccount.overdraftLimit)}`
      : "";

  renderHistory();
}


function renderHistory() {
  let list = [...currentAccount.transactions]; // copy banai (spread), original na bigde

  // Filter
  if (filterSelect.value === "credit") {
    list = list.filter(isCredit);
  } else if (filterSelect.value === "debit") {
    list = list.filter((t) => !isCredit(t));
  }

  // Sort
  switch (sortSelect.value) {
    case "oldest":
      list.sort((a, b) => new Date(a.date) - new Date(b.date));
      break;
    case "highest":
      list.sort((a, b) => b.amount - a.amount);
      break;
    default:
      list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  // reduce se total nikalna
  const totalIn = currentAccount.transactions
    .filter(isCredit)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalOut = currentAccount.transactions
    .filter((t) => !isCredit(t))
    .reduce((sum, t) => sum + t.amount, 0);

  summaryText.textContent = `Total in: ${formatMoney(totalIn)}  |  Total out: ${formatMoney(totalOut)}`;

  // List banana
  historyList.innerHTML = "";

  if (list.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.textContent = "No transactions to show";
    historyList.append(emptyItem);
    return;
  }

  for (const t of list) {
    const item = document.createElement("li");
    item.className = isCredit(t) ? "credit" : "debit";
    item.innerHTML = `
      <div>
        <span class="type">${t.type}</span><br>
        <span class="date">${formatDate(t.date)}</span>
      </div>
      <div>
        <span class="amount">${isCredit(t) ? "+" : "-"}${formatMoney(t.amount)}</span>
        <span class="after">Balance: ${formatMoney(t.balanceAfter)}</span>
      </div>
    `;
    historyList.append(item);
  }
}


function showDashboard() {
  authSection.classList.add("hidden");
  dashboard.classList.remove("hidden");
  renderDashboard();
}

function logout() {
  currentAccount = null;
  dashboard.classList.add("hidden");
  authSection.classList.remove("hidden");
  convertedText.textContent = "";
  showMessage("Logged out", "info");
}


// Currency: internet se rates lana (async/await + fetch)
async function convertBalance() {
  const currency = currencySelect.value;

  try {
    if (!currencyRates) {
      convertedText.textContent = "Loading rates...";
      const response = await fetch(
        "https://api.frankfurter.dev/v1/latest?base=INR&symbols=USD,EUR,GBP"
      );

      if (!response.ok) {
        throw new Error("Rates not available");
      }

      const data = await response.json();
      currencyRates = data.rates;
    }

    const converted = currentAccount.balance * currencyRates[currency];
    convertedText.textContent =
      "≈ " + new Intl.NumberFormat("en-US", { style: "currency", currency: currency }).format(converted);
  } catch (error) {
    convertedText.textContent = "";
    showMessage("Could not load currency rates. Check your internet", "error");
  }
}


// ----- Events -----

createForm.addEventListener("submit", function (event) {
  event.preventDefault(); // page reload hone se roka

  try {
    const account = bank.createAccount(
      newName.value,
      newPin.value,
      Number(newBalance.value),
      newType.value
    );

    showMessage(`Account created! Your Account ID is ${account.id}. Note it down to login.`);
    createForm.reset();
    loginId.value = account.id;
  } catch (error) {
    showMessage(error.message, "error");
  }
});


loginForm.addEventListener("submit", function (event) {
  event.preventDefault();

  try {
    currentAccount = bank.login(loginId.value, loginPin.value);
    loginForm.reset();
    showDashboard();
  } catch (error) {
    showMessage(error.message, "error");
  } finally {
    bank.save(); // galat PIN ki ginti bhi save ho
  }
});


// Event delegation: dashboard ke saare buttons ek hi listener se
dashboard.addEventListener("click", async function (event) {
  const action = event.target.dataset.action; // data-action ki value

  if (!action) return; // button nahi dabaya to kuch mat karo

  try {
    switch (action) {
      case "deposit":
        currentAccount.deposit(Number(amountInput.value));
        showMessage("Deposit successful!");
        amountInput.value = "";
        break;

      case "withdraw":
        currentAccount.withdraw(Number(amountInput.value));
        showMessage("Withdraw successful!");
        amountInput.value = "";
        break;

      case "interest": {
        const interest = currentAccount.addInterest();
        showMessage(`Interest added: ${formatMoney(interest)}`);
        break;
      }

      case "transfer":
        transferBtn.disabled = true;
        showMessage("Processing transfer...", "info");
        await bank.transfer(currentAccount, transferTo.value, Number(transferAmount.value));
        showMessage("Transfer successful!");
        transferTo.value = "";
        transferAmount.value = "";
        break;

      case "convert":
        await convertBalance();
        return; // balance badla nahi, save/render ki zaroorat nahi

      case "logout":
        logout();
        return;
    }

    bank.save();
    renderDashboard();
  } catch (error) {
    showMessage(error.message, "error");
  } finally {
    transferBtn.disabled = false;
  }
});


// Filter ya sort badalne par history dobara banao
filterSelect.addEventListener("change", renderHistory);
sortSelect.addEventListener("change", renderHistory);