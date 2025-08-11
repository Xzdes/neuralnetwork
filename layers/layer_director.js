// layers/layer_director.js
const tf = require('@tensorflow/tfjs');
const { FINAL_VERDICTS } = require('../utils'); // Импортируем утилиты

async function createDirector(trainingData) {
    const model = tf.sequential();
    model.add(tf.layers.dense({ inputShape: [trainingData.xs[0].length], units: 8, activation: 'relu' }));
    model.add(tf.layers.dense({ units: FINAL_VERDICTS.length, activation: 'softmax' }));
    model.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy' });

    const xs = tf.tensor2d(trainingData.xs);
    const ys = tf.tensor2d(trainingData.ys);

    await model.fit(xs, ys, { epochs: 300, verbose: 0 });
    return model;
}

module.exports = { createDirector };