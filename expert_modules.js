// expert_modules.js

// Эксперт №1: Анализатор тональности (хороший/плохой)
function sentimentExpert(text) {
  const positiveWords = ['отлично', 'супер', 'нравится', 'хорошо', 'доволен'];
  const negativeWords = ['ужасно', 'плохо', 'сломался', 'не работает', 'разочарован'];
  
  let score = 0.5; // Нейтральный
  if (positiveWords.some(word => text.includes(word))) score = 0.9;
  if (negativeWords.some(word => text.includes(word))) score = 0.1;

  return score; // Возвращает число от 0 (плохо) до 1 (хорошо)
}

// Эксперт №2: Определитель темы
function topicExpert(text) {
  const priceWords = ['цена', 'дорого', 'дешево', 'стоимость', 'деньги'];
  const qualityWords = ['качество', 'сборка', 'материал', 'надежность', 'сломался', 'развалилось', 'дизайн', 'скорость'];
  const deliveryWords = ['доставка', 'привезли', 'курьер', 'коробка'];
  
  // Мы можем даже возвращать несколько тем, но для простоты вернем первую найденную
  if (qualityWords.some(word => text.includes(word))) return 'quality';
  if (priceWords.some(word => text.includes(word))) return 'price';
  if (deliveryWords.some(word => text.includes(word))) return 'delivery'; // Новая категория!
  
  return 'other';
}

// Эксперт №3: Детектор спама
function spamExpert(text) {
    const spamWords = ['купите', 'скидка', 'переходи по ссылке', 'заработок'];
    const isSpam = spamWords.some(word => text.toLowerCase().includes(word));
    return isSpam ? 1 : 0; // 1 = спам, 0 = не спам
}

module.exports = { sentimentExpert, topicExpert, spamExpert };