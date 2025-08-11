// index.js (ВЕРСИЯ 7.0 - НЕЗАВИСИМАЯ СБОРКА)
const fs = require('fs');
const path = require('path');

// Импортируем наш собственный движок!
const { DirectorNet } = require('./DirectorNet.js');

// Эксперты и Менеджеры - наши надежные JS-функции
const { sentimentExpert, topicExpert, spamExpert } = require('./layers/layer_experts.js');
const { satisfactionManager, securityManager } = require('./layers/layer_managers');

// Утилиты остаются прежними
const {
    TOPIC_CATEGORIES,
    SATISFACTION_CATEGORIES,
    SECURITY_CATEGORIES,
    FINAL_VERDICTS,
    oneHotEncode,
} = require('./utils');

console.log('>>> ЗАПУСК КОРПОРАЦИИ ИИ v7.0 (НЕЗАВИСИМЫЙ ДВИЖОК) <<<');

/**
 * Готовит данные для обучения. Код не меняется.
 */
function prepareTrainingData() {
    // ... Код этой функции остается точно таким же, как в версии 6.0 ...
    // Он сканирует папку data, собирает все отзывы и готовит входы и выходы
    // для Директора.
    console.log('[Офис] Сканирование корпоративной базы знаний...');
    const dataDir = './data';
    const files = fs.readdirSync(dataDir);
    const jsonFiles = files.filter(file => path.extname(file) === '.json');
    
    let allReviews = [];
    for (const file of jsonFiles) {
        const filePath = path.join(dataDir, file);
        try { // Добавим обработку ошибок на случай пустого файла
            const reviewsInFile = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            allReviews = allReviews.concat(reviewsInFile);
        } catch (e) {
            console.warn(`Предупреждение: Не удалось прочитать файл ${file}. Он может быть пустым или поврежденным.`);
        }
    }

    const labeledReviews = allReviews.filter(r => r.final_verdict);

    if (labeledReviews.length === 0) {
        throw new Error("В базе знаний нет ни одного размеченного примера для обучения!");
    }
    
    // Вместо directorData, теперь это общий trainingSet
    const trainingSet = [];

    for (const review of labeledReviews) {
        const l1_report = { sentiment: sentimentExpert(review.text), topic: topicExpert(review.text), spam: spamExpert(review.text) };
        const l2_report = { satisfaction: satisfactionManager(l1_report), security: securityManager(l1_report) };
        
        const input = [
            ...oneHotEncode(l2_report.satisfaction, SATISFACTION_CATEGORIES),
            ...oneHotEncode(l2_report.security, SECURITY_CATEGORIES)
        ];
        const output = oneHotEncode(review.final_verdict, FINAL_VERDICTS);
        trainingSet.push({ input, output });
    }
    
    console.log(`[Офис] Подготовлено ${labeledReviews.length} согласованных кейсов для обучения Директора.`);
    return trainingSet;
}


/**
 * Проводит полный анализ одного отзыва с помощью DirectorNet.
 */
function getFullAnalysis(text, directorNet) {
    const l1_report = { sentiment: sentimentExpert(text), topic: topicExpert(text), spam: spamExpert(text) };
    const l2_reports = { satisfaction: satisfactionManager(l1_report), security: securityManager(l1_report) };
    
    const inputForNet = [
        ...oneHotEncode(l2_reports.satisfaction, SATISFACTION_CATEGORIES), 
        ...oneHotEncode(l2_reports.security, SECURITY_CATEGORIES)
    ];

    // Используем наш собственный метод predict!
    const prediction = directorNet.predict(inputForNet);
    
    // Логика нахождения лучшего ответа
    let maxIndex = 0;
    for (let i = 1; i < prediction.length; i++) {
        if (prediction[i] > prediction[maxIndex]) {
            maxIndex = i;
        }
    }
    const finalDecision = FINAL_VERDICTS[maxIndex];

    return { l1_report, l2_reports, finalDecision };
}

/**
 * Главная функция, оркестрирующая все процессы.
 */
function main() {
    // --- Фаза 1: Обучение ---
    const trainingSet = prepareTrainingData();
    console.log('[ИТ-Отдел] Создание и обучение собственного Директора...');
    
    // Создаем нашего Директора! Архитектура: 5 входов, 8 скрытых нейронов, 3 выхода
    const directorNet = new DirectorNet(5, 8, 3);

    // Запускаем цикл обучения
    const epochs = 1000; // Нам нужно больше эпох для самописной сети
    for (let i = 0; i < epochs; i++) {
        for (const data of trainingSet) {
            directorNet.train(data.input, data.output);
        }
    }
    
    console.log(`[ИТ-Отдел] Директор обучен за ${epochs} эпох и готов к работе!`);

    // --- Фаза 2: Финальный экзамен ---
    console.log('\n--- ФАЗА 2: ФИНАЛЬНЫЙ ЭКЗАМЕН ---');
    const testReviews = [
      "Телефон сильно греется во время разговора, я беспокоюсь.",
      "Телефон вроде работает, но ждал доставку две недели. Это нормально?",
      "Экран яркий, камера хорошая, хотя батарея могла бы быть и получше.",
      "Узнайте, как получить доход от инвестиций без риска. Информация на нашем сайте."
    ];

    for(const review of testReviews) {
        const { l1_report, l2_reports, finalDecision } = getFullAnalysis(review, directorNet);
        console.log(`\n=================================================`);
        console.log(`ПОСТУПИЛ НОВЫЙ ОТЗЫВ: "${review}"`);
        console.log(`=================================================`);
        console.log(`[L1 Эксперты] Отчет:`, l1_report);
        console.log(`[L2 Менеджеры] Сводка:`, l2_reports);
        console.log(`\n>>> [L3 Директор] ИТОГОВОЕ РЕШЕНИЕ: ${finalDecision.toUpperCase()} <<<`);
    }

    console.log('\n>>> РАБОЧИЙ ЦИКЛ КОРПОРАЦИИ ЗАВЕРШЕН <<<');
}

main();