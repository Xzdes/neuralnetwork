// layers/layer2_managers.js
const tf = require('@tensorflow/tfjs');
const { oneHotEncode, SATISFACTION_CATEGORIES } = require('../utils'); // Импортируем утилиты

async function createSatisfactionManager(trainingData) {
    const model = tf.sequential();
    model.add(tf.layers.dense({ inputShape: [trainingData.xs[0].length], units: 8, activation: 'relu' }));
    model.add(tf.layers.dense({ units: SATISFACTION_CATEGORIES.length, activation: 'softmax' }));
    model.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy' });

    const xs = tf.tensor2d(trainingData.xs);
    const ys = tf.tensor2d(trainingData.ys);

    await model.fit(xs, ys, { epochs: 300, verbose: 0 });
    return model;
}

// Менеджер по безопасности остается простым и быстрым
function securityManager(l1_report) {
    return l1_report.spam > 0.8 ? 'threat' : 'safe';
}

module.exports = { createSatisfactionManager, securityManager };