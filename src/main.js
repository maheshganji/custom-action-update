const core = require('@actions/core');
const axios = require('axios');

const main = async() => {
   let status = "NOT-STARTED";
   try{
    console.log('Custom Action - UPDATE => START');    
    const instanceUrl = core.getInput('instance-url', { required: true });
    const username = core.getInput('devops-integration-user-name', { required: true });
    const passwd = core.getInput('devops-integration-user-password', { required: true });
    const changeRequestNumber = core.getInput('change-request-number');//#TODO - Need to add required:true
    
    let changeRequestDetailsStr = core.getInput('change-request-details', { required: true });
    let githubContextStr = core.getInput('context-github', { required: true });

    core.setOutput("status",status);
    try{

        console.log('Calling Update Change Control API to update change.... for changeRequestNumber => '+changeRequestNumber); 
    
        let changeRequestDetails;
    
        if(changeRequestNumber == ""){
            console.error("Please Provide a valid 'Change Request Number' to proceed with Update Change Request"); 
            return;
        }
    
        try {
          changeRequestDetails = JSON.parse(changeRequestDetailsStr);
        } catch (e) {
            console.log(`Unable to parse Error occured with message ${e}`);
            console.error("Failed parsing changeRequestDetails, please provide a valid JSON");
            return;
        }
    
        let githubContext;
    
        try {
            githubContext = JSON.parse(githubContextStr);
        } catch (e) {
            console.log(`Error occured with message ${e}`);
            console.error("Exception parsing github context");
            return;
        }        
        const restendpoint = `${instanceUrl}/api/sn_devops/v1/devops/orchestration/changeInfo?changeRequestNumber=${changeRequestNumber}`;
        let response;
    
        console.log("REST endpoint Url -> 123 "+restendpoint);
    
        try {
            console.log('user name'+ username + ' and the password is'+ passwd);
            const token = `${username}:${passwd}`;
            const encodedToken = Buffer.from(token).toString('base64');
            console.log('token created'+ encodedToken);
    
            const defaultHeaders = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': 'Basic ' + `${encodedToken}`
            };
            let httpHeaders = { headers: defaultHeaders };
            response = axios.put(restendpoint, changeRequestDetailsStr, httpHeaders);
            console.log("response => "+response+", Stringified response => "+JSON.stringify(response));
        } catch (err) {
            if (!err.response) {
                status = "SUCCESS";
                console.log('Update Successful.');            
            }else{

                if (err.message.includes('ECONNREFUSED') || err.message.includes('ENOTFOUND')) {
                    console.error('Invalid ServiceNow Instance URL. Please correct the URL and try again.');
                }
                
                if (err.message.includes('401')) {
                    console.error('Invalid Credentials. Please correct the credentials and try again.');
                }
                    
                if (err.message.includes('405')) {
                    console.error('Response Code from ServiceNow is 405. Please check ServiceNow logs for more details.');
                }
            
                if (err.response.status == 500) {
                    console.error('Response Code from ServiceNow is 500. Please check ServiceNow logs for more details.')
                }
                
                if (err.response.status == 400) {
                    let errMsg = 'ServiceNow DevOps Update Change is not Succesful.';
                    let errMsgSuffix = ' Please provide valid inputs.';
                    let responseData = err.response.data;
                    if (responseData && responseData.error && responseData.error.message) {
                        errMsg = errMsg + responseData.error.message + errMsgSuffix;
                        console.error("Inside, if, errMsg => "+errMsg);
                    } else if (responseData && responseData.result && responseData.result.details && responseData.result.details.errors) {
                        let errors = err.response.data.result.details.errors;
                        for (var index in errors) {
                            errMsg = errMsg + errors[index].message + errMsgSuffix;
                        }
                        console.error("Inside, else-if, errMsg => "+errMsg);
                    }
                }
            }
        }

    }catch(err){
        core.setOutput("status",status);
        core.setFailed(err.message);
    }

   }catch(error){
        core.setOutput("status",status);
       core.setFailed(error.message)
   }
    
}

main();
