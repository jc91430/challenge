import urllib2
import json
import MySQLdb
import os
import numpy as np
from flask import Flask, render_template, request, session

app = Flask(__name__)
app.secret_key = "aewgfo2P@${<:<ne(ZX(C&(#@@#)*SAD"

# Opens a connection to the database
db = MySQLdb.connect("localhost", "jeffAdmin", "project", "challenge")
ALLOWED_EXTENSIONS = set(['png', 'jpg', 'jpeg', 'gif'])
app.config['UPLOAD_FOLDER'] = './project/static/uploads'





#####################
# Routing functions #
#####################

# Renders the index page
@app.route('/')
def index():
    return render_template('index.html')

# Renders the error page when users try to log in but are not in the database
@app.route('/notfound')
def notfound():
    return render_template('notfound.html')

# Renders the profile page
@app.route('/profile')
def profile():
    return render_template('profile.html')

# Renders the main page displaying the network
@app.route('/main')
def main():
    return render_template('main.html')

# GET:  Renders the signin page
# POST: Authenticates the user on the server and returns an redirect URL
@app.route('/signin', methods=['GET', 'POST'])
def signin():
    if request.method == 'POST':
        data = None
        try:
            data = json.loads(urllib2.urlopen("https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=" + request.form['idtoken']).read())
        except urllib2.URLError, e:
            print "Error with authentication: ", e
            print "Received: " + idtoken

        if data != None:
            result = {}
            id = check_user(data)
            if id == 0:             # First use, redirect to profile page
                initialize_user(data)
                session['data'] = data
                return "/profile"
            elif id == -1:          # User not found or JSON badly formatted
                return "/notfound"
            else:                   # Returning user, redirect to main page
                session['data'] = data
                return "/main"
        else:
            print "signin(): User verification failed"
            return "/"
    else:
        return render_template('signin.html')

@app.route('/checksignin', methods=['POST'])
def checksignin():
    try:
        session['data']
        return "OK"
    except:
        print "checksignin(): User not logged in"
        return "Error"

@app.route('/signout', methods=['POST'])
def signout():
    try:
        session.pop('data', None)
        return "OK"
    except:
        print "signout(): Signout failed"
        return "Error"

# Loads the user's profile by fetching data from the database
@app.route('/loadProfile', methods=['POST'])
def loadProfile():
    try:
        data = session['data']
        if check_user(data) > 0:
            db_data = get_user(data)
            filename = 'none'
            if db_data['imgType'] in ALLOWED_EXTENSIONS:
                filename = str(db_data['id']) + "." + db_data['imgType']
            response = {"name":            data['name'],         \
                        "email":           data['email'],        \
                        "aboutMsg":        db_data['about'],     \
                        "project":         db_data['project'],   \
                        "fundraisingLink": db_data['fundraise'], \
                        "imgName":         filename}
            return json.dumps(response)
    except:
        print "loadProfile(): User verification failed or user not found"
        return "Error"

# Saves the user's profile information to the database
# Deletes the old profile image before saving a new one if appropriate
@app.route('/saveProfile', methods=['POST'])
def saveProfile():
    try:
        data = session['data']
        if check_user(data) > 0:
            db_data = get_user(data)
            imgType = db_data['imgType']

            if request.files:
                if imgType != 'none':
                    os.remove(os.path.join(app.config['UPLOAD_FOLDER'], str(db_data['id']) + "." + imgType))
                imgType = request.form['imgType']
                request.files['file'].save(os.path.join(app.config['UPLOAD_FOLDER'], str(db_data['id']) + "." + imgType))

            update_user(data, request.form['aboutMsg'], request.form['project'], request.form['fundraisingLink'], imgType)
            return "/main"
    except:
        print "saveProfile(): User verification failed or user not found"
        return "/"

# Adds a user to the database
# Required fields are the new user's first name, last name, and email
@app.route('/addUser', methods=['POST'])
def addUser():
    try:
        id = check_user(session['data'])
        if id > 0 and '' not in request.form.values():
            with db:
                cursor = db.cursor()
                cmd = "INSERT INTO Users (first_name, last_name, email, status, parent_id) VALUES(%s, %s, %s, %s, %s)"
                cursor.execute(cmd, (request.form['first_name'], request.form['last_name'], request.form['email'], "pending", id))
            return "OK"
        else:
            print "addUser(): User already added or not enough fields"
    except:
        print "addUser(): User verification failed"
        return "Error"

# Returns the id of the user corresponding to the received idtoken
@app.route('/setDefaultViewing', methods=['POST'])
def setDefaultViewing():
    try:
        return str(check_user(session['data']))
    except:
        return "-1"

# Returns user info for the currently viewed user and all their children
# Fields returned are id, first name, last name, status, and profile img type
@app.route('/childView', methods=['POST'])
def childView():
    try:
        if check_user(session['data']) > 0:
            with db:
                cursor = db.cursor()
                currentlyViewing = str(request.form['currentlyViewing'])

                cmd = "SELECT id, first_name, last_name, status, imgType FROM Users WHERE id=%s"
                cursor.execute(cmd, [currentlyViewing])
                user_raw = cursor.fetchall()[0]
                user = process_concise(user_raw)

                cursor.close()
                cursor = db.cursor()
                cmd = "SELECT id, first_name, last_name, status, imgType FROM Users WHERE parent_id=%s AND id!=%s"
                cursor.execute(cmd, (currentlyViewing, currentlyViewing))
                child_data = cursor.fetchall()
                children = []
                edges = []
                for i, child in enumerate(child_data):
                    children.append(process_concise(child))

                    if (i % 3 == 2):
                        new_edge = {"source": i-2, "target": i-1}
                        edges.append(new_edge)
                        new_edge = {"source": i-2, "target": i}
                        edges.append(new_edge)
                        new_edge = {"source": i-1, "target": i}
                        edges.append(new_edge)

                user_and_children = {"user": [user],
                                     "children": children,
                                     "edges": edges}

                return json.dumps(user_and_children)
        else:
            return "User not found"
    except Exception as e:
        print "Error in childView()"
        print e
        return "Error"

# Returns the full profile of the currently viewed user
@app.route('/profileView', methods=['POST'])
def profileView():
    try:
        if check_user(session['data']) > 0:
            with db:
                cursor = db.cursor()
                cmd = "SELECT * FROM Users WHERE id=%s"
                cursor.execute(cmd, [str(request.form['currentlyViewing'])])
                raw_data = cursor.fetchall()[0]

                result = {}
                result["id"]        = raw_data[0]
                result["name"]      = raw_data[1] + " " + raw_data[2]
                result["email"]     = raw_data[3]
                result["status"]    = raw_data[4]
                result["about"]     = raw_data[5]
                result["project"]   = raw_data[6]
                result["fundraise"] = raw_data[7]
                result["parent"]    = raw_data[8]
                result["imgType"]   = raw_data[9]

                return json.dumps(result)
        else:
            return "User not found"
    except Exception as e:
        print "Error in profileView()"
        print e
        return "Error"

# Returns user info for the parent and siblings of the currently viewed user
# Fields returned are id, first name, last name, status, and profile img type
@app.route('/parentView', methods=['POST'])
def parentView():
    try:
        if check_user(session['data']) > 0:
            with db:
                cursor = db.cursor()
                cmd = "SELECT parent_id FROM Users WHERE id=%s"
                user_id = str(request.form['currentlyViewing'])
                cursor.execute(cmd, [user_id])
                parent_id = str(cursor.fetchall()[0][0])

                # Add parent as index 0 tuple in the list
                cursor.close()
                cursor = db.cursor()
                cmd = "SELECT id, first_name, last_name, status, imgType FROM Users WHERE id=%s"
                cursor.execute(cmd, [parent_id])
                parent_raw = cursor.fetchall()[0]
                parent_and_sibs = []
                parent_and_sibs.append(process_concise(parent_raw))

                # Add self as index 1 tuple in the list
                cursor.close()
                cursor = db.cursor()
                cursor.execute(cmd, [user_id])
                user_raw = cursor.fetchall()[0]
                parent_and_sibs.append(process_concise(user_raw))

                # Add siblings in the list
                cursor.close()
                cursor = db.cursor()
                cmd = "SELECT id, first_name, last_name, status, imgType FROM Users WHERE parent_id=%s AND id!=%s AND id!=1"
                cursor.execute(cmd, (parent_id, user_id))
                for row in cursor.fetchall():
                    parent_and_sibs.append(process_concise(row))

                return json.dumps(parent_and_sibs)
    except Exception as e:
        print "Error in parentView()"
        print e
        return "Error"





####################
# Helper functions #
####################

# Takes raw data in a tuple and returns a properly labelled dict
def process_concise(raw_data):
    result = {}
    if len(raw_data) == 5:
        result["id"]        = raw_data[0]
        result["name"]      = raw_data[1] + " " + raw_data[2]
        result["status"]    = raw_data[3]
        result["imgType"]   = raw_data[4]
    return result

# Checks the user's first name, last name, and email against database
# Returns -1 if user is not found or JSON is incorrectly formatted
# Returns 0 if user is found with a status that is not "accepted"
# Else returns the user's unique ID
# With multiple matches, returns only the first user's unique ID
def check_user(data):
    if data["email"]:
        with db:
            cursor = db.cursor()
            cmd = "SELECT id, status FROM Users WHERE email=%s"
            cursor.execute(cmd, [data['email']])
            if cursor.rowcount > 0:
                result = cursor.fetchall()[0]
                if result[1] == 'accepted':
                    return int(result[0])
                else:
                    return 0
            else:
                print "check_user(): User not found"
                return -1
    else:
        print "check_user(): No email field in JSON"
        return -1

# Initializes the given user by setting his/her status to "accepted"
# Assumes the given user exists in the database via a prior call to check_user()
def initialize_user(data):
    with db:
        cursor = db.cursor()
        cmd = "SELECT * FROM Users WHERE email=%s"
        cursor.execute(cmd, [data['email']])
        id = cursor.fetchall()[0][0]
        cursor.close()
        cursor = db.cursor()
        cmd = "UPDATE Users SET first_name=%s, last_name=%s, status='accepted' WHERE id='" + str(id) + "'"
        cursor.execute(cmd, (data['given_name'], data['family_name']))
        return id

# Updates an existing row in the database
# Returns 0 upon success
# Returns -1 if user is not in the database or JSON data is badly formatted
def update_user(data, about, project, fundraise, imgType):
    id = check_user(data)
    if id > 0:
        with db:
            cursor = db.cursor()
            cmd = "UPDATE Users SET about=%s, project=%s, fundraise=%s, imgType=%s WHERE id=%s"
            cursor.execute(cmd, (about, project, fundraise, imgType, id))
        return 0
    else:
        print "ERROR IN push_user(): User not found or JSON incorrectly formatted"
        return -1

# Looks up the user in the database based on given data, and returns additional user's info
# Returns None if user is not found, has not logged in at least once, or JSON incorrectly formatted
def get_user(data):
    id = check_user(data)
    if id == 0 or id == -1:
        return None
    else:
        response = {}
        with db:
            cursor = db.cursor()
            cmd = "SELECT * FROM Users WHERE id=%s"
            cursor.execute(cmd, [str(id)])
            user = cursor.fetchall()[0]
            response["id"]        = id
            response["about"]     = user[5]
            response["project"]   = user[6]
            response["fundraise"] = user[7]
            response["imgType"]   = user[9]
        return response

if __name__ == '__main__':
    app.run(debug=True, threaded=True)
    # app.run(debug=True)