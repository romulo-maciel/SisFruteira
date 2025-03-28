function updatePrice(fruitName, fruitCode) {
    const newPrice = prompt('Digite o novo preço para ' + fruitName);
    if (newPrice) {
        fetch('/update-price', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fruitCode,
                newPrice
            })
        }).then(response => {
            if (response.ok) {
                alert('Preço atualizado com sucesso!');
                location.reload();
            } else {
                alert('Erro ao atualizar o preço');
            }
        });
    }
}