// layers/layer_managers.js (ФИНАЛЬНАЯ, ЭКСПЕРТНАЯ ВЕРСИЯ)

/**
 * Менеджер по Удовлетворенности.
 * Больше не нейросеть. Это надежная логическая функция, которая следует четким инструкциям.
 * @param {{sentiment: number}} l1_report - Отчет от экспертов L1.
 * @returns {'happy'|'unhappy'|'neutral'}
 */
function satisfactionManager(l1_report) {
    if (l1_report.sentiment > 0.7) {
        return 'happy';
    }
    if (l1_report.sentiment < 0.3) {
        return 'unhappy';
    }
    return 'neutral';
}

/**
 * Менеджер по безопасности. Уже был идеален.
 */
function securityManager(l1_report) {
    return l1_report.spam > 0.8 ? 'threat' : 'safe';
}

module.exports = { satisfactionManager, securityManager };