var fs = require('fs')
var path = require('path')
var test = require('tape')
var postcss = require('postcss')
var tempfile = require('tempfile')
var atImport = require('postcss-import')
var Watcher = require('./')

test('warn when not last plugin', function (t) {
  var watcher = new Watcher()
  var entry = tempfile('-entry.css')

  t.plan(3)
  fs.writeFileSync(entry, 'body { color: red; }')

  postcss([watcher.plugin(), function noop () {}]).process(
    fs.readFileSync(entry, 'utf8'),
    { from: entry }
  ).then(function (result) {
    watcher.close()
    var messages = result.messages
    t.equal(messages.length, 1, 'added message')
    t.equal(messages[0].type, 'warning', 'message is warning')
    t.equal(messages[0].plugin, 'postcss-watcher', 'message is from plugin')
  })
})

test('watches entry file', function (t) {
  var watcher = new Watcher()
  var entry = tempfile('-entry.css')

  t.plan(2)
  fs.writeFileSync(entry, 'body { color: red; }')

  watcher.on('add', function (path) {
    t.equal(path, entry, 'entry file added')
    setTimeout(function () {
      fs.writeFileSync(entry, 'body { color: green; }')
    }, 100)
  })

  watcher.on('change', function (path) {
    t.equal(path, entry, 'entry file triggered change')
    setImmediate(() => watcher.close())
  })

  postcss([watcher.plugin()]).process(
    fs.readFileSync(entry, 'utf8'),
    { from: entry }
  ).catch(t.end)
})

test('watches imported file', function (t) {
  var watcher = new Watcher()
  var entry = tempfile('-entry.css')
  var imported = tempfile('-imported.css')

  t.plan(2)
  fs.writeFileSync(entry, `@import "${imported}";`)
  fs.writeFileSync(imported, 'body { color: red; }')

  watcher.on('add', function (path) {
    if (path === imported) {
      t.pass('imported file added')
      setTimeout(function () {
        fs.writeFileSync(imported, 'body { color: green; }')
      }, 100)
    }
  })

  watcher.on('change', function (path) {
    t.equal(path, imported, 'imported file triggered change')
    setImmediate(() => watcher.close())
  })

  postcss([atImport(), watcher.plugin()]).process(
    fs.readFileSync(entry, 'utf8'),
    { from: entry }
  ).catch(t.end)
})

test('stops watching orphaned file', function (t) {
  var watcher = new Watcher()
  var entry = tempfile('-entry.css')
  var imported = tempfile('-imported.css')
  var bundle = postcss([atImport(), watcher.plugin()])

  t.plan(1)
  fs.writeFileSync(entry, `@import "${imported}";`)
  fs.writeFileSync(imported, 'body { color: red; }')

  var added = 0
  watcher.on('add', function (path) {
    added += 1
    if (added === 2) {
      setTimeout(function () {
        fs.writeFileSync(entry, 'body { color: blue; }')
      }, 100)
    }
  })

  watcher.on('change', function () {
    bundle.process(
      fs.readFileSync(entry, 'utf8'),
      { from: entry }
    ).then(function () {
      var dir = path.dirname(imported)
      var file = path.basename(imported)
      var watched = watcher.getWatched()
      t.equal(watched[dir].indexOf(file), -1, 'imported file not being watched')
      watcher.close()
    })
  })

  bundle.process(
    fs.readFileSync(entry, 'utf8'),
    { from: entry }
  ).catch(t.end)
})

test('stops listening to pruned files', function (t) {
  var watcher = new Watcher()
  var entry = tempfile('-entry.css')
  var imported = tempfile('-imported.css')

  fs.writeFileSync(entry, `@import "${imported}";`)
  fs.writeFileSync(imported, 'body { color: red; }')

  watcher.on('ready', function (path) {
    watcher.prune((file) => file === imported)
    setTimeout(function () {
      fs.writeFileSync(imported, 'body { color: green; }')
      setTimeout(function () {
        watcher.close()
        t.end()
      }, 200)
    }, 100)
  })

  watcher.on('change', function (path) {
    t.fail('pruned file triggered change')
  })

  postcss([atImport(), watcher.plugin()]).process(
    fs.readFileSync(entry, 'utf8'),
    { from: entry }
  ).catch(t.end)
})
