from flask import Flask, request
import json

app = Flask(__name__)

#from app import routes
@app.route('/')
def index():
    return "hello, server!"

@app.route('/classify', methods = ['POST'])
def classify():
    data = request.data
    print(request.json)
    data = request.json

    print(data["hello"])
    result = {}
    result["value"] = 0.4 #Return the number of the classification
    return json.dumps(result) 

if __name__ == "__main__":
    app.run(host="localhost", port=8000)