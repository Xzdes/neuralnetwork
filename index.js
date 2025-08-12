const fs = require('fs');
const path = require('path');
const { DirectorNet } = require('./DirectorNet.js');
const { ExpertsNet } = require('./ExpertsNet.js'); // <-- НАШ НОВЫЙ НЕЙРОСЕТЕВОЙ ЭКСПЕРТ
// Старые эксперты больше не нужны для работы, только для обучения ExpertsNet (они внутри него)
// const { sentimentExpert, topicExpert, spamExpert } = require('./layers/layer_experts.js'); 
const { satisfactionManager, securityManager } = require('./layers/layer_managers');
const {
    TOPIC_CATEGORIES,
    SATISFACTION_CATEGORIES,
    SECURITY_CATEGORIES,
    FINAL_VERDICTS,
    oneHotEncode,
} = require('./utils');

console.log('>>> ЗАПУСК КОРПОРАЦИИ ИИ v12.0 (ПОЛНАЯ АВТОНОМИЯ) <<<');

/**
 * Сканирует все JSON-файлы и возвращает массив всех текстов отзывов.
 * Нужно для первоначального обучения ExpertsNet.
 */
function getAllReviewTexts() {
    console.log('[Офис] Сканирование всей базы знаний для сбора текстов...');
    const dataDir = './data';
    const files = fs.readdirSync(dataDir);
    const jsonFiles = files.filter(file => path.extname(file) === '.json');
    
    let allTexts = [];
    for (const file of jsonFiles) {
        const filePath = path.join(dataDir, file);
        try {
            const reviewsInFile = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            for (const review of reviewsInFile) {
                if (review.text) {
                    allTexts.push(review.text);
                }
            }
        } catch (e) {
            console.warn(`Предупреждение: Не удалось прочитать файл ${file}.`);
        }
    }
    return allTexts;
}


/**
 * Готовит набор данных для обучения Директора, используя уже обученного ExpertsNet.
 * @param {ExpertsNet} expertsNet - Обученный экземпляр L1-эксперта.
 */
function prepareDirectorTrainingData(expertsNet) {
    console.log('[Офис] Подготовка данных для обучения L3-Директора...');
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

    const labeledReviews = allReviews.filter(r => r.final_verdict && r.text);

    if (labeledReviews.length === 0) {
        throw new Error("В базе знаний нет ни одного размеченного примера для обучения Директора!");
    }
    
    const trainingSet = [];
    for (const review of labeledReviews) {
        // Генерируем L1 отчет с помощью нашей новой нейросети
        const l1_report = expertsNet.predict(review.text);
        const l2_report = { satisfaction: satisfactionManager(l1_report), security: securityManager(l1_report) };
        
        const input = [...oneHotEncode(l2_report.satisfaction, SATISFACTION_CATEGORIES), ...oneHotEncode(l2_report.security, SECURITY_CATEGORIES)];
        const output = oneHotEncode(review.final_verdict, FINAL_VERDICTS);
        trainingSet.push({ input, output });
    }
    
    console.log(`[Офис] Подготовлено ${labeledReviews.length} согласованных кейсов для обучения Директора.`);
    return trainingSet;
}

/**
 * Проводит полный анализ и возвращает сырой результат.
 * @param {string} text - Текст отзыва.
 * @param {DirectorNet} directorNet - Обученный Директор.
 * @param {ExpertsNet} expertsNet - Обученный Эксперт.
 */
function getFullAnalysis(text, directorNet, expertsNet) {
    // Получаем L1 отчет от нейросети-эксперта
    const l1_report = expertsNet.predict(text);
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
 * Сканирует папку data, обрабатывает неразмеченные файлы и сохраняет результаты.
 */
function processNewData(directorNet, expertsNet) {
    console.log('\n\n--- ФАЗА 2: ПОИСК И ОБРАБОТКА НОВЫХ ЗАДАЧ ---');
    const dataDir = './data';
    const files = fs.readdirSync(dataDir);
    const jsonFiles = files.filter(file => path.extname(file) === '.json');

    for (const file of jsonFiles) {
        const filePath = path.join(dataDir, file);
        const reviews = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        
        let fileWasModified = false;
        console.log(`\n[Анализ Архива] Проверка файла: ${file}`);

        for (const review of reviews) {
            if (!review.final_verdict && review.text) {
                console.log(`\n  > Найден неразмеченный отзыв: "${review.text}"`);
                
                const { l1_report, l2_reports, finalDecision, confidence } = getFullAnalysis(review.text, directorNet, expertsNet);
                
                console.log(`    [L1 Эксперт-Нейросеть] Отчет:`, l1_report);
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
            console.log(`[Анализ Архива] В файле ${file} не найдено новой работы.`);
        }
    }
}

/**
 * Главная функция, оркестрирующая все процессы.
 */
function main() {
    // --- Фаза 0: Обучение L1-Эксперта ---
    // Этот эксперт учится один раз при запуске на всех доступных текстовых данных
    const allTexts = getAllReviewTexts();
    if (allTexts.length === 0) {
        throw new Error("В папке data нет текстов для обучения L1-Эксперта!");
    }
    const expertsNet = new ExpertsNet();
    expertsNet.train(allTexts);

    // --- Фаза 1: Обучение L3-Директора ---
    // Директор обучается на отчетах, сгенерированных свежеобученным L1-Экспертом
    const directorTrainingSet = prepareDirectorTrainingData(expertsNet);
    console.log('[ИТ-Отдел] Создание и обучение L3-Директора...');
    
    const directorNet = new DirectorNet(5, 8, 3); // Вход 5 (3 sat + 2 sec), скрытый 8, выход 3
    const epochs = 1000;
    for (let i = 0; i < epochs; i++) {
        for (const data of directorTrainingSet) {
            directorNet.train(data.input, data.output);
        }
    }
    
    console.log(`[ИТ-Отдел] L3-Директор обучен и готов к работе!`);

    // --- Фаза 2: Автономная работа с полным логированием ---
    processNewData(directorNet, expertsNet);

    console.log('\n>>> РАБОЧИЙ ЦИКЛ КОРПОРАЦИИ ЗАВЕРШЕН <<<');
}

main();