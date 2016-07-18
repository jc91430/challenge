// Loads the user's profile page based on server's response via a POST request
function loadProfile() {
    $.post(
        '/loadProfile',
        function(data) {
            var response = jQuery.parseJSON(data);
            $("#profileName").html(response.name);
            $("#profileEmail").html(response.email);
            $("#aboutMsg").val(response.aboutMsg);
            $("#project").val(response.project);
            $("#fundraisingLink").val(response.fundraisingLink);

            if (response.imgName == 'none') {
                $("#currentPic").attr("src", "/static/uploads/default.jpeg");
                $("#addPic").html("Add profile image");
            }
            else {
                var path = "/static/uploads/" + response.imgName;
                $("#currentPic").attr("src", path);
                $("#addPic").html("Change profile image");
            }
        }
    );
    // gapi.load('auth2', function() {
    //     gapi.auth2.getAuthInstance().then(function () {
    //         var currentUser = gapi.auth2.getAuthInstance().currentUser.get();
    //         var idtoken = currentUser.getAuthResponse().id_token;

    //         $.post(
    //             '/loadProfile',
    //             { "idtoken": idtoken },
    //             function(data) {
    //                 var response = jQuery.parseJSON(data);
    //                 $("#profileName").html(currentUser.getBasicProfile().getName());
    //                 $("#profileEmail").html(currentUser.getBasicProfile().getEmail());
    //                 $("#aboutMsg").val(response.aboutMsg);
    //                 $("#project").val(response.project);
    //                 $("#fundraisingLink").val(response.fundraisingLink);

    //                 if (response.imgName == 'none') {
    //                     $("#currentPic").attr("src", "/static/uploads/default.jpeg");
    //                     $("#addPic").html("Add profile image");
    //                 }
    //                 else {
    //                     var path = "/static/uploads/" + response.imgName;
    //                     $("#currentPic").attr("src", path);
    //                     $("#addPic").html("Change profile image");
    //                 }
    //             }
    //         );
    //     });
    // });
}

$(function () {
    // Saves the user's profile information
    // Sends user profile data to server to be saved via ajax POST
    // Afterwards, redirects to the main page
    $("button#saveProfile").click(function (){
        var formData = new FormData();
        formData.append('aboutMsg', $("#aboutMsg").val());
        formData.append('project', $("#project").val());
        formData.append('fundraisingLink', $("#fundraisingLink").val());

        var pic = $("#profileImg")[0].files[0];
        if (pic != null) {
            formData.append('file', pic);
            formData.append('imgType', pic.type.split("/")[1]);
        }
        else {
            formData.append('file', null);
            formData.append('imgType', "none");
        }

        $.ajax({
            url: '/saveProfile',
            type: 'POST',
            data: formData,
            cache: false,
            processData: false,
            contentType: false,
            success: function(data) {
                window.location = data;
            },
           error: function(jqXHR, textStatus, errorMessage) {
               console.log(errorMessage);
           }
        });
    });

    // Does not change saved profile and redirects to main page
    $("button#cancelProfile").click(function (){
        window.location = '/main';
    });

    // Adds a user to the database
    $("button#addUser").click(function () {
        $.post(
            '/addUser',
            {"first_name": $("#refFirstName").val(),
             "last_name":  $("#refLastName").val(),
             "email":      $("#refEmail").val()},
             addUser
        );
    });
});

// Callback function for adding an user into the database
var addUser = function(data) {
    $("#refFirstName").val('');
    $("#refLastName").val('');
    $("#refEmail").val('');

    if (data == "OK") {
        //Notify user of success

        $("#msg").show();
        $("#msg").html("Success");
        $("#msg").delay(1000).fadeOut();
    }
    else {
        //Notify user of failure
        $("#msg").show();
        $("#msg").html("Failed");
        $("#msg").delay(1000).fadeOut();
    }
}