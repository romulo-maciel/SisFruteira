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
        // document.getElementById("weight").textContent = weight;
        return weight;
    }

    window.finishPurchase = async () => {
        if (confirm("Deseja finalizar a compra?")) {
            const purchaseData = [];
            cartList.querySelectorAll("tr").forEach(row => {
                const cells = row.querySelectorAll("td");
                purchaseData.push({
                    name: cells[0].textContent,
                    quantity: parseFloat(cells[1].textContent),
                    price: parseFloat(cells[2].textContent.replace('/kg', '').replace('R$ ', '')),
                    total: parseFloat(cells[3].textContent.replace('R$ ', ''))
                });
            });

            const dataResponse = await fetch("api/record");
            let data = await dataResponse.json();

            const history = data.history || [];
            const statistics = data.statistics || [];


            const newHistoryEntry = {
                date: new Date().toLocaleTimeString({ timeZone: "America/Sao_Paulo" }),
                items: purchaseData,
                total: purchaseData.reduce((sum, item) => sum + item.total, 0).toFixed(2)
            };

            history.push(newHistoryEntry);

            purchaseData.forEach(item => {
                const stat = statistics.find(stat => stat.name === item.name && stat.price === item.price);
                if (stat) {
                    stat.quantity += item.quantity;
                    stat.total += item.total;
                } else {
                    statistics.push({
                        name: item.name,
                        quantity: item.quantity.toFixed(2),
                        total: item.total.toFixed(2),
                        price: item.price.toFixed(2),
                    });
                }
            });

            statistics.sort((a, b) => a.name.localeCompare(b.name));

            data = {
                history: history,
                statistics: statistics
            };

            await fetch("api/record", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            cartList.innerHTML = "";
            total = 0;
            document.getElementById("cart-total").textContent = "0.00";
            setProduct("");

            alert("Compra finalizada");

        }
    };

    window.setProduct = async (code) => {
        // let product = products.find(p => p.code == code);
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
        }

        if (product && product.isUnitary) {
            weightInfo.textContent = "";
            itemPrice.textContent = "";
            return;
        }

        getWeight().then(async weight => {
            // console.log(product.price, weight.slice(1));
            while (weight.slice(1) == 'IIIII') {
                // await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms before requesting again
                weight = await getWeight();
                weightInfo.textContent = 'Peso instável';
                weightInfo.classList.add("unstable");
            }
            weightInfo.classList.remove("unstable");
            if (weight.slice(1) == 'IIIII') {
                weightInfo.textContent = "Erro ao ler peso";
                itemPrice.textContent = "";
                return;
            }
            let weightValue = parseFloat(weight.slice(1)) / 1000;
            let itemPriceValue = product.price * weightValue;

            weightInfo.textContent = `${weightValue.toFixed(3)}kg`;
            itemPrice.textContent = `R$ ${itemPriceValue.toFixed(2)}`;

            interval = setInterval(async () => {
                weight = await getWeight();
                if (weight.slice(1) == 'IIIII') {
                    weightInfo.classList.add("unstable");
                    return;
                }
                weightInfo.classList.remove("unstable");
                weightValue = parseFloat(weight.slice(1)) / 1000;
                itemPriceValue = product.price * weightValue;

                // console.log(weightValue, itemPriceValue);

                weightInfo.textContent = `${weightValue.toFixed(3)}kg`;
                itemPrice.textContent = `R$ ${itemPriceValue.toFixed(2)}`;
            }
                , 500);
        });

        if (interval) {
            clearInterval(interval);
            interval = null
        }
    }

    codeInput.addEventListener("change", () => {
        if (interval) {
            clearInterval(interval);
            interval = null
        }
        setProduct(codeInput.value);
    });

    async function addToCart() {
        let code = codeInput.value.padStart(2, '0');
        // let product = products.find(p => p.code == code);
        let product = products[code]
        let qtd = 0;
        if (!product) return;

        if (product.isUnitary) {
            window.cartAPI.promptQuantity()
            window.cartAPI.addToCart((value) => {
                qtd = parseFloat(value);
                if (isNaN(qtd)) {
                    alert("Quantidade inválida");
                    return;
                }
                addRow();
            });
        } else {
            console.log(getWeight());
            getWeight().then(weight => {
                qtd = parseFloat(weight.slice(1)) / 1000
                addRow();
            })
            // qtd = parseFloat(weightInfo.textContent.replace("kg", ""));
        }

        const addRow = () => {

            console.log(product, qtd);

            let row = document.createElement("tr");
            row.innerHTML = `
        <td>${product.name}</td>
        <td>${qtd}</td>
        <td>R$ ${product.price.toFixed(2)}${!product.isUnitary ? '/kg' : ''}</td>
        <td>R$ ${(product.price * qtd).toFixed(2)}</td>
        `;

            if (isGray) {
                row.classList.add("is-gray");
            }

            isGray = !isGray;
            cartList.appendChild(row);

            codeInput.value = "";

            total += product.price * qtd;
            document.getElementById("cart-total").textContent = `${total.toFixed(2)}`;

            if (interval) {
                clearInterval(interval);
                interval = null;
            }
            weightInfo.textContent = "";
            itemPrice.textContent = "";
            productImage.src = "";
        }
    }



    document.addEventListener("keypress", (event) => {
        // console.log(event);

        if (event.key === "Enter") {
            if (codeInput.value === "") {
                finishPurchase();
            }
            addToCart();
            return
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
            // console.log(codeInput.value, codeInput.value.slice(0, -1));
            setProduct(codeInput.value.slice(0, -1));
            return
        }
    });

    await fetchProducts();



});
