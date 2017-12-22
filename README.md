<div align="center">

# postcss-watcher 👀

[![npm version][0]][1] [![build status][2]][3]
[![downloads][4]][5]
[![style][6]][7]

Watches files in [PostCSS](https://github.com/postcss/postcss) bundle and emits events on change.

</div>

## Usage

Create an instance of the Watcher and use the `watcher.plugin` function as you would any other plugin. It is recommended to put the watcher plugin as the last plugin to ensure that all files are being watched.

```javascript
var fs = require('fs')
var postcss = require('postcss')
var atImport = require('postcss-import')
var Watcher = require('postcss-watcher')

var watcher = new Watcher()
var bundle = postcss([atImport() watcher.plugin()])

watcher.on('change', process)
process()

function process () {
  bundle.process(fs.readFileSync('./index.css', 'utf8'), {
    from: __dirname + '/index.css'
  }).then(function (result) {
    fs.writeFileSync(__dirname + '/build.css'), result.css)
  })
}
```

## API

### `watcher = new Watcher([opts])`

Create an instance of Watcher. Forwards opts to [chokidar](https://github.com/paulmillr/chokidar) and ignores files in `node_modules` by default. Watcher is a subclass of chokidar, so all the same events are supported (`ready`, `add`, `change`, `unlink`, `all` etc.).

### `watcher.plugin()`

Returns a PostCSS plugin function.

### `watcher.prune(fn)`

Remove listeners for files that pass the supplied filter function test. The supplied function is called for every file being watched with the file path as only argument. Expects a Boolean to be returned.

## Install

```bash
$ npm install -S postcss-watcher
```

## License

MIT

[0]: https://img.shields.io/npm/v/postcss-watcher.svg?style=flat-square
[1]: https://npmjs.org/package/postcss-watcher
[2]: https://img.shields.io/travis/codeandconspire/postcss-watcher/master.svg?style=flat-square
[3]: https://travis-ci.org/codeandconspire/postcss-watcher
[4]: http://img.shields.io/npm/dm/postcss-watcher.svg?style=flat-square
[5]: https://npmjs.org/package/postcss-watcher
[6]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[7]: https://standardjs.com
