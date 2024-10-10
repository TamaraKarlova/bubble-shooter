// game.js

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Настройки игры
const BUBBLE_RADIUS = 20;
const ROWS = 8;
const COLUMNS = 10;
const COLORS = ['red', 'green', 'blue', 'yellow', 'purple'];
let bubbles = [];
let activeBubble = null;  // Текущий пузырь, который летит

// Объект стрелка
let shooter = {
    x: canvas.width / 2,
    y: canvas.height - BUBBLE_RADIUS - 10,
    color: getRandomColor(),
    angle: 0
};

// Функция для создания начального массива пузырьков
function initBubbles() {
    for (let row = 0; row < ROWS; row++) {
        bubbles[row] = [];
        for (let col = 0; col < COLUMNS; col++) {
            bubbles[row][col] = {
                x: col * (BUBBLE_RADIUS * 2) + BUBBLE_RADIUS,
                y: row * (BUBBLE_RADIUS * 2) + BUBBLE_RADIUS,
                color: getRandomColor(),
                active: true
            };
        }
    }
}

// Отрисовка пузырьков
function drawBubbles() {
    bubbles.forEach(row => {
        row.forEach(bubble => {
            if (bubble.active) {
                drawCircle(bubble.x, bubble.y, BUBBLE_RADIUS, bubble.color);
            }
        });
    });
}

// Отрисовка одного пузырька
function drawCircle(x, y, radius, color) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
}

// Отрисовка стрелка
function drawShooter() {
    drawCircle(shooter.x, shooter.y, BUBBLE_RADIUS, shooter.color);
}

// Генерация случайного цвета
function getRandomColor() {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
}

// Отрисовка всего экрана
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBubbles();
    drawShooter();
    if (activeBubble) {
        drawCircle(activeBubble.x, activeBubble.y, BUBBLE_RADIUS, activeBubble.color);
    }
}

// Логика полета пузыря
function updateBubble() {
    if (activeBubble) {
        activeBubble.x += activeBubble.dx;
        activeBubble.y += activeBubble.dy;

        // Проверяем столкновение с границами
        if (activeBubble.x - BUBBLE_RADIUS < 0 || activeBubble.x + BUBBLE_RADIUS > canvas.width) {
            activeBubble.dx *= -1;  // Отскок от стен
        }

        if (activeBubble.y - BUBBLE_RADIUS < 0) {
            // Пузырь достиг верхней границы
            placeBubble();
        }

        // Проверка столкновения с другими пузырями
        bubbles.forEach(row => {
            row.forEach(bubble => {
                if (bubble.active && checkCollision(bubble, activeBubble)) {
                    placeBubble();
                }
            });
        });
    }
}

// Функция для создания летящего пузыря
function createActiveBubble() {
    activeBubble = {
        x: shooter.x,
        y: shooter.y,
        dx: Math.cos(shooter.angle) * 5,
        dy: Math.sin(shooter.angle) * 5,
        color: shooter.color
    };
    shooter.color = getRandomColor();  // Новый цвет для следующего пузыря
}

// Проверка столкновения пузыря
function checkCollision(bubble1, bubble2) {
    let dist = Math.sqrt((bubble1.x - bubble2.x) ** 2 + (bubble1.y - bubble2.y) ** 2);
    return dist < BUBBLE_RADIUS * 2;
}

// Функция для размещения пузыря на сетке после столкновения
function placeBubble() {
    // Найдем ближайшее место на сетке
    let row = Math.floor(activeBubble.y / (BUBBLE_RADIUS * 2));
    let col = Math.floor(activeBubble.x / (BUBBLE_RADIUS * 2));

    // Проверка, чтобы не выйти за границы
    if (row >= 0 && row < ROWS && col >= 0 && col < COLUMNS) {
        bubbles[row][col].active = true;
        bubbles[row][col].color = activeBubble.color;
    }

    // Проверим на наличие совпадений цветов
    let matchedBubbles = findMatchingBubbles(row, col, bubbles[row][col].color);
    if (matchedBubbles.length >= 3) {
        removeBubbles(matchedBubbles);
    }

    activeBubble = null;
}

// Поиск пузырей одного цвета
function findMatchingBubbles(row, col, color) {
    let matches = [];
    let queue = [{row, col}];
    let visited = new Set([`${row}-${col}`]);

    while (queue.length > 0) {
        let {row, col} = queue.shift();
        let bubble = bubbles[row][col];

        if (bubble.color === color && bubble.active) {
            matches.push(bubble);

            // Проверим соседей
            let neighbors = getNeighbors(row, col);
            neighbors.forEach(neighbor => {
                let key = `${neighbor.row}-${neighbor.col}`;
                if (!visited.has(key)) {
                    visited.add(key);
                    queue.push(neighbor);
                }
            });
        }
    }

    return matches;
}

// Получение соседей пузыря
function getNeighbors(row, col) {
    let neighbors = [];

    if (row > 0) neighbors.push({row: row - 1, col}); // Сосед сверху
    if (row < ROWS - 1) neighbors.push({row: row + 1, col}); // Сосед снизу
    if (col > 0) neighbors.push({row, col: col - 1}); // Сосед слева
    if (col < COLUMNS - 1) neighbors.push({row, col: col + 1}); // Сосед справа

    return neighbors;
}

// Удаление пузырей
function removeBubbles(matchedBubbles) {
    matchedBubbles.forEach(bubble => {
        let row = Math.floor(bubble.y / (BUBBLE_RADIUS * 2));
        let col = Math.floor(bubble.x / (BUBBLE_RADIUS * 2));
        bubbles[row][col].active = false;  // Деактивируем пузырь
    });
}

// Управление стрельбой
canvas.addEventListener('mousemove', (e) => {
    let rect = canvas.getBoundingClientRect();
    let mouseX = e.clientX - rect.left;
    let mouseY = e.clientY - rect.top;

    // Рассчитываем угол, по которому будет стрелять пузырь
    shooter.angle = Math.atan2(mouseY - shooter.y, mouseX - shooter.x);
});

canvas.addEventListener('click', (e) => {
    if (!activeBubble) {
        createActiveBubble();  // Выстрел пузырем
    }
});

// Функция для обновления состояния игры
function update() {
    updateBubble();
    draw();
    requestAnimationFrame(update);
}

// Инициализация игры
initBubbles();
update();
