import json
import os

import requests
from bs4 import BeautifulSoup
from flask import Flask, redirect, render_template, request, session
from googletrans import Translator

from google.oauth2 import id_token
from google.auth.transport import requests


app = Flask(__name__)
app.secret_key = b'445c1e98c90420acbf41320ff5f89674f75f18d345fd25fc267bb03afb40c136'



class Ticket:
    Translator = Translator(['translate.google.com'])
    def __init__(self, id, image, question, answers, desc, correct_answer, lazy_load=False):
        self.id = id
        self.image = image
        self.question = question
        if lazy_load:
            self.answers = answers
            self.description = desc
        else:
            self.answers = json.loads(answers)
            soup = BeautifulSoup(desc, 'html.parser')
            self.description = self.Translator.translate(soup.find_all('p')[1].text, dest='ru', src='ka').text
        self.correct = correct_answer

    @property
    def dump(self):
        return {
            "id": self.id,
            "image": self.image,
            "question": self.question,
            "answers": self.answers,
            "desc": self.description,
            "correct_answer": self.correct,
        }

def get_tickets(force=False):
    if os.path.exists("tickets.json") and not force:
        tickets = [
            Ticket(
                id=ticket["id"],
                image=ticket["image"],
                question=ticket["question"],
                answers=ticket["answers"],
                desc=ticket["desc"],
                correct_answer=ticket["correct_answer"],
                lazy_load=True
            )
            for ticket in json.load(open("tickets.json"))
            if "id" in ticket
        ]
    else:
        response = requests.post(
            url="https://teoria.on.ge/tickets",
            data={
                "cat_id":2,
                "limit":30,
                "topics":"all",
                "all_questions":False,
                "log_token":""
            },
            headers={
                "cookie": "exam-settings=%7B%22category%22%3A2%2C%22locale%22%3A%22ru%22%2C%22skin%22%3A%22light%22%2C%22user%22%3A0%2C%22created%22%3A1678273760%2C%22questions%22%3A30%2C%22challenge%22%3Atrue%2C%22all_questions%22%3Afalse%2C%22topics%22%3A%5B%221%22%2C%222%22%2C%223%22%2C%224%22%2C%225%22%2C%226%22%2C%227%22%2C%228%22%2C%229%22%2C%2210%22%2C%2211%22%2C%2212%22%2C%2213%22%2C%2214%22%2C%2215%22%2C%2216%22%2C%2217%22%2C%2218%22%2C%2219%22%2C%2220%22%2C%2221%22%2C%2222%22%2C%2223%22%2C%2224%22%2C%2225%22%2C%2226%22%2C%2227%22%2C%2228%22%2C%2229%22%2C%2230%22%2C%2231%22%2C%2232%22%5D%2C%22autoShowCorrect%22%3Atrue%2C%22autoNextStep%22%3Afalse%7D"
            }
        )
        tickets = [
            Ticket(
                id=ticket["id"],
                image=ticket["image"],
                question=ticket["question"],
                answers=ticket["answers"],
                desc=ticket["desc"],
                correct_answer=ticket["correct_answer"]
            )
            for ticket in response.json()
            if "id" in ticket
        ]
        json.dump([ticket.dump for ticket in tickets], open("tickets.json", "w"))
    return tickets

# @app.after_request
# def add_header(response):
#     response.headers['X-Frame-Options'] = 'SAMEORIGIN'
#     response.headers['Content-Security-Policy'] = "default-src 'self'; style-src 'self' 'unsafe-inline';"
#     response.headers['Cross-Origin-Opener-Policy'] = "same-origin-allow-popups"
#     response.headers['Content-Security-Policy-Report-Only'] = "script-src https://accounts.google.com/gsi/client; frame-src https://accounts.google.com/gsi/; connect-src https://accounts.google.com/gsi/;"
#     return response

@app.route("/")
def index():
    if not session.get("user"):
        return render_template('login.html')
    tickets = get_tickets()
    return render_template('index.html', tickets=enumerate(tickets), allnum=len(tickets))

@app.route("/login", methods=["POST"])
def login():
    token = request.form.get("idtoken")
    try:
        CLIENT_ID = "703660434308-94po6fdl0t8hc54dmb416vktufkp2qi7.apps.googleusercontent.com"
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), CLIENT_ID)
        session['user'] = idinfo['sub']
    except ValueError:
        # Invalid token
        pass
    print(request.form)
    return redirect("/")

@app.route("/update")
def update():
    if not session.get("user"):
        return render_template('login.html')
    get_tickets(force=True)
    return redirect("/")


@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect("/")

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))
