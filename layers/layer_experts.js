/**
 * НОВЫЙ КЛЮЧЕВОЙ ЭКСПЕРТ! Определяет основное НАМЕРЕНИЕ отзыва.
 * Это самая важная функция на первом уровне, так как она задает контекст.
 * @param {string} text - Текст отзыва.
 * @returns {'complaint'|'praise'|'question'|'neutral_statement'}
 */
function intentExpert(text) {
    const lowerCaseText = text.toLowerCase();

    // ПРАВИЛЬНЫЙ ПОРЯДОК: Сначала ищем явные проблемы, потом все остальное.
    // Это предотвращает ложное срабатывание на вопросах, которые на самом деле являются жалобами.
    const problemWords = [
        'не работает', 'сломался', 'ужасно', 'плохо', 'разочарован', 'отвратительное',
        'греется', 'беспокоюсь', 'перестало', 'не могу', 'слабая', 'размытыми',
        'ждал доставку', 'нахамил', 'обман', 'хлипким', 'не смогла мне помочь', 'убрали мою',
        'завышенной', 'печка' // Добавляем слова из нашего опыта
    ];
    if (problemWords.some(word => lowerCaseText.includes(word))) {
        return 'complaint';
    }

    const questionWords = ['?', 'подскажите', 'почему', 'как', 'нормально ли'];
    if (questionWords.some(word => lowerCaseText.includes(word))) {
        return 'question';
    }

    const praiseWords = [
        'отлично', 'супер', 'нравится', 'хорошо', 'доволен', 'спасибо', 'фантастический',
        'приятно', 'в восторге', 'идеально', 'вежлив', 'вовремя' // Добавляем слова из опыта
    ];
    if (praiseWords.some(word => lowerCaseText.includes(word))) {
        return 'praise';
    }

    // Если ничего из вышеперечисленного не найдено, это нейтральное утверждение
    return 'neutral_statement';
}

/**
 * Эксперт по тональности. Теперь он полностью подчиняется intentExpert.
 * Логика стала проще и надежнее.
 */
function sentimentExpert(text) {
    const intent = intentExpert(text);

    switch (intent) {
        case 'praise':
            return 0.9; // Явно позитивный
        case 'complaint':
            return 0.1; // Явно негативный
        case 'question':
        case 'neutral_statement':
        default:
            return 0.5; // Нейтральный
    }
}

/**
 * Эксперт по теме. Улучшены словари и порядок проверки.
 */
function topicExpert(text) {
    const lowerCaseText = text.toLowerCase();
    
    // Доставка - часто специфичные слова, проверяем в первую очередь.
    const deliveryWords = ['доставка', 'привезли', 'курьер', 'коробка', 'ждал доставку', 'вовремя'];
    if (deliveryWords.some(word => lowerCaseText.includes(word))) return 'delivery';
    
    // Сервис - отдельная важная категория
    const serviceWords = ['сервис', 'поддержки', 'консультант', 'менеджер', 'оператора', 'помочь', 'вежлив'];
    if (serviceWords.some(word => lowerCaseText.includes(word))) return 'service';

    // Качество - самая широкая категория, проверяем после более узких.
    const qualityWords = [
        'качество', 'сборка', 'дизайн', 'скорость', 'сломался', 'работает', 
        'батарея', 'экран', 'камера', 'интерфейс', 'греется', 'заряд', 
        'материал', 'корпус', 'функцию', 'включаться', 'печка'
    ];
    if (qualityWords.some(word => lowerCaseText.includes(word))) return 'quality';

    const priceWords = ['цена', 'стоимость', 'деньги', 'завышенной', 'скидку', 'самолет'];
    if (priceWords.some(word => lowerCaseText.includes(word))) return 'price';
    
    return 'other';
}

/**
 * Эксперт по спаму. Компетентен и надежен. Обогащаем словарь.
 */
function spamExpert(text) {
    const spamWords = [
        'купите', 'скидка', 'ссылке', 'заработок', 'доход', 'инвестици', 
        'без риска', 'приз', 'выиграли', 'нашем сайте', 'кликните', 'перейдите',
        'ваш аккаунт', 'заблокирован', 'сенсация'
    ];
    const lowerCaseText = text.toLowerCase();
    const isSpam = spamWords.some(word => lowerCaseText.includes(word));
    return isSpam ? 1 : 0;
}

module.exports = { sentimentExpert, topicExpert, spamExpert };