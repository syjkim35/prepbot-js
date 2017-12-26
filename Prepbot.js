/**
 Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

 http://aws.amazon.com/apache2.0/

 or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

console.log('Loading function');

const doc = require('dynamodb-doc');

const dynamo = new doc.DynamoDB();


exports.handler = (event, context, callback) => {
    //console.log('Received event:', JSON.stringify(event, null, 2));
    if (event.httpMethod) {
        const done = (err, res) => callback(null, {
            statusCode: err ? '400' : '200',
            body: err ? err.message : JSON.stringify(res),
            headers: {
            'Content-Type': 'application/json', 'Access-Control-Allow-Headers': 'x-requested-with',
            "Access-Control-Allow-Origin" : "*", "Access-Control-Allow-Credentials" : true,
            },
        });

        switch (event.httpMethod) {
        case 'DELETE':
            dynamo.deleteItem(JSON.parse(event.body), done);
            break;
        case 'GET':
            dynamo.scan({ TableName: event.queryStringParameters.TableName }, done);
            break;
        case 'POST':
            dynamo.putItem(JSON.parse(event.body), done);
            break;
        case 'PUT':
            dynamo.updateItem(JSON.parse(event.body), done);
            break;
        default:
            done(new Error(`Unsupported method "${event.httpMethod}"`));
        }
    } else {
        try {
            console.log("event.session.application.applicationId=" + event.session.application.applicationId);

            /**
             * Uncomment this if statement and populate with your skill's application ID to
             * prevent someone else from configuring a skill that sends requests to this function.
             */

            // if (event.session.application.applicationId !== "amzn1.ask.skill.dcd6d388-5481-4e6d-b6c5-be2eb46d5637") {
            //     context.fail("Invalid Application ID");
            // }

            if (event.session.new) {
                onSessionStarted({requestId: event.request.requestId}, event.session);
            }

            if (event.request.type === "LaunchRequest") {
                onLaunch(event.request,
                    event.session,
                    function callback(sessionAttributes, speechletResponse) {
                        context.succeed(buildResponse(sessionAttributes, speechletResponse));
                    });
            } else if (event.request.type === "IntentRequest") {
                onIntent(event.request,
                    event.session,
                    function callback(sessionAttributes, speechletResponse) {
                        context.succeed(buildResponse(sessionAttributes, speechletResponse));
                    });
            } else if (event.request.type === "SessionEndedRequest") {
                onSessionEnded(event.request, event.session);
                context.succeed();
            }
        } catch (e) {
            context.fail("Exception: " + e);
        }
    }

    
    
};







/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId
        + ", sessionId=" + session.sessionId);

    

    //fetchDatabase(null);
}

/**
 * Called when the user invokes the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId
        + ", sessionId=" + session.sessionId);
    getWelcomeResponse(callback);
    //retrieveDish("cheese and crackers", session, callback);
}



/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId
        + ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;


    // dispatch custom intents to handlers here
    if ("TypeOfInterviewIntent" === intentName) {
        handleUserRequest(intent, session, callback);
    } else if ("ReadyIntent" === intentName) {
        handleUserRequest(intent, session, callback);
    } else if ("TypeOfTechnicalInterviewIntent" === intentName) {
        handleUserRequest(intent, session, callback);
    } else if ("DetailIntent" === intentName) {
        handleUserRequest(intent, session, callback);
    } else if ("HelpIntent" === intentName) {
        handleUserRequest(intent, session, callback);
    } else if ("NextIntent" === intentName) {
        handleUserRequest(intent, session, callback);
    } else if ("PreviousIntent" === intentName) {
        handleUserRequest(intent, session, callback);
    } else if ("DoneIntent") {
        handleUserRequest(intent, session, callback);
    } else if ("AMAZON.YesIntent" === intentName) {
        handleUserRequest(intent, session, callback);
    } else if ("AMAZON.NoIntent" === intentName) {
        handleUserRequest(intent, session, callback);
    } else if ("AMAZON.StartOverIntent" === intentName) {
        getWelcomeResponse(callback);
    } else if ("AMAZON.RepeatIntent" === intentName) {
        handleRepeatRequest(intent, session, callback);
    } else if ("AMAZON.HelpIntent" === intentName) {cksgml12
        handleGetHelpRequest(intent, session, callback);
    } else if ("AMAZON.StopIntent" === intentName) {
        handleFinishSessionRequest(intent, session, callback);
    } else if ("AMAZON.CancelIntent" === intentName) {
        handleFinishSessionRequest(intent, session, callback);
    } else if ("ExitIntent" === intentName) {
        handleUserRequest(intent, session, callback);
    } else {
        throw "Invalid intent";
    }
}

function retrieveInterviewQuestions (type, session, callback) {
    var response;
    var table;
    var number = session.attributes.number;
    if (type === "behavioral") {
        table = "BehavioralQuestions";
    } else if (type === "investment banking") {
        table = "InvestmentBankingQuestions";
    } else if (type === "data science") {
    	table = "DataScienceQuestion";
    } else if (type === "accounting") {
    	table = "AccountingQuestions"
    }
    var params = {
        TableName: table,
        Key: {
            "Number": number
        }
    }

    dynamo.getItem(params, function(err, data) {
        if (err) {
            response = "error occured. please try again.";
            callback(session.attributes, 
                buildSpeechletResponse(CARD_TITLE, response, "", false));
        } else {
            //console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
            if (data.Item == null) {
                response = "I couldn't find interview questions for " + type + ". There are behavioral, investment banking, and accounting related questions available.";
                callback(session.attributes, 
                    buildSpeechletResponse(CARD_TITLE, response, "", false));
            } else {
                response = "Here is the question. Say 'ready' when you are ready.";
                session.attributes.currentInterviewQuestion = data.Item;
                session.attributes.currentPhase = "OnInterview";
                callback(session.attributes, 
                    buildSpeechletResponse(CARD_TITLE, response, "", false));
            }
            
        }
    });
}

function sendInvalidResponse () {
    callback(session.attributes,
                buildSpeechletResponse(CARD_TITLE, "invalid response. try again.", "", false));
}

function handleUserRequest (intent, session, callback) {
    var intentName = intent.name;

    if (intentName === "TypeOfInterviewIntent") {
        var typeOfInterview = intent.slots.type_of_interview.value;
        session.attributes.currentType = typeOfInterview;
        /* reset index of the question */
        session.attributes.number = 1;
        if (typeOfInterview === "behavioral") {
            retrieveInterviewQuestions (typeOfInterview, session, callback);
        } else if (typeOfInterview === "technical") {
            var response = "what kind of technical question would you like? There are accounting, investment banking, data science."
            callback(session.attributes,
                buildSpeechletResponse(CARD_TITLE, response, "", false));
        } else {
            sendOutErrorMessage ("Invalid type, please try again. There are accounting, investment banking, and data science.")
        }
    } else if (intentName === "TypeOfTechnicalInterviewIntent") {
        var typeOfTechnicalInterview = intent.slots.type_of_technical_interview.value;
        session.attributes.currentType = typeOfTechnicalInterview;
        retrieveInterviewQuestions (typeOfTechnicalInterview, session, callback);

    } else if (intentName === "DetailIntent") {
        var interviewQuestion = session.attributes.currentInterviewQuestion;
        var response = interviewQuestion.Detail;

        callback(session.attributes, 
            buildSpeechletResponse(CARD_TITLE, response, "", false));
    } else if (intentName === "ReadyIntent") {
        // narrate question
        var interviewQuestion = session.attributes.currentInterviewQuestion;
        var response = interviewQuestion.Question;

        callback(session.attributes, 
            buildSpeechletResponse(CARD_TITLE, response, "", false));
    } else if (intentName === "DoneIntent") {
        var response = "Good job, do you want to hear the solution?";
        session.attributes.userPromptForSolution = true;
        callback(session.attributes, 
            buildSpeechletResponse(CARD_TITLE, response, "", false));
    } else if (intentName === "SolutionIntent" || (intentName === "AMAZON.YesIntent" && session.attributes.userPromptForSolution)) {
        // tell solution
        var interviewQuestion = session.attributes.currentInterviewQuestion;
        session.attributes.userPromptForSolution = true;
        var response = interviewQuestion.Solution + ". Do you want to hear it again?";
        if (interviewQuestion) {
            callback(session.attributes, 
                buildSpeechletResponse(CARD_TITLE, response, "", false));
        } else {
            sendOutErrorMessage ("You have to select the type of interview question. What kind do you want?");
        }
    } else if (intentName === "AMAZON.NoIntent" && session.attributes.userPromptForSolution) {
        changeToBeginningState(callback);
    } else if (intentName === "HelpIntent") {
        var response;
        var currentPhase = session.attributes.currentPhase;
        if (currentPhase === "OnInterview") {
            response = "If you want to check the solution, say 'solution'. If you want more details, say 'detail'. If you want to go out, say 'main menu'.";
        } else if (currentPhase === "OnMain") {
            response = "What kind of interview do you want? There are accounting, investment banking, and data science."
        } 
        callback(session.attributes,
            buildSpeechletResponse(CARD_TITLE, response, "", false));
    } else if (intentName === "NextIntent") {
        var interviewQuestion = session.attributes.currentInterviewQuestion;
        session.attributes.userPromptForSolution = false;
        if (interviewQuestion) {
            session.attributes.number = session.attributes.number + 1;
            retrieveInterviewQuestions (session.attributes.currentType, session, callback);
        } else {
            sendOutErrorMessage ("Please select a interview type. For more information about the type, say 'help'");
        }
    } else if (intentName === "PreviousIntent") {
        var interviewQuestion = session.attributes.currentInterviewQuestion;
        if (interviewQuestion) {
            if (session.attributes.number > 1) {
                session.attributes.number = session.attributes.number - 1;
            } else {
                sendOutErrorMessage ("This is the first question.");
            }
            retrieveInterviewQuestions (session.attributes.currentType, session, callback);
        } else {
            sendOutErrorMessage ("Please select a interview type. For more information about the type, say 'help'");
        }

        
        retrieveInterviewQuestions (session.attributes.currentType, session, callback);
    } else if (intentName === "ExitIntent") {
        var currentPhase = session.attributes.currentPhase;
        if (currentPhase === "OnInterview") {
            changeToBeginningState(callback);
        } else if (currentPhase === "OnMain") {
            handleFinishSessionRequest(intent, session, callback)
        }
    }



}

function changeToBeginningState (callback) {
    var sessionAttributes = {},
        speechOutput = "OK, We're on the main menu. What kind of interview would you like to hear again?",
        shouldEndSession = false,


    sessionAttributes = {
        "speechOutput": speechOutput,
        "currentPhase": "OnMain",
        "number": 1,
        "userPromptForSolution": false,
        "currentType": "",
        "currentInterviewQuestion": ""
    };
    

    callback(sessionAttributes,
        buildSpeechletResponse(CARD_TITLE, speechOutput, "", shouldEndSession));
}

function sendOutErrorMessage (msg) {
    callback(session.attributes,
            buildSpeechletResponse(CARD_TITLE, msg, "", false));
}



/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId
        + ", sessionId=" + session.sessionId);

    // Add any cleanup logic here
    callback(session.attributes, 
                    buildSpeechletResponse(CARD_TITLE, "good bye", "", false));
}

// ------- Skill specific business logic -------


var CARD_TITLE = "Prepbot"; // Be sure to change this for your skill.

function getWelcomeResponse(callback) {
    // Initializations
    var sessionAttributes = {},
        speechOutput = "Hi, do you want a behavioral or technical question?",
        shouldEndSession = false,


    sessionAttributes = {
        "speechOutput": speechOutput,
        "currentPhase": "OnMain",
        "number": 1,
        "userPromptForSolution": false,
        "currentType": "",
        "currentInterviewQuestion": ""
    };
    

    callback(sessionAttributes,
        buildSpeechletResponse(CARD_TITLE, speechOutput, "", shouldEndSession));
}

function handleRepeatRequest(intent, session, callback) {
    // Repeat the previous speechOutput and repromptText from the session attributes if available
    // else start a new game session
    if (!session.attributes || !session.attributes.speechOutput) {
        getWelcomeResponse(callback);
    } else {
        callback(session.attributes,
            buildSpeechletResponseWithoutCard(session.attributes.speechOutput, session.attributes.repromptText, false));
    }
}

function handleGetHelpRequest(intent, session, callback) {
    // Provide a help prompt for the user, explaining how the game is played. Then, continue the game
    // if there is one in progress, or provide the option to start another one.
    
    // Ensure that session.attributes has been initialized
    if (!session.attributes) {
        session.attributes = {};
    }

    // Set a flag to track that we're in the Help state.
    session.attributes.userPromptedToContinue = true;

    // Do not edit the help dialogue. This has been created by the Alexa team to demonstrate best practices.

    var speechOutput = "",
        shouldEndSession = false;

    callback(session.attributes,
        buildSpeechletResponseWithoutCard(speechOutput, repromptText, shouldEndSession));
}

function handleFinishSessionRequest(intent, session, callback) {
    // null session attr's

    callback(session.attributes, buildSpeechletResponse(CARD_TITLE, "Good bye!", "", true));    
}



// ------- Helper functions to build responses -------


function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}

