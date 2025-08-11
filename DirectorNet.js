// DirectorNet.js - Мой собственный, минималистичный нейросетевой движок

// ---------------------------------
// ВСПОМОГАТЕЛЬНЫЙ КЛАСС ДЛЯ МАТРИЦ
// Нейросети - это, по сути, операции с матрицами.
// ---------------------------------
class Matrix {
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.data = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
    }

    // Создать матрицу из простого массива
    static fromArray(arr) {
        let m = new Matrix(arr.length, 1);
        for (let i = 0; i < arr.length; i++) {
            m.data[i][0] = arr[i];
        }
        return m;
    }

    // Преобразовать матрицу обратно в массив
    toArray() {
        let arr = [];
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                arr.push(this.data[i][j]);
            }
        }
        return arr;
    }

    // Заполнить матрицу случайными числами от -1 до 1
    randomize() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                this.data[i][j] = Math.random() * 2 - 1;
            }
        }
        return this;
    }

    // Сложение (матрица + матрица)
    add(n) {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                this.data[i][j] += n.data[i][j];
            }
        }
    }

    // Вычитание (матрица A - матрица B)
    static subtract(a, b) {
        let result = new Matrix(a.rows, a.cols);
        for (let i = 0; i < a.rows; i++) {
            for (let j = 0; j < a.cols; j++) {
                result.data[i][j] = a.data[i][j] - b.data[i][j];
            }
        }
        return result;
    }

    // Транспонирование (меняем строки и столбцы местами)
    static transpose(matrix) {
        let result = new Matrix(matrix.cols, matrix.rows);
        for (let i = 0; i < matrix.rows; i++) {
            for (let j = 0; j < matrix.cols; j++) {
                result.data[j][i] = matrix.data[i][j];
            }
        }
        return result;
    }

    // Матричное умножение (Dot Product)
    static multiply(a, b) {
        if (a.cols !== b.rows) {
            console.error('Количество столбцов A должно совпадать с количеством строк B.');
            return undefined;
        }
        let result = new Matrix(a.rows, b.cols);
        for (let i = 0; i < result.rows; i++) {
            for (let j = 0; j < result.cols; j++) {
                let sum = 0;
                for (let k = 0; k < a.cols; k++) {
                    sum += a.data[i][k] * b.data[k][j];
                }
                result.data[i][j] = sum;
            }
        }
        return result;
    }

    // Поэлементное умножение (Hadamard Product)
    multiply(n) {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                this.data[i][j] *= n.data[i][j];
            }
        }
    }

    // Умножение на скаляр (число)
    multiply_scalar(n) {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                this.data[i][j] *= n;
            }
        }
    }

    // Применить функцию к каждому элементу матрицы
    map(func) {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                let val = this.data[i][j];
                this.data[i][j] = func(val);
            }
        }
    }
}

// ---------------------------------
// КЛАСС НЕЙРОННОЙ СЕТИ
// ---------------------------------
class DirectorNet {
    constructor(input_nodes, hidden_nodes, output_nodes) {
        // Задаем архитектуру
        this.input_nodes = input_nodes;
        this.hidden_nodes = hidden_nodes;
        this.output_nodes = output_nodes;

        // Создаем матрицы весов и заполняем их случайными числами.
        // Это "мозг" нашей сети.
        this.weights_ih = new Matrix(this.hidden_nodes, this.input_nodes).randomize();
        this.weights_ho = new Matrix(this.output_nodes, this.hidden_nodes).randomize();

        // Создаем векторы смещений (bias)
        this.bias_h = new Matrix(this.hidden_nodes, 1).randomize();
        this.bias_o = new Matrix(this.output_nodes, 1).randomize();
        
        // Коэффициент обучения
        this.learning_rate = 0.1;
    }

    // Функция активации (Сигмоида)
    sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }

    // Производная от сигмоиды (нужна для обратного распространения)
    dsigmoid(y) {
        // return sigmoid(x) * (1 - sigmoid(x));
        return y * (1 - y);
    }

    /**
     * ПРЕДСКАЗАНИЕ (Прямое распространение / Feedforward)
     * Прогоняет сигнал от входа к выходу.
     */
    predict(input_array) {
        // --- ГЕНЕРАЦИЯ ВЫХОДОВ СКРЫТОГО СЛОЯ ---
        let inputs = Matrix.fromArray(input_array);
        let hidden = Matrix.multiply(this.weights_ih, inputs);
        hidden.add(this.bias_h);
        // Применяем функцию активации
        hidden.map(this.sigmoid);

        // --- ГЕНЕРАЦИЯ ВЫХОДА СЕТИ ---
        let output = Matrix.multiply(this.weights_ho, hidden);
        output.add(this.bias_o);
        output.map(this.sigmoid);

        // Возвращаем результат в виде простого массива
        return output.toArray();
    }

    /**
     * ОБУЧЕНИЕ (Обратное распространение ошибки / Backpropagation)
     * Корректирует веса на основе ошибки.
     */
    train(input_array, target_array) {
        // --- ПРЯМОЕ РАСПРОСТРАНЕНИЕ (чтобы получить предсказание и промежуточные значения) ---
        let inputs = Matrix.fromArray(input_array);
        let hidden = Matrix.multiply(this.weights_ih, inputs);
        hidden.add(this.bias_h);
        hidden.map(this.sigmoid);

        let outputs = Matrix.multiply(this.weights_ho, hidden);
        outputs.add(this.bias_o);
        outputs.map(this.sigmoid);

        // --- ОБРАТНОЕ РАСПРОСТРАНЕНИЕ ---

        // Преобразуем массив с правильным ответом в матрицу
        let targets = Matrix.fromArray(target_array);

        // ВЫЧИСЛЯЕМ ОШИБКУ ВЫХОДНОГО СЛОЯ
        // (TARGET - OUTPUT)
        let output_errors = Matrix.subtract(targets, outputs);

        // ВЫЧИСЛЯЕМ ГРАДИЕНТ (learning_rate * error * производная)
        let gradients = new Matrix(outputs.rows, outputs.cols);
        gradients.data = outputs.data;
        gradients.map(this.dsigmoid);
        gradients.multiply(output_errors);
        gradients.multiply_scalar(this.learning_rate);

        // ВЫЧИСЛЯЕМ "ДЕЛЬТЫ" (изменения) ДЛЯ ВЕСОВ
        let hidden_T = Matrix.transpose(hidden);
        let weight_ho_deltas = Matrix.multiply(gradients, hidden_T);

        // КОРРЕКТИРУЕМ ВЕСА И СМЕЩЕНИЯ ВЫХОДНОГО СЛОЯ
        this.weights_ho.add(weight_ho_deltas);
        this.bias_o.add(gradients);

        // ВЫЧИСЛЯЕМ ОШИБКУ СКРЫТОГО СЛОЯ (распространяем ошибку назад)
        let who_t = Matrix.transpose(this.weights_ho);
        let hidden_errors = Matrix.multiply(who_t, output_errors);

        // ВЫЧИСЛЯЕМ ГРАДИЕНТ СКРЫТОГО СЛОЯ
        let hidden_gradient = new Matrix(hidden.rows, hidden.cols);
        hidden_gradient.data = hidden.data;
        hidden_gradient.map(this.dsigmoid);
        hidden_gradient.multiply(hidden_errors);
        hidden_gradient.multiply_scalar(this.learning_rate);

        // ВЫЧИСЛЯЕМ "ДЕЛЬТЫ" ДЛЯ ВЕСОВ ВХОДНОГО СЛОЯ
        let inputs_T = Matrix.transpose(inputs);
        let weight_ih_deltas = Matrix.multiply(hidden_gradient, inputs_T);

        // КОРРЕКТИРУЕМ ВЕСА И СМЕЩЕНИЯ ВХОДНОГО СЛОЯ
        this.weights_ih.add(weight_ih_deltas);
        this.bias_h.add(hidden_gradient);
    }
}

module.exports = { DirectorNet };