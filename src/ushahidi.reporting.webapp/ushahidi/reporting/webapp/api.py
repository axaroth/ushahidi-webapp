# todo

import os
import base64
import json
import time
from pprint import pprint
from paste.request import parse_formvars

CATEGORIES = { 
    "payload": {
        "domain": None,   # to set
        "categories":[
            {"category":
                { "id":"1",
                  "parent_id":"0",
                  "title":"Category 1",
                  "description":"Category 1",
                  "color":"9900CC","position":"0"}},
            {"category":
                { "id":"2",
                  "parent_id":"0",
                  "title":"Category 2",
                  "description":"Category 2",
                  "color":"3300FF",
                  "position":"0"}},
            {"category":
                { "id":"3",
                  "parent_id":"0",
                  "title":"Category 3",
                  "description":"Category 3",
                  "color":"663300",
                  "position":"0"}},
            {"category":
                { "id":"4",
                  "parent_id":"0",
                  "title":"Trusted Reports",
                  "description":"Reports from trusted reporters",
                  "color":"339900","position":"0"}}
        ]},
    "error":{"code":"0","message":"No Error"}
}
  
                    
class FakeAPI(object):
    """ to test the request submitted """

    def __call__(self, environ, start_response):

        # log form fields
        pprint(parse_formvars(environ))

        # response
        # TODO: to format as ushahidi do
        start_response('200 OK', [('content-type', 'application/json')])

        #pprint(environ)
        #import pdb; pdb.set_trace()

        CATEGORIES['payload']['domain']= environ.get('HTTP_ORIGIN')
        
        if environ.get('REQUEST_METHOD','') == 'POST':
            #~ import pdb; pdb.set_trace()
            if  environ['paste.parsed_formvars'][0].has_key('task'):
                result = CATEGORIES  
            else:
                result = { "payload": {
                              "domain": environ.get('HTTP_ORIGIN'),
                              "success":"true"
                            },
                            "error":{ "code":"0",
                                      "message":"No Error"}
                        }
        elif environ.get('REQUEST_METHOD','') == 'GET' and \
             environ.get('QUERY_STRING', '') == 'task=categories':
            result = CATEGORIES
        else:
            result = {"status": "ok", "now": int(time.time())}

        return json.dumps(result)


def app_factory(global_config, **local_conf):
    return FakeAPI()
