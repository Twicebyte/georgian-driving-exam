
var done = 0;
var correct = 0;

function nextexam(element) {
    // Show modal with loader
    var modal = document.createElement('div');
    modal.classList.add('modal');
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
    document.body.appendChild(modal);

    window.location.href = '{{ url_for("update") }}';

};

function logout(element) {
    window.location.href = '{{ url_for("logout") }}';

};

function scrollnext(element) {
    element.parentElement.nextElementSibling.scrollIntoView(
        {behavior: "smooth", block: "center", inline: "center"}
    )
};

function answerclick(element) {
    if (!element.parentElement.parentElement.classList.contains('done')) {
        element.parentElement.parentElement.classList.add('done');
        done += 1;
        if (!element.classList.contains('correct')) {
            element.classList.add('incorrect');
        } else {
            correct += 1;
            document.getElementById('goodnum').innerHTML = correct;
        }
        document.getElementById('header').style.backgroundImage = 'linear-gradient(to right, #f2fff2 ' + (correct / allnum * 100) + '%, #fff1f1 ' + (correct / allnum * 100) + '%, #fff1f1 ' + (done / allnum * 100) + '%, #ffffff ' + (done / allnum * 100) + '%, #ffffff 100%)';
    }
};

function keyhandler(event) {
    // Scroll to next ticket element if pressed space
    if (event.keyCode == 32) {
        event.preventDefault();
        var middleElement;
        var viewportHeight = document.defaultView.innerHeight;

        for (var el of document.querySelectorAll('.ticket')) {
            var top = el.getBoundingClientRect().top;
            var bottom = el.getBoundingClientRect().bottom;
            // if an element is more or less in the middle of the viewport
            if( bottom > viewportHeight/2 && top < viewportHeight/2 ){
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
            if( bottom > viewportHeight/2 && top < viewportHeight/2 ){
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
            if( bottom > viewportHeight/2 && top < viewportHeight/2 ){
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
    // Prevent the mini-infobar from appearing on mobile.
    event.preventDefault();
    console.log('👍', 'beforeinstallprompt', event);
    // Stash the event so it can be triggered later.
    window.deferredPrompt = event;
    // Remove the 'hidden' class from the install button container.
    butInstall.classList.toggle('hidden', false);
});

butInstall.addEventListener('click', async () => {
    console.log('👍', 'butInstall-clicked');
    const promptEvent = window.deferredPrompt;
    if (!promptEvent) {
      // The deferred prompt isn't available.
      return;
    }
    // Show the install prompt.
    promptEvent.prompt();
    // Log the result
    const result = await promptEvent.userChoice;
    console.log('👍', 'userChoice', result);
    // Reset the deferred prompt variable, since
    // prompt() can only be called once.
    window.deferredPrompt = null;
    // Hide the install button.
    butInstall.classList.toggle('hidden', true);
});

window.addEventListener('appinstalled', (event) => {
    console.log('👍', 'appinstalled', event);
    // Clear the deferredPrompt so it can be garbage collected
    window.deferredPrompt = null;
});
/* Only register a service worker if it's supported */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/static/service-worker.js");
}

