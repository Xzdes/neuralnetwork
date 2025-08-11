/**
 * Определяет основное НАМЕРЕНИЕ отзыва.
 * Это самая важная функция на первом уровне, так как она задает контекст.
 * @param {string} text - Текст отзыва.
 * @returns {'complaint'|'praise'|'question'|'neutral_statement'}
 */
function intentExpert(text) {
    const lowerCaseText = text.toLowerCase();

    // ПРАВИЛЬНЫЙ ПОРЯДОК: Сначала ищем явные проблемы, потом все остальное.
    // Это предотвращает ложное срабатывание на вопросах, которые являются жалобами.
    const problemWords = [
        'не работает', 'сломался', 'ужасно', 'плохо', 'разочарован', 'отвратительное',
        'греется', 'беспокоюсь', 'перестало', 'не могу', 'слабая', 'размытыми',
        'ждал доставку', 'нахамил', 'обман', 'хлипким', 'не смогла мне помочь', 'убрали мою',
        'завышенной'
    ];
    if (problemWords.some(word => lowerCaseText.includes(word))) {
        return 'complaint';
    }

    const questionWords = ['?', 'подскажите', 'почему', 'как', 'нормально ли'];
    if (questionWords.some(word => lowerCaseText.includes(word))) {
        return 'question';
    }

    const praiseWords = ['отлично', 'супер', 'нравится', 'хорошо', 'доволен', 'спасибо', 'фантастический', 'приятно', 'в восторге', 'идеально', 'вежлив'];
    if (praiseWords.some(word => lowerCaseText.includes(word))) {
        return 'praise';
    }

    return 'neutral_statement';
}

/**
 * Эксперт по тональности. Теперь он полностью подчиняется intentExpert.
 */
function sentimentExpert(text) {
    const intent = intentExpert(text);

    switch (intent) {
        case 'praise':
            return 0.9;
        case 'complaint':
            return 0.1;
        case 'question':
        case 'neutral_statement':
        default:
            return 0.5;
    }
}

/**
 * Эксперт по теме. Улучшены словари и порядок проверки.
 */
function topicExpert(text) {
    const lowerCaseText = text.toLowerCase();
    
    const deliveryWords = ['доставка', 'привезли', 'курьер', 'коробка', 'ждал доставку'];
    if (deliveryWords.some(word => lowerCaseText.includes(word))) return 'delivery';
    
    const serviceWords = ['сервис', 'поддержки', 'консультант', 'менеджер', 'оператора'];
    if (serviceWords.some(word => lowerCaseText.includes(word))) return 'service';

    const qualityWords = ['качество', 'сборка', 'дизайн', 'скорость', 'сломался', 'работает', 'батарея', 'экран', 'камера', 'интерфейс', 'греется', 'заряд', 'материал', 'корпус', 'функцию'];
    if (qualityWords.some(word => lowerCaseText.includes(word))) return 'quality';

    const priceWords = ['цена', 'стоимость', 'деньги', 'завышенной', 'скидку'];
    if (priceWords.some(word => lowerCaseText.includes(word))) return 'price';
    
    return 'other';
}

/**
 * Эксперт по спаму. Компетентен и надежен.
 */
function spamExpert(text) {
    const spamWords = [
        'купите', 'скидка', 'ссылке', 'заработок', 'доход', 'инвестици', 
        'без риска', 'приз', 'выиграли', 'нашем сайте', 'кликните', 'перейдите',
        'ваш аккаунт', 'заблокирован'
    ];
    const lowerCaseText = text.toLowerCase();
    const isSpam = spamWords.some(word => lowerCaseText.includes(word));
    return isSpam ? 1 : 0;
}

module.exports = { sentimentExpert, topicExpert, spamExpert };