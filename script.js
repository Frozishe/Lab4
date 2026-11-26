// ===== Виведення в консоль + на сторінку =====
const outputEl = typeof document !== "undefined" ? document.getElementById("output") : null;
function log(message) {
  console.log(message);
  if (outputEl) outputEl.textContent += message + "\n";
}

const LOAN_DAYS = 14;   // стандартний термін позики
const MAX_LOANS = 3;    // максимум книг в одного читача
const DAY_MS = 24 * 60 * 60 * 1000;
const fmt = (d) => d.toLocaleDateString("uk-UA");

// ===== Book =====
class Book {
  #title;
  #author;
  #isAvailable = true;

  constructor(title, author) {
    if (!title || !author) throw new Error("Книга повинна мати назву та автора");
    this.#title = title;
    this.#author = author;
  }

  get title() { return this.#title; }
  get author() { return this.#author; }
  get isAvailable() { return this.#isAvailable; }

  borrow() {
    if (!this.#isAvailable) {
      throw new Error(`Книга «${this.#title}» вже у користуванні`);
    }
    this.#isAvailable = false;
  }

  return() {
    if (this.#isAvailable) {
      throw new Error(`Книга «${this.#title}» і так у бібліотеці`);
    }
    this.#isAvailable = true;
  }
}

// ===== User (базовий) =====
class User {
  #id;
  #name;
  #email;

  constructor(id, name, email) {
    if (new.target === User) {
      throw new Error("User є базовим класом, створіть Librarian або Reader");
    }
    this.#id = id;
    this.name = name;   // через сетери (валідація)
    this.email = email;
  }

  get id() { return this.#id; }
  get name() { return this.#name; }
  get email() { return this.#email; }

  set name(value) {
    if (typeof value !== "string" || value.trim().length < 2) {
      throw new Error("Ім'я має містити щонайменше 2 символи");
    }
    this.#name = value.trim();
  }

  set email(value) {
    if (typeof value !== "string" || !/^\S+@\S+\.\S+$/.test(value)) {
      throw new Error(`Некоректний email: ${value}`);
    }
    this.#email = value;
  }

  // Поліморфізм: кожен тип користувача описує себе по-своєму
  describe() {
    return `Користувач ${this.#name} (${this.#email})`;
  }
}

// ===== Librarian =====
class Librarian extends User {
  #salary;

  constructor(id, name, email, salary = 15000) {
    super(id, name, email);
    this.#salary = salary;
  }

  get salary() { return this.#salary; }

  addBook(library, book) {
    library.addBook(book);
    log(`  ✔ Бібліотекар ${this.name} додав книгу «${book.title}»`);
  }

  removeBook(library, title) {
    library.removeBook(title);
    log(`  ✔ Бібліотекар ${this.name} видалив книгу «${title}»`);
  }

  describe() {
    return `Бібліотекар ${this.name} (${this.email})`;
  }
}

// ===== Reader =====
class Reader extends User {
  #membershipId;

  constructor(id, name, email, membershipId) {
    super(id, name, email);
    if (!membershipId) throw new Error("Потрібен номер читацького квитка");
    this.#membershipId = membershipId;
  }

  get membershipId() { return this.#membershipId; }

  borrowBook(library, title, now = new Date()) {
    const loan = library.lendBook(this, title, now);
    log(`  ✔ Читач ${this.name} взяв «${title}», повернути до ${fmt(loan.dueDate)}`);
    return loan;
  }

  returnBook(library, title, now = new Date()) {
    const lateDays = library.receiveBook(this, title, now);
    if (lateDays > 0) {
      log(`  ⚠ Читач ${this.name} повернув «${title}» з запізненням на ${lateDays} дн.`);
    } else {
      log(`  ✔ Читач ${this.name} повернув «${title}» вчасно`);
    }
    return lateDays;
  }

  describe() {
    return `Читач ${this.name} (квиток ${this.#membershipId})`;
  }
}

// ===== Loan =====
class Loan {
  #book;
  #reader;
  #dueDate;

  constructor(book, reader, takenAt = new Date(), days = LOAN_DAYS) {
    this.#book = book;
    this.#reader = reader;
    this.#dueDate = new Date(takenAt.getTime() + days * DAY_MS);
  }

  get book() { return this.#book; }
  get reader() { return this.#reader; }
  get dueDate() { return this.#dueDate; }

  isOverdue(now = new Date()) {
    return now > this.#dueDate;
  }

  overdueDays(now = new Date()) {
    return this.isOverdue(now) ? Math.ceil((now - this.#dueDate) / DAY_MS) : 0;
  }
}

// ===== Library =====
class Library {
  #books = [];
  #users = [];
  #loans = [];

  // --- користувачі ---
  addUser(user) {
    if (!(user instanceof User)) throw new Error("Можна додати лише користувача");
    if (this.#users.some((u) => u.id === user.id)) {
      throw new Error(`Користувач з id ${user.id} вже існує`);
    }
    this.#users.push(user);
    log(`  ✔ Зареєстровано: ${user.describe()}`);
  }

  #assertRegistered(user) {
    if (!this.#users.includes(user)) {
      throw new Error(`${user.name} не зареєстрований у бібліотеці`);
    }
  }

  // --- книги ---
  #findBook(title) {
    return this.#books.find((b) => b.title.toLowerCase() === title.toLowerCase());
  }

  addBook(book) {
    if (!(book instanceof Book)) throw new Error("Можна додати лише об'єкт Book");
    if (this.#findBook(book.title)) {
      throw new Error(`Книга «${book.title}» вже є в бібліотеці`);
    }
    this.#books.push(book);
  }

  removeBook(title) {
    const book = this.#findBook(title);
    if (!book) throw new Error(`Книги «${title}» немає в бібліотеці`);
    if (!book.isAvailable) {
      throw new Error(`Не можна видалити «${title}» – книга на руках у читача`);
    }
    this.#books = this.#books.filter((b) => b !== book);
  }

  // --- позики ---
  lendBook(reader, title, now = new Date()) {
    this.#assertRegistered(reader);
    const book = this.#findBook(title);
    if (!book) throw new Error(`Книги «${title}» немає в бібліотеці`);
    if (!book.isAvailable) throw new Error(`Книга «${title}» вже в користуванні`);

    const active = this.#loans.filter((l) => l.reader === reader);
    if (active.length >= MAX_LOANS) {
      throw new Error(`${reader.name} вже взяв максимум книг (${MAX_LOANS})`);
    }
    if (active.some((l) => l.isOverdue(now))) {
      throw new Error(`${reader.name} має прострочені книги – спочатку поверніть їх`);
    }

    book.borrow();
    const loan = new Loan(book, reader, now);
    this.#loans.push(loan);
    return loan;
  }

  receiveBook(reader, title, now = new Date()) {
    const loan = this.#loans.find(
      (l) => l.reader === reader && l.book.title.toLowerCase() === title.toLowerCase()
    );
    if (!loan) throw new Error(`${reader.name} не брав книгу «${title}»`);
    const lateDays = loan.overdueDays(now);
    loan.book.return();
    this.#loans = this.#loans.filter((l) => l !== loan);
    return lateDays;
  }

  // --- перегляд ---
  showBooks() {
    if (this.#books.length === 0) return log("  Бібліотека порожня");
    this.#books.forEach((b) =>
      log(`  «${b.title}» – ${b.author}: ${b.isAvailable ? "доступна" : "взята"}`)
    );
  }

  showOverdue(now = new Date()) {
    const overdue = this.#loans.filter((l) => l.isOverdue(now));
    if (overdue.length === 0) return log("  Прострочених позик немає");
    overdue.forEach((l) =>
      log(`  ⚠ «${l.book.title}» – ${l.reader.name}, термін був ${fmt(l.dueDate)} (прострочено на ${l.overdueDays(now)} дн.)`)
    );
  }
}

// ===== Безпечний запуск сценаріїв =====
function run(title, fn) {
  log(`\n--- ${title} ---`);
  try {
    fn();
  } catch (e) {
    log("  ✖ Помилка: " + e.message);
  }
}

// ===== Тестові сценарії =====
function runTests() {
  if (outputEl) outputEl.textContent = "";
  const lib = new Library();
  const day0 = new Date(2026, 0, 1);
  const inDays = (n) => new Date(day0.getTime() + n * DAY_MS);

  const librarian = new Librarian(1, "Олена Петренко", "olena@lib.ua", 18000);
  const anna = new Reader(2, "Анна Коваль", "anna@mail.com", "R-001");
  const ivan = new Reader(3, "Іван Мельник", "ivan@mail.com", "R-002");
  const stranger = new Reader(99, "Сторонній", "x@mail.com", "R-999"); // не зареєстрований

  run("1. Реєстрація користувачів", () => {
    lib.addUser(librarian);
    lib.addUser(anna);
    lib.addUser(ivan);
  });
  run("2. ПОМИЛКА: повторна реєстрація", () => lib.addUser(anna));

  run("3. Бібліотекар додає книги", () => {
    librarian.addBook(lib, new Book("Кобзар", "Т. Шевченко"));
    librarian.addBook(lib, new Book("Intermezzo", "М. Коцюбинський"));
    librarian.addBook(lib, new Book("Лісова пісня", "Леся Українка"));
    librarian.addBook(lib, new Book("Тіні забутих предків", "М. Коцюбинський"));
  });
  run("4. ПОМИЛКА: дублікат книги", () => librarian.addBook(lib, new Book("Кобзар", "Т. Шевченко")));
  run("5. Стан книг", () => lib.showBooks());

  run("6. Читач бере книгу", () => anna.borrowBook(lib, "Кобзар", day0));
  run("7. ПОМИЛКА: книга вже взята", () => ivan.borrowBook(lib, "Кобзар", day0));
  run("8. ПОМИЛКА: книги немає", () => ivan.borrowBook(lib, "Гаррі Поттер", day0));
  run("9. ПОМИЛКА: незареєстрований читач", () => stranger.borrowBook(lib, "Intermezzo", day0));

  run("10. Ліміт книг (максимум 3)", () => {
    anna.borrowBook(lib, "Intermezzo", day0);
    anna.borrowBook(lib, "Лісова пісня", day0);
    anna.borrowBook(lib, "Тіні забутих предків", day0);
  });

  run("11. ПОМИЛКА: видалити книгу, що на руках", () => librarian.removeBook(lib, "Кобзар"));
  run("12. Стан книг", () => lib.showBooks());

  run("13. Повернення вчасно (день 10)", () => anna.returnBook(lib, "Intermezzo", inDays(10)));
  run("14. ПОМИЛКА: повернути книгу, яку не брав", () => ivan.returnBook(lib, "Лісова пісня", inDays(10)));

  run("15. Прострочені позики (день 20)", () => lib.showOverdue(inDays(20)));
  run("16. ПОМИЛКА: читач з простроченими не може брати нову", () =>
    anna.borrowBook(lib, "Intermezzo", inDays(20)));
  run("17. Повернення з запізненням (день 20)", () => anna.returnBook(lib, "Кобзар", inDays(20)));

  run("18. Бібліотекар видаляє книгу", () => librarian.removeBook(lib, "Intermezzo"));
  run("19. ПОМИЛКА: некоректний email", () => new Reader(5, "Петро", "bad-email", "R-005"));
  run("20. ПОМИЛКА: створення базового User", () => new User(7, "Хтось", "a@b.com"));
  run("21. Поліморфізм: describe()", () =>
    [librarian, anna, ivan].forEach((u) => log("  " + u.describe())));
  run("22. Підсумковий стан", () => lib.showBooks());
}

if (typeof document !== "undefined") {
  document.getElementById("runBtn").addEventListener("click", runTests);
} else {
  runTests();
}
