// index.js (ВЕРСИЯ 6.0 - ФИНАЛЬНАЯ СБОРКА + САМООБУЧЕНИЕ)
const fs = require('fs');
const path = require('path');
const tf = require('@tensorflow/tfjs');

const { sentimentExpert, topicExpert, spamExpert } = require('./layers/layer_experts.js');
const { satisfactionManager, securityManager } = require('./layers/layer_managers');
const { createDirector } = require('./layers/layer_director');
const {
    TOPIC_CATEGORIES,
    SATISFACTION_CATEGORIES,
    SECURITY_CATEGORIES,
    FINAL_VERDICTS,
    oneHotEncode,
    decodeOutput
} = require('./utils');

console.log('>>> ЗАПУСК КОРПОРАЦИИ ИИ v6.0 (САМООБУЧАЮЩАЯСЯ ЭКСПЕРТНАЯ СБОРКА) <<<');

/**
 * Готовит идеально согласованные данные для обучения Директора.
 */
function prepareTrainingData() {
    console.log('[Офис] Сканирование корпоративной базы знаний...');
    const dataDir = './data';
    const files = fs.readdirSync(dataDir);
    const jsonFiles = files.filter(file => path.extname(file) === '.json');
    
    let allReviews = [];
    for (const file of jsonFiles) {
        const filePath = path.join(dataDir, file);
        const reviewsInFile = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        allReviews = allReviews.concat(reviewsInFile);
    }

    // ВАЖНО: Обучаемся на ВСЕХ размеченных данных из ВСЕХ файлов!
    const labeledReviews = allReviews.filter(r => r.final_verdict);

    if (labeledReviews.length === 0) {
        throw new Error("В базе знаний нет ни одного размеченного примера для обучения!");
    }
    
    const directorData = { xs: [], ys: [] };

    for (const review of labeledReviews) {
        const l1_report = { sentiment: sentimentExpert(review.text), topic: topicExpert(review.text), spam: spamExpert(review.text) };
        const l2_report = { satisfaction: satisfactionManager(l1_report), security: securityManager(l1_report) };
        
        directorData.xs.push([
            ...oneHotEncode(l2_report.satisfaction, SATISFACTION_CATEGORIES),
            ...oneHotEncode(l2_report.security, SECURITY_CATEGORIES)
        ]);
        directorData.ys.push(oneHotEncode(review.final_verdict, FINAL_VERDICTS));
    }
    
    console.log(`[Офис] Подготовлено ${labeledReviews.length} согласованных кейсов из ${jsonFiles.length} файлов.`);
    return directorData;
}

/**
 * Проводит полный анализ одного отзыва по всей иерархии.
 */
async function getFullAnalysis(text, models) {
    const l1_report = { sentiment: sentimentExpert(text), topic: topicExpert(text), spam: spamExpert(text) };
    const l2_reports = { satisfaction: satisfactionManager(l1_report), security: securityManager(l1_report) };

    const directorInput = tf.tensor2d([[
        ...oneHotEncode(l2_reports.satisfaction, SATISFACTION_CATEGORIES), 
        ...oneHotEncode(l2_reports.security, SECURITY_CATEGORIES)
    ]]);
    const directorPrediction = models.director.predict(directorInput);
    const finalDecision = decodeOutput(directorPrediction, FINAL_VERDICTS);

    return { l1_report, l2_reports, finalDecision };
}

/**
 * Сканирует папку data, обрабатывает неразмеченные файлы и сохраняет результаты.
 */
async function processAndLearnFromData(models) {
    console.log('\n\n--- ФАЗА 3: ПОИСК НЕРАЗМЕЧЕННЫХ ДАННЫХ ДЛЯ ОБОГАЩЕНИЯ ---');
    const dataDir = './data';
    const files = fs.readdirSync(dataDir);
    const jsonFiles = files.filter(file => path.extname(file) === '.json');

    for (const file of jsonFiles) {
        // Пропускаем наш основной обучающий файл, чтобы случайно его не изменить
        if (file === 'reviews.json') continue;

        const filePath = path.join(dataDir, file);
        const reviews = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        
        let fileWasModified = false;
        console.log(`\n[Анализ Архива] Проверка файла: ${file}`);

        for (const review of reviews) {
            if (!review.final_verdict) {
                console.log(`  > Найден неразмеченный отзыв: "${review.text.substring(0, 40)}..."`);
                const { finalDecision } = await getFullAnalysis(review.text, models);
                review.final_verdict = finalDecision; // Обогащаем объект!
                fileWasModified = true;
                console.log(`  > ПРИСВОЕН ВЕРДИКТ: ${finalDecision.toUpperCase()}`);
            }
        }

        if (fileWasModified) {
            console.log(`[Сохранение Знаний] Обнаружены изменения в ${file}. Перезаписываю файл...`);
            fs.writeFileSync(filePath, JSON.stringify(reviews, null, 2));
            console.log(`[Сохранение Знаний] Файл ${file} успешно обновлен.`);
        } else {
            console.log(`[Анализ Архива] В файле ${file} не найдено работы. Пропускаю.`);
        }
    }
}


/**
 * Главная функция, оркестрирующая все процессы.
 */
async function main() {
    // --- Фаза 1: Обучение ---
    const directorData = prepareTrainingData();
    console.log('[ИТ-Отдел] Начинаем обучение Директора...');
    const models = {
        director: await createDirector(directorData),
    };
    console.log('[ИТ-Отдел] Персонал обучен и готов к работе!');

    // --- Фаза 2: Демонстрационный анализ (быстрая проверка) ---
    console.log('\n--- ФАЗА 2: БЫСТРАЯ ПРОВЕРКА КОМПЕТЕНТНОСТИ ---');
    const testReview = "Телефон вроде работает, но ждал доставку две недели. Это нормально?";
    const { finalDecision } = await getFullAnalysis(testReview, models);
    console.log(`Тестовый отзыв: "${testReview}"`);
    console.log(`>>> Итоговый вердикт: ${finalDecision.toUpperCase()}`);
    
    // --- Фаза 3: Автономная работа и самообучение ---
    await processAndLearnFromData(models);

    console.log('\n>>> РАБОЧИЙ ЦИКЛ КОРПОРАЦИИ ЗАВЕРШЕН <<<');
}

main();