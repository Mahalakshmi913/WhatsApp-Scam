from flask import Flask, render_template, request, redirect, url_for, jsonify, session
from flask_pymongo import PyMongo
from bson.objectid import ObjectId
from datetime import datetime
import os
from bson.json_util import dumps 
from bson.son import SON
from collections import Counter
from bson import ObjectId
from bson.json_util import dumps
from flask import Response




app = Flask(__name__)
app.secret_key = "secret-key"  # Needed for session management

# Local MongoDB
app.config["MONGO_URI"] = "mongodb://localhost:27017/WhatsApp_Scam_Reports"
app.config['MAX_CONTENT_LENGTH'] = 2 * 1024 * 1024
mongo = PyMongo(app)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf', 'mp4', 'mov'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

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

    # Debug print (optional)
    print("Submitted:", username, password)
    for doc in users_collection.find():
        print(doc)  # Debug: See what's in the collection

    user = users_collection.find_one({"username": username, "password": password})

    if user:
        session['username'] = username
        role = user.get("role", "user")  # default role 'user' if not set
        return jsonify({
            "status": "success",
            "message": "Login successful",
            "role": role
        })
    else:
        return jsonify({"status": "error", "message": "Invalid credentials"}), 401

@app.route('/adminDashboard')
def admin_dashboard():
    return render_template('adminDashboard.html')

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

    # Handle evidence file upload once
    evidence_file = request.files.get('evidence')
    file_name = None
    if evidence_file and allowed_file(evidence_file.filename):
        file_name = evidence_file.filename
        upload_dir = os.path.join("static", "uploads")
        os.makedirs(upload_dir, exist_ok=True)
        upload_path = os.path.join(upload_dir, file_name)
        evidence_file.save(upload_path)
    elif evidence_file:
        return jsonify({"status": "error", "message": "Invalid file type"}), 400
    
    # Insert the report into MongoDB
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

    # Count total reports for the same phone number
    report_count = reports_collection.count_documents({"phone": phone})

    # Determine risk level
    if report_count >= 3:
        risk_level = "High"
    elif report_count == 2:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    # Update all reports for the same phone number with the risk level
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

# Contact Us API
contact_collection = mongo.db.contact_us

@app.route('/api/contact', methods=['POST'])
def contact_us():
    try:
        email = request.form.get('email')
        message = request.form.get('message')
        submitted_at = datetime.utcnow()

        if not email or not message:
            return jsonify({"status": "error", "message": "All fields are required"}), 400

        contact_doc = {
            "email": email,
            "message": message,
            "submitted_at": submitted_at
        }

        contact_collection.insert_one(contact_doc)

        return jsonify({"status": "success", "message": "Thank you for contacting us!"})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# Admin dashboard connection
@app.route('/admin/overview-data', methods=['GET'])
def admin_overview_data():
    # Total number of reports
    total_reports = mongo.db.reports.count_documents({})

    # Total users = all users who are NOT admin (i.e., no 'role' or role != 'admin')
    total_users = mongo.db.Users.count_documents({
        "$or": [
            {"role": {"$ne": "admin"}},
            {"role": {"$exists": False}}
        ]
    })

    # Active reports (based on 'status' field or no status)
    active_reports = mongo.db.reports.count_documents({
        "$or": [
            {"status": {"$in": ["active", "pending"]}},
            {"status": {"$exists": False}}
        ]
    })

    return jsonify({
        "total_reports": total_reports,
        "total_users": total_users,
        "active_reports": active_reports
    })


@app.route('/admin/chart-data')
def admin_chart_data():
    # Reports trend (count by date)
    reports = mongo.db.reports.find({}, {"submitted_at": 1})
    date_counts = {}
    for r in reports:
        dt = r.get('submitted_at')
        if isinstance(dt, str):
            dt = datetime.strptime(dt[:10], "%Y-%m-%d")
        date_str = dt.strftime('%b %d')
        date_counts[date_str] = date_counts.get(date_str, 0) + 1

    sorted_dates = sorted(date_counts.items(), key=lambda x: datetime.strptime(x[0], "%b %d"))
    trend_labels = [d[0] for d in sorted_dates]
    trend_values = [d[1] for d in sorted_dates]

    # Scam type distribution
    scam_types = mongo.db.reports.distinct("scam_type")
    type_counter = Counter()
    for scam in mongo.db.reports.find({}, {"scam_type": 1}):
        type_counter[scam.get("scam_type", "Others")] += 1

    type_labels = list(type_counter.keys())
    type_values = list(type_counter.values())

    return jsonify({
        "trend": {
            "labels": trend_labels,
            "values": trend_values
        },
        "types": {
            "labels": type_labels,
            "values": type_values
        }
    })

@app.route('/admin/users')
def get_all_users():
    users = users_collection.find({
        "$or": [
            {"role": {"$exists": False}},
            {"role": {"$ne": "admin"}}
        ]
    })

    user_list = []
    for user in users:
        user_list.append({
            "_id": str(user.get('_id')),  # Match JS usage of user._id
            "name": user.get('name', 'N/A'),
            "email": user.get('email', 'N/A')
        })

    return jsonify(user_list)


@app.route('/admin/users/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    result = users_collection.delete_one({'_id': ObjectId(user_id)})
    if result.deleted_count:
        return jsonify({'message': 'User deleted'})
    return jsonify({'message': 'User not found'}), 404


@app.route('/admin/users/<user_id>', methods=['GET'])
def get_user(user_id):
    user = users_collection.find_one({'_id': ObjectId(user_id)})
    if user:
        return jsonify({
            "_id": str(user.get('_id')),
            "name": user.get('name', 'N/A'),
            "email": user.get('email', 'N/A')
        })
    return jsonify({'message': 'User not found'}), 404

@app.route('/admin/reports-data')
def get_reports_data():
    reports = mongo.db.reports.find()
    formatted = []

    for report in reports:
        evidence_file = report.get("evidence_file", "")
        evidence_url = f"/static/uploads/{evidence_file}" if evidence_file else ""

        formatted.append({
            "id": str(report.get('_id', '')),
            "phone": report.get("phone", "N/A"),
            "scam_type": report.get("scam_type", "N/A"),
            "description": report.get("description", "N/A"),
            "date": report.get("date_of_incident", "N/A"),
            "location": report.get("location", "N/A"),
            "contact": report.get("contact", "N/A"),
            "evidence_url": evidence_url
        })

    return jsonify(formatted)

@app.route('/admin/delete-report/<report_id>', methods=['DELETE'])
def delete_report(report_id):
    result = reports_collection.delete_one({'_id': ObjectId(report_id)})
    if result.deleted_count == 1:
        return jsonify({'message': 'Deleted successfully'}), 200
    else:
        return jsonify({'message': 'Report not found'}), 404
    
@app.route('/admin/feedback-data')
def get_feedback_data():
    feedbacks = mongo.db.contact_us.find().sort("submitted_at", -1)  # latest first
    formatted = []

    for fb in feedbacks:
        formatted.append({
            "id": str(fb.get('_id')),
            "email": fb.get('email', 'N/A'),
            "message": fb.get('message', 'N/A'),
            "submitted_at": fb.get('submitted_at').strftime("%Y-%m-%d %H:%M:%S") if fb.get('submitted_at') else 'N/A'
        })

    return jsonify(formatted)

# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True)
