/*:
* @plugindesc Show Enemy HP Bars
* @author Ahmed Alamri
*
* @help This plugin shows HP bars for enemies in battle.
*/

(function() {
    var Window_BattleEnemy_prototype_initialize = Window_BattleEnemy.prototype.initialize;
    Window_BattleEnemy.prototype.initialize = function(x, y) {
        Window_BattleEnemy_prototype_initialize.call(this, x, y);
        this.refresh();
    };

    Window_BattleEnemy.prototype.maxCols = function() {
        return 1; // Only one column needed for enemy selection
    };

    Window_BattleEnemy.prototype.maxItems = function() {
        return $gameTroop.members().length;
    };

    Window_BattleEnemy.prototype.itemHeight = function() {
        return this.lineHeight();
    };

    Window_BattleEnemy.prototype.itemRect = function(index) {
        var rect = Window_Selectable.prototype.itemRect.call(this, index);
        rect.width = this.contentsWidth(); // Adjust the width if necessary
        return rect;
    };

    Window_BattleEnemy.prototype.refresh = function() {
        this.contents.clear();
        $gameTroop.members().forEach(function(enemy, index) {
            var rect = this.itemRect(index);
            var currentHpRate = enemy.hpRate();
            var color1 = this.hpGaugeColor1();
            var color2 = this.hpGaugeColor2();

            this.drawGauge(rect.x, rect.y, rect.width / 1, currentHpRate, color1, color2); // HP gauge width is half of the item width
            this.drawText(enemy.name(), rect.x, rect.y, rect.width / 2);
            this.drawText(enemy.hp + '/' + enemy.mhp, rect.x + rect.width / 2, rect.y, rect.width / 2, 'right');
        }, this);
    };

    Window_BattleEnemy.prototype.update = function() {
        Window_Selectable.prototype.update.call(this);
    };

    Window_BattleEnemy.prototype.select = function(index) {
        Window_Selectable.prototype.select.call(this, index);
        this.refresh();
    };

    Window_BattleEnemy.prototype.processCursorMove = function() {
        if (this.isCursorMovable()) {
            var lastIndex = this.index();
            if (Input.isRepeated('down')) {
                this.cursorDown(Input.isTriggered('down'));
            }
            if (Input.isRepeated('up')) {
                this.cursorUp(Input.isTriggered('up'));
            }
            if (Input.isRepeated('right')) {
                this.cursorRight(Input.isTriggered('right'));
            }
            if (Input.isRepeated('left')) {
                this.cursorLeft(Input.isTriggered('left'));
            }
            if (this.index() !== lastIndex) {
                SoundManager.playCursor();
            }
        }
    };
})();


