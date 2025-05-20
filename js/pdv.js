document.addEventListener("DOMContentLoaded", async () => {
    const codeInput = document.getElementById("code");
    const productImage = document.getElementById("product-image");
    const productName = document.getElementById("product-name");
    const productPrice = document.getElementById("product-price");
    const cartList = document.getElementById("cart-list");
    const weightInfo = document.getElementById("weight");
    const itemPrice = document.getElementById("item-price");

    let products = [];
    let isGray = false;
    let total = 0;
    let interval = null;

    async function fetchProducts() {
        try {
            const response = await fetch("assets/products.json");
            products = await response.json();
        } catch (error) {
            console.error("Erro ao carregar os produtos:", error);
        }
    }

    async function getWeight() {
        const weight = await window.weightAPI.getWeight()
        return weight;
    }

    async function readStableWeight() {
        let attempts = 0;
        let weight;
        while (attempts < 1000) { // Limita tentativas para evitar loop infinito
            weight = await getWeight();
            if (weight.slice(1) !== 'IIIII') {
                weightInfo.classList.remove("unstable");
                return weight;
            }
            weightInfo.textContent = 'Peso instável';
            weightInfo.classList.add("unstable");
            attempts++;
        }
        return null; // Não conseguiu peso estável
    }

    async function updateWeightAndPrice(product) {
        const weight = await readStableWeight();
        if (!weight) {
            weightInfo.textContent = "Erro ao ler peso";
            itemPrice.textContent = "";
            return null;
        }
        let weightValue = parseFloat(weight.slice(1)) / 1000;
        let itemPriceValue = product.price * weightValue;
        weightInfo.textContent = `${weightValue.toFixed(3)}kg`;
        itemPrice.textContent = `R$ ${itemPriceValue.toFixed(2)}`;
    }

    // window.finishPurchase = async () => {
    //     if (confirm("Deseja finalizar a compra?")) {
    //         const purchaseData = [];
    //         cartList.querySelectorAll("tr").forEach(row => {
    //             const cells = row.querySelectorAll("td");
    //             purchaseData.push({
    //                 name: cells[0].textContent,
    //                 quantity: parseFloat(cells[1].textContent),
    //                 price: parseFloat(cells[2].textContent.replace('/kg', '').replace('R$ ', '')),
    //                 total: parseFloat(cells[3].textContent.replace('R$ ', ''))
    //             });
    //         });

    //         const dataResponse = await fetch("api/record");
    //         let data = await dataResponse.json();

    //         const history = data.history || [];
    //         const statistics = data.statistics || [];

    //         const newHistoryEntry = {
    //             date: new Date().toLocaleTimeString({ timeZone: "America/Sao_Paulo" }),
    //             items: purchaseData,
    //             total: purchaseData.reduce((sum, item) => sum + item.total, 0).toFixed(2)
    //         };

    //         history.push(newHistoryEntry);

    //         purchaseData.forEach(item => {
    //             const stat = statistics.find(stat => stat.name === item.name && stat.price === item.price);
    //             if (stat) {
    //                 stat.quantity += item.quantity;
    //                 stat.total += item.total;
    //             } else {
    //                 statistics.push({
    //                     name: item.name,
    //                     quantity: item.quantity.toFixed(2),
    //                     total: item.total.toFixed(2),
    //                     price: item.price.toFixed(2),
    //                 });
    //             }
    //         });

    //         statistics.sort((a, b) => a.name.localeCompare(b.name));

    //         data = {
    //             history: history,
    //             statistics: statistics
    //         };

    //         await fetch("api/record", {
    //             method: "POST",
    //             headers: {
    //                 "Content-Type": "application/json"
    //             },
    //             body: JSON.stringify(data)
    //         });

    //         cartList.innerHTML = "";
    //         total = 0;
    //         document.getElementById("cart-total").textContent = "0.00";
    //         setProduct("");

    //         alert("Compra finalizada");

    //     }
    // };

    window.finishPurchase = async () => {
        // Usa o novo prompt customizado em vez do confirm nativo
        const confirmed = await window.cartAPI.promptConfirmation();
        
        if (confirmed) {
            // Limpa o carrinho e reseta os valores
            cartList.innerHTML = "";
            total = 0;
            document.getElementById("cart-total").textContent = "0.00";
            productImage.src = "";
            productName.textContent = "Digite o código do produto";
            productPrice.textContent = "";
            weightInfo.textContent = "";
            itemPrice.textContent = "";
            codeInput.value = "";
        }
    }

    setProduct = async (code) => {
        if (interval) {
            clearInterval(interval);
            interval = null;
        }
        if (!code) {
            productImage.src = "";
            productName.textContent = "Digite o código do produto";
            codeInput.value = "";
            codeInput.focus();
            productPrice.textContent = "";
            weightInfo.textContent = "";
            itemPrice.textContent = "";
            return;
        }
        code = code.padStart(2, '0');
        codeInput.focus();
        let product = products[code]

        if (product) {
            productImage.src = `fruits/${product.image}`;
            productName.textContent = product.name;
            productPrice.textContent = `R$ ${product.price.toFixed(2)}`;
        } else {
            productImage.src = "";
            productName.textContent = "Produto não encontrado";
            productPrice.textContent = "";
            weightInfo.textContent = "";
            itemPrice.textContent = "";
            return;
        }

        if (product && product.isUnitary) {
            weightInfo.textContent = "";
            itemPrice.textContent = "";
            return;
        }

        await updateWeightAndPrice(product);

        interval = setInterval(async () => {
            const weight = await getWeight();
            if (weight.slice(1) === 'IIIII') {
                weightInfo.classList.add("unstable");
                return;
            }
            weightInfo.classList.remove("unstable");
            let weightValue = parseFloat(weight.slice(1)) / 1000;
            let itemPriceValue = product.price * weightValue;
            weightInfo.textContent = `${weightValue.toFixed(3)}kg`;
            itemPrice.textContent = `R$ ${itemPriceValue.toFixed(2)}`;
        }, 500);
    }

    codeInput.addEventListener("change", () => {
        if (interval) {
            clearInterval(interval);
            interval = null;
        }
        setProduct(codeInput.value);
    });

    function addRow(product, qtd) {
        if (interval) {
            clearInterval(interval);
            interval = null;
        }

        console.log('addRow called');

        let row = document.createElement("tr");
        row.innerHTML = `
        <td>${product.name}</td>
        <td>${qtd}${!product.isUnitary ? 'kg' : ''}</td>
        <td>R$ ${product.price.toFixed(2)}${!product.isUnitary ? '/kg' : ''}</td>
        <td>R$ ${(product.price * qtd).toFixed(2)}</td>
        `;

        if (isGray) {
            row.classList.add("is-gray");
        }

        isGray = !isGray;
        cartList.insertBefore(row, cartList.firstChild);

        codeInput.value = "";

        total += product.price * qtd;
        document.getElementById("cart-total").textContent = `${total.toFixed(2)}`;

        weightInfo.textContent = "";
        itemPrice.textContent = "";
        productImage.src = "";
    }

    async function addToCart() {
        if (interval) {
            clearInterval(interval);
            interval = null;
        }
        let code = codeInput.value.padStart(2, '0');
        let product = products[code]
        let qtd = 0;
        if (!product) return;

        if (product.isUnitary) {
            const value = await window.cartAPI.promptQuantity();
            qtd = parseFloat(value);
            if (isNaN(qtd)) {
                alert("Quantidade inválida");
                throw new Error("Quantidade inválida");
            }
            addRow(product, qtd);
        } else {
            getWeight().then(async weight => {
                // Limpa o intervalo novamente ANTES de adicionar ao carrinho
                if (interval) {
                    clearInterval(interval);
                    interval = null;
                }
                if (weight.slice(1) === 'IIIII') {
                    weightInfo.classList.add("unstable");
                    while (!readStableWeight()) {
                        if (isNaN(weight.slice(1)) && weight.slice(1) !== 'IIIII') {
                            weightInfo.classList.remove("unstable");
                            break;
                        }
                    }
                    weight = await readStableWeight();
                }
                weightInfo.classList.remove("unstable");
                weightInfo.textContent = `${weight.slice(1)}g`;

                qtd = parseFloat(weight.slice(1)) / 1000;
                addRow(product, qtd);
            })
        }
    }

    document.addEventListener("keypress", (event) => {
        console.log(event.key);
        if (event.key === '-') {
            console.log("Remover produto");
            const productCode = codeInput.value.padStart(2, '0');
            console.log("Código do produto:", productCode);
            const product = products[productCode];
            console.log("Produto:", product);
            if (!product) {
                console.log("Produto não encontrado");
                return;
            }
            const rows = Array.from(cartList.querySelectorAll("tr"));
            // const matchingRow = rows.reverse().find(row => row.cells[0].textContent === product.name);
            const matchingRow = rows.find(row => row.cells[0].textContent === product.name);
            console.log("Linha correspondente:", matchingRow);
            if (matchingRow) {
                // if(!confirm("Deseja remover o produto do carrinho?")) return;
                const quantityText = matchingRow.cells[1].textContent;
                const qty = parseFloat(quantityText.replace('kg', ''));
                const priceText = matchingRow.cells[2].textContent;
                const price = parseFloat(priceText.replace('/kg', '').replace('R$ ', ''));
                total -= price * qty;
                document.getElementById("cart-total").textContent = `${total.toFixed(2)}`;
                cartList.removeChild(matchingRow);
            } else {
                console.log("Produto não encontrado no carrinho");
            }
            codeInput.value = "";
            event.preventDefault();
            return;
        }
        if (event.key === "Enter") {
            if (codeInput.value == "" && document.activeElement === codeInput) {
                finishPurchase();
            }
            // return
        }

        if (event.code.startsWith("Numpad") || event.code.startsWith("Digit")) {
            setProduct(codeInput.value + event.key);
            return
        }

        if (event.key === "*") {
            codeInput.value = "";
            alert("Compra finalizada");
            return
        }
    });

    document.addEventListener("keydown", async (event) => {
        if (event.key === "Backspace") {
            setProduct(codeInput.value.slice(0, -1));
            return
        }
    });

    await fetchProducts();

});
