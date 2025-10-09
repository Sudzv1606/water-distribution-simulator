import urllib.request
import json
import time

print('Testing API endpoint for fluctuating values...')

for i in range(5):
    response = urllib.request.urlopen('http://localhost:8000/api/status')
    data = json.loads(response.read())
    print(f'Poll {i+1}: Freq={data["spectral_freq"]:.1f}Hz, RMS={data["rms_power"]:.2f}, Kurtosis={data["kurtosis"]:.2f}')
    time.sleep(1)

print('Test completed!')
