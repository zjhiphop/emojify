var Editor = require('./editor');
var SELECTOR = "[data-emojify]";

module.exports = {
    init: function() {
        var $targets = document.querySelectorAll(SELECTOR);
        var len = $targets.length - 1;
        var editors = [];

        while (len >= 0) {
            editors.push(new Editor($targets.item(len), ["css/main.css"]));
            len--;
        }

        return editors;
    }
}