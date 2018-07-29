var http = require('http');
var url = require('url');
var fs = require('fs');
var request = require("request");


var oktaConfig = {
    "oktaOrgUrl": "https://companyx.okta.com",
    "apiKey": "00dpe4hYVZ-4EOixZ8uFmWx0zzdhu563-BixRvgx04",
}


http.createServer(function (req, res) {
    console.log("createServer()");
    res.writeHead(200, {'Content-Type': 'text/html'});
    var q = url.parse(req.url, true).query;
    var txt = q.year + " " + q.month;
    if (req.url == "/test") {

        var requestObj = {}

        fakeGetJson ( requestObj).
            then ( getUserProfile ).
            then ( requiredObjects).
            then ( compareUserProfile).
            then ( renderHtml).
            then ( (responseObj)=> {
            // console.log(JSON.stringify( responseObj))
            readHtmlFile ( "index.html").then ( (html)=> {
                res.end(html);

            }).catch ( (error)=> {
                console.log(error)
            });



        }).catch ( (error)=> {
            console.log("Error: ");
            console.log(error);
        })

        // getSchema({}).then((responseObj) => {
        //     var customAttributes = JSON.parse(responseObj)
        //     customAttributes = customAttributes.definitions
        //
        //     for (var key in obj) {
        //         if (obj.hasOwnProperty(key)) {
        //             var val = obj[key];
        //             console.log(val);
        //             walk(val);
        //         }
        //     }
        //
        //     res.end(responseObj.definitions.toString());
        // }).catch ( (error)=> {
        //     res.end(error.toString());
        // })
    } else {
        res.end("bad");

    }
}).listen(process.env.PORT);


getSchema = function (requestObj) {
    return new Promise((resolve, reject) => {
        console.log("getSchema()");

        var options = {
            method: 'GET',
            url: oktaConfig.oktaOrgUrl + '/api/v1/meta/schemas/user/default',
            headers:
                {
                    'postman-token': 'b79652df-ed9d-e8fb-4606-64dca1166f52',
                    'cache-control': 'no-cache',
                    authorization: 'SSWS ' + oktaConfig.apiKey,
                    'content-type': 'application/json',
                    accept: 'application/json'
                }
        };

        request(options, function (error, response, body) {
            if (error) reject ( error )
            resolve(body);
        });
    })
}

var requiredObjects = function( requestObj ) {
    return new Promise ( (resolve, reject)=> {
        console.log("requiredObjects()");
        
        requestObj.requiredAttributes = []

        for (var key in requestObj.oktaJsonResponse.definitions.custom.properties) {
            if (requestObj.oktaJsonResponse.definitions.custom.properties.hasOwnProperty(key)) {
                var val = requestObj.oktaJsonResponse.definitions.custom.properties[key];
                if ( val.required) {
                    requestObj.requiredAttributes.push ( val )
                }
            }
        }
        var responseObj=requestObj;
        resolve ( responseObj )

    })
}


getUserProfile  = function ( requestObj )  {
    return new Promise ( (resolve)=> {
        console.log("getUserProfile()");
        
        requestObj.userProfile = {
            "id": "00u1a2izikgyTFgl21d8",
            "status": "ACTIVE",
            "created": "2017-01-09T16:30:53.000Z",
            "activated": "2017-01-09T16:30:55.000Z",
            "statusChanged": "2017-01-09T16:32:14.000Z",
            "lastLogin": "2017-01-09T16:39:41.000Z",
            "lastUpdated": "2018-07-29T14:36:44.000Z",
            "passwordChanged": "2017-01-09T16:32:14.000Z",
            "profile": {
                "firstName": "testuser91",
                "lastName": "testuser",
                "mobilePhone": null,
                "tester1": "111",
                "secondEmail": null,
                "login": "testuser91@mailinator.com",
                "email": "testuser91@mailinator.com"
            },
            "credentials": {
                "password": {},
                "recovery_question": {
                    "question": "What is the food you least liked as a child?"
                },
                "provider": {
                    "type": "OKTA",
                    "name": "OKTA"
                }
            },
            "_links": {
                "suspend": {
                    "href": "https://companyx.okta.com/api/v1/users/00u1a2izikgyTFgl21d8/lifecycle/suspend",
                    "method": "POST"
                },
                "resetPassword": {
                    "href": "https://companyx.okta.com/api/v1/users/00u1a2izikgyTFgl21d8/lifecycle/reset_password",
                    "method": "POST"
                },
                "forgotPassword": {
                    "href": "https://companyx.okta.com/api/v1/users/00u1a2izikgyTFgl21d8/credentials/forgot_password",
                    "method": "POST"
                },
                "expirePassword": {
                    "href": "https://companyx.okta.com/api/v1/users/00u1a2izikgyTFgl21d8/lifecycle/expire_password",
                    "method": "POST"
                },
                "changeRecoveryQuestion": {
                    "href": "https://companyx.okta.com/api/v1/users/00u1a2izikgyTFgl21d8/credentials/change_recovery_question",
                    "method": "POST"
                },
                "self": {
                    "href": "https://companyx.okta.com/api/v1/users/00u1a2izikgyTFgl21d8"
                },
                "changePassword": {
                    "href": "https://companyx.okta.com/api/v1/users/00u1a2izikgyTFgl21d8/credentials/change_password",
                    "method": "POST"
                },
                "deactivate": {
                    "href": "https://companyx.okta.com/api/v1/users/00u1a2izikgyTFgl21d8/lifecycle/deactivate",
                    "method": "POST"
                }
            }
        };
        resolve ( requestObj )
    })
}

fakeGetJson  = function ( requestObj ) {

    return new Promise((resolve) => {
        console.log("fakeGetJson()");

        var json = {
            "id": "https://companyx.okta.com/meta/schemas/user/default",
            "$schema": "http://json-schema.org/draft-04/schema#",
            "name": "user",
            "title": "User",
            "description": "Okta user profile template with default permission settings",
            "lastUpdated": "2018-07-29T13:17:00.000Z",
            "created": "2015-03-05T18:28:09.000Z",
            "definitions": {
                "custom": {
                    "id": "#custom",
                    "type": "object",
                    "properties": {
                        "newcustom": {
                            "title": "newcustomattribute",
                            "description": "custom attribute",
                            "type": "string",
                            "mutability": "READ_WRITE",
                            "scope": "NONE",
                            "permissions": [
                                {
                                    "principal": "SELF",
                                    "action": "READ_ONLY"
                                }
                            ],
                            "master": {
                                "type": "PROFILE_MASTER"
                            }
                        },
                        "verizon1": {
                            "title": "verizon1",
                            "type": "string",
                            "mutability": "READ_WRITE",
                            "scope": "NONE",
                            "permissions": [
                                {
                                    "principal": "SELF",
                                    "action": "READ_ONLY"
                                }
                            ],
                            "master": {
                                "type": "PROFILE_MASTER"
                            }
                        },
                        "verizon2": {
                            "title": "verizon2",
                            "type": "string",
                            "mutability": "READ_WRITE",
                            "scope": "NONE",
                            "permissions": [
                                {
                                    "principal": "SELF",
                                    "action": "READ_ONLY"
                                }
                            ],
                            "master": {
                                "type": "PROFILE_MASTER"
                            }
                        },
                        "twitterUserName": {
                            "title": "oktaproxy username",
                            "description": "User's username for oktaproxy.com",
                            "type": "string",
                            "mutability": "READ_WRITE",
                            "scope": "NONE",
                            "minLength": 1,
                            "maxLength": 20,
                            "permissions": [
                                {
                                    "principal": "SELF",
                                    "action": "READ_WRITE"
                                }
                            ],
                            "master": {
                                "type": "PROFILE_MASTER"
                            }
                        },
                        "monkey": {
                            "title": "monkey",
                            "type": "string",
                            "mutability": "READ_WRITE",
                            "scope": "NONE",
                            "permissions": [
                                {
                                    "principal": "SELF",
                                    "action": "READ_ONLY"
                                }
                            ],
                            "master": {
                                "type": "PROFILE_MASTER"
                            }
                        },
                        "unmastered": {
                            "title": "unmastered",
                            "description": "unmastered",
                            "type": "string",
                            "mutability": "READ_WRITE",
                            "scope": "NONE",
                            "permissions": [
                                {
                                    "principal": "SELF",
                                    "action": "READ_WRITE"
                                }
                            ],
                            "master": {
                                "type": "OKTA"
                            }
                        },
                        "multiarray": {
                            "title": "multiarray",
                            "description": "multiarray",
                            "type": "array",
                            "mutability": "READ_WRITE",
                            "scope": "NONE",
                            "items": {
                                "type": "string"
                            },
                            "union": "DISABLE",
                            "permissions": [
                                {
                                    "principal": "SELF",
                                    "action": "READ_ONLY"
                                }
                            ],
                            "master": {
                                "type": "PROFILE_MASTER"
                            }
                        },
                        "tester1": {
                            "title": "tester1",
                            "description": "tester1",
                            "type": "string",
                            "required": true,
                            "mutability": "READ_WRITE",
                            "scope": "NONE",
                            "permissions": [
                                {
                                    "principal": "SELF",
                                    "action": "READ_ONLY"
                                }
                            ],
                            "master": {
                                "type": "PROFILE_MASTER"
                            }
                        },
                        "tester2": {
                            "title": "tester2",
                            "description": "tester2",
                            "type": "string",
                            "required": true,
                            "mutability": "READ_WRITE",
                            "scope": "NONE",
                            "permissions": [
                                {
                                    "principal": "SELF",
                                    "action": "READ_ONLY"
                                }
                            ],
                            "master": {
                                "type": "PROFILE_MASTER"
                            }
                        }
                    },
                    "required": [
                        "tester1",
                        "tester2"
                    ]
                },
                "base": {
                    "id": "#base",
                    "type": "object",
                    "properties": {
                        "login": {
                            "title": "Username",
                            "type": "string",
                            "required": true,
                            "mutability": "READ_WRITE",
                            "scope": "NONE",
                            "minLength": 5,
                            "maxLength": 100,
                            "permissions": [
                                {
                                    "principal": "SELF",
                                    "action": "READ_ONLY"
                                }
                            ],
                            "master": {
                                "type": "PROFILE_MASTER"
                            }
                        },
                        "firstName": {
                            "title": "First name",
                            "type": "string",
                            "required": true,
                            "mutability": "READ_WRITE",
                            "scope": "NONE",
                            "minLength": 1,
                            "maxLength": 50,
                            "permissions": [
                                {
                                    "principal": "SELF",
                                    "action": "READ_WRITE"
                                }
                            ],
                            "master": {
                                "type": "OKTA"
                            }
                        },
                        "lastName": {
                            "title": "Last name",
                            "type": "string",
                            "required": true,
                            "mutability": "READ_WRITE",
                            "scope": "NONE",
                            "minLength": 1,
                            "maxLength": 50,
                            "permissions": [
                                {
                                    "principal": "SELF",
                                    "action": "READ_WRITE"
                                }
                            ],
                            "master": {
                                "type": "PROFILE_MASTER"
                            }
                        },
                        "middleName": {
                            "title": "Middle name",
                            "type": "string",
                            "mutability": "READ_WRITE",
                            "scope": "NONE",
                            "permissions": [
                                {
                                    "principal": "SELF",
                                    "action": "READ_ONLY"
                                }
                            ],
                            "master": {
                                "type": "PROFILE_MASTER"
                            }
                        },
                        "honorificPrefix": {
                            "title": "Honorific prefix",
                            "type": "string",
                            "mutability": "READ_WRITE",
                            "scope": "NONE",
                            "permissions": [
                                {
                                    "principal": "SELF",
                                    "action": "READ_ONLY"
                                }
                            ],
                            "master": {
                                "type": "PROFILE_MASTER"
                            }
                        },
                        "honorificSuffix": {
                            "title": "Honorific suffix",
                            "type": "string",
                            "mutability": "READ_WRITE",
                            "scope": "NONE",
                            "permissions": [
                                {
                                    "principal": "SELF",
                                    "action": "READ_ONLY"
                                }
                            ],
                            "master": {
                                "type": "PROFILE_MASTER"
                            }
                        },
                        "email": {
                            "title": "Primary email",
                            "type": "string",
                            "required": true,
                            "format": "email",
                            "mutability": "READ_WRITE",
                            "scope": "NONE",
                            "permissions": [
                                {
                                    "principal": "SELF",
                                    "action": "READ_WRITE"
                                }
                            ],
                            "master": {
                                "type": "PROFILE_MASTER"
                            }
                        },
                        "title": {
                            "title": "Title",
                            "type": "string",
                            "mutability": "READ_WRITE",
                            "scope": "NONE",
                            "permissions": [
                                {
                                    "principal": "SELF",
                                    "action": "READ_ONLY"
                                }
                            ],
                            "master": {
                                "type": "PROFILE_MASTER"
                            }
                        },
                        "displayName": {
                            "title": "Display name",
                            "type": "string",
                            "mutability": "READ_WRITE",
                            "scope": "NONE",
                            "permissions": [
                                {
                                    "principal": "SELF",
                                    "action": "READ_ONLY"
                                }
                            ],
                            "master": {
                                "type": "PROFILE_MASTER"
                            }
                        },
                        "nickName": {
                            "title": "Nickname",
                            "type": "string",
                            "mutability": "READ_WRITE",
                            "scope": "NONE",
                            "permissions": [
                                {
                                    "principal": "SELF",
                                    "action": "READ_ONLY"
                                }
                            ],
                            "master": {
                                "type": "PROFILE_MASTER"
                            }
                        },
                        "profileUrl": {
                            "title": "Profile Url",
                            "type": "string",
                            "format": "uri",
                            "mutability": "READ_WRITE",
                            "scope": "NONE",
                            "permissions": [
                                {
                                    "principal": "SELF",
                                    "action": "READ_ONLY"
                                }
                            ],
                            "master": {
                                "type": "PROFILE_MASTER"
                            }
                        },
                        "secondEmail": {
                            "title": "Secondary email",
                            "type": "string",
                            "format": "email",
                            "mutability": "READ_WRITE",
                            "scope": "NONE",
                            "permissions": [
                                {
                                    "principal": "SELF",
                                    "action": "READ_WRITE"
                                }
                            ],
                            "master": {
                                "type": "PROFILE_MASTER"
                            }
                        },
                        "mobilePhone": {
                            "title": "Mobile phone",
                            "type": "string",
                            "mutability": "READ_WRITE",
                            "scope": "NONE",
                            "maxLength": 100,
                            "permissions": [
                                {
                                    "principal": "SELF",
                                    "action": "READ_WRITE"
                                }
                            ],
                            "master": {
                                "type": "PROFILE_MASTER"
                            }
                        },
                        "primaryPhone": {
                            "title": "Primary phone",
                            "type": "string",
                            "mutability": "READ_WRITE",
                            "scope": "NONE",
                            "maxLength": 100,
                            "permissions": [
                                {
                                    "principal": "SELF",
                                    "action": "HIDE"
                                }
                            ],
                            "master": {
                                "type": "PROFILE_MASTER"
                            }
                        },
                        "streetAddress": {
                            "title": "Street address",
                            "type": "string",
                            "mutability": "READ_WRITE",
                            "scope": "NONE",
                            "permissions": [
                                {
                                    "principal": "SELF",
                                    "action": "HIDE"
                                }
                            ],
                            "master": {
                                "type": "PROFILE_MASTER"
                            }
                        },
                        "city": {
                            "title": "City",
                            "type": "string",
                            "mutability": "READ_WRITE",
                            "scope": "NONE",
                            "permissions": [
                                {
                                    "principal": "SELF",
                                    "action": "HIDE"
                                }
                            ],
                            "master": {
                                "type": "PROFILE_MASTER"
                            }
                        },
                        "state": {
                            "title": "State",
                            "type": "string",
                            "mutability": "READ_WRITE",
                            "scope": "NONE",
                            "permissions": [
                                {
                                    "principal": "SELF",
                                    "action": "HIDE"
                                }
                            ],
                            "master": {
                                "type": "PROFILE_MASTER"
                            }
                        },
                        "zipCode": {
                            "title": "Zip code",
                            "type": "string",
                            "mutability": "READ_WRITE",
                            "scope": "NONE",
                            "permissions": [
                                {
                                    "principal": "SELF",
                                    "action": "HIDE"
                                }
                            ],
                            "master": {
                                "type": "PROFILE_MASTER"
                            }
                        },
                        "countryCode": {
                            "title": "Country code",
                            "type": "string",
                            "format": "country-code",
                            "mutability": "READ_WRITE",
                            "scope": "NONE",
                            "permissions": [
                                {
                                    "principal": "SELF",
                                    "action": "HIDE"
                                }
                            ],
                            "master": {
                                "type": "PROFILE_MASTER"
                            }
                        },
                        "postalAddress": {
                            "title": "Postal Address",
                            "type": "string",
                            "mutability": "READ_WRITE",
                            "scope": "NONE",
                            "permissions": [
                                {
                                    "principal": "SELF",
                                    "action": "HIDE"
                                }
                            ],
                            "master": {
                                "type": "PROFILE_MASTER"
                            }
                        },
                        "preferredLanguage": {
                            "title": "Preferred language",
                            "type": "string",
                            "format": "language-code",
                            "mutability": "READ_WRITE",
                            "scope": "NONE",
                            "permissions": [
                                {
                                    "principal": "SELF",
                                    "action": "READ_ONLY"
                                }
                            ],
                            "master": {
                                "type": "PROFILE_MASTER"
                            }
                        },
                        "locale": {
                            "title": "Locale",
                            "type": "string",
                            "format": "locale",
                            "mutability": "READ_WRITE",
                            "scope": "NONE",
                            "permissions": [
                                {
                                    "principal": "SELF",
                                    "action": "READ_ONLY"
                                }
                            ],
                            "master": {
                                "type": "PROFILE_MASTER"
                            }
                        },
                        "timezone": {
                            "title": "Time zone",
                            "type": "string",
                            "format": "timezone",
                            "mutability": "READ_WRITE",
                            "scope": "NONE",
                            "permissions": [
                                {
                                    "principal": "SELF",
                                    "action": "READ_ONLY"
                                }
                            ],
                            "master": {
                                "type": "PROFILE_MASTER"
                            }
                        },
                        "userType": {
                            "title": "User type",
                            "type": "string",
                            "mutability": "READ_WRITE",
                            "scope": "NONE",
                            "permissions": [
                                {
                                    "principal": "SELF",
                                    "action": "READ_ONLY"
                                }
                            ],
                            "master": {
                                "type": "PROFILE_MASTER"
                            }
                        },
                        "employeeNumber": {
                            "title": "Employee number",
                            "type": "string",
                            "mutability": "READ_WRITE",
                            "scope": "NONE",
                            "permissions": [
                                {
                                    "principal": "SELF",
                                    "action": "READ_ONLY"
                                }
                            ],
                            "master": {
                                "type": "PROFILE_MASTER"
                            }
                        },
                        "costCenter": {
                            "title": "Cost center",
                            "type": "string",
                            "mutability": "READ_WRITE",
                            "scope": "NONE",
                            "permissions": [
                                {
                                    "principal": "SELF",
                                    "action": "READ_ONLY"
                                }
                            ],
                            "master": {
                                "type": "PROFILE_MASTER"
                            }
                        },
                        "organization": {
                            "title": "Organization",
                            "type": "string",
                            "mutability": "READ_WRITE",
                            "scope": "NONE",
                            "permissions": [
                                {
                                    "principal": "SELF",
                                    "action": "READ_ONLY"
                                }
                            ],
                            "master": {
                                "type": "PROFILE_MASTER"
                            }
                        },
                        "division": {
                            "title": "Division",
                            "type": "string",
                            "mutability": "READ_WRITE",
                            "scope": "NONE",
                            "permissions": [
                                {
                                    "principal": "SELF",
                                    "action": "READ_ONLY"
                                }
                            ],
                            "master": {
                                "type": "PROFILE_MASTER"
                            }
                        },
                        "department": {
                            "title": "Department",
                            "type": "string",
                            "mutability": "READ_WRITE",
                            "scope": "NONE",
                            "permissions": [
                                {
                                    "principal": "SELF",
                                    "action": "READ_ONLY"
                                }
                            ],
                            "master": {
                                "type": "PROFILE_MASTER"
                            }
                        },
                        "managerId": {
                            "title": "ManagerId",
                            "type": "string",
                            "mutability": "READ_WRITE",
                            "scope": "NONE",
                            "permissions": [
                                {
                                    "principal": "SELF",
                                    "action": "READ_ONLY"
                                }
                            ],
                            "master": {
                                "type": "PROFILE_MASTER"
                            }
                        },
                        "manager": {
                            "title": "Manager",
                            "type": "string",
                            "mutability": "READ_WRITE",
                            "scope": "NONE",
                            "permissions": [
                                {
                                    "principal": "SELF",
                                    "action": "READ_ONLY"
                                }
                            ],
                            "master": {
                                "type": "PROFILE_MASTER"
                            }
                        }
                    },
                    "required": [
                        "login",
                        "firstName",
                        "lastName",
                        "email"
                    ]
                }
            },
            "type": "object",
            "properties": {
                "profile": {
                    "allOf": [
                        {
                            "$ref": "#/definitions/custom"
                        },
                        {
                            "$ref": "#/definitions/base"
                        }
                    ]
                }
            }
        };

        var responseObj = {}
        responseObj.oktaJsonResponse = json
        resolve(responseObj)

    })
}

compareUserProfile  = function ( requestObj ) {
    return new Promise((resolve) => {
        console.log("compareUserProfile()");
        requestObj.requestAttributes = []

        function attributeExistsUserProfile ( attribute) {
            requestObj.userProfile.hasOwnProperty(attribute)
            return (requestObj.userProfile.profile.hasOwnProperty(attribute))
        }

            for (var key in requestObj.requiredAttributes) {
                if (requestObj.requiredAttributes.hasOwnProperty(key)) {
                    var val = requestObj.requiredAttributes[key];
                    // console.log(JSON.stringify(val));
                    if ( !attributeExistsUserProfile(val.title)) {
                        requestObj.requestAttributes.push ( val )
                    }
                }
            }
        resolve(requestObj)
    })
}


renderHtml  = function ( requestObj ) {

    return new Promise((resolve) => {
        console.log("renderHtml()");
        requestObj.html = "<html>"
        for (var key in requestObj.requestAttributes) {
            if (requestObj.requestAttributes.hasOwnProperty(key)) {
                var val = requestObj.requestAttributes[key];
                // console.log(JSON.stringify(val));
                requestObj.html +="<p>"+val.title+"<p/><br>"
            }
        }

        requestObj.html +="</html>"
        resolve(requestObj)
    })
}

readHtmlFile = function ( filename ) {

    return new Promise ( (resolve, reject)=> {
        console.log("readHtmlFile('" + filename + "')");

        fs.readFile(filename, function(err, data) {
            if ( err ) reject ( err )

            resolve (data.toString())

        });

    })
}


