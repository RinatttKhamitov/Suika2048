import { BallNumber } from './BallNumber.js';

const { Engine, Render, World, Bodies, Events } = Matter;

// Параметры игрового поля
const WIDGHT = 500;
const HEIGHT = 600;
const BALL_RADIUS_BASE = 30; // Базовый радиус шара (начальный)
const imageSize = 200; // Размер изображения для текстуры

// Инициализируем движок Matter.js
const engine = Engine.create();
const world = engine.world;

// Счётчик очков
let score = 0;

// Переменная для хранения текстуры следующего шара
let nextBallValue = 2;
const ballTextures = {
    2: new Image(),
    4: new Image(),
    8: new Image()
};
ballTextures[2].src = './img/num2.png';
ballTextures[4].src = './img/num4.png';
ballTextures[8].src = './img/num8.png';

// Функция обновления следующего шара
function updateNextBall() {
    const values = [2, 4, 8];
    nextBallValue = values[Math.floor(Math.random() * values.length)];
}

// Функция обновления счёта
function updateScore(points) {
    score += points;
}

// Получаем доступ к canvas
const canvas = document.getElementById('myCanvas');
const context = canvas.getContext('2d');

// Параметры отрисовки
const render = Render.create({
    canvas: canvas,
    engine: engine,
    options: {
        width: WIDGHT,
        height: HEIGHT,
        wireframes: false,
        background: '#faf8ef' // Бледно-кремовый фон
    }
});

let balls = [];

// Статичные объекты — стены и пол
const ground = Bodies.rectangle(WIDGHT / 2, HEIGHT + 10, WIDGHT, 20, {
    isStatic: true, 
    render: { fillStyle: '#bbb' } // Светло-серая рамка
});

const walls = [
    Bodies.rectangle(0, HEIGHT / 2, 20, HEIGHT, { isStatic: true, render: { fillStyle: '#bbb' } }), // Левая стена
    Bodies.rectangle(WIDGHT, HEIGHT / 2, 20, HEIGHT, { isStatic: true, render: { fillStyle: '#bbb' } }), // Правая стена
    Bodies.rectangle(WIDGHT / 2, 0, WIDGHT, 80, { isStatic: true, render: { fillStyle: '#bbb' } }) // Верхняя рамка
];

World.add(world, [ground, ...walls]);

// Функция для создания нового шара
function createNewBall(mouseX, y) {
    let circleRadius = BALL_RADIUS_BASE + 10 * Math.log2(nextBallValue/2); // Увеличиваем радиус
    let scale = circleRadius / (imageSize / 2); // Масштаб для нового шара

    const newBall = Bodies.circle(mouseX, y, circleRadius, {
        restitution: 0.6, // Отскок шаров при столкновении
        friction: 0.1, // Трение
        render: {
            sprite: {
                texture: './img/num' + nextBallValue + '.png', // Текстура для шара с числом
                xScale: scale,
                yScale: scale
            }
        }
    });

    const ballNumber = new BallNumber(mouseX, y, nextBallValue, newBall);
    World.add(world, ballNumber.ball);
    balls.push(ballNumber);

    console.log('Создан новый шар с числом ' + nextBallValue + ' на координатах: ', mouseX, y);
    updateNextBall(); // Обновляем следующий шар
}

// Добавляем событие нажатия мыши для создания нового шара
canvas.addEventListener('mousedown', function(event) {
    const mousePosition = {
        x: event.clientX - canvas.getBoundingClientRect().left,
        y: 80 // Падающий шар всегда появляется сверху
    };

    createNewBall(mousePosition.x, mousePosition.y);
});

// Функция поиска шара по физическому телу
function searchBall(ball) {
    return balls.find(b => b.ball === ball) || null;
}

// Функция для объединения двух одинаковых шаров
function newBall(ball1, ball2) {
    if (ball1.number === ball2.number) {
        // Вычисляем новую позицию объединенного шара
        const newX = (ball1.ball.position.x + ball2.ball.position.x) / 2;
        const newY = (ball1.ball.position.y + ball2.ball.position.y) / 2;

        // Удаляем старые шары
        World.remove(world, ball1.ball);
        World.remove(world, ball2.ball);

        let circleRadius = BALL_RADIUS_BASE + 10 * Math.log2(ball1.number); // Увеличиваем радиус
        let scale = circleRadius / (imageSize / 2); // Масштаб для нового шара

        // Создаем новый объединенный шар
        const newBall = Bodies.circle(newX, newY, circleRadius, {
            restitution: 0.6,
            friction: 0.1,
            render: {
                sprite: {
                    texture: './img/num' + ball1.number * 2 + '.png', // Обновляем текстуру
                    xScale: scale,
                    yScale: scale
                }
            }
        });

        // Обновляем первый шар
        ball1.ball = newBall;
        ball1.x = newX;
        ball1.y = newY;
        ball1.number *= 2; // Удваиваем значение шара

        // Добавляем новый шар в мир
        World.add(world, newBall);

        // Удаляем второй шар из массива
        balls = balls.filter(b => b !== ball2);

        // Обновляем очки
        updateScore(ball1.number);

        return true;
    }

    return false;
}

// Слушаем события столкновений
Events.on(engine, 'collisionStart', function(event) {
    const pairs = event.pairs;

    for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i];

        const ballA = searchBall(pair.bodyA);
        const ballB = searchBall(pair.bodyB);

        if (!ballA || !ballB) {
            continue;
        }

        // Пытаемся объединить шары
        newBall(ballA, ballB);
    }
});

Engine.run(engine);
Render.run(render);

// Пользовательская отрисовка на canvas
Events.on(render, 'afterRender', function() {
    // Отрисовка счёта
    context.font = '24px Arial';
    context.fillStyle = '#000';
    context.fillText('Score: ' + score, 20, 30); // Выводим счётчик в левом верхнем углу

    // Отрисовка следующего шара
    context.drawImage(ballTextures[nextBallValue], WIDGHT - 70, 10, 50, 50); // Рисуем следующий шар в правом верхнем углу
});

// Начальное обновление следующего шара
updateNextBall();
