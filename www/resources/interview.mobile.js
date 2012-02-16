function ushahidiDate(date){
    var curr_date = date.getDate();
    curr_date = (curr_date < 10) ? '0' + curr_date : curr_date;

    var curr_month = date.getMonth();
    curr_month = curr_month + 1;
    curr_month = (curr_month < 10) ? '0' + curr_month : curr_month;

    var curr_year = date.getFullYear();

    var incident_date= curr_month + '/'+ curr_date + '/'+ curr_year;
    var incident_hour = date.getHours()
    var incident_ampm = "am";
    if (incident_hour   > 11) { incident_ampm = "pm";        }
    if (incident_hour   > 12) { incident_hour = incident_hour - 12; }
    if (incident_hour   == 0) { incident_hour = 12;        }
    var incident_minute = date.getMinutes()

    return {
      'curr_date': curr_date,
      'curr_month': curr_month,
      'curr_year': curr_year,
      'incident_date': incident_date,
      'incident_hour': incident_hour,
      'incident_ampm': incident_ampm,
      'incident_minute': incident_minute
    }
}

// geolocation
function geo_success_callback(p) {
    console.log('lat='+p.coords.latitude+';lon='+p.coords.longitude);
}

function geo_error_callback(p) {
    var msg = 'error='+p.code;
    alert(msg);
    console.log(msg);
}

function handlePhotoSelect(files) {
  // XXX refactor with jquery
  // Loop through the FileList and render image files as thumbnails.
  for (var i = 0, f; f = files[i]; i++) {

    // Only process image files.
    if (!f.type.match('image.*')) {
      continue;
    }

    var reader = new FileReader();

    // Closure to capture the file information.
    reader.onload = (function(theFile) {
      return function(e) {
        // Render thumbnail.
        var span = document.createElement('span');
        span.innerHTML = ['<img class="thumb" src="', e.target.result,
                          '" title="', theFile.name, '"/>'].join('');
        document.getElementById('incident_photo_preview').insertBefore(span, null);
      };
    })(f);

    // Read in the image file as a data URL.
    reader.readAsDataURL(f);
  }
}



// --
var status_msg = "";
var interviews_app = {};

(function(context) {

    context.initUI = function(){
        $(".form-interview").submit(context.newInterview);
        $(".form-settings").submit(context.saveSettings);
    }

    context.addAnswer = function (interview, query, response) {
        var answer = new interviews_db.Answer({
            query: query,
            value: response
        });
        persistence.add(answer);
        interview.answers.add(answer);
    };

    context.newInterview = function () {
        // get the  position
        geo_position_js.getCurrentPosition(
                          context._newInterview,
                          geo_error_callback,
                          {enableHighAccuracy:true});
        $.mobile.changePage("#index");
        context.setStatus('interview saved');

        return false;
    };

    context._newInterview = function (position) {

        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
        console.log('lat='+latitude+';lon='+longitude);

        var interview = new interviews_db.Interview({
            title: $("#incident_title").val().toString(),
            posted: false
        });
        persistence.add(interview);

        ushahidi_date = ushahidiDate(new Date());

        // incident_title
        context.addAnswer(
                    interview,
                    'incident_title',
                    $("#incident_title").val().toString());
        // incident_description
        context.addAnswer(
                    interview,
                    'incident_description',
                    $("#incident_description").val().toString());
        // incident_date
        context.addAnswer(
                    interview,
                    'incident_date',
                    ushahidi_date['incident_date']);
        // incident_hour
        context.addAnswer(
                    interview,
                    'incident_hour',
                    ushahidi_date['incident_hour']);
        // incident_minute
        context.addAnswer(
                    interview,
                    'incident_minute',
                    ushahidi_date['incident_minute']);
        // incident_ampm
        context.addAnswer(
                    interview,
                    'incident_ampm',
                    ushahidi_date['incident_ampm']);
        // incident_category
        context.addAnswer(
                    interview,
                    'incident_category',
                    $("#incident_category").val().toString());
        // latitude
        context.addAnswer(
                    interview,
                    'latitude',
                    latitude);
        // longitude
        context.addAnswer(
                    interview,
                    'longitude',
                    longitude);
        // location_name
        context.addAnswer(
                    interview,
                    'location_name',
                    $("#location_name").val().toString());
        // incident_photo
        context.addAnswer(
                    interview,
                    'incident_photo',
                    $("#incident_photo_preview img").attr('src'));

        persistence.flush();
        //context.updateStatus('done');
    };

    context.listingUpdate = function (event, ui) {
        var allInterviews = interviews_db.Interview.all();
        allInterviews.list(null, function (results) {
            results.forEach(context.showInterview)
        });
        $('.status').html('');
    };

    context.showInterview = function (interview) {
        var snippet = $("[data-snippet=interview-item]").clone()
        snippet.removeAttr("data-snippet");

        interview.answers.each( function (answer) {
            snippet.removeAttr("data-snippet");
            snippet.find("." + answer.query).text(answer.value);
        });

        if (interview.posted == false)
            msg = "to upload";
        else
            msg = "uploaded";
        snippet.find(".posted").text(msg);

        snippet.show();
        $("#interview-list").append(snippet);
        $("[data-snippet=interview-item]").hide();
    };

    context.listingHide = function (event, ui) {
        $("#interview-list").find('div[data-snippet!=interview-item].interview-item').remove();

    };

    context.updateFormCategories = function (categories) {
        ic = $("#incident_category");
        ic.html("");
        for (i in categories) {
            index = categories[i].category.id;
            title = categories[i].category.title;
            ic.append("<option value="+i+">"+title+"</option>");
        }
    };

    context.updateStatus = function (msg) {
        console.log(msg);
        $('.status').html(msg);
        $.mobile.changePage("#dbstatus", "pop");
    };

    context.checkFileSupport = function (event, ui) {
        if (!window.File && !window.FileReader && !window.FileList) {
          $('.form-interview').find('.incident_photo_field').hide()
        }
    };


    context.saveSettings = function () {
        $.mobile.changePage("#index");
        interviews_conf.savePersonalInfo({
           'person_first': $('#person_first').val(),
           'person_last': $('#person_last').val(),
           'person_email': $('#person_email').val()
        });
        $('.status').html('Settings saved');
        return false;
    };

    context.showSettings = function (event, ui) {
        var settings = interviews_conf.getPersonalInfo();
        $('#person_first').val(settings.person_first);
        $('#person_last').val(settings.person_last);
        $('#person_email').val(settings.person_email);
    };

    context.setStatusMsg = function (msg){
        status_msg = msg;
    }
    context.getStatusMsg = function(){
        return status_msg;
    }

})(interviews_app);

// init app
$(document).bind("mobileinit", function(){

    if(geo_position_js.init()){
        geo_position_js.getCurrentPosition(
                            geo_success_callback,
                            geo_error_callback,
                            {enableHighAccuracy:true});
    } else {
        alert("Functionality not available");
    }

    $('#index').live('pageshow', function(){
        interviews_app.listingUpdate();
        $('.status').html(interviews_app.getStatusMsg());
        interviews_app.setStatusMsg("");
    });
    $('#index').live('pagehide', function(){
        interviews_app.listingHide();
        $('.status').html(interviews_app.getStatusMsg());
    });
    $('#new').live('pageshow', interviews_app.checkFileSupport);
    $('#settings').live('pageshow', interviews_app.showSettings);
})

$(document).ready(function(){
    interviews_app.initUI();
})