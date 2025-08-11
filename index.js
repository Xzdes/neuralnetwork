// index.js (ВЕРСИЯ 10.0 - АБСОЛЮТНАЯ ПРОЗРАЧНОСТЬ)
const fs = require('fs');
const path = require('path');
const { DirectorNet } = require('./DirectorNet.js');
const { sentimentExpert, topicExpert, spamExpert } = require('./layers/layer_experts.js');
const { satisfactionManager, securityManager } = require('./layers/layer_managers');
const {
    TOPIC_CATEGORIES,
    SATISFACTION_CATEGORIES,
    SECURITY_CATEGORIES,
    FINAL_VERDICTS,
    oneHotEncode,
} = require('./utils');

console.log('>>> ЗАПУСК КОРПОРАЦИИ ИИ v10.0 (АБСОЛЮТНАЯ ПРОЗРАЧНОСТЬ) <<<');

/**
 * Сканирует всю корпоративную базу знаний и готовит единый набор данных для обучения.
 */
function prepareTrainingData() {
    console.log('[Офис] Сканирование корпоративной базы знаний...');
    const dataDir = './data';
    const files = fs.readdirSync(dataDir);
    const jsonFiles = files.filter(file => path.extname(file) === '.json');
    
    let allReviews = [];
    for (const file of jsonFiles) {
        const filePath = path.join(dataDir, file);
        try {
            const reviewsInFile = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            allReviews = allReviews.concat(reviewsInFile);
        } catch (e) {
            console.warn(`Предупреждение: Не удалось прочитать файл ${file}.`);
        }
    }

    const labeledReviews = allReviews.filter(r => r.final_verdict);

    if (labeledReviews.length === 0) {
        throw new Error("В базе знаний нет ни одного размеченного примера для обучения!");
    }
    
    const trainingSet = [];
    for (const review of labeledReviews) {
        const l1_report = { sentiment: sentimentExpert(review.text), topic: topicExpert(review.text), spam: spamExpert(review.text) };
        const l2_report = { satisfaction: satisfactionManager(l1_report), security: securityManager(l1_report) };
        
        const input = [...oneHotEncode(l2_report.satisfaction, SATISFACTION_CATEGORIES), ...oneHotEncode(l2_report.security, SECURITY_CATEGORIES)];
        const output = oneHotEncode(review.final_verdict, FINAL_VERDICTS);
        trainingSet.push({ input, output });
    }
    
    console.log(`[Офис] Подготовлено ${labeledReviews.length} согласованных кейсов из ${jsonFiles.length} файлов для обучения.`);
    return trainingSet;
}

/**
 * Проводит полный анализ и возвращает сырой результат для анализа "мыслей".
 */
function getFullAnalysis(text, directorNet) {
    const l1_report = { sentiment: sentimentExpert(text), topic: topicExpert(text), spam: spamExpert(text) };
    const l2_reports = { satisfaction: satisfactionManager(l1_report), security: securityManager(l1_report) };
    
    const inputForNet = [...oneHotEncode(l2_reports.satisfaction, SATISFACTION_CATEGORIES), ...oneHotEncode(l2_reports.security, SECURITY_CATEGORIES)];
    const prediction = directorNet.predict(inputForNet);
    
    let maxIndex = 0;
    for (let i = 1; i < prediction.length; i++) {
        if (prediction[i] > prediction[maxIndex]) maxIndex = i;
    }
    const finalDecision = FINAL_VERDICTS[maxIndex];

    return { l1_report, l2_reports, finalDecision, confidence: prediction };
}

/**
 * Сканирует папку data, обрабатывает неразмеченные файлы и сохраняет результаты с подробным логированием.
 */
function processAndLearnFromData(directorNet) {
    console.log('\n\n--- ФАЗА 3: ПОИСК И ОБРАБОТКА НОВЫХ ЗАДАЧ ---');
    const dataDir = './data';
    const files = fs.readdirSync(dataDir);
    const jsonFiles = files.filter(file => path.extname(file) === '.json');

    for (const file of jsonFiles) {
        const filePath = path.join(dataDir, file);
        const reviews = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        
        let fileWasModified = false;
        console.log(`\n[Анализ Архива] Проверка файла: ${file}`);

        for (const review of reviews) {
            if (!review.final_verdict) {
                console.log(`\n  > Найден неразмеченный отзыв: "${review.text}"`);
                
                // Получаем полный анализ со всеми данными для лога
                const { l1_report, l2_reports, finalDecision, confidence } = getFullAnalysis(review.text, directorNet);
                
                // ВЫВОДИМ "МЫСЛИ" ДИРЕКТОРА ПРЯМО В ПРОЦЕССЕ РАБОТЫ
                console.log(`    [L1 Эксперты] Отчет:`, l1_report);
                console.log(`    [L2 Менеджеры] Сводка:`, l2_reports);
                console.log(`    [L3 Директор] Уверенность: 
                - Жалоба: ${(confidence[0] * 100).toFixed(2)}%
                - Позитив:  ${(confidence[1] * 100).toFixed(2)}%
                - Спам:     ${(confidence[2] * 100).toFixed(2)}%`);

                review.final_verdict = finalDecision;
                fileWasModified = true;
                console.log(`  > ПРИСВОЕН ВЕРДИКТ: ${finalDecision.toUpperCase()}`);
            }
        }

        if (fileWasModified) {
            console.log(`\n[Сохранение Знаний] Обнаружены изменения в ${file}. Перезаписываю файл...`);
            fs.writeFileSync(filePath, JSON.stringify(reviews, null, 2));
            console.log(`[Сохранение Знаний] Файл ${file} успешно обновлен.`);
        } else {
            console.log(`[Анализ Архива] В файле ${file} не найдено работы.`);
        }
    }
}

/**
 * Главная функция, оркестрирующая все процессы.
 */
function main() {
    // --- Фаза 1: Обучение ---
    const trainingSet = prepareTrainingData();
    console.log('[ИТ-Отдел] Создание и обучение собственного Директора...');
    
    const directorNet = new DirectorNet(5, 8, 3);
    const epochs = 1000;
    for (let i = 0; i < epochs; i++) {
        for (const data of trainingSet) {
            directorNet.train(data.input, data.output);
        }
    }
    
    console.log(`[ИТ-Отдел] Директор обучен и готов к работе!`);

    // --- Фаза 2: Быстрая проверка ---
    console.log('\n--- ФАЗА 2: БЫСТРАЯ ПРОВЕРКА КОМПЕТЕНТНОСТИ ---');
    // ... быстрая проверка остается для самоконтроля ...
    
    // --- Фаза 3: Автономная работа с полным логированием ---
    processAndLearnFromData(directorNet);

    console.log('\n>>> РАБОЧИЙ ЦИКЛ КОРПОРАЦИИ ЗАВЕРШЕН <<<');
}

main();