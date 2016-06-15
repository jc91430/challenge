from flask import Flask, render_template, request
import urllib2
import json
from person import Person
from network import Network

app = Flask(__name__)

# Renders the index page
@app.route('/')
def index():
    return render_template('index.html')

# Renders the about page
@app.route('/about')
def about():
    return render_template('about.html')

# Renders the FAQ page
@app.route('/faq')
def faq():
    return render_template('faq.html')

# Renders the Contact page
@app.route('/contact')
def contact():
    return render_template('contact.html')

# Renders the signin page and verifies the user on the server
@app.route('/signin', methods=['GET', 'POST'])
def signin():
    if request.method == 'POST':
        data = verify(request.form['idtoken'])
        if data is not None:
            user = Person(data, "ACCEPTED", "Hello everyone", "n/a")
            print data
            #use user data
    return render_template('signin.html')

# Renders the main page displaying the network
@app.route('/main')
def main():
    return render_template('main.html')

# Verifies the idtoken using Google's tokeninfo endpoint
# Returns fetched user data as a dict if successful
def verify(idtoken):
    response = urllib2.urlopen("https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=" + idtoken)
    if response.getcode() == 200:
        return json.loads(response.read())
    else:
        print "ERROR: Invalid id token"
        return None

if __name__ == '__main__':
    app.run(debug=True, threaded=True)
