import functools
import json
import os

import psycopg2
import requests as req
from bs4 import BeautifulSoup
from flask import (Flask, jsonify, redirect, render_template, request,
                   send_from_directory, session)
from google.auth.transport import requests
from google.oauth2 import id_token
from googletrans import Translator

app = Flask(__name__)
app.secret_key = os.environ.get("DATABASE_URL").encode()

translator = Translator(['translate.google.com'])

class Ticket:
    def __init__(self, id, image, question, answers, desc, correct_answer, **kwargs):
        self.id = id
        self.image = image
        self.question = question
        self.answers = json.loads(answers)
        text = BeautifulSoup(desc, 'html.parser').find_all('p')[1].text
        self.description = text
        self.correct = correct_answer
        self.options = kwargs

    @property
    def dump(self):
        return {
            "id": self.id,
            "image": self.image,
            "question": self.question,
            "answers": self.answers,
            "desc": self.description,
            "correct_answer": self.correct,
            "options": self.options,
        }

def get_tickets():
    response = req.post(
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
            correct_answer=ticket["correct_answer"],
            cutoff=ticket["cutoff"],
            topic=ticket["topic"],
            coefficient=ticket["coeficient"],
        )
        for ticket in response.json()
        if "id" in ticket
    ]
    return tickets


def login_required(view):
    @functools.wraps(view)
    def wrapped_view(**kwargs):
        if not session.get('user') and not app.debug:
            return render_template('login.html')
        return view(**kwargs)
    return wrapped_view

@app.route("/")
@login_required
def index():
    return render_template('index.html', str=str, int=int)

@app.route("/privacy")
def privacy():
    return render_template('privacy.html')


@app.route('/.well-known/<path:path>')
def send_report(path):
    return send_from_directory('.well-known', path)

@app.route("/stats", methods=["GET"])
@login_required
def obtain_stats():
    with psycopg2.connect(os.environ.get("DATABASE_URL")) as postgres:
        with postgres.cursor() as cursor:
            cursor.execute(
                f"""
                SELECT * FROM public.stats
                WHERE email='{session.get('user', 'twicebyte@gmail.com')}'
                """
            )
            res = cursor.fetchone()
            session['stats-started'] = res[1]
            session['stats-completed'] = res[2]
            session['stats-perfect'] = res[3]
            session['stats-questions'] = res[4]
            session['stats-correct'] = res[5]

    return jsonify({
        "started": session['stats-started'],
        "completed": session['stats-completed'],
        "perfect": session['stats-perfect'],
        "questions": session['stats-questions'],
        "correct": session['stats-correct']
    })

@app.route("/stats", methods=["POST"])
@login_required
def stats():
    session['stats-started'] = request.json['started']
    session['stats-completed'] = request.json['completed']
    session['stats-perfect'] = request.json['perfect']
    session['stats-questions'] = request.json['questions']
    session['stats-correct'] = request.json['correct']

    with psycopg2.connect(os.environ.get("DATABASE_URL")) as postgres:
        with postgres.cursor() as cursor:
            cursor.execute(
                f"""
                UPDATE public.stats
                SET
                    started={session.get('stats-started', 0)},
                    completed={session.get('stats-completed', 0)},
                    perfect={session.get('stats-perfect', 0)},
                    questions={session.get('stats-questions', 0)},
                    correct={session.get('stats-correct', 0)}
                WHERE email='{session.get('user', 'twicebyte@gmail.com')}'
                """
            )
            postgres.commit()
    return jsonify({})


@app.route("/login", methods=["POST"])
def login():
    token = request.form.get("credential")
    try:
        CLIENT_ID = os.environ.get("GOOGLE_AUTH_CLIENT_ID")
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), CLIENT_ID)
        print(idinfo)
        session['user'] = idinfo['email']
        session['pic'] = idinfo['picture']
        with psycopg2.connect(os.environ.get("DATABASE_URL")) as postgres:
            with postgres.cursor() as cursor:
                cursor.execute(
                    f"""
                    SELECT * FROM public.stats
                    WHERE email='{session.get('user', 'twicebyte@gmail.com')}'
                    """
                )
                res = cursor.fetchone()
                if res:
                    session['stats-started'] = res[1]
                    session['stats-completed'] = res[2]
                    session['stats-perfect'] = res[3]
                    session['stats-questions'] = res[4]
                    session['stats-correct'] = res[5]
                else:
                    session['stats-started'] = 0
                    session['stats-completed'] = 0
                    session['stats-perfect'] = 0
                    session['stats-questions'] = 0
                    session['stats-correct'] = 0
                    cursor.execute(
                        f"""
                        INSERT INTO public.stats (email, started, completed, perfect, questions, correct)
                        VALUES (
                            '{session.get('user', 'twicebyte@gmail.com')}', 0, 0, 0, 0, 0
                        )
                        """
                    )
                    postgres.commit()
    except ValueError:
        print('login failed')
        pass
    print(request.form)
    return redirect("/")


@app.route("/tickets")
@login_required
def tickets():
    tickets = get_tickets()
    return jsonify([ticket.dump for ticket in tickets])

@app.route("/translate", methods=["POST"])
@login_required
def translate():
    text = request.json['text']
    translation = translator.translate(text, dest='ru', src='ka').text
    return jsonify({"text": translation})


@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect("/")

@app.route('/reset')
def reset():
    with psycopg2.connect(os.environ.get("DATABASE_URL")) as postgres:
        with postgres.cursor() as cursor:
            cursor.execute(
                f"""
                DELETE FROM public.stats
                WHERE email='{session.get('user')}'
                """
            )
            postgres.commit()
    session.pop('user', None)
    return redirect("/")

@app.before_first_request
def prepare_db():
    with psycopg2.connect(os.environ.get("DATABASE_URL")) as postgres:
        with postgres.cursor() as cursor:
            cursor.execute(
                """
                SELECT EXISTS (
                    SELECT FROM
                        pg_tables
                    WHERE
                        schemaname = 'public' AND
                        tablename  = 'stats'
                )
                """
            )
            res = cursor.fetchone()
            if not res[0]:
                cursor.execute(
                    """
                    CREATE TABLE public.stats (
                        email VARCHAR(255) PRIMARY KEY,
                        started INT,
                        completed INT,
                        perfect INT,
                        questions INT,
                        correct INT
                    )
                    """
                )
                postgres.commit()


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))
