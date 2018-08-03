var http = require('http');
var url = require('url');
var fs = require('fs');
var path = require('path');
var request = require("request");
var qs = require('querystring');

// Environment variables required
// appBaseUrl = base URL for the application i.e. https://www.myapp.com
// oktaAuthServerId = Okta Auth Server Id
// oktaClientId = Okta OIDC app client Id
// oktaClientSecret = Okta OIDC app client secret
// oktaKey = Okta api key
// oktaOrg = url okta org example: https://okta.okta.com
// oktaRedirectUri = Redirect URL specified in Okta OIDC App

if(!process.env.oktaOrg && 
    !process.env.oktaKey  &&
    !process.env.appBaseUrl &&
    !process.env.oktaAppId &&
    !process.env.oktaAuthServerId &&
    !process.env.oktaClientId &&
    !process.env.oktaClientSecret &&
    !process.env.oktaRedirectUri) {
    console.log('environment variables not set, set them like this:');
    console.log('export appBaseUrl="https://www.myapp.com"');
    console.log('export oktaAppId="Okta app Id this app corrisponds to"');
    console.log('export oktaAuthServerId="yourOktaAuthServerId"');
    console.log('export oktaClientId="yourOktaAppClientId"');
    console.log('export oktaClientSecret="YourOktaAppClientSecret"');
    console.log('export oktaOrg="https://okta.okta.com"');
    console.log('export oktaKey="yourOktaAPIKey"');
    console.log('export oktaRedirectUri="https://www.myapp.com/oidc"');
    return;
}

var tokenizedValues = {
    "oktaOrg": process.env.oktaOrg,
    "oktaClientId": process.env.oktaClientId,
    "oktaRedirectUri": process.env.oktaRedirectUri,
    "oktaAuthServerId": process.env.oktaAuthServerId,
    "appBaseUrl": process.env.appBaseUrl
}

http.createServer(function (req, res) {
    //Routing rules
    console.log("Request URL: '" + req.url + "'");
    var parsedUrl = req.url;
    var queryParamIndex = parsedUrl.indexOf("?");
    
    if(queryParamIndex != -1) {
        parsedUrl = parsedUrl.substr(0, queryParamIndex);
    }
    
    console.log("Parsed URL: " + parsedUrl);
    switch(parsedUrl) {
        case "/":
            handleRoot(req, res);
            break;
        case "/index.html":
            handleRoot(req, res);
            break;
        case "/about.html":
        case "/codes.html":
        case "/contact.html":
        case "/gallery.html":
            handlePage(req, res);
            break;
        case "/userprofile":
            handleUserProfile(req, res);
            break;
        case "/createuser":
            handleCreateUser(req, res);
            break;
        case "/progrssiveprofile":
            handleProgressiveProfile(req, res);
        case "/oidc":
            handleOidcCode(req, res);
            break;
        case "/logout":
            console.log("HERE");
            logOut(req, res);
            break;
        case "/test":
            progresiveProfile(req, res);
            break;
        default:
            //NOTE: This will generically rout to the web folder for static html files
            displayDefault(req, res);
            break;
    }
    
}).listen(process.env.PORT, process.env.IP);

handleProgressiveProfile = function(req, res) {
    console.log("handleProgressiveProfile()");
    
    // Update profile to decrement by one so as to not keep nagging user
    // Pull json down for display
    var jsonResponse = {
        "success": false,
        "message": ""
    }
    
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(jsonResponse), "utf-8");
}


handleCreateUser = function(req, res) {
    console.log("handleCreateUser()");
    
    //Reas JSON request
    if (req.method == 'POST') {
        var jsonReqest = "";
        
        req.on("data", function (data) {
            jsonReqest += data;
        });
        
        req.on("end", function () {
            console.log("jsonReqest: " + jsonReqest);
            var parsedJsonRequest = JSON.parse(jsonReqest);
            
            // return JSON
            var jsonResponse = {
                "success": false,
                "message": ""
            }
            
            if(parsedJsonRequest.password == parsedJsonRequest.confirmPassword) {
                var oktaCreateUserJSON = {
                    "profile": {
                        "firstName": parsedJsonRequest.firstName,
                        "lastName": parsedJsonRequest.lastName,
                        "email": parsedJsonRequest.email,
                        "login": parsedJsonRequest.email
                    },
                    "credentials": {
                        "password": {"value": parsedJsonRequest.password}
                    }
                }
                
                // Call Okta
                var options = {
                    "method": "POST",
                    "url": process.env.oktaOrg + "/api/v1/users?activate=true",
                    "body": JSON.stringify(oktaCreateUserJSON),
                    "headers": {
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                        "Authorization": "SSWS " + process.env.oktaKey
                    }
                };
                
                request(options, function (error, response, body) {
                    console.log("Called Okta Create User");
                    
                    if (error) {
                        console.log("Error!");
                        console.log(error);
                        jsonResponse.error = error;
                        jsonResponse.message = "Failed to create user.";
                        jsonResponse.response = body;
                    } else {
                        console.log("No Server Error but possible Okta Error");
                        //console.log(body);
                        jsonResponse.success = true;
                        jsonResponse.message = "Successfully created user!";
                        jsonResponse.response = JSON.parse(body);
                        
                        //console.log(jsonResponse);
                    }
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify(jsonResponse), "utf-8");
                });
            } else {
                jsonResponse.message = "Passwords do not match"
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify(jsonResponse), "utf-8");
            }
            
        });
    }
}

handleUserProfile = function(req, res) {
    console.log("handleUserProfile()");
    var requestObj = {}

    requestObj.filename = "./web/userprofile.html";
    readHtmlFile(requestObj).then((requestObj)=>{
        applyFragment("fragmentHeader.html", requestObj).then( (requestObj) => {
            applyTokenizedValues(tokenizedValues, requestObj).then((requestObj) => {
                res.writeHead(200, { 'Content-Type': requestObj.contentType });
                //console.log(res);
                res.end(requestObj.data, "utf-8");
            });
        });
    }).catch((error) => {
        console.log(error);
        res.statusCode = 200;
        res.end("");
    });
}

handlePage = function(req, res) {
    console.log("handlePage()");
    var requestObj = {}

    requestObj.filename = "./web" + req.url;
    readHtmlFile(requestObj).then( (requestObj) => {
        applyFragment("fragmentHeader.html", requestObj).then( (requestObj) => {
            applyTokenizedValues(tokenizedValues, requestObj).then((requestObj) => {
                res.writeHead(200, { 'Content-Type': requestObj.contentType });
                //console.log(res);
                res.end(requestObj.data, "utf-8");
            });
        });
    }).catch((error) => {
        console.log(error);
        res.statusCode = 200;
        res.end("");
    });
}

handleRoot = function(req, res) {
    console.log("handleRoot()");
    var requestObj = {}

    requestObj.filename = "./web/index.html";
    readHtmlFile(requestObj).then((requestObj)=>{
        applyTokenizedValues(tokenizedValues, requestObj).then((requestObj) => {
            res.writeHead(200, { 'Content-Type': requestObj.contentType });
            //console.log(res);
            res.end(requestObj.data, "utf-8");
        });
    }).catch((error) => {
        console.log(error);
        res.statusCode = 200;
        res.end("");
    });
}

handleOidcCode = function(req, res) {
    console.log("handleOidcCode()");
    if (req.method == 'POST') {
        var body = "";
        req.on("data", function (data) {
            body += data;
        });
        req.on("end", function () {
            console.log("Body: " + body);
            
            formBody = qs.parse(body)
            console.log("code: " + formBody.code);
            
            getOIDCTokens(formBody.code).then(incrementProgressiveProfileLogin).then((results) => {
                //console.log(results);
                var tokenResponse = JSON.parse(results);
                res.writeHead(302, {
                    "Location": process.env.appBaseUrl,
                    "Set-Cookie": ["access_token=" + tokenResponse.access_token, "id_token=" + tokenResponse.id_token]
                });
                res.end();
            })
        });
    } else {
        // redirect back to root
        res.writeHead(302, {"Location": process.env.appBaseUrl});
        res.end();
    }
}

logOut = function(req, res) {
    console.log("logOut()");
    res.writeHead(200, { 
        "Set-Cookie": ["access_token=", "id_token="]
    });
    res.end("<script>location.href='" + process.env.oktaOrg + "/login/signout?fromURI=" + process.env.appBaseUrl + "';</script>");
}

progresiveProfile = function(req, res) {
    console.log("progresiveProfile");
    var requestObj = {}

    requestObj.filename = "index.html"

    //requestObj.requestAttributes (These are the attributes we want)
    //requestObj.fragment (Fields we are going to add to form)
    //requestObj.html (webpage w/ form)
    //requestObj.userProfile (Okta User Profile)
    //requestObj.require dAttributes (array of required Attributes according to Schema)

    //todo: Need to get the UserID, I tested in statically
    //requestObj.userid (guid or something to identify the User in Okta)

    fakeGetJson ( requestObj). //get Schema from Okta
        then ( getUserProfile ). //get Selected User Profile //todo: need to update to fetch Specific User profile
        then ( requiredObjects). //find required attributes
        then ( compareUserProfile). //compare it to user profile
        then ( getFragments). //generate the fragments
        then ( readHtmlFile). //pull html from filesystem
        then ( (requestObj)=> { //replace {{fragment}} tag in HTML w/ new elements

        res.end (requestObj.data.toString().replace(/{{fragment}}/g, requestObj.fragment))
            // console.log(fragment)
            // res.end(html);
        }).catch ( (error)=> {
            console.log(error)
        });
}

displayDefault = function(req, res) {
    var requestObj = {}
    requestObj.filename = "./web" + req.url
    
    readHtmlFile(requestObj).then((requestObj) => {
        res.writeHead(200, { 'Content-Type': requestObj.contentType });
        res.end(requestObj.data, "utf-8");
    }).catch((error) => {
        console.log(error); 
        res.statusCode = 200;
        res.end("");
    });
}

incrementProgressiveProfileLogin = function(body) {
    console.log("incrementProgressiveProfileLogin");
    return new Promise((resolve, reject) => {
        try {
            var resolveBody = body;
            var json = JSON.parse(body);
            
            console.log("ID_TOKEN");
            //console.log(json.id_token);
            //TODO: Introspect toke to make sure it is valid
            
            var idTokenJSON = parseIdToken(json.id_token);
            
            var oktaUser = idTokenJSON.sub;
            console.log("UserId: " + oktaUser);
            
            // Call Okta
            var options = {
                "method": "GET",
                "url": process.env.oktaOrg + "/api/v1/apps/" + process.env.oktaAppId + "/users/" + oktaUser,
                "headers": {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Authorization": "SSWS " + process.env.oktaKey
                }
            };
            
            request(options, function (error, response, body) {
                console.log("Called Okta Get App User Profile");
                var updateAppUserProfile = false;
                var jsonAppUserProfile = JSON.parse(body);
                
                if(isNaN(jsonAppUserProfile.profile.currentNumLogins)) {
                    jsonAppUserProfile.profile.currentNumLogins = 1;
                    updateAppUserProfile = true;
                } else {
                    if(jsonAppUserProfile.profile.currentNumLogins <= jsonAppUserProfile.profile.promptAfterNumLogins) {
                        jsonAppUserProfile.profile.currentNumLogins++;
                        updateAppUserProfile = true;
                    }
                }
                
                if(updateAppUserProfile) {
                    var options = {
                        "method": "POST",
                        "url": process.env.oktaOrg + "/api/v1/apps/" + process.env.oktaAppId + "/users/" + oktaUser,
                        "body": JSON.stringify(jsonAppUserProfile),
                        "headers": {
                            "Accept": "application/json",
                            "Content-Type": "application/json",
                            "Authorization": "SSWS " + process.env.oktaKey
                        }
                    };
                    
                    request(options, function (error, response, body) {
                        console.log("Called Okta Update App User Profile");
                        //TODO: Handle errors
                        console.log("body")
                        resolve(resolveBody);
                    });
                } else {
                    resolve(resolveBody);
                }
                
                
            });
        } catch (err) {
            reject(err);
        }
        
    });
}

getOIDCTokens = function(code) {
    console.log("getOIDCTokens()");
    return new Promise((resolve, reject) => {
        var url = process.env.oktaOrg+ "/oauth2/" + process.env.oktaAuthServerId + "/v1/token?" +
            "grant_type=authorization_code&" + 
            "code=" + code + "&" + 
            "redirect_uri=" + process.env.oktaRedirectUri;
            
        console.log("token url: " + url);
        
        var options = {
            "method": "POST",
            "url": url,
            "body": "authorization_code=" + code,
            "headers": {
                "Accept": "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": "Basic " + Buffer.from(process.env.oktaClientId + ":" + process.env.oktaClientSecret).toString("base64")
            }
        };
        
        request(options, function (error, response, body) {
            if (error) reject ( error )
            //console.log(body);
            resolve(body)
        });
        
    });
}

getSchema = function (requestObj) {
    return new Promise((resolve, reject) => {

        var options = {
            method: 'GET',
            url: 'https://companyx.okta.com/api/v1/meta/schemas/user/default',
            headers:
                {
                    authorization: 'SSWS ' + process.env.oktaKey,
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

//todo: Junk this, just used to test on plane
fakeGetJson  = function ( requestObj ) {
    return new Promise((resolve) => {
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
                            "description": "Tester 2 Description",
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
        requestObj.data = "<html>"
        for (var key in requestObj.requestAttributes) {
            if (requestObj.requestAttributes.hasOwnProperty(key)) {
                var val = requestObj.requestAttributes[key];
                // console.log(JSON.stringify(val));
                requestObj.data +="<p>"+val.title+"<p/><br>"
            }
        }
        requestObj.data +="</html>"
        resolve(requestObj)
    })
}

readHtmlFile = function ( requestObj ) {
    return new Promise ( (resolve, reject)=> {
        
        var extname = path.extname(requestObj.filename);
        var contentType = 'text/html';
        switch (extname) {
            case '.js':
                contentType = 'text/javascript';
                break;
            case '.css':
                contentType = 'text/css';
                break;
            case '.json':
                contentType = 'application/json';
                break;
            case '.png':
                contentType = 'image/png';
                break;      
            case '.jpg':
                contentType = 'image/jpg';
                break;
            case '.wav':
                contentType = 'audio/wav';
                break;
        }

        requestObj.contentType = contentType;
        
        //Enable for debugging
        //console.log("requestObj.filename: " + requestObj.filename);
        fs.readFile(requestObj.filename, function(err, data) {
            if ( err ) reject ( err )
            requestObj.data = data;
            resolve (requestObj)
        });
    })
}

applyTokenizedValues = function (values, requestObj) {
    return new Promise( (resolve, reject) => { 
        //console.log(values);
        
        var tempHtml = requestObj.data.toString(); 
        for (key in values) {
            if(values.hasOwnProperty(key)) {
                var val = values[key];
                tempHtml = tempHtml.replace(new RegExp("{{" + key + "}}", 'g'), val);
            }
        }
        requestObj.data = tempHtml;
        
        resolve(requestObj);
    });
}

getFragments = function ( requestObj ) {
    return new Promise ( (resolve, reject)=> {
        fs.readFile("fragment.html", function(err, fragment) {
            if ( err ) reject ( err )

            requestObj.fragment = ""
            fragmentOriginal = fragment.toString();

            for (var key in requestObj.requestAttributes) {
                if (requestObj.requestAttributes.hasOwnProperty(key)) {
                    var val = requestObj.requestAttributes[key];
                    var temp = fragmentOriginal.replace(/{{tag}}/g, val.title).
                        replace(/{{description}}/g, val.description);
                    requestObj.fragment+=temp
                    // console.log(requestObj.fragment)
                }
            }
            resolve ( requestObj )
        });
    })
}

applyFragment = function (fragmentFileName, requestObj) {
    console.log("applyFragment() " + fragmentFileName);
    return new Promise((resolve, reject) => {
        fs.readFile(fragmentFileName, function(err, fragment) {
            if ( err ) reject ( err )

            var values = {};
            values[fragmentFileName] = fragment.toString();
            
            //console.log(values);
            
            applyTokenizedValues(values, requestObj).then((requestObj) => {
                resolve ( requestObj )
            });
            
        });
    });
}

parseIdToken = function(rawIdToken) {
    console.log("parseIdToken()");
    
    var tempIdToken = rawIdToken;
    //console.log("tempIdToken: " + tempIdToken);
    tempIdToken = tempIdToken.substr(tempIdToken.indexOf(".") + 1, tempIdToken.length);
    //console.log("tempIdToken: " + tempIdToken);
    tempIdToken = tempIdToken.substr(0, tempIdToken.indexOf("."));
    //console.log("tempIdToken: " + tempIdToken);
    var idToken = new Buffer(tempIdToken, 'base64').toString("utf-8");
    console.log(idToken);
    
    return JSON.parse(idToken);
}
