const electron = require('electron');
const appConfig = require('electron-settings');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
var open = require('open');
const path = require('path');
const cache = {};
const { Menu } = require('electron');

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
	var mainWindowState = windowStateKeeper('main');
	var window = new BrowserWindow({ autoHideMenuBar: true, icon: __dirname + '/icon.png', x: mainWindowState.x, y: mainWindowState.y, width: mainWindowState.width, height: mainWindowState.height, webPreferences: { nodeIntegration: true, nativeWindowOpen: true }});

	mainWindowState.track(window);

	window.on('closed', function () {
		if (mainWindow == this)
			mainWindow = null;
	});

	window.webContents.on('new-window', function(e, url, frameName, disposition, options) {
		e.preventDefault();
		if (url.indexOf('/api/download/') !== -1 && url.indexOf('?path') !== -1) {
			Object.assign(options, { width: 1280, height: 768, modal: false });
			var mws = windowStateKeeper('preview');
			options.autoHideMenuBar = true;
			options.x = mws.x;
			options.y = mws.y;
			options.width = mws.width;
			options.height = mws.height;
			e.newGuest = new BrowserWindow(options);
			mws.track(e.newGuest);
		} else
			open(url);
	});

	window.on('focus', function () {
		mainWindow = this;
	});

	mainWindow = window;
	mainWindow.setMenuBarVisibility(false);
	window.loadFile('index.html');

	var template = [{
		label: 'Application',
		submenu: [
			{ label: 'About Application', selector: 'orderFrontStandardAboutPanel:' },
			{ type: 'separator' },
			{ label: 'New window', accelerator: 'CmdOrCtrl+N', click: function() { createWindow(); }},
			{ label: 'Developer tools', accelerator: 'F12', click: function() { mainWindow.toggleDevTools(); }},
			{ label: 'Quit', accelerator: 'Command+Q', click: function() { app.quit(); }},
			{ label: 'Quit', accelerator: 'Alt+F4', click: function() { app.quit(); }}
		]}, {
		label: 'Edit',
		submenu: [
			{ label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:' },
			{ label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:' },
			{ type: 'separator' },
			{ label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
			{ label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
			{ label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
			{ label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:' }
		]}
	];

	Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function windowStateKeeper(windowName) {

	let window, windowState;

	function setBounds() {
		// Restore from appConfig
		if (appConfig.has(`windowState.${windowName}`)) {
			windowState = appConfig.get(`windowState.${windowName}`);
			return;
		}
		// Default
		windowState = { x: undefined, y: undefined, width: 1000, height: 800 };
	}

	function saveState() {
		if (!windowState.isMaximized) {
			windowState = window.getBounds();
		}
		windowState.isMaximized = window.isMaximized();
		appConfig.set(`windowState.${windowName}`, windowState);
	}

	function track(win) {
		window = win;
		['resize', 'move', 'close'].forEach(event => {
			win.on(event, saveState);
		});
	}

	setBounds();
	return({ x: windowState.x, y: windowState.y, width: windowState.width, height: windowState.height, isMaximized: windowState.isMaximized, track });
}

app.on('ready', createWindow);
app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit());
app.on('activate', () => mainWindow == null && createWindow());

