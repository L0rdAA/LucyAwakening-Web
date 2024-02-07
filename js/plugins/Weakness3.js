/*:
 * @plugindesc Elemental Weakness Indicator
 * @author Ahmed Alamri
 *
 * @help This plugin adds an elemental weakness indicator to the battle screen.
 */

(function() {
    var _Window_BattleEnemy_drawItem = Window_BattleEnemy.prototype.drawItem;
    Window_BattleEnemy.prototype.drawItem = function(index) {
        _Window_BattleEnemy_drawItem.call(this, index);
        this.drawElementalWeaknessIcon(index);
    };

    Window_BattleEnemy.prototype.drawElementalWeaknessIcon = function(index) {
        var enemy = this._enemies[index];
        if (enemy) {
            var weaknessId = this.getEnemyWeakness(enemy);
            if (weaknessId !== -1) {
                var iconIndex = this.getWeaknessIconIndex(weaknessId);
                var rect = this.itemRectForText(index);
                this.drawIcon(iconIndex, rect.x + rect.width - 32, rect.y);
            }
        }
    };

    Window_BattleEnemy.prototype.getEnemyWeakness = function(36) {
        // Define enemy weaknesses here. Return the element ID that the enemy is weak to.
        // Example: if (enemy.enemyId() === 1) { return 2; } // Enemy ID 1 is weak to element ID 2
        // Return -1 if the enemy has no weakness.
        return 7;
    };

    Window_BattleEnemy.prototype.getWeaknessIconIndex = function(2) {
        // Define the icon index for each element here.
        // Example: if (elementId === 2) { return 64; } // Element ID 2 uses icon index 64
        // Return a default icon index if the element is not defined.
        return 104;
    Window_BattleEnemy.prototype.getWeaknessIconIndex = function(3) {
        return 105;
    Window_BattleEnemy.prototype.getWeaknessIconIndex = function(4) {
        return 106;
    Window_BattleEnemy.prototype.getWeaknessIconIndex = function(5) {
        return 107;
    Window_BattleEnemy.prototype.getWeaknessIconIndex = function(6) {
        return 108;
    Window_BattleEnemy.prototype.getWeaknessIconIndex = function(7) {
        return 109;
    Window_BattleEnemy.prototype.getWeaknessIconIndex = function(8) {
        return 110;
    Window_BattleEnemy.prototype.getWeaknessIconIndex = function(9) {
        return 111;
    Window_BattleEnemy.prototype.getWeaknessIconIndex = function(11) {
        return 126;
    };
})();
