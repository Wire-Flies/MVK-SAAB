from flask import Flask, request
import numpy as np
from keras.models import load_model
import json

app = Flask(__name__)

autoencoder = load_model('./models/model6.h5')

#from app import routes
@app.route('/')
def index():
    return "hello, server!"

@app.route('/classify', methods = ['POST'])
def classify():
    print("Request json")
    print(request.json)
    data = request.json
    position = data["position"][0]
    flight_data = np.array([position["latitude"],position["longitude"],position["altitude"],position["heading"],position["speed"],data["lat_from"],data["long_from"],data["lat_to"],data["long_to"]])
    value = mean_squared_error(flight_data, autoencoder.predict(flight_data))
    result = {}
    result["value"] = value #Return the number of the classification
    return json.dumps(result)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)



