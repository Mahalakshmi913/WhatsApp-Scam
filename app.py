from flask import Flask, render_template, request, redirect, url_for, jsonify, session
from flask_pymongo import PyMongo
from bson.objectid import ObjectId
from datetime import datetime
import os
from bson.json_util import dumps 
from bson.son import SON


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
    return render_template('homePage.html')

@app.route('/report')
def report():
    return render_template('report.html')


# New collection to store info about the reports
reports_collection = mongo.db.reports  # New collection

@app.route('/api/report', methods=['POST'])
def submit_report():
    phone = request.form.get('phone')
    scam_type = request.form.get('scamType')
    other_scam_type = request.form.get('otherScamType')
    description = request.form.get('description')
    date_of_incident = request.form.get('date')
    location = request.form.get('location')
    contact = request.form.get('contact')

    # Choose final scam type
    scam_type_final = other_scam_type if scam_type == "Others" else scam_type

    # Handle evidence file upload
    evidence_file = request.files.get('evidence')
    file_name = None
    if evidence_file:
        file_name = evidence_file.filename
        upload_path = os.path.join("static/uploads", file_name)
        evidence_file.save(upload_path)

    # Step 1: Insert the report
    report = {
        "phone": phone,
        "scam_type": scam_type_final,
        "description": description,
        "date_of_incident": date_of_incident,
        "location": location,
        "contact": contact,
        "evidence_file": file_name,
        "submitted_at": datetime.utcnow()
    }

    reports_collection.insert_one(report)

    # Step 2: Calculate how many times this phone is reported
    report_count = reports_collection.count_documents({"phone": phone})

    # Step 3: Assign risk level based on count
    if report_count >= 3:
        risk_level = "High"
    elif report_count == 2:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    # Step 4: Update ALL reports for this phone with risk_level
    reports_collection.update_many(
        {"phone": phone},
        {"$set": {"risk_level": risk_level}}
    )

    return jsonify({"status": "success", "message": "Report submitted successfully!"})

#To check if the number is spoofed 
@app.route('/api/check_number', methods=['GET'])
def check_number():
    phone = request.args.get('phone')
    if not phone:
        return jsonify({"status": "error", "message": "No phone number provided"}), 400

    report_count = reports_collection.count_documents({"phone": phone})

    if report_count > 0:
        # Optionally fetch one example report to show details
        example_report = reports_collection.find_one({"phone": phone})
        return jsonify({
            "status": "reported",
            "message": f"⚠️ This number has been reported {report_count} time(s).",
            "count": report_count,
            "report": {
                "scam_type": example_report["scam_type"],
                "description": example_report["description"],
                "date": example_report["date_of_incident"],
                "location": example_report["location"]
            }
        })
    else:
        return jsonify({"status": "clean", "message": "✅ This number has not been reported."})

#Latest reports API
@app.route('/api/latest_reports', methods=['GET'])
def latest_reports():
    try:
        all_reports = list(reports_collection.find().sort("submitted_at", -1))

        seen_phones = set()
        unique_reports = []

        for report in all_reports:
            phone = report.get("phone")
            if phone not in seen_phones:
                seen_phones.add(phone)

                report_count = reports_collection.count_documents({"phone": phone})

                # Updated risk logic: 1 = Low, 2 = Medium, ≥3 = High
                if report_count >= 3:
                    risk_level = "🔴 High"
                elif report_count == 2:
                    risk_level = "🟠 Medium"
                else:
                    risk_level = "🟢 Low"

                unique_reports.append({
                    "phone": phone,
                    "scam_type": report.get("scam_type", "N/A"),
                    "date": report.get("date_of_incident", "N/A"),
                    "report_count": report_count,
                    "risk": risk_level
                })

            if len(unique_reports) == 10:
                break

        return jsonify(unique_reports), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

#Scam statistics API
from collections import defaultdict

#Pie chart data for scam statistics
@app.route('/api/scam_statistics', methods=['GET'])
def scam_statistics():
    try:
        pipeline = [
            {"$group": {"_id": "$scam_type", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        scam_data = list(reports_collection.aggregate(pipeline))

        labels = [item["_id"] for item in scam_data]
        counts = [item["count"] for item in scam_data]

        return jsonify({"labels": labels, "counts": counts})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# New collection for Contact Messages
contact_collection = mongo.db.ContactMessages

@app.route('/contact', methods=['POST'])
def contact():
    data = request.get_json()
    email = data.get('email')
    message = data.get('message')

    if not email or not message:
        return jsonify({'status': 'error', 'message': 'Both email and message are required.'}), 400

    contact_collection.insert_one({
        'email': email,
        'message': message,
        'timestamp': datetime.datetime.utcnow()
    })

    return jsonify({'status': 'success', 'message': 'Message sent successfully.'}), 200


# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True)
