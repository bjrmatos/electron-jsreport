const { app, BrowserWindow, ipcMain } = require('electron')
const url = require('url')
const path = require('path')
const isDev = require('electron-is-dev')

if (!isDev) {
  const chromePath = require('puppeteer').executablePath()
  process.env.extensions_chromePdf_launchOptions_executablePath = path.join(process.cwd(), chromePath.slice(chromePath.indexOf('node_modules')))
}

var jsreport = require('jsreport')({
  rootDirectory: process.cwd(),
  extensions: {
    assets: {
      allowedFiles: '**/*.*',
      publicAccessEnabled: true,
      searchOnDiskIfNotFoundInStore: true,
      rootUrlForLinks: "http://localhost:5488"
    }
  }
});

var fs = require('fs')

let win

app.on('ready', () => {
  ipcMain.on('generateReport', (e, args) => {
    appLog('info', 'initializing reporter..')

    jsreport.init().then(function () {
      appLog('info', 'reporter started..')

      appLog('info', 'rendering report..')

      jsreport.render({
        template: {
          content: fs.readFileSync(path.join(__dirname, './print.html')).toString(),
          engine: 'jsrender',
          recipe: 'chrome-pdf'
        },
        data: {
          rows: args
        }
      }).then(function (resp) {
        appLog('info', 'report generated..')
        fs.writeFileSync('report.pdf', resp.content)
      }).catch((e) => {
        appLog('error', 'error while generatin report: ' + e.stack)
        console.error('render error')
        console.error(e)
      });
    }).catch(function (e) {
      appLog('error', 'error while starting reporter: ' + e.stack)
      console.error(e.stack)
      process.exit(1)
    })
  }) 

  createWindow()
})

function createWindow() {
  win = new BrowserWindow({ width: 800, height: 600 })
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  win.on('closed', () => {
    win = null
  })
}

process.on('uncaughtException', (err) => {
  appLog('error', err.stack)
  throw err
})

function appLog(level, message) {
  message += '\r\n'
  if (level === 'info') {
    fs.appendFileSync('app-info.log', message)
  } else if (level === 'error') {
    fs.appendFileSync('app-error.log', message)
  }
}