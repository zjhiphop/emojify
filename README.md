emojify
=======

A content editable plugin for supporting emoji insert/delete.


Design goal
===========

* Give a placeholder could make it support add emoji to specify position
* Delete a emoji from specific position


How to use it?
==============

Only attach a attribute `data-emojify` to editor container and a attribute `data-emoji-btn` to emoji button.
Then include `bundle.js` will done.

```
<html>
<head>
    <title>Web editor</title>
</head>
<body>
    <div data-emojify></div>

    <button data-emoji-btn>Add a Emoji</button>

    <script type="text/javascript" src="bundle.js"></script>
</body>
</html>
```

See Example
===========
Run `npm test` then open browser with `locahost:8000`

