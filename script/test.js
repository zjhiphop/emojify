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