window.onload = function() {
    window.editor = window.frames[0];

    /*
    * Text range http://www.cnblogs.com/bignjl/articles/1654291.html
         collapse([bStart])   
         移动Range的插入点   
         bStart      true(移到开头)      false(移到末尾)   
        
         findText(sText      [,      iSearchScope]      [,      iFlags])   
         在Range中查找sText   
         iSearchScope      开始位置，负数方向搜索   
         iFlags      2(整词匹配)      4(区别大小写)   
        
         moveStart(sUnit      [,      iCount])   
         moveEnd(sUnit      [,      iCount])   
         移动Range的开头或结尾   
         sUnit      character(字)      word(词)      sentence(句)      textedit(Range)   
         iCount      移动数量，默认为1   
        
         moveToPoint(iX,      iY)   
         移动光标到坐标(iX,iY)   
        
         pasteHTML(sHTMLText)   
         替换Range中的html   
        
         scrollIntoView([bAlignToTop])   
         滚动使之在当前窗口显示   
         bAlignToTop      true(Range在窗口开头)      false(Range在窗口底部)   
        
         select()   
         选中Range   
    */
    var NODETYPE = {
        ELEMENT: 1,
        TEXT: 3,
        HTMLELEMENT: 9
    }

    var _focusAfter = function(node, range) {
        range.selectNode(node);
        range.collapse(false);
        applyRanges(editor.entyWin, range);
        editor.focus();
    };

    var applyRanges = function(win, ranges) {
        if (!ranges) {
            return;
        }
        var selection = editor.getSelection();
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

    /**
     * 在多标签包含的情况下(情况分为完全包含和部分包含)，到底要不要向上一级选中。
     * 例如，完全包含的情况：
     * <div>123<span><a>|test|</a></span>456</div>，选中了a标签内的所有内容.
     * 但是a标签完全包含在span标签内，所以选区会被修正为:
     * <div>123|<span><a>test</a></span>|456</div>
     * @param {Object} elm 判断是否为完全包含的子节点。
     * @return {Object} 当且仅当参数节点为父节点的全包含时，返回最上层的父节点。
     */
    var _whichOne = function(elm) {
        var p, pp;
        p = elm.parentNode;
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
    };

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
    var _resetRange = function(range) {
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
        var newStart = _whichOne(oldStart);
        while (newStart) {
            range.setStartBefore(newStart);
            if (range.toString() !== tmpRange.toString()) {
                break;
            }
            oldStart = newStart;
            newStart = _whichOne(oldStart);
        }
        if (oldStart === tmpRange.startContainer) {
            range.setStart(oldStart, tmpRange.startOffset);
        } else {
            range.setStartBefore(oldStart);
        }
        var oldEnd = range.endContainer;
        var newEnd = _whichOne(oldEnd);
        while (newEnd) {
            range.setEndAfter(newEnd);
            if (range.toString() !== tmpRange.toString()) {
                break;
            }
            oldEnd = newEnd;
            newEnd = _whichOne(oldEnd);
        }
        if (oldEnd === tmpRange.endContainer) {
            range.setEnd(oldEnd, tmpRange.endOffset);
        } else {
            range.setEndAfter(oldEnd);
        }
        tmpRange.detach();
        return range;
    };

    var getCurrentRanges = function(win) {
        var selection = win.getSelection();
        if (!selection) {
            //在没有选中的情况下
            return [];
        }
        var rangeArr = [];
        var count = selection.rangeCount;
        if (!count) {
            var range = win.document.createRange();
            if (!win.document.body.firstChild) {
                win.document.body.innerHTML = '&#x200b;';
            }
            range.selectNode(win.document.body.firstChild);
            range.collapse(true);
            //selection.addRange();
            return [range];
        }
        var i, tmpRange;
        for (i = 0; i < count; i++) {
            tmpRange = _resetRange(selection.getRangeAt(i));
            rangeArr.push(tmpRange);
        }
        return rangeArr;
    };

    editor.operation = {
        addNode: function(node, focus) {
            editor.focus();

            var range = getCurrentRanges(editor)[0];
            if (!range.collapsed) {
                range.deleteContents();
            }
            range.insertNode(node);

            if (!focus) {
                _focusAfter(node, range);
            }
        }
    };

};