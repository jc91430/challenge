// Checks if the user is already signed in and if so, redirects the page
function redirect(googleUser) {
	if (googleUser.isSignedIn())
		window.location = 'main';
}

// Initializes the auth instance and toggles the sign in/out and profile buttons
function handleMainPage() {
	gapi.load('auth2', function() {
		gapi.auth2.init().then(function () {
		    $("#greeting").append("Hello, " + gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile().getName());
		});
	});

	$("a[href='signin']").parent().toggleClass("hidden");
    $("a[onclick='signOut()']").parent().toggleClass("hidden");
    $("a[href='profile']").parent().toggleClass("hidden");
}

// Signs the user out then redirects to index
function signOut() {
	// gapi.load('auth2', function() {
	// 	gapi.auth2.init().then(function () {
	// 		gapi.auth2.getAuthInstance().signOut().then(function () {
	// 			window.location = '/';
	// 		});
	// 	});
	// });

	gapi.auth2.getAuthInstance().signOut().then(function () {
		window.location = '/';
	});
}