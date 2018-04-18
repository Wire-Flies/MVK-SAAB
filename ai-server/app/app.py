from flask import Flask, request
import numpy as np
from keras.models import load_model
import json
from sklearn.metrics import mean_squared_error
import sys

app = Flask(__name__)

autoencoder = load_model('./models/model6.h5')

avgs = [55.0508738124329,
        12.477793190734,
        12534.366649766861,
        175.1113875125417309,
        242.8279644653325668,
        45.0933818074002,
        12.5955883176537,
        44.7382849382711,
        11.2354800043253]
        
stds = [3.66620172009337,
        8.30491904704385,
        13654.92933906,
        102.559905803384,
        152.310135458926,
        19.207335145831,
        24.4142390604775,
        20.026868171039,
        22.8483284459873]

def scale(a):
    b = []
    for i, x in enumerate(a):
        b.append((x - avgs[i]) / stds[i])
    return b

#from app import routes
@app.route('/')
def index():
    return "hello, server!"

@app.route('/classify', methods = ['POST'])
def classify():
    data = request.get_json()
    print("Classifying...")
    print(json.dumps(data))
    position = data["positions"][0]
    unscaled_data = [position["latitude"],position["longitude"],position["altitude"],position["heading"],position["speed"],data["lat_from"],data["long_from"],data["lat_to"],data["long_to"]]
    flight_data = np.array([scale(unscaled_data)])
    value = mean_squared_error(flight_data, autoencoder.predict(flight_data))
    result = {}
    result["value"] = value #Return the number of the classification
    return json.dumps(result)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(sys.argv[1]))
