var path = require('path')
var assert = require('assert')
var postcss = require('postcss')
var chokidar = require('chokidar')

module.exports = Watcher

function Watcher (opts) {
  if (!(this instanceof Watcher)) return new Watcher(opts)
  chokidar.FSWatcher.call(this, Object.assign({
    persistent: true,
    ignored: /node_modules/
  }, opts))

  var self = this
  this.plugin = postcss.plugin('postcss-watcher', function () {
    return function (root, result) {
      var last = result.processor.plugins[result.processor.plugins.length - 1]
      if (last !== 'postcss-watcher') {
        result.warn('postcss-watcher is not the last plugin, some files may not be watched')
      }

      var batch = [root.source.input.file]

      result.messages.filter(function (msg) {
        return msg.type === 'dependency' && batch.indexOf(msg.file) === -1
      }).forEach(function (msg) {
        batch.push(msg.file)
      })

      self.add(batch)
      self.prune(function (path) {
        return batch.indexOf(path) === -1
      })
    }
  })
}

Watcher.prototype = Object.create(chokidar.FSWatcher.prototype)

// stop observing files filtered by provided function
// fn -> void
Watcher.prototype.prune = function (filter) {
  assert(typeof filter === 'function', 'postcss-watcher: prune filter is required')
  var watched = this.getWatched()
  Object.keys(watched).forEach(function (key) {
    for (var file, i = 0, len = watched[key].length; i < len; i += 1) {
      file = path.resolve(key, watched[key][i])
      if (filter(file)) this.unwatch(file)
    }
  }, this)
}
