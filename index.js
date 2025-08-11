// index.js
const fs = require('fs');
const tf = require('@tensorflow/tfjs');

// Импортируем строительные блоки нашей корпорации
const { sentimentExpert, topicExpert, spamExpert } = require('./layers/layer_experts');
const { createSatisfactionManager, securityManager } = require('./layers/layer_managers');
const { createDirector } = require('./layers/layer_director');
const {
    TOPIC_CATEGORIES,
    SATISFACTION_CATEGORIES,
    SECURITY_CATEGORIES,
    FINAL_VERDICTS,
    oneHotEncode,
    decodeOutput
} = require('./utils');

console.log('>>> ЗАПУСК КОРПОРАЦИИ ИИ v2.0 <<<');

// 1. ПОДГОТОВКА ДАННЫХ ДЛЯ ОБУЧЕНИЯ
// ------------------------------------
function prepareTrainingData() {
    console.log('[Офис] Загрузка и обработка всех отзывов из архива...');
    const reviews = JSON.parse(fs.readFileSync('./data/reviews.json', 'utf-8'));

    // Готовим "учебники" для каждого уровня
    const satisfactionManagerData = { xs: [], ys: [] };
    const directorData = { xs: [], ys: [] };

    for (const review of reviews) {
        // Уровень 1: Аналитики нижнего звена готовят отчет
        const l1_report = {
            sentiment: sentimentExpert(review.text),
            topic: topicExpert(review.text),
            spam: spamExpert(review.text),
        };

        // --- Готовим учебник для Менеджера по Удовлетворенности ---
        satisfactionManagerData.xs.push([l1_report.sentiment, ...oneHotEncode(l1_report.topic, TOPIC_CATEGORIES)]);
        // Выводим правильный ответ для менеджера на основе итогового вердикта
        let satisfactionLabel;
        if (l1_report.sentiment > 0.7) {
            satisfactionLabel = 'happy';
        } else if (l1_report.sentiment < 0.3) {
            satisfactionLabel = 'unhappy';
        } else {
            satisfactionLabel = 'neutral';
        }
        satisfactionManagerData.ys.push(oneHotEncode(satisfactionLabel, SATISFACTION_CATEGORIES));

        // --- Готовим учебник для Директора ---
        const securityLabel = securityManager(l1_report);
        // Вход для директора - это комбинация отчетов от менеджеров
        directorData.xs.push([...oneHotEncode(satisfactionLabel, SATISFACTION_CATEGORIES), ...oneHotEncode(securityLabel, SECURITY_CATEGORIES)]);
        // Правильный ответ для директора берется прямо из "земли"
        directorData.ys.push(oneHotEncode(review.final_verdict, FINAL_VERDICTS));
    }
    
    console.log(`[Офис] Подготовлено ${reviews.length} кейсов для обучения.`);
    return { satisfactionManagerData, directorData };
}


// 2. ГЛАВНАЯ ФУНКЦИЯ (СБОРКА И ЗАПУСК)
// ------------------------------------
async function main() {
    const { satisfactionManagerData, directorData } = prepareTrainingData();

    console.log('[ИТ-Отдел] Начинаем обучение персонала...');
    const [satisfactionManager, director] = await Promise.all([
        createSatisfactionManager(satisfactionManagerData),
        createDirector(directorData),
    ]);
    console.log('[ИТ-Отдел] Все сотрудники обучены и готовы к работе!');

    // --- Функция для анализа нового отзыва ---
    async function analyzeReview(text) {
        console.log(`\n=================================================`);
        console.log(`ПОСТУПИЛ НОВЫЙ ОТЗЫВ: "${text}"`);
        console.log(`=================================================`);

        // Уровень 1: Отчеты от "Рабочих"
        const l1_report = {
            sentiment: sentimentExpert(text),
            topic: topicExpert(text),
            spam: spamExpert(text),
        };
        console.log(`[L1 Эксперты] Отчет:`, l1_report);

        // Уровень 2: Сводки от "Менеджеров"
        const satisfactionInput = tf.tensor2d([[l1_report.sentiment, ...oneHotEncode(l1_report.topic, TOPIC_CATEGORIES)]]);
        const satisfactionPrediction = satisfactionManager.predict(satisfactionInput);
        const satisfactionReport = decodeOutput(satisfactionPrediction, SATISFACTION_CATEGORIES);
        const securityReport = securityManager(l1_report);
        const l2_reports = { satisfaction: satisfactionReport, security: securityReport };
        console.log(`[L2 Менеджеры] Сводка:`, l2_reports);

        // Уровень 3: Финальное решение "Директора"
        const directorInput = tf.tensor2d([
            [...oneHotEncode(l2_reports.satisfaction, SATISFACTION_CATEGORIES), ...oneHotEncode(l2_reports.security, SECURITY_CATEGORIES)]
        ]);
        const directorPrediction = director.predict(directorInput);
        const finalDecision = decodeOutput(directorPrediction, FINAL_VERDICTS);
        
        console.log(`\n>>> [L3 Директор] ИТОГОВОЕ РЕШЕНИЕ: ${finalDecision.toUpperCase()} <<<`);
    }

    // --- Запускаем анализ на новых данных, которых не было в обучении ---
    await analyzeReview("Дизайн телефона просто супер, но батарея ужасно слабая и не держит заряд.");
    await analyzeReview("За свою цену — отличный выбор. Привезли быстро.");
    await analyzeReview("Вы выиграли приз! Перейдите по ссылке чтобы забрать!");
}

main();