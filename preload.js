const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

let userDataPath;
let productsUserPath;
let productsAssetPath;

async function initPaths() {
    userDataPath = await ipcRenderer.invoke('get-user-data-path');
    productsUserPath = path.join(userDataPath, 'products.json');
    productsAssetPath = path.join(__dirname, 'assets/products.json');

    // Copia o arquivo original se não existir
    if (!fs.existsSync(productsUserPath)) {
        fs.copyFileSync(productsAssetPath, productsUserPath);
    }
}

function getFruits() {
    if (!productsUserPath) throw new Error('Paths not initialized');
    return JSON.parse(fs.readFileSync(productsUserPath, 'utf8'));
}

function updatePrice(code, newPrice) {
    try {
        const products = getFruits();
        // Se products for objeto, acesse diretamente pela chave
        if (!products[code]) return false;
        products[code].price = newPrice === '' ? null : parseFloat(newPrice);
        fs.writeFileSync(productsUserPath, JSON.stringify(products, null, 2));
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

// Inicializa os caminhos antes de expor as APIs
initPaths().then(() => {
    contextBridge.exposeInMainWorld('fruitsAPI', {
        getFruits,
        updatePrice
    });

    contextBridge.exposeInMainWorld('cartAPI', {
        promptQuantity: () => ipcRenderer.invoke('prompt-quantity', 'Quantidade:'),

        updateQuantity: (product, quantity) => {
            console.log('Sending quantity to main process (updateQuantity)');
            console.log('product: ', product);
            console.log('quantity: ', quantity);
            ipcRenderer.send('update-quantity', product, quantity);
        },

        // Novo método para confirmar finalização da compra
        confirmPurchase: (confirmed) => {
            console.log('Sending confirmation to main process');
            ipcRenderer.send('confirm-purchase', confirmed);
        },

        // Novo método para abrir o diálogo de confirmação
        promptConfirmation: () => ipcRenderer.invoke('prompt-confirmation'),

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
});