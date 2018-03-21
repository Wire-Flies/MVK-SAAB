from flask import Flask, request
import json

app = Flask(__name__)

#from app import routes
@app.route('/')
def index():
    return "hello, server!"

@app.route('/classify', methods = ['POST'])
def classify():
    print("Request json")
    print(request.json)
    data = request.json

    result = {}
    result["value"] = 0.4 #Return the number of the classification
    return json.dumps(result) 

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
