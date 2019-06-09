var path = require('path')
var assert = require('assert')
var postcss = require('postcss')
var { FSWatcher } = require('chokidar')

module.exports = class Watcher extends FSWatcher {
  constructor (opts) {
    super(Object.assign({
      persistent: true,
      ignored: /node_modules/
    }, opts))

    var self = this
    this.plugin = postcss.plugin('postcss-watcher', function plugin () {
      return function (root, result) {
        var last = result.processor.plugins[result.processor.plugins.length - 1]
        if (last.postcssPlugin !== 'postcss-watcher') {
          result.warn('postcss-watcher is not the last plugin, some files may not be watched')
        }

        var batch = [root.source.input.file]

        result.messages.filter(function (msg) {
          return msg.type === 'dependency' && batch.indexOf(msg.file) === -1
        }).forEach(function (msg) {
          batch.push(msg.file)
        })

        self.add(batch)
        self.prune((path) => !batch.includes(path))
      }
    })
  }

  // stop observing files filtered by provided function
  // fn -> void
  prune (filter) {
    assert(typeof filter === 'function', 'postcss-watcher: prune filter is required')
    var watched = this.getWatched()
    for (let [folder, files] of Object.entries(watched)) {
      for (let file of files) {
        file = path.resolve(folder, file)
        if (filter(file)) this.unwatch(file)
      }
    }
  }
}
