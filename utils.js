// utils.js
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

function decodeOutput(prediction, categories) {
    const index = prediction.argMax(-1).dataSync()[0];
    return categories[index];
}

module.exports = {
    TOPIC_CATEGORIES,
    SATISFACTION_CATEGORIES,
    SECURITY_CATEGORIES,
    FINAL_VERDICTS,
    oneHotEncode,
    decodeOutput
};