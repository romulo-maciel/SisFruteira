const { contextBridge, ipcRenderer, dialog } = require('electron');
const fs = require('fs');
const path = require('path');


contextBridge.exposeInMainWorld('fruitsAPI', {
    getFruits: () => {
        // console.log('getFruits() called');
        const fruits = fs.readFileSync(path.join(__dirname, 'assets/products.json'), 'utf8');
        return JSON.parse(fruits);
    },
    ping: () => {
        console.log('pong');
    }
});

contextBridge.exposeInMainWorld('cartAPI', {
    promptQuantity: async () => {
        console.log('promptQuantity() called');
        const result = await ipcRenderer.invoke('open-prompt', 'Quantidade:');
        return result;
    },
    updateQuantity: (product, quantity) => {
        console.log('sending info to main process');
        console.log('product: ', product);
        console.log('quantity: ', quantity);
        ipcRenderer.send('update-quantity', product, quantity);
    },
    addToCart: (callback) => {
        ipcRenderer.on('add-to-cart', (event, product) => {
            console.log('add-to-cart() called');
            callback(product);
        });
    },
    finishPurchase: async () => {
        console.log('finishPurchase() called');
        const result = await ipcRenderer.invoke('finish-purchase');
        return result;
    },
});

contextBridge.exposeInMainWorld('weightAPI', {
    getWeight: () => {
        // console.log('getWeight() called');
        const weight = ipcRenderer.invoke('get-weight');
        return weight;
    },
});