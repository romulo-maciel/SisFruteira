function createChart(data) {
    const ctx = document.getElementById('quantity-chart').getContext('2d');
    const labels = data.statistics.map(entry => entry.name + ' - R$ ' + entry.price);
    const quantities = data.statistics.map(entry => entry.quantity);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Quantidade Vendida',
                data: quantities,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

async function fetchData() {
    try {
        const response = await fetch('api/record');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function populateTable(data) {
    const reportBody = document.getElementById('report-body');
    reportBody.innerHTML = ''; // Clear existing content

    const stats = data.statistics;
    const history = data.history;


    stats.forEach(entry => {
        const row = document.createElement('tr');

        const nameCell = document.createElement('td');
        nameCell.textContent = entry.name;
        row.appendChild(nameCell);

        const quantityCell = document.createElement('td');
        quantityCell.textContent = `${entry.quantity}`;
        row.appendChild(quantityCell);

        const priceCell = document.createElement('td');
        priceCell.textContent = entry.price;
        row.appendChild(priceCell);

        const totalCell = document.createElement('td');
        totalCell.textContent = entry.total;
        row.appendChild(totalCell);

        reportBody.appendChild(row);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const data = await fetchData();
    populateTable(data);
    createChart(data);
});