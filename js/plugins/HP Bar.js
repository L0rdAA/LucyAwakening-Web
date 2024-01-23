/*:
 * @plugindesc Show Enemy HP Bar
 * @author Ahmad Alamri
 *
 * @help This plugin displays an enemy's HP bar during battle scenes.
 */

(function() {
    var _Sprite_Enemy_initMembers = Sprite_Enemy.prototype.initMembers;
    Sprite_Enemy.prototype.initMembers = function() {
        _Sprite_Enemy_initMembers.call(this);
        this.createHpBar();
    };

    Sprite_Enemy.prototype.createHpBar = function() {
        this._hpBar = new Sprite(ImageManager.loadSystem('EnemyHpBar'));
        this._hpBar.x = 0;
        this._hpBar.y = 0;
        this.addChild(this._hpBar);
    };

    var _Sprite_Enemy_updateBitmap = Sprite_Enemy.prototype.updateBitmap;
    Sprite_Enemy.prototype.updateBitmap = function() {
        _Sprite_Enemy_updateBitmap.call(this);
        this.updateHpBar();
    };

    Sprite_Enemy.prototype.updateHpBar = function() {
        if (this._hpBar) {
            var rate = this._enemy.hpRate();
            this._hpBar.setFrame(0, 0, this._hpBar.bitmap.width * rate, this._hpBar.bitmap.height);
        }
    };
})();
