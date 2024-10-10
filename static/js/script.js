document.addEventListener('DOMContentLoaded', function() {
    // Convert bytes to gigabytes
    function bytesToGigabytes(bytes) {
        return (bytes / (1024 * 1024 * 1024)).toFixed(2);
    }

    // Initialize CPU and Network Charts
    const cpuChartCtx = document.getElementById('cpuChart').getContext('2d');
    const networkChartCtx = document.getElementById('networkChart').getContext('2d');

    // Data for charts (dummy initial values)
    let cpuChart = new Chart(cpuChartCtx, {
        type: 'line',
        data: {
            labels: ['Core 1', 'Core 2', 'Core 3', 'Core 4', 'Core 5', 'Core 6'],
            datasets: [{
                label: 'CPU Core Usage (%)',
                data: [0, 0, 0, 0, 0, 0],
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
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

    let networkChart = new Chart(networkChartCtx, {
        type: 'line',
        data: {
            labels: ['1s', '2s', '3s', '4s', '5s', '6s', '7s'],
            datasets: [{
                label: 'Upload (GB)',
                data: [0, 0, 0, 0, 0, 0, 0],
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }, {
                label: 'Download (GB)',
                data: [0, 0, 0, 0, 0, 0, 0],
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

    // Fetch network stats in GB
    function updateStats() {
        fetch('/stats')
            .then(response => response.json())
            .then(data => {
                document.getElementById('bytes-sent').textContent = data.bytes_sent.toFixed(2);
                document.getElementById('bytes-received').textContent = data.bytes_received.toFixed(2);

                // Update network chart data
                if (networkChart.data.labels.length >= 20) {
                    networkChart.data.labels.shift();  // Remove the first element
                    networkChart.data.datasets[0].data.shift();  // Remove the first element
                    networkChart.data.datasets[1].data.shift();  // Remove the first element
                }

                networkChart.data.labels.push(`${networkChart.data.labels.length + 1}s`);
                networkChart.data.datasets[0].data.push(data.bytes_sent.toFixed(2));
                networkChart.data.datasets[1].data.push(data.bytes_received.toFixed(2));
                networkChart.update();
            });
    }

    // Fetch CPU info and update CPU chart
    function updateAdvancedCPU() {
        fetch('/cpu-advanced')
            .then(response => response.json())
            .then(data => {
                const cpuPerCoreList = document.getElementById('cpu-per-core-list');
                cpuPerCoreList.innerHTML = ''; // Clear previous results

                data.cpu_per_core.forEach((usage, index) => {
                    const li = document.createElement('li');
                    li.textContent = `Core ${index + 1}: ${usage.toFixed(2)}%`;
                    cpuPerCoreList.appendChild(li);
                });

                // Update CPU chart data
                cpuChart.data.datasets[0].data = data.cpu_per_core.map(usage => usage.toFixed(2));
                cpuChart.update();
            });
    }

    // Fetch Network Info for "Ethernet 3"
    function updateNetworkInfo() {
        fetch('/network-info')
            .then(response => response.json())
            .then(data => {
                const networkDetails = document.getElementById('network-details');
                networkDetails.innerHTML = ''; // Clear previous results

                data.forEach(detail => {
                    const li = document.createElement('li');
                    li.textContent = `IP: ${detail.ip_address}, MAC: ${detail.mac_address}, Status: ${detail.status}`;
                    networkDetails.appendChild(li);
                });
            });
    }

    // Fetch bandwidth by application
    function updateAppBandwidth() {
        fetch('/bandwidth-apps')
            .then(response => response.json())
            .then(data => {
                const bandwidthAppList = document.getElementById('bandwidth-app-list');
                bandwidthAppList.innerHTML = ''; // Clear previous results

                Object.entries(data).forEach(([app, info]) => {
                    const li = document.createElement('li');
                    li.textContent = `App: ${app}, Local Address: ${info.local_address}, PID: ${info.pid}`;
                    bandwidthAppList.appendChild(li);
                });
            });
    }

    // Initialize all updates and refresh every second
    function initDashboardUpdates() {
        updateStats();
        updateNetworkInfo();
        updateAdvancedCPU();
        updateAppBandwidth();
    }

    setInterval(initDashboardUpdates, 1000);  // Refresh every 1 second
});
