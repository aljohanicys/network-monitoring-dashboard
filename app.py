from flask import Flask, jsonify, render_template
import psutil
import subprocess
import socket

app = Flask(__name__)

# Function to get network usage per process using netstat
def get_bandwidth_by_application():
    netstat_output = subprocess.check_output("netstat -ano", shell=True, text=True)
    lines = netstat_output.splitlines()

    process_bandwidth = {}

    for line in lines:
        if 'ESTABLISHED' in line:
            parts = line.split()
            local_address = parts[1]
            pid = int(parts[-1])

            try:
                process = psutil.Process(pid)
                process_name = process.name()

                if process_name not in process_bandwidth:
                    process_bandwidth[process_name] = {
                        'local_address': local_address,
                        'pid': pid
                    }
            except psutil.NoSuchProcess:
                continue

    return process_bandwidth

# API route to serve bandwidth usage by application
@app.route('/bandwidth-apps')
def bandwidth_apps():
    bandwidth_data = get_bandwidth_by_application()
    return jsonify(bandwidth_data)

# Route to get network stats in GB
@app.route('/stats')
def network_stats():
    stats = psutil.net_io_counters()
    # Convert from bytes to gigabytes
    bytes_sent_gb = stats.bytes_sent / (1024 ** 3)
    bytes_received_gb = stats.bytes_recv / (1024 ** 3)
    return jsonify({
        'bytes_sent': bytes_sent_gb,
        'bytes_received': bytes_received_gb
    })

# Route to get detailed network information for "Ethernet 3" only
@app.route('/network-info')
def network_info():
    net_if_addrs = psutil.net_if_addrs()
    net_if_stats = psutil.net_if_stats()
    network_details = []

    interface_name = "Ethernet 3"
    if interface_name in net_if_addrs:
        addresses = net_if_addrs[interface_name]
        ip_address = None
        mac_address = None
        
        for addr in addresses:
            if addr.family == socket.AF_INET:  # IPv4 address
                ip_address = addr.address
            elif addr.family == psutil.AF_LINK:  # MAC address
                mac_address = addr.address
        
        # Get NIC stats
        stats = net_if_stats.get(interface_name)
        is_up = "Up" if stats.isup else "Down"

        network_details.append({
            'interface': interface_name,
            'ip_address': ip_address,
            'mac_address': mac_address,
            'status': is_up
        })
    
    return jsonify(network_details)

# Route to get advanced CPU monitoring info (per-core and temperature)
@app.route('/cpu-advanced')
def cpu_advanced():
    cpu_percent_per_core = psutil.cpu_percent(percpu=True, interval=1)
    cpu_temp = None
    
    # Get CPU temperature (this might not be supported on all systems)
    if hasattr(psutil, "sensors_temperatures"):
        temps = psutil.sensors_temperatures()
        if 'coretemp' in temps:  # 'coretemp' is commonly used on Intel CPUs
            cpu_temp = temps['coretemp'][0].current

    return jsonify({
        'cpu_per_core': cpu_percent_per_core,
        'cpu_temp': cpu_temp
    })

# Main route to serve the HTML page
@app.route('/')
def dashboard():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)
