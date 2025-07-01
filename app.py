from flask import Flask, render_template, request, redirect, url_for, jsonify, session
from flask_pymongo import PyMongo
from bson.objectid import ObjectId

app = Flask(__name__)
app.secret_key = "secret-key"  # Needed for session management

# Local MongoDB
app.config["MONGO_URI"] = "mongodb://localhost:27017/WhatsApp_Scam_Reports"
mongo = PyMongo(app)

# Reference to collection
users_collection = mongo.db.Users

# Route to render login page
@app.route('/')
def home():
    return render_template('landing.html')

@app.route('/landing')
def landing():
    return render_template('landing.html')

# Login API route
@app.route('/login')
def login_page():
    return render_template('login.html')

@app.route('/api/login', methods=['POST'])
def login():
    username = request.form.get('username')
    password = request.form.get('password')
    
    print("Submitted:", username, password)
    for doc in users_collection.find():
        print(doc)  # Debug: See what's in the collection


    user = users_collection.find_one({"username": username, "password": password})
    
    if user:
        session['username'] = username
        return jsonify({"status": "success", "message": "Login successful"})
    else:
        return jsonify({"status": "error", "message": "Invalid credentials"}), 401

@app.route('/signup')
def signup():
    return render_template('signup.html')

# API route to handle signup form
@app.route('/api/signup', methods=['POST'])
def signup_api():
    name = request.form.get('name')
    username = request.form.get('username')
    password = request.form.get('password')
    phone = request.form.get('phone')
    email = request.form.get('email')

    if users_collection.find_one({'username': username}):
        return jsonify({"status": "error", "message": "Username already exists"}), 409

    user = {
        "name": name,
        "username": username,
        "password": password,
        "phone": phone,
        "email": email
    }

    users_collection.insert_one(user)
    return jsonify({"status": "success", "message": "User registered successfully!"})

@app.route('/report-anonymous')
def report_anonymous():
    return "<h2>Anonymous Report Page (Coming Soon)</h2>"

@app.route('/homePage')
def dashboard():
    if 'username' in session:
        return f"<h2>Welcome, {session['username']}! You are logged in.</h2>"
    else:
        return redirect('/login')
    
# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True)
