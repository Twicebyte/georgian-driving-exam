
var done = 0;
var correct = 0;
var allnum = 0;


var stats_exams_started = 0;
var stats_exams_completed = 0;
var stats_exams_perfect = 0;
var stats_questions = 0;
var stats_correct = 0;

function add_started() {
    stats_exams_started += 1;
    send_stats();
};

function add_exam() {
    stats_exams += 1;
    if (correct == allnum)
        stats_exams_perfect += 1;
    send_stats();
};

function add_incorrect() {
    stats_questions += 1;
    send_stats();
};

function add_correct() {
    stats_questions += 1;
    stats_correct += 1;
    send_stats();
};

function update_stats() {
    document.getElementById("stats-started").innerHTML = stats_exams_started;
    document.getElementById("stats-completed").innerHTML = stats_exams_completed + " (" + Math.round(100 * stats_exams_completed / stats_exams_started) + " %)";
    document.getElementById("stats-perfect").innerHTML = stats_exams_perfect + " (" + Math.round(100 * stats_exams_perfect / stats_exams_completed) + " %)";
    document.getElementById("stats-questions").innerHTML = stats_questions;
    document.getElementById("stats-correct").innerHTML = Math.round(100 * stats_correct / stats_questions) + " %";

    checkachivements();
};


function send_stats() {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/stats", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
        "started": stats_exams_started,
        "completed": stats_exams_completed,
        "perfect": stats_exams_perfect,
        "questions": stats_questions,
        "correct": stats_correct
    }));
    update_stats();
};

function get_stats() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/stats');
    //Set payload to element text
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange  = function() {
        if (this.readyState == 4 && this.status == 200) {
            payload = JSON.parse(this.responseText);

            stats_exams_started = payload.started;
            stats_exams_completed = payload.completed;
            stats_exams_perfect = payload.perfect;
            stats_questions = payload.questions;
            stats_correct = payload.correct;

            update_stats();
        }
    };
    xhr.send();
}

function logout(element) {
    window.location.href = '/logout';

};

function scrollnext(element) {
    element.parentElement.parentElement.nextElementSibling.scrollIntoView(
        {behavior: "smooth", block: "start", inline: "center"}
    )
};

function answerclick(element) {
    if (!element.parentElement.parentElement.classList.contains('done')) {
        element.parentElement.parentElement.classList.add('done');
        done += 1;
        if (!element.classList.contains('correct')) {
            element.classList.add('incorrect');
            add_incorrect();
        } else {
            correct += 1;
            add_correct();
            document.getElementById('goodnum').innerHTML = correct;
        }
        if (done == allnum) {
            add_exam();
        }
        document.getElementById('header').style.backgroundImage = 'linear-gradient(to right, #f2fff2 ' + (correct / allnum * 100) + '%, #fff1f1 ' + (correct / allnum * 100) + '%, #fff1f1 ' + (done / allnum * 100) + '%, #ffffff ' + (done / allnum * 100) + '%, #ffffff 100%)';
    }
};

function scroll_to_active() {
    for (var el of document.querySelectorAll('.ticket')) {
        if (!el.classList.contains('done')) {
            el.parentElement.scrollIntoView(
                {behavior: "smooth", block: "start", inline: "center"}
            );
            break;
        }
    };
}


function keyhandler(event) {
    // Scroll to next ticket element if pressed space
    if (event.keyCode == 32) {
        event.preventDefault();
        var middleElement;
        var viewportHeight = document.defaultView.innerHeight;

        for (var el of document.querySelectorAll('.snap')) {
            var top = el.getBoundingClientRect().top;
            var bottom = el.getBoundingClientRect().bottom;
            // if an element is more or less in the middle of the viewport
            if( bottom > 100 && top < 100 ){
                middleElement = el;
                break;
            }
        };
        middleElement.nextElementSibling.scrollIntoView(
            {behavior: "smooth", block: "center", inline: "center"}
        );
    }

    // Click answer in current centered ticket element based on number pressed on keyboard
    if (event.keyCode >= 49 && event.keyCode <= 57) {

        var middleElement;
        var viewportHeight = document.defaultView.innerHeight;

        for (var el of document.querySelectorAll('.ticket')) {
            var top = el.getBoundingClientRect().top;
            var bottom = el.getBoundingClientRect().bottom;
            // if an element is more or less in the middle of the viewport
            if( bottom > 100 && top < 100 ){
                middleElement = el;
                break;
            }
        };
        if (!middleElement.classList.contains('done')) {
            middleElement.querySelector('.answers').children[event.keyCode - 49].click();
        }
    }

    // Click answer in current centered ticket element based on number pressed on numberpad
    if (event.keyCode >= 97 && event.keyCode <= 105) {

        var middleElement;
        var viewportHeight = document.defaultView.innerHeight;

        for (var el of document.querySelectorAll('.ticket')) {
            var top = el.getBoundingClientRect().top;
            var bottom = el.getBoundingClientRect().bottom;
            // if an element is more or less in the middle of the viewport
            if( bottom > 100 && top < 100 ){
                middleElement = el;
                break;
            }
        };
        if (!middleElement.classList.contains('done')) {
            middleElement.querySelector('.answers').children[event.keyCode - 97].click();
        }
    }

};

document.addEventListener("keydown", keyhandler);


const butInstall = document.getElementById("butInstall");

window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    console.log('👍', 'beforeinstallprompt', event);
    window.deferredPrompt = event;
    butInstall.classList.toggle('hidden', false);
});

butInstall.addEventListener('click', async () => {
    console.log('👍', 'butInstall-clicked');
    const promptEvent = window.deferredPrompt;
    if (!promptEvent) {
      return;
    }
    promptEvent.prompt();
    const result = await promptEvent.userChoice;
    console.log('👍', 'userChoice', result);
    window.deferredPrompt = null;
    butInstall.classList.toggle('hidden', true);
});

window.addEventListener('appinstalled', (event) => {
    console.log('👍', 'appinstalled', event);
    window.deferredPrompt = null;
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/static/service-worker.js");
}

const stack = document.getElementById('stack');


function translate_desc(element) {
    let descinfo = element.querySelector('.descinfo');
    let descraw = element.querySelector('.descraw');
    if (descinfo.dataset.translated == 'true') {
        return
    }
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/translate');
    //Set payload to element text
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange  = function() {
        if (this.readyState == 4 && this.status == 200) {
            descinfo.innerHTML = JSON.parse(this.responseText).text;
            descinfo.dataset.translated = 'true';
        }
    };
    xhr.send(JSON.stringify({text: descraw.innerHTML}));
}

function recreate() {
    stack.innerHTML = '';

    done = 0;
    correct = 0;
    allnum = 0;

    var modal = document.createElement('div');
    modal.classList.add('ticket');
    var loader = document.createElement('div');
    loader.classList.add('loader');
    modal.appendChild(loader);
    //animate loader
    var i = 0;
    var interval = setInterval(function() {
        loader.style.transform = 'rotate(' + i + 'deg)';
        i += 10;
        if (i == 360) { i = 0; }
    }, 50);
    stack.appendChild(modal);

    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/tickets');
    xhr.onreadystatechange  = function() {
        if (this.readyState == 4 && this.status == 200) {
            clearInterval(interval);
            stack.removeChild(modal);
            var data = JSON.parse(this.responseText);
            allnum = data.length;
            add_started();
            document.getElementById('scroll_float').classList.remove('hidden');
            document.getElementById('header').style.backgroundImage = 'linear-gradient(to right, #f2fff2 ' + (correct / allnum * 100) + '%, #fff1f1 ' + (correct / allnum * 100) + '%, #fff1f1 ' + (done / allnum * 100) + '%, #ffffff ' + (done / allnum * 100) + '%, #ffffff 100%)';

            for (var i = 0; i < data.length; i++) {
                var ticket = data[i];
                var element = document.createElement('div');
                element.classList.add('snap');
                element.innerHTML = `
                    <div class="ticket">
                        <span class="num">${i+1}</span>
                        <div class="question"><span class="mobilenum">${i+1}</span><h2>${ticket.question}</h2></div>
                        ${ticket.image ? `<div class="imgcontainer"><img class="cutoff${ticket.options.cutoff}" src="${ticket.image}" alt="Ticket image"></div>` : ''}
                        <div class="answers">
                            ${Object.entries(ticket.answers).map(([n, answer]) => `<div onclick="answerclick(this)" class="answer ${answer.real_id == ticket.correct_answer ? 'correct' : ''}">
                                <span class="answernum">${n}</span>
                                ${answer.text}
                            </div>`).join('')}
                        </div>
                        <div class="desc">
                            Детали
                            <span class="hidden descraw">${ticket.desc}</span>
                            <span class="descinfo">
                                <span class="material-symbols-rounded" style="
                                    margin: 8px;
                                    font-size: x-large;
                                ">downloading</span>
                                Получение описания
                            </span>
                        </div>
                        <div class="next" onclick="scrollnext(this)">Далее</div>
                    </div>
                `;
                stack.appendChild(element);
            };
            var element = document.createElement('div');
            element.classList.add('snap');
            element.innerHTML = `
                <div class="ticket">
                    <div style="margin: 32px;"><h3>Экзамен закончен</h2></div>
                    <span class="stats" id="goodnum">0</span><span class="stats"> / ${allnum}</span>
                    <div style="margin: 16px;">
                        <span class="nextexam" onclick="recreate()">Ещё раз</span>
                    </div>
                </div>
            `;
            stack.appendChild(element);

            //Translate all descriptions from georgian to russian
            elements = document.getElementsByClassName('desc');
            for (let element of elements) {
                element.addEventListener('mouseenter', () => translate_desc(element));
            }
        }
    };
    xhr.send();

};

function home() {

    home_ticket = document.getElementById('home_ticket');

    home_ticket.scrollIntoView(
        {behavior: "smooth", block: "center", inline: "center"}
    );
}

function checkachivements() {
    if (stats_exams_completed > 0) {
        document.getElementById('rocket_launch').classList.remove('disabled');
    }

    if (stats_exams_perfect > 0) {
        document.getElementById('diamond').classList.remove('disabled');
    }

    if (stats_questions >= 100) {
        document.getElementById('weight').classList.remove('disabled');

        if (stats_correct / stats_questions > 0.9) {
            document.getElementById('lightbulb').classList.remove('disabled');
        }
    }

    if (stats_exams_perfect >= 20) {
        document.getElementById('diamond').classList.remove('disabled');
    }

    if (stats_questions >= 1000) {
        document.getElementById('all_inclusive').classList.remove('disabled');
    }

    if (stats_exams_started >= 10) {
        if (stats_exams_completed / stats_exams_started > 0.9) {
            document.getElementById('data_check').classList.remove('disabled');
        }
    }

}

document.addEventListener("DOMContentLoaded", () => {
    home();
    document.getElementById('achivements_shelf').classList.remove('hidden');
    get_stats();
});
