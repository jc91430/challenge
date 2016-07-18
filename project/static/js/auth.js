// Sends a POST request to the server to authenticate them on the backend
// Expects a string response and redirects the browser accordingly
function handleSignIn(googleUser) {
    $.post(
        '/signin',
        {"idtoken": googleUser.getAuthResponse().id_token},
        function(data) {
            if (data == "/notfound")
                gapi.auth2.getAuthInstance().signOut();
            window.location = data;
        }
    );
}

// Initializes the auth instance
// If the user is not signed in, redirects them to the index page
function checkSignIn() {
    $.post(
        '/checksignin',
        function(data) {
            if (!data)
                window.location = '/';
        }
    );
}

// Signs the user out then redirects to index
function signOut() {
    $.post(
        '/signout',
        function(data) {
            gapi.load('auth2', function() {
                gapi.auth2.init().then(function () {
                    gapi.auth2.getAuthInstance().signOut().then(function () {
                        window.location.href = '/';
                    });
                });
            });
        }
    );
}