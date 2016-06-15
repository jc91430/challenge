// Sends an AJAX request to the server with the user's idtoken
// Redirects the user to the main page if successfully signed in, else error msg
function redirect(googleUser) {
    console.log(googleUser.getId());
    $.ajax({
        data: "idtoken=" + googleUser.getAuthResponse().id_token,
        type: 'POST',
        success: function() {
            if (googleUser.isSignedIn())
                window.location = 'main';
        },
        error: function(error) {
            console.log("Request failed: " + error);
        }
    });
}

// Initializes the auth instance and toggles the sign in/out and profile buttons
// If the user is not signed in, redirects them to the index page
function handleMainPage() {
    gapi.load('auth2', function() {
        gapi.auth2.init().then(function () {
            var currentUser = gapi.auth2.getAuthInstance().currentUser.get();
            if (!currentUser.isSignedIn()) 
                window.location = '/';
        });
    });

    $("a[href='signin']").parent().toggleClass("hidden");
    $("a[onclick='signOut()']").parent().toggleClass("hidden");
    $("a[href='profile']").parent().toggleClass("hidden");
}

// Signs the user out then redirects to index
function signOut() {
    gapi.auth2.getAuthInstance().signOut().then(function () {
        window.location = '/';
    });
    // gapi.load('auth2', function() {
    //  gapi.auth2.init().then(function () {
    //      gapi.auth2.getAuthInstance().signOut().then(function () {
    //          window.location = '/';
    //      });
    //  });
    // });
}