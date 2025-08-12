const TOPIC_CATEGORIES = ['price', 'quality', 'delivery', 'other'];
const SATISFACTION_CATEGORIES = ['happy', 'unhappy', 'neutral'];
const SECURITY_CATEGORIES = ['safe', 'threat'];
const FINAL_VERDICTS = ['priority_complaint', 'positive_feedback', 'spam_to_delete'];

function oneHotEncode(value, categories) {
    const encoding = Array(categories.length).fill(0);
    const index = categories.indexOf(value);
    if (index > -1) encoding[index] = 1;
    return encoding;
}

/**
 * Создает словарь из самых частых слов в массиве текстов.
 * @param {string[]} texts - Массив всех текстов для анализа.
 * @param {number} vocabSize - Желаемый размер словаря.
 * @returns {string[]} - Массив-словарь.
 */
function createVocabulary(texts, vocabSize) {
    console.log(`[Utils] Создание словаря из ${texts.length} текстов...`);
    // Очищаем текст от знаков препинания для лучшего качества словаря
    const allWords = texts.join(' ').toLowerCase().replace(/[.,!?"'()`]/g, '').split(/\s+/g);
    const wordCounts = {};
    allWords.forEach(word => {
        // Игнорируем слишком короткие слова (предлоги, союзы)
        if (word.length > 2) {
             wordCounts[word] = (wordCounts[word] || 0) + 1;
        }
    });

    const sortedWords = Object.keys(wordCounts).sort((a, b) => wordCounts[b] - wordCounts[a]);
    const vocabulary = sortedWords.slice(0, vocabSize);
    console.log(`[Utils] Словарь создан. Размер: ${vocabulary.length} слов.`);
    return vocabulary;
}

/**
 * Преобразует текст в вектор "мешка слов" (Bag of Words).
 * @param {string} text - Входной текст.
 * @param {string[]} vocabulary - Словарь, на основе которого создается вектор.
 * @returns {number[]} - Вектор из 0 и 1.
 */
function textToBoW(text, vocabulary) {
    const vector = Array(vocabulary.length).fill(0);
    const lowerCaseText = text.toLowerCase().replace(/[.,!?"'()`]/g, '');
    const wordsInText = new Set(lowerCaseText.split(/\s+/g)); // Используем Set для уникальности слов
    
    for (const word of wordsInText) {
        const index = vocabulary.indexOf(word);
        if (index !== -1) {
            vector[index] = 1;
        }
    }
    return vector;
}


module.exports = {
    TOPIC_CATEGORIES,
    SATISFACTION_CATEGORIES,
    SECURITY_CATEGORIES,
    FINAL_VERDICTS,
    oneHotEncode,
    createVocabulary, // Новая функция
    textToBoW         // Новая функция
};