var api_url = "/api"  // fix for your server
//var api_url ="/ushahidi-dev/api"
//var api_url ="/ushahidi/api"

var interviews_db = {};

(function(context) {

    context.initDB = function(){
        if (window.openDatabase) {
            context.in_memory = false;
            persistence.store.websql.config(persistence, "Interviews",
                                            'database', 10 * 1024 * 1024);

        } else if (typeof(localStorage) != 'undefined') {
            context.in_memory = true;
            console.log('In memory');
            persistence.store.memory.config(persistence);
        }
        // else {
            //~ $.mobile.changePage("#offlinealert");
            //~ return false
        //~ }

        context.Interview = persistence.define('Interview', {
            title: "TEXT",
            posted: "BOOL"
        });

        context.Answer = persistence.define('Answer', {
            query: "TEXT",
            value: "TEXT"
        });

        context.Interview.hasMany('answers', context.Answer, 'interview');

        console.log('sync');
        persistence.schemaSync();

        if (context.in_memory) {
            console.log('In memory');
            persistence.loadFromLocalStorage(function() { console.log("Loading from localStorage")})
            console.log('done');
        }


    };

    context.initUI = function(){
        // reset DB
        $('#reset').click(function() {
            context.resetDB();
            $('.status').html('Reset complete');
            context.save_and_go("#index");
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

    context.dataURItoBlob = function (dataURI) {
        // convert base64 to raw binary data held in a string
        // doesn't handle URLEncoded DataURIs
        var byteString = atob(dataURI.split(',')[1]);

        // separate out the mime component
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

        // write the bytes of the string to an ArrayBuffer
        var ab = new ArrayBuffer(byteString.length);
        var ia = new Uint8Array(ab);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        // write the ArrayBuffer to a blob, and you're done
        BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
        var bb = new BlobBuilder();
        bb.append(ab);
        return bb.getBlob(mimeString);
    }

    context.postInterview = function (interview) {
        if (interview.posted == false) {
            interview.answers.list( function (answers) {
                $('.status').ajaxError(context.uploadFailed);
                 // Check for the various File API support.
                if (window.File && window.FileReader && window.FileList && window.Blob) {
                    // Great success! All the File APIs are supported.
                    var formData = new FormData();
                    formData.append('task', 'report');
                    for(var idx in answers) {
                        answers_idx = answers[idx];
                        if (answers[idx].query == 'incident_photo'){
                            var photo_data = answers[idx].value;
                            if(photo_data!=null){
                                //blob
                                blob = context.dataURItoBlob(photo_data);
                                formData.append("incident_photo[]", blob);
                            }
                        } else {
                            formData.append(answers[idx].query, answers[idx].value.toString());
                        }
                    }


                    // add personal informations from the settings
                    var settings_data = interviews_conf.getPersonalInfo()
                    if (settings_data.person_first != undefined){
                        formData.append('person_first', settings_data.person_first);
                    }
                    if (settings_data.person_last != undefined){
                        formData.append('person_last', settings_data.person_last);
                    }
                    if (settings_data.person_email != undefined){
                        formData.append('person_email', settings_data.person_email);
                    }

                    $.ajax({
                      url: api_url,
                      data: data,
                      cache: false,
                      contentType: false, // must be a multipart due to the image
                      processData: false,
                      type: 'POST',
                      success: function(data, textStatus, jqXHRres){
                                  success = context.uploadedInterview(data, textStatus, jqXHRres);
                                  if (success) { interview.posted = true; }
                                  context.save_and_go("#empty");
                                }
                      })

                } else {
                    console.log('no blob');
                    var data = {'task': 'report'};

                    for(var idx in answers) {
                        value = answers[idx].value
                        if(value != undefined){
                            data[answers[idx].query] = value.toString();
                        }
                    }

                    // add personal informations from the settings
                    var settings_data = interviews_conf.getPersonalInfo();
                    if (settings_data.person_first != undefined){
                        data.person_first = settings_data.person_first;
                    }
                    if (settings_data.person_last != undefined){
                        data.person_last = settings_data.person_last;
                    }
                    if (settings_data.person_email != undefined){
                        data.person_email = settings_data.person_email;
                    }

                    //iOS need a $.post
                    $.post(api_url,
                            data,
                            function(data, textStatus, jqXHRres){
                                success = context.uploadedInterview(data, textStatus, jqXHRres);
                                if (success) { interview.posted = true; };
                                context.save_and_go("#empty");
                            },
                            'json');
                }
            });

        };
    };

    context.uploadFailed = function (event, jqXHR, ajaxSettings, thrownError) {
        console.log('upload error')
        $(this).addClass('failed')
        $(this).html('Sync failed: '+jqXHR.statusText);
        $.mobile.changePage("#index");
    };

    context.uploadedInterview = function (data, textStatus, jqXHRres) {
        status_el = $('.status')
        status_el.removeClass('progress')

        // note: this should be raised only after all interviews are uploaded...
        if (jqXHRres.success()) {
            if(data["error"]!=undefined){
                data = data["error"];
            }
            if (data["code"]=="0"){
                status_el.removeClass('failed')
                status_el.html('');
                return true
            }else{
                status_el.addClass('failed')
                $('.status').html('Sync failed: ushahidi says:'+data["message"]);
                return false
            }
        } else {
            status_el.addClass('failed')
            status_el.html('Sync failed: '+jqXHRres.statusText);
            return false
        }
    };

    context.save_and_go = function(id){
        console.log("Saving/flushing");
        if (context.in_memory) {
            persistence.flush();
            persistence.saveToLocalStorage(function() {
                  console.log("Saving in localStorage")
                  if (id) { $.mobile.changePage(id) };
            })
        } else {
            persistence.flush(function() { if (id) { $.mobile.changePage(id) }});
        }
    }

})(interviews_db);

// interviews configurations
var interviews_conf = {};

(function(context) {

    context.init = function() {
        if (!localStorage.categories)
            localStorage.categories = JSON.stringify({});

        if (!localStorage.personal_info)
            localStorage.personal_info = JSON.stringify({});

      $.ajax({
          url: api_url,
          data: {'task':'categories'},
          type: 'POST',
          dataType: 'json',
          success: function(ajaxArgs) {
                    localStorage.categories = context.parseCategories(ajaxArgs);
                    interviews_app.updateFormCategories(JSON.parse(localStorage.categories))
                  }
          });

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
