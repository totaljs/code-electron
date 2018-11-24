const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const windowStateKeeper = require('electron-window-state');
const path = require('path');
const cache = {};

let mainWindow;

module.paths.push(path.resolve('node_modules'));
module.paths.push(path.resolve('../node_modules'));
module.paths.push(path.resolve(__dirname, '..', '..', '..', '..', 'resources', 'app', 'node_modules'));
module.paths.push(path.resolve(__dirname, '..', '..', '..', '..', 'resources', 'app.asar', 'node_modules'));

electron.ipcMain.on('setPath', function(e, arg) {
	if (arg.url[arg.url.length - 1] === '/')
		arg.url = arg.url.substring(0, arg.url.length - 1);
	cache[arg.url] = arg.path;
});

electron.ipcMain.on('getPath', function(e, arg) {
	e.returnValue = cache[arg.url] || '';
});

function createWindow () {
	var mainWindowState = windowStateKeeper({ defaultWidth: 1280, defaultHeight: 768 });
	var window = new BrowserWindow({ icon: __dirname + '/icon.png', x: mainWindowState.x, y: mainWindowState.y, width: mainWindowState.width, height: mainWindowState.height, webPreferences: { nodeIntegration: true }, vibrancy: 'dark' });
	window.on('closed', function () {
		if (mainWindow == this)
			mainWindow = null;
	});
	window.on('focus', function () {
		mainWindow = this;
	});
	mainWindow = window;
	mainWindowState.manage(window);
	window.loadFile('index.html');
}

app.on('ready', createWindow);
app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit());
app.on('activate', () => mainWindow == null && createWindow());

app.on('ready', () => {
	electron.globalShortcut.register('CommandOrControl+N', createWindow);
	electron.globalShortcut.register('Command+R', function() {});
	electron.globalShortcut.register('Command+W', function() {
		mainWindow.webContents.send('tabs.close');
	});
});