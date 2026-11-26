// ===== 1. IIFE: інформація про браузер =====
(function () {
  console.log("1. User Agent:", window.clientInformation.userAgent);
})();

// ===== 2. Метод find =====
const students = [
  { firstName: 'Alice', lastName: 'Johnson', grade: 75 },
  { firstName: 'Bob', lastName: 'Smith', grade: 85 },
  { firstName: 'Charlie', lastName: 'Brown', grade: 92 },
  { firstName: 'Diana', lastName: 'Evans', grade: 68 },
  { firstName: 'Ethan', lastName: 'Clark', grade: 88 }
];
const topStudent = students.find(student => student.grade > 80);
console.log("2. Перший студент з балом вище 80:", topStudent);

// ===== 3. Rest Parameters =====
function multiplyAll(...numbers) {
  return numbers.reduce((total, num) => total * num, 1);
}
console.log("3. multiplyAll(2, 3, 4, 5) =", multiplyAll(2, 3, 4, 5)); // 120

// ===== 4. Set =====
const mySet = new Set([1, 2, 2, 3, 4, 4, 5, 5, 5]);
console.log("4. Розмір Set (дублікати не зберігаються):", mySet.size);
for (const value of mySet) {
  console.log("   Елемент Set:", value);
}

// ===== 5. bind =====
const person = {
  age: 40,
  getAge: function () {
    console.log(`5. Вік: ${this.age}`);
  }
};
const child = { age: 10 };

person.getAge();                        // Вік: 40
const childGetAge = person.getAge.bind(child);
childGetAge();                          // Вік: 10

// ===== 6. Замикання: createGreeting =====
function createGreeting(greeting) {
  return function (userName) {
    console.log(`6. ${greeting}, ${userName}!`);
  };
}
const sayHello = createGreeting("Привіт");
const sayGoodDay = createGreeting("Доброго дня");
sayHello("Олександр");      // Привіт, Олександр!
sayGoodDay("Марія");        // Доброго дня, Марія!
