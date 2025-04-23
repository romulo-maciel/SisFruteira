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
            // Quando o usuário confirmar
            ipcMain.once('update-quantity', (_, value) => {
                resolve(value);
                promptWindow.close();
            });

            // Opcional: tratar cancelamento
            // ipcMain.once('cancel-quantity', () => {
            //   resolve(null);
            //   promptWindow.close();
            // });

            promptWindow.once('ready-to-show', () => {
                promptWindow.show();
            });

            // ipcMain.once('update-quantity', (event, value) => {
            //     resolve(value);
            //     console.log('\n\nupdate-quantity on main process');
            //     win.webContents.send('add-to-cart', value);
            //     promptWindow.close();
            // });


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