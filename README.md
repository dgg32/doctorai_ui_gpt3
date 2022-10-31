# Welcome to Doctor.ai React Front-end 

This is the React front-end app for Doctor.ai, our proud submission to the SINGAPORE HEALTHCARE AI DATATHON AND EXPO 2021 (https://www.nus-datathon.com/).



## To try this on your computer

### `npm start`

Runs the app in the development mode.

In DoctorAI_gpt3.js, you need to set the Neo4j connection detail in Line 17. And you also need to set the GPT-3 secret key in Line 23.

## To try this on the cloud

Please refer to our [article in Medium](https://medium.com/p/1396d1cd6fa5).

## On the client side

You need to add the https://[EC_public_ip]:7687 as exception in your browser. Otherwise the browser will complain "WebSocket connection failure".

For example, when you enter https://[EC_public_ip]:7687 in your browser, you will see this page:


![security_exception_4](https://user-images.githubusercontent.com/1873196/198913814-7021eaa2-1210-40f7-a60f-61618ed2332a.png)

Click Advanced...

![security_exception_5](https://user-images.githubusercontent.com/1873196/198913834-afc597fb-ff97-4642-ab64-f775b9112d45.png)

And click Accept the Risk and Continue. You will be greeted by a page like this.
![security_exception_6](https://user-images.githubusercontent.com/1873196/198913881-8d45795c-ec63-4f71-ae68-5cd4ddb5c312.png)

Then, your browser will allow the communication with the Neo4j backend.




## Authors
*  **Sixing Huang**
*  **Maruthi Prithivirajan**

## Supported by

*  **Derek Ding**
*  **Emil Pastor**
*  **Irwan Butar Butar**
*  **Shiny Zhu**
