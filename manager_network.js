// manager_network.js
const tf = require('@tensorflow/tfjs');
const { sentimentExpert, topicExpert, spamExpert } = require('./expert_modules');

// --- Подготовка данных для TensorFlow ---
// TensorFlow работает с числами (тензорами), поэтому нам нужно преобразовать наши данные.
// Категории тем ('price', 'quality', 'other') и финальные вердикты ('good_review', 'complaint'...)
// нужно закодировать.
const TOPIC_CATEGORIES = ['price', 'quality', 'other'];
const FINAL_CATEGORIES = ['good_review', 'complaint', 'spam', 'neutral'];

// Вспомогательная функция для "one-hot" кодирования
// 'quality' -> [0, 1, 0]
// 'good_review' -> [1, 0, 0, 0]
function oneHotEncode(value, categories) {
    const encoding = Array(categories.length).fill(0);
    const index = categories.indexOf(value);
    if (index > -1) {
        encoding[index] = 1;
    }
    return encoding;
}


// --- Определяем и обучаем модель-менеджер ---
async function createAndTrainManager() {
    console.log('Создаю и обучаю Менеджера на TensorFlow.js...');
    
    // 1. Создаем модель
    const model = tf.sequential();

    // 2. Добавляем слои
    // Входной слой: 1 (sentiment) + 3 (topic) + 1 (spam) = 5 входов
    model.add(tf.layers.dense({ inputShape: [5], units: 10, activation: 'relu' }));
    // Скрытый слой
    model.add(tf.layers.dense({ units: 10, activation: 'relu' }));
    // Выходной слой: 4 категории вердиктов
    model.add(tf.layers.dense({ units: 4, activation: 'softmax' }));

    // 3. Компилируем модель
    model.compile({
        optimizer: 'adam',
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
    });

    // 4. Готовим данные для обучения
const trainingData = [
    // Хорошие отзывы (4 примера)
    { text: "Отличное качество!", verdict: 'good_review' },
    { text: "Очень доволен сборкой", verdict: 'good_review'},
    { text: "Телефон супер, всем советую", verdict: 'good_review' },
    { text: "Хорошая цена и работает быстро", verdict: 'good_review' },
    
    // Жалобы (4 примера)
    { text: "Ужасно, сломался", verdict: 'complaint' },
    { text: "Цена слишком высокая", verdict: 'complaint' },
    { text: "Не работает, верните деньги", verdict: 'complaint'},
    { text: "Качество материала плохое", verdict: 'complaint' },

    // Спам (4 примера)
    { text: "Срочно купите наш новый товар", verdict: 'spam' },
    { text: "Переходи по ссылке и зарабатывай", verdict: 'spam' },
    { text: "Только сегодня огромная скидка", verdict: 'spam' },
    { text: "Самая лучшая цена только у нас, купите!", verdict: 'spam' },

    // Нейтральные (4 примера)
    { text: "В целом нормально", verdict: 'neutral' },
    { text: "Обычный телефон, ничего особенного", verdict: 'neutral' },
    { text: "Работает, как и заявлено", verdict: 'neutral' },
    { text: "За свою стоимость пойдет", verdict: 'neutral' }
];
    
    // Преобразуем наши данные в тензоры
    const inputs = trainingData.map(d => {
        const sentiment = sentimentExpert(d.text);
        const topic = topicExpert(d.text);
        const spam = spamExpert(d.text);
        const topicEncoded = oneHotEncode(topic, TOPIC_CATEGORIES);
        return [sentiment, ...topicEncoded, spam];
    });

    const outputs = trainingData.map(d => oneHotEncode(d.verdict, FINAL_CATEGORIES));

    const xs = tf.tensor2d(inputs); // Входной тензор
    const ys = tf.tensor2d(outputs); // Выходной тензор

    // 5. Обучаем модель!
    await model.fit(xs, ys, { epochs: 100, shuffle: true }); // epochs - сколько раз "просмотреть" данные
    console.log('Менеджер обучен!');
    
    return model;
}


// --- Главная функция-оркестратор ---
async function analyzeReview(model, text) {
    console.log(`\n--- Анализирую отзыв: "${text}" ---`);

    // 1. Получаем отчеты от экспертов
    const sentiment = sentimentExpert(text);
    const topic = topicExpert(text);
    const spam = spamExpert(text);

    // 2. Готовим входные данные для предсказания (один отзыв)
    const topicEncoded = oneHotEncode(topic, TOPIC_CATEGORIES);
    const inputTensor = tf.tensor2d([[sentiment, ...topicEncoded, spam]]);

    // 3. Получаем предсказание от Менеджера
    const prediction = model.predict(inputTensor);
    const predictionData = await prediction.data(); // Получаем результат как массив
    
    // Находим индекс с максимальным значением - это и есть наш вердикт
    const verdictIndex = prediction.argMax(-1).dataSync()[0];
    const finalVerdict = FINAL_CATEGORIES[verdictIndex];

    console.log(`Отчет Экспертов: Тональность=${sentiment.toFixed(2)}, Тема=${topic}, Спам=${spam}`);
    console.log(`Уверенность Менеджера:`, predictionData);
    console.log(`Итоговый вердикт: ${finalVerdict}`);

    return finalVerdict;
}

// --- Запускаем все вместе ---
async function main() {
    const managerModel = await createAndTrainManager();
    await analyzeReview(managerModel, "Качество сборки просто ужасно, все развалилось через неделю!");
    await analyzeReview(managerModel, "Телефон супер, очень нравится дизайн и скорость работы.");
    await analyzeReview(managerModel, "Срочно купите наш новый товар, лучшая цена только сегодня!");
    await analyzeReview(managerModel, "Стоимость адекватная, но могло быть и дешевле");
}

main();