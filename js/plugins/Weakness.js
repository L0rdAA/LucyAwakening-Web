/*:
 * @plugindesc Elemental Weakness Indicator
 * @author Ahmed Alamri
 *
 * @help This plugin adds an elemental weakness indicator to the battle screen.
 *       Use the note tag <weakness:elementId,iconIndex> in the enemy's note box.
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
            var enemyData = $dataEnemies[enemy.enemyId()];
            var noteData = enemyData.note.match(/<weakness:(\d+),(\d+)>/);
            if (noteData) {
                var elementId = Number(noteData[1]);
                var iconIndex = Number(noteData[2]);
                var rect = this.itemRectForText(index);
                this.drawIcon(iconIndex, rect.x + rect.width - 32, rect.y);
            }
        }
    };
})();
