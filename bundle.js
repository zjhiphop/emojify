(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var RangeUtil = require("./range");
var Cursor = {};

Cursor.focusAfter = function(node, range, root) {
    range.selectNode(node);
    range.collapse(false);

    RangeUtil.applyRange(root, range);
};

module.exports = Cursor;
},{"./range":5}],2:[function(require,module,exports){
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
},{"./cursor":1,"./range":5,"./util":7}],3:[function(require,module,exports){
module.exports = {
    ELEMENT: 1,
    TEXT: 3,
    HTMLELEMENT: 9
}
},{}],4:[function(require,module,exports){
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
},{"./editor":2}],5:[function(require,module,exports){
var NODETYPE = require("./enum-node");

var RangeUtil = {};

var normalizeNode = function(node) {

    /**
     * 在多标签包含的情况下(情况分为完全包含和部分包含)，到底要不要向上一级选中。
     * 例如，完全包含的情况：
     * <div>123<span><a>|test|</a></span>456</div>，选中了a标签内的所有内容.
     * 但是a标签完全包含在span标签内，所以选区会被修正为:
     * <div>123|<span><a>test</a></span>|456</div>
     * @param {Object} elm 判断是否为完全包含的子节点。
     * @return {Object} 当且仅当参数节点为父节点的全包含时，返回最上层的父节点。
     */
    var p, pp;
    p = node.parentNode;

    //最上面到body就截止#webkit，问题出现。
    //遇到了HTML这个节点,#opera，出现问题。
    if (!p || p.nodeType === NODETYPE.HTMLELEMENT || p.tagName.toUpperCase() === 'HTML' || p.tagName.toUpperCase() === 'BODY') {
        return null;
    }

    pp = p.parentNode;
    if (pp && p) {
        var cs = pp.childNodes;
        for (var i = 0; cs[i]; i++) {
            if (cs[i] === p) {
                return p;
            }
        }
    }

    return null;
}


RangeUtil.getRange = function(root) {
    var selection = root.getSelection();
    if (!selection) {
        //在没有选中的情况下
        return [];
    }
    var rangeArr = [];
    var count = selection.rangeCount;

    if (!count) {
        var range = root.document.createRange();
        if (!root.document.body.firstChild) {
            root.document.body.innerHTML = '&#x200b;';
        }
        range.selectNode(root.document.body.firstChild);

        range.collapse(true);
        //selection.addRange();
        return [range];
    }

    var i, tmpRange;

    for (i = 0; i < count; i++) {
        tmpRange = RangeUtil.resetRange(selection.getRangeAt(i));
        rangeArr.push(tmpRange);
    }

    return rangeArr;
}


/**
 * 修正range，有这种情况<span>abc</span>
 * 在webkit内核下，选中abc，返回的range在span里面:
 *   <span>[#text]|abc|[/#text]</span>
 * 但是我们可能需要获得的range是:
 *   |<span>[#text]abc[/#text]</span>|
 * 所以需要对这些选区进行再修正。
 * @param {Object} range 要修正的range
 * @return {Object} range 修正后的range
 */
RangeUtil.resetRange = function(range) {
    if (range.collapsed) {
        return range;
    }
    if (range._range && range._range.item) {
        //选中了图片或者表格
        return range;
    }

    if (range._range && range.startContainer && range.startContainer.nodeType === NODETYPE.ELEMENT && (range.startContainer.tagName.toUpperCase() === 'IMG' || range.startContainer.tagName.toUpperCase() === 'table')) {
        return range;
    }

    if (range._range && range.endContainer && range.endContainer.nodeType === NODETYPE.ELEMENT && (range.endContainer.tagName.toUpperCase() === 'IMG' || range.endContainer.tagName.toUpperCase() === 'table')) {
        return range;
    }

    var tmpRange = range.cloneRange();
    var oldStart = range.startContainer;
    var newStart = normalizeNode(oldStart);
    while (newStart) {
        range.setStartBefore(newStart);
        if (range.toString() !== tmpRange.toString()) {
            break;
        }
        oldStart = newStart;
        newStart = normalizeNode(oldStart);
    }
    if (oldStart === tmpRange.startContainer) {
        range.setStart(oldStart, tmpRange.startOffset);
    } else {
        range.setStartBefore(oldStart);
    }
    var oldEnd = range.endContainer;
    var newEnd = normalizeNode(oldEnd);
    while (newEnd) {
        range.setEndAfter(newEnd);
        if (range.toString() !== tmpRange.toString()) {
            break;
        }
        oldEnd = newEnd;
        newEnd = normalizeNode(oldEnd);
    }
    if (oldEnd === tmpRange.endContainer) {
        range.setEnd(oldEnd, tmpRange.endOffset);
    } else {
        range.setEndAfter(oldEnd);
    }
    tmpRange.detach();
    return range;
}

RangeUtil.applyRange = function(root, ranges) {
    if (!ranges || !root) {
        return;
    }
    var selection = root.getSelection();

    selection.removeAllRanges();
    if (ranges.push) {
        var i;
        for (i = 0; ranges[i]; i++) {
            selection.addRange(ranges[i]);
        }
    } else {
        selection.addRange(ranges);
    }
};


module.exports = RangeUtil;
},{"./enum-node":3}],6:[function(require,module,exports){
var app = require("./main");

var $editor = app.init()[0];

var $addEmoji = document.querySelector("[data-emoji-btn]");

function createNode(tagName, attributes) {
    var tag = document.createElement(tagName);
    Object.keys(attributes).forEach(function(key) {
        tag.setAttribute(key, attributes[key]);
    });

    return tag;
}

$addEmoji.addEventListener("click", function() {

    $editor.addNode(createNode("img", {
        src: "http://s3.amazonaws.com/kawo-emoji/K0" + Math.round(Math.random() * 100) + ".png"
    }));

}, false);
},{"./main":4}],7:[function(require,module,exports){
var util = {};

util.addIframe = function(root, html) {
    var iframe = document.createElement("iframe");

    iframe.id = "frame";
    iframe.src = "about:blank"; //or blank.html
    iframe.style = "width: 100%; height: 100%;";
    iframe.frameborder = 0;
    iframe.allowtransparency = true;

    iframe.onload = function() {
        var domdoc = iframe.contentDocument || iframe.contentWindow.document;
        domdoc.write(html);
    };

    root.appendChild(iframe);

    return iframe;
}


module.exports = util;
},{}]},{},[6])