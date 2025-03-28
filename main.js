const { app, BrowserWindow, ipcMain, webContents } = require('electron')
const path = require('node:path')
const { SerialPort, ReadlineParser } = require('serialport')




app.whenReady().then(() => {

    // createWindow()
    const win = new BrowserWindow({

        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            sandbox: false,
            contextIsolation: true,
            nodeIntegration: false
            // enableRemoteModule: false,
        },
        // titleBarStyle: 'hidden',
        // autoHideMenuBar: true,
        // frame: false,
    })

    ipcMain.handle('open-prompt', async (event, message) => {
        return new Promise((resolve) => {
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

            ipcMain.once('update-quantity', (event, value) => {
                resolve(value);
                console.log('update-quantity: ', value);
                win.webContents.send('add-to-cart', value);
                promptWindow.close();
            });

            
        });
    });

    win.maximize()
    win.loadFile('index.html')

    const port = new SerialPort({
        path: '/dev/ttyUSB0',
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
    });

    port.on('open', () => {
        // console.log('Serial Port Opened');
        port.write('\x05');
    });

    const parser = port.pipe(new ReadlineParser({ delimiter: '\x03' })); // ETX (03H) como delimitador


    ipcMain.handle('get-weight', async (event) => {
        // console.log('get-weight called on main'); 
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

    // app.on('activate', () => {
    //     if (BrowserWindow.getAllWindows().length === 0) createWindow()
    // })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

app.on('web-contents-created', (event, contents) => {
    contents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('Failed to load preload script:', errorDescription);
    });
});