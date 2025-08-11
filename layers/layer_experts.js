// layers/layer1_experts.js
function sentimentExpert(text) {
  const positiveWords = ['отлично', 'супер', 'нравится', 'хорошо', 'доволен', 'спасибо'];
  const negativeWords = ['ужасно', 'плохо', 'сломался', 'не работает', 'разочарован', 'отвратительное', 'порвана'];
  let score = 0.5;
  if (positiveWords.some(word => text.toLowerCase().includes(word))) score = 0.9;
  if (negativeWords.some(word => text.toLowerCase().includes(word))) score = 0.1;
  return score;
}

function topicExpert(text) {
  const priceWords = ['цена', 'стоимость', 'деньги'];
  const qualityWords = ['качество', 'сборка', 'дизайн', 'скорость', 'сломался', 'работает'];
  const deliveryWords = ['доставка', 'привезли', 'курьер', 'коробка'];
  if (qualityWords.some(word => text.toLowerCase().includes(word))) return 'quality';
  if (priceWords.some(word => text.toLowerCase().includes(word))) return 'price';
  if (deliveryWords.some(word => text.toLowerCase().includes(word))) return 'delivery';
  return 'other';
}

function spamExpert(text) {
  const spamWords = ['купите', 'скидка', 'ссылке', 'заработок'];
  const isSpam = spamWords.some(word => text.toLowerCase().includes(word));
  return isSpam ? 1 : 0;
}

module.exports = { sentimentExpert, topicExpert, spamExpert };