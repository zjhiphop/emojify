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