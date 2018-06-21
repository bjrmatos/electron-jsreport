const { app, BrowserWindow, ipcMain } = require('electron')
const url = require('url')
const path = require('path')
var jsreport = require('jsreport')({
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

jsreport.init().then(function () {
}).catch(function (e) {
  console.error(e.stack)
  process.exit(1)
})

ipcMain.on('generateReport', (e, args) => {
  jsreport.render({
    template: {
      content: fs.readFileSync('./print.html').toString(),
      engine: 'jsrender',
      recipe: 'chrome-pdf'
    },
    data: {
      rows: args
    }
  }).then(function (resp) {
    fs.writeFileSync('report.pdf', resp.content)
  });
})
let win

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

} app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (win === null) {
    createWindow()
  }
})
