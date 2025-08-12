const { DirectorNet } = require('./DirectorNet.js');
const { createVocabulary, textToBoW, TOPIC_CATEGORIES, oneHotEncode } = require('./utils.js');
// Мы импортируем старых экспертов, чтобы создать обучающую выборку "с правильными ответами"
const { sentimentExpert, topicExpert, spamExpert } = require('./layers/layer_experts.js');

const VOCABULARY_SIZE = 500;  // Размер нашего словаря
const HIDDEN_NODES = 64;      // Количество нейронов в скрытом слое для этой задачи
const EPOCHS = 100;           // Количество эпох обучения

class ExpertsNet {
    constructor() {
        this.model = null;
        this.vocabulary = null;
        // 4 (тема) + 1 (тональность) + 1 (спам)
        this.outputSize = TOPIC_CATEGORIES.length + 2;
    }

    /**
     * Обучает нейросеть-эксперта на основе всех доступных текстов.
     * @param {string[]} allTexts - Массив всех текстов из базы знаний.
     */
    train(allTexts) {
        console.log('[Эксперт L1] Запуск процесса обучения...');
        
        // 1. Создаем словарь на основе ВСЕХ текстов
        this.vocabulary = createVocabulary(allTexts, VOCABULARY_SIZE);

        // 2. Создаем и настраиваем модель DirectorNet для нашей задачи
        this.model = new DirectorNet(this.vocabulary.length, HIDDEN_NODES, this.outputSize);
        this.model.learning_rate = 0.05; // Для более сложной задачи шаг обучения лучше сделать поменьше

        console.log(`[Эксперт L1] Подготовка ${allTexts.length} обучающих примеров...`);
        
        // 3. Готовим обучающий набор
        const trainingSet = [];
        for (const text of allTexts) {
            if (!text) continue; // Пропускаем пустые отзывы
            
            // Вход: текст, преобразованный в вектор "мешка слов"
            const input = textToBoW(text, this.vocabulary);
            
            // Выход: "идеальный" ответ, сгенерированный старыми экспертами
            const targetTopicVec = oneHotEncode(topicExpert(text), TOPIC_CATEGORIES);
            const targetSentiment = sentimentExpert(text);
            const targetSpam = spamExpert(text);
            const output = [...targetTopicVec, targetSentiment, targetSpam];

            trainingSet.push({ input, output });
        }

        // 4. Запускаем цикл обучения
        console.log(`[Эксперт L1] Начало обучения на ${EPOCHS} эпох...`);
        for (let i = 0; i < EPOCHS; i++) {
            let errorSum = 0;
            for (const data of trainingSet) {
                this.model.train(data.input, data.output);
            }
            if ((i + 1) % 10 === 0) {
                 console.log(`  > Эпоха ${i + 1}/${EPOCHS} завершена.`);
            }
        }
        console.log('[Эксперт L1] Обучение успешно завершено!');
    }

    /**
     * Предсказывает L1-отчет для одного текста.
     * @param {string} text - Входной текст отзыва.
     * @returns {{sentiment: number, topic: string, spam: number}}
     */
    predict(text) {
        if (!this.model) {
            throw new Error("Модель ExpertsNet еще не обучена! Сначала вызовите .train()");
        }

        // 1. Преобразуем входной текст в вектор
        const inputVector = textToBoW(text, this.vocabulary);
        
        // 2. Получаем предсказание от нашей внутренней нейросети
        const predictionVector = this.model.predict(inputVector);

        // 3. Декодируем выходной вектор обратно в структурированный отчет
        const topicVector = predictionVector.slice(0, TOPIC_CATEGORIES.length);
        const sentimentValue = predictionVector[TOPIC_CATEGORIES.length];
        const spamValue = predictionVector[TOPIC_CATEGORIES.length + 1];

        // Находим индекс темы с максимальной уверенностью
        let maxIndex = 0;
        for (let i = 1; i < topicVector.length; i++) {
            if (topicVector[i] > topicVector[maxIndex]) {
                maxIndex = i;
            }
        }
        
        const topic = TOPIC_CATEGORIES[maxIndex];

        // Ограничиваем значения от 0 до 1, так как сигмоида может быть неидеальной
        const clamp = (num) => Math.max(0, Math.min(1, num));

        return {
            sentiment: clamp(sentimentValue),
            topic: topic,
            spam: clamp(spamValue)
        };
    }
}

module.exports = { ExpertsNet };