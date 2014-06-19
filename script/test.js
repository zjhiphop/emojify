var $addEmoji = document.querySelector("button");

function createNode(tagName, attributes) {
    var tag = document.createElement(tagName);
    Object.keys(attributes).forEach(function(key) {
        tag.setAttribute(key, attributes[key]);
    });

    return tag;
}

$addEmoji.addEventListener("click", function() {

    editor.operation.addNode(createNode("img", {
        src: "http://s3.amazonaws.com/kawo-emoji/K0" + Math.round(Math.random() * 100) + ".png"
    }))

}, false);