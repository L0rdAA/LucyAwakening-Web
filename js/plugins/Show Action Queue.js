/*:
 * @plugindesc Displays next 5 turns in battle action queue
 * @author Ahmed Alamri
 *
 * @help 
 * Places an "Queue" showing the next 
 * 5 units and skills set to act in battle.
 */

(function() {
    var _Scene_Battle_createAllWindows = Scene_Battle.prototype.createAllWindows;
    Scene_Battle.prototype.createAllWindows = function() {
        _Scene_Battle_createAllWindows.call(this);
        this.createActionOrderWindow();
        this._actionOrderWindow.z = -1; // Ensure the queue window is behind other windows
    };

    Scene_Battle.prototype.createActionOrderWindow = function() {
        this._actionOrderWindow = new Window_ActionOrder(0, 0);
        this.addWindow(this._actionOrderWindow);
    };

    function Window_ActionOrder() {
        this.initialize.apply(this, arguments);
    }

    Window_ActionOrder.prototype = Object.create(Window_Base.prototype);
    Window_ActionOrder.prototype.constructor = Window_ActionOrder;

    Window_ActionOrder.prototype.initialize = function(x, y) {
        var width = this.windowWidth();
        var height = this.windowHeight();
        Window_Base.prototype.initialize.call(this, x, y, width, height);
        this.opacity = 0; // Set window opacity to 0 (approximately 100% transparency)
        this.refresh();
    };

    Window_ActionOrder.prototype.windowWidth = function() {
        return 408;
    };

    Window_ActionOrder.prototype.windowHeight = function() {
        return this.fittingHeight(1);
    };

    Window_ActionOrder.prototype.refresh = function() {
        var x = this.textPadding();
        var y = 0;
        var width = this.contents.width - this.textPadding() * 2;
        this.contents.clear();
        // Change text color to red
        this.changeTextColor(this.textColor(2)); // This sets the color to red
        this.drawText("Queue: ", x, y, width);
        // Reset text color to default
        this.resetTextColor();
        this.drawText(this.value(), x + this.textWidth("Queue: "), y, width);
    };

    Window_ActionOrder.prototype.value = function() {
        var battlers = $gameParty.members().concat($gameTroop.members());
        battlers.sort(function(a, b) {
            return b.speed() - a.speed();
        });
        // Display the next 5 actors/enemies instead of 6
        return battlers.slice(0, 5).map(function(battler) {
            return battler.name();
        }).join(', ');
    };

    var _Scene_Battle_update = Scene_Battle.prototype.update;
    Scene_Battle.prototype.update = function() {
        _Scene_Battle_update.call(this);
        this._actionOrderWindow.refresh();
    };
})();

