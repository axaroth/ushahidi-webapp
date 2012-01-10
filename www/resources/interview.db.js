var interviews_db = {};

(function(context) {

    context.initDB = function(){
        persistence.store.websql.config(persistence, "Interviews",
                                        'database', 10 * 1024 * 1024);

        context.Interview = persistence.define('Interview', {
            title: "TEXT",
            posted: "BOOL"
        });

        context.Answer = persistence.define('Answer', {
            query: "TEXT",
            value: "TEXT"
        });

        context.Interview.hasMany('answers', context.Answer, 'interview');

        persistence.schemaSync();

    };

    context.initUI = function(){
        // reset DB
        $('#reset').click(function() {
            context.resetDB();
            $('.status').html('Reset complete');
            return false;
        });

        // sync DB
        $('#sync').click(function(){
            $('.status').html('Starting sync');
            context.uploadDB();
            return false;
        });
    };

    context.resetDB = function () {
        persistence.reset();
        persistence.schemaSync();
        console.log("DB reset");
    };

    context.uploadDB = function () {
//        persistence.dumpToJson(
//            null,
//            [interviews_db.Interview, interviews_db.Answer],
//            function(dump) {
//                console.log(dump);
//            });

        var allInterviews = interviews_db.Interview.all();
        allInterviews.list(null, function (results) {
            results.forEach(context.postInterview)
        });

    };

    context.postInterview = function (interview) {
        var data = {'task': 'report'};

        if (interview.posted == false) {
            interview.answers.list( function (answers) {
                for(var idx in answers) {
                    if (answers[idx].query == 'incident_photo'){
                        var photo_data = answers[idx].value
                        if (photo_data != null){
                            var encoded_photo_data = photo_data.substring(photo_data.indexOf('base64,')+7);
                            data[answers[idx].query] = window.atob(encoded_photo_data);
                        }
                    } else {
                        data[answers[idx].query] = answers[idx].value.toString()
                    }
                }

                // add personal informations from the settings
                var settings_data = interviews_conf.getPersonalInfo()
                if (settings_data.person_first != undefined){
                    data.person_first = settings_data.person_first
                }
                if (settings_data.person_last != undefined){
                    data.person_last = settings_data.person_last
                }
                if (settings_data.person_email != undefined){
                    data.person_email = settings_data.person_email
                }

                //console.log(interview.title(), data)
                $('.status').ajaxError(context.uploadedFailed);

                // XXX move the api url in a config file
                //$.post('http://localhost/ushahidi/api', data,context.uploadedInterview );
                $.post('http://localhost:8080/api', data, context.uploadedInterview);
                //$.post('http://174.129.246.207/ushahidi-dev/api', data, context.uploadedInterview);
            });

        };
    };

    context.uploadedFailed = function (event, jqXHR, ajaxSettings, thrownError) {
        console.log(jqXHR);
        $(this).html('Sync failed: '+jqXHR.statusText);
    };

    context.uploadedInterview = function (data, textStatus, jqXHRres) {
        // note: this should be raised only after all interviews are uploaded...
        console.log(jqXHRres);
        if (jqXHRres.success()) {
            if (data["error"]["code"]=="0")
                $('.status').html('Sync done');
            else
                $('.status').html('Sync failed: '+data["error"]["message"]);
        } else
            $('.status').html('Sync failed: '+jqXHRres.statusText);
    };


})(interviews_db);

// interviews configurations
var interviews_conf = {};

(function(context) {

    context.init = function() {
        if (!localStorage.categories)
            localStorage.categories = JSON.stringify({});

        if (!localStorage.personal_info)
            localStorage.personal_info = JSON.stringify({});

        $.ajax( "api?task=categories",
                settings={ success: function(ajaxArgs) {
                    localStorage.categories = context.parseCategories(ajaxArgs);
                    interviews_app.updateFormCategories(JSON.parse(localStorage.categories))
                  }
                })
    };

    context.parseCategories = function(ajaxArgs) {
        var categories = ajaxArgs.payload.categories
        return JSON.stringify(categories)
    };

    context.savePersonalInfo = function(info) {
        localStorage.personal_info = JSON.stringify(info);
    };

    context.getPersonalInfo = function() {
        return JSON.parse(localStorage.personal_info);
    };

})(interviews_conf);

//
$(document).ready(function(){
    interviews_conf.init();
    interviews_db.initDB();
    interviews_db.initUI();
})
