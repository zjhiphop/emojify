var RangeUtil = require("./range");
var Cursor = {};

Cursor.focusAfter = function(node, range, root) {
    range.selectNode(node);
    range.collapse(false);

    RangeUtil.applyRange(root, range);
};

module.exports = Cursor;