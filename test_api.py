import urllib.request
import json
import time

print('Testing API endpoint for leak confidence...')

for i in range(5):
    response = urllib.request.urlopen('http://localhost:8000/api/status')
    data = json.loads(response.read())

    # Check if ML metrics are available for leak confidence calculation
    if 'accuracy' in data and 'precision' in data and 'recall' in data:
        confidence = (data['accuracy'] + data['precision'] + data['recall']) * 100 / 3
        print(f'Poll {i+1}: Freq={data["spectral_freq"]:.1f}Hz, RMS={data["rms_power"]:.2f}, Kurtosis={data["kurtosis"]:.2f}')
        print(f'         ML Metrics: Acc={data["accuracy"]:.3f}, Prec={data["precision"]:.3f}, Rec={data["recall"]:.3f}')
        print(f'         Leak Confidence: {confidence:.1f}% ({ "🔴HIGH" if confidence > 80 else "🟢LOW" })')
    else:
        print(f'Poll {i+1}: Freq={data["spectral_freq"]:.1f}Hz, RMS={data["rms_power"]:.2f}, Kurtosis={data["kurtosis"]:.2f}')
        print(f'         ⚠️  ML Metrics not found in response')

    time.sleep(1)

print('Test completed!')

# Test clear leaks endpoint
print('\nTesting clear leaks...')
try:
    req = urllib.request.Request('http://localhost:8000/api/scenarios/clear-leaks', method='POST')
    response = urllib.request.urlopen(req)
    result = json.loads(response.read())
    print(f'Clear leaks result: {result}')
except Exception as e:
    print(f'Clear leaks error: {e}')
