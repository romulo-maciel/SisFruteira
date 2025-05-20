const { app, BrowserWindow, ipcMain, webContents } = require('electron')
const path = require('node:path')
const { SerialPort, ReadlineParser } = require('serialport')

function createWindow () {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        }
    });

    win.loadFile('index.html');
}

ipcMain.handle('get-user-data-path', () => {
    return app.getPath('userData');
});

app.whenReady().then(() => {

    const win = new BrowserWindow({

        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            sandbox: false,
            contextIsolation: true,
            nodeIntegration: false
        },
        titleBarStyle: 'hidden',
        autoHideMenuBar: true,
        frame: false,
    })


    ipcMain.handle('prompt-quantity', async () => {
        let promptWindow = new BrowserWindow({
            width: 400,
            height: 400,
            parent: win,
            modal: true,
            frame: false,
            transparent: true,
            resizable: false,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                sandbox: false,
                contextIsolation: true,
                nodeIntegration: false,
            }
        });

        promptWindow.loadFile('renderer/prompt.html');

        return new Promise((resolve, reject) => {
            ipcMain.once('update-quantity', (_, value) => {
                resolve(value);
                promptWindow.close();
            });

            ipcMain.once('cancel-quantity', () => {
                resolve(null);
                promptWindow.close();
            });

            promptWindow.once('ready-to-show', () => {
                promptWindow.show();
            });
        });
    });

    ipcMain.handle('prompt-confirmation', async () => {
        let confirmWindow = new BrowserWindow({
            width: 400,
            height: 400,
            parent: win,
            modal: true,
            frame: false,
            transparent: true,
            resizable: false,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                sandbox: false,
                contextIsolation: true,
                nodeIntegration: false,
            }
        });

        confirmWindow.loadFile('renderer/confirm.html');

        return new Promise((resolve, reject) => {
            ipcMain.once('confirm-purchase', (_, confirmed) => {
                resolve(confirmed);
                confirmWindow.close();
                
                if (confirmed) {
                    win.reload();
                }
            });

            confirmWindow.once('ready-to-show', () => {
                confirmWindow.show();
            });
        });
    });

    win.maximize()
    win.loadFile('index.html')

    const DEFAULT_PORT = process.platform === 'win32' ? 'COM6' : '/dev/ttyUSB0';

    const port = new SerialPort({
        path: DEFAULT_PORT,
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
    });

    port.on('open', () => {
        port.write('\x05');
    });

    const parser = port.pipe(new ReadlineParser({ delimiter: '\x03' }));

    ipcMain.handle('get-weight', async (event) => {
        return new Promise((resolve) => {
            port.write('\x05');
            parser.once('data', data => {
                resolve(data);
            });
        });
    });

    port.on('error', err => {
        console.error('Serial Port Error:', err);
    });
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

app.on('web-contents-created', (event, contents) => {
    contents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('Failed to load preload script:', errorDescription);
    });
});