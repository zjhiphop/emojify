var RangeUtil = require('./range');
var Cursor = require('./cursor');
var util = require("./util");

var EDITOR_TPL = "<html contenteditable>" +
    "<head>" +
    "<title>Editor</title>" +
    "{{styles}}" +
    "</head>" +
    "<body spellcheck=false>" +
    "</body>" +
    "</html>";

var buildStyles = function(styleLinks) {
    if (!styleLinks) return;

    var r = "";

    styleLinks.forEach(function(link) {
        r += '<link rel="stylesheet" type="text/css" href="' + link + '">';
    });

    return r;
}

var editor = function(root, styleLinks) {
    this.$el = util.addIframe(root, EDITOR_TPL.replace("{{styles}}", buildStyles(styleLinks))).contentWindow;
}

editor.prototype.focus = function() {
    this.$el.focus();
}

editor.prototype.addNode = function(node, focus) {
    this.focus();

    var range = RangeUtil.getRange(this.$el)[0];

    if (!range.collapsed) {
        range.deleteContents();
    }

    range.insertNode(node);

    if (!focus) {
        Cursor.focusAfter(node, range, this.$el);
        this.focus();
    }
}

module.exports = editor;