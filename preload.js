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
    promptQuantity: () => ipcRenderer.invoke('prompt-quantity', 'Quantidade:'),

    updateQuantity: (product, quantity) => {
        console.log('Sending quantity to main process (updateQuantity)');
        console.log('product: ', product);
        console.log('quantity: ', quantity);
        ipcRenderer.send('update-quantity', product, quantity);
    },

    // addToCart: (callback) => {
    //     ipcRenderer.on('add-to-cart', (event, product) => {
    //         console.log('add-to-cart() called');
    //         callback(product);
    //     });
    // },

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