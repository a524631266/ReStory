const fs = require('fs-extra')
// Ensure environment variables are read.
const path = require('path')
const npm = require('npm')
// Ensure environment variables are read.
require(path.resolve(__dirname, '../config/env'))
const signale = require('signale')

const chalk = require('chalk')
const { resolve, join } = require('path')
const child_process = require('child_process')

const indexPageInfo = [
  '// This is a index page',
  '//you can write any code here...',
  'import React from "react"',
  'export default () => {',
  'return <div>index</div>',
  '}'
].join('\n')

class ReactStoryInit {
  constructor(props, args) {
    args[0] = args[0] || 'dev'
    args[1] = args[1] || '.'
    if (!this.modes[args[0]]) {
      console.log(
        chalk.default.redBright(
          [
            '\nReactStory-cli only support',
            'dev: for development',
            'build: for building site',
            'deploy: run a server to serve your site'
          ].join('\n')
        )
      )
      process.exit(1)
    }

    this.bootPath = props
    this.mode = args[0]
    this.targetPath = args[1]
  }

  dev() {
    const devrun = require('./dev')
    if (process.argv[4] !== 'dontCopy') {
      const indexPage = path.resolve(this.bootPath, 'index.js')
      if (!fs.existsSync(indexPage)) {
        fs.ensureFileSync(indexPage)
        fs.writeFileSync(indexPage, indexPageInfo, 'utf-8')
      }
    }
    devrun()
  }

  finished() {
    // when build is finished, we simply did the right thing here.
    signale.success('Everything is done!\n')

    if (process.argv[4] === 'dontCopy') return

    const simpleServerOutputPath = join(this.bootPath, 'server')
    const simpleServerBuiltInPath = resolve(__dirname, '../server')

    if (fs.existsSync(simpleServerOutputPath)) {
      fs.removeSync(simpleServerOutputPath)
    }
    fs.ensureDirSync(simpleServerOutputPath)
    fs.copy(simpleServerBuiltInPath, simpleServerOutputPath)
  }

  build() {
    let i = 0 // mark for build
    const buildServer = require('./build')
    const buildClient = require('./client')
    buildServer(() => {
      i++
      if (i == 2) this.finished()
    })
    buildClient(() => {
      i++
      if (i == 2) this.finished()
    })
  }

  simpleServer() {
    // const str = [
    //   'npm init -y &&',
    //   'npm install --save babel-register babel-preset-env babel-preset-react-app &&',
    //   'npm install --save express react react-helmet --color'
    // ].join(' ')
    // const c = child_process.exec(str, { encoding: 'utf-8' }, (err, stdout) => {})
    // c.stdout.pipe(process.stdout)
    npm.load(() => {
      npm.commands.install(['--save babel-register babel-preset-env babel-preset-react-app'])
      // npm.commands.install('--save express react react-helmet')
    })
  }

  _delete() {
    try {
      const manifestJson = require('../docs/build/asset-manifest.json')
      const jsName = manifestJson['main.js'].replace('static/js/', '')
      const cssName = manifestJson['main.css'].replace('static/css/', '')
      fs.removeSync(resolve(__dirname, `../docs/${jsName}`))
      fs.removeSync(resolve(__dirname, `../docs/${cssName}`))
      fs.removeSync(resolve(__dirname, `../docs/index.html`))
    } catch (e) {
      console.log(e)
    }
  }

  deploy() {
    const manifestJson = require('../docs/build/asset-manifest.json')
    const jsName = manifestJson['main.js'].replace('static/js/', '')
    const cssName = manifestJson['main.css'].replace('static/css/', '')

    fs.ensureFileSync(resolve(__dirname, `../docs/${jsName}`))
    fs.ensureFileSync(resolve(__dirname, `../docs/${cssName}`))
    fs.copyFileSync(
      resolve(__dirname, `../docs/build/${manifestJson['main.js']}`),
      resolve(__dirname, `../docs/${jsName}`)
    )
    fs.copyFileSync(
      resolve(__dirname, `../docs/build/${manifestJson['main.css']}`),
      resolve(__dirname, `../docs/${cssName}`)
    )

    const html = [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head>',
      '<meta charset="utf-8">',
      '<meta content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0;" name="viewport" />',
      '  <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.14.0/themes/prism-tomorrow.min.css" rel="stylesheet">',
      '  <meta name="theme-color" content="#000000">',
      ' <title>ReactStory</title>',
      `<link href="${cssName}" rel="stylesheet">`,
      '</head><body><div id="root"></div></body>',
      '</html>',
      `<script type="text/javascript" src="${jsName}" ></script>`
    ].join(' ')

    fs.ensureFileSync(resolve(__dirname, '../docs/index.html'))
    fs.writeFileSync(resolve(__dirname, '../docs/index.html'), html)
    fs.removeSync(resolve(__dirname, '../docs/build'))
  }

  run() {
    this[this.mode]()
  }
}
ReactStoryInit.prototype.modes = {
  dev: 1,
  build: 1,
  deploy: 1,
  simpleServer: 1,
  _delete: 1
}

module.exports = ReactStoryInit
