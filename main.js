const electron = require('electron');
const appConfig = require('electron-settings');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
var open = require('open');
const path = require('path');
const cache = {};
const { Menu } = require('electron');

let mainWindow;

app.commandLine.appendSwitch('ignore-gpu-blacklist');

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

global.META = {
	version: 1
};

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;
process.env.ELECTRON_ENABLE_SECURITY_WARNINGS = false;

function createWindow () {
	var mainWindowState = windowStateKeeper('main');
	//  frame: false
	var window = new BrowserWindow({ autoHideMenuBar: true, frame: true, titleBarStyle: 'hidden', icon: __dirname + '/icon.png', x: mainWindowState.x, y: mainWindowState.y, width: mainWindowState.width, height: mainWindowState.height, transparent: false, webPreferences: { backgroundThrottling: false, nodeIntegration: true, nativeWindowOpen: true, webviewTag: true }});
	window.setBackgroundColor('#202020');
	window && (window.ELECTRON_DISABLE_SECURITY_WARNINGS = true);
	window && (window.ELECTRON_ENABLE_SECURITY_WARNINGS = false);

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

	var isMac = process.platform === 'darwin';

	const template = [
		// { role: 'appMenu' }
		...(isMac ? [{
			label: app.getName(),
			submenu: [
				// { role: 'about' },
				// { type: 'separator' },
				{ role: 'services' },
				{ type: 'separator' },
				{ label: 'New window', accelerator: 'CmdOrCtrl+N', click: function() { createWindow(); }},
				{ type: 'separator' },
				{ role: 'hide' },
				{ role: 'hideothers' },
				{ role: 'unhide' },
				{ type: 'separator' },
				{ role: 'quit' }
			]
		}] : []),
		{
			label: 'Edit',
			submenu: [
				{ role: 'undo' },
				{ role: 'redo' },
				{ type: 'separator' },
				{ role: 'cut' },
				{ role: 'copy' },
				{ role: 'paste' },
				...(isMac ? [
					{ role: 'delete' },
					{ type: 'separator' },
					{ role: 'selectAll' }
				] : [
					{ role: 'delete' },
					{ type: 'separator' },
					{ role: 'selectAll' }
				])
			]
		},
		// { role: 'viewMenu' }
		{
			label: 'View',
			submenu: [
				{ role: 'forcereload' },
				{ type: 'separator' },
				{ label: 'Developer tools', accelerator: 'F12', click: function() { mainWindow.toggleDevTools() }},
				{ type: 'separator' },
				{ role: 'togglefullscreen' }
			]
		},
		{ role: 'windowMenu' },
		/*
		{
			label: 'Window',
			submenu: [
				{ role: 'minimize' },
				{ role: 'zoom' },
				...(isMac ? [
					{ type: 'separator' },
					{ role: 'front' },
					{ type: 'separator' },
					{ role: 'window' }
				] : [
					{ role: 'close' }
				])
			]
		},*/
		{
			role: 'help',
			submenu: [

				{
					label: 'Documentation',
					click () { electron.shell.openExternalSync('https://wiki.totaljs.com/code/01-welcome/'); }
				},
				{
					label: 'Total.js Platform',
					click () { electron.shell.openExternalSync('https://www.totaljs.com/'); }
				},
				{
					label: 'Contact us',
					click () { electron.shell.openExternalSync('https://www.totaljs.com/contact/'); }
				},
				{
					label: 'Support',
					click () { electron.shell.openExternalSync('https://www.totaljs.com/support/'); }
				}
			]
		}
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

