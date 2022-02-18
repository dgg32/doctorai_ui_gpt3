
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Loading } from 'react-simple-chatbot';

import Speech from 'speak-tts'


const CONFIDENTIAL = "[CONFIDENTIAL]";
const speech = new Speech()
require('dotenv').config()


const { Configuration, OpenAIApi } = require("openai");
const neo4j = require('neo4j-driver')

console.log("process.env.NEO4JURI", process.env.NEO4JURI);


const driver = neo4j.driver(process.env.NEO4JURI, neo4j.auth.basic(process.env.NEO4JUSER, process.env.NEO4JPASSWORD))
const session = driver.session()

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

//console.log("OPENAI_API_KEY", process.env.OPENAI_API_KEY);


speech.init({
  'volume': 1,
  'lang': 'en-GB',
  'rate': 1,
  'pitch': 1,
  'voice': 'Google UK English Male',
  'splitSentences': true,
  'listeners': {
    'onvoiceschanged': (voices) => {
      console.log("Event voiceschanged", voices)
    }
  }
})

class DoctorAI extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      result: ''
    };

    this.triggetNext = this.triggetNext.bind(this);
  }

  callDoctorAI() {

    console.log(process.env)

    const self = this;
    const { steps } = this.props;
    const search = steps.user.value;

    // const lexParams = {
    //   credentials: {accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY, secretAccessKey: process.env.REACT_APP_AWS_SECRET},
    //   userId: process.env.REACT_APP_AWS_USERID, 
    //   region: process.env.REACT_APP_AWS_REGION
    //   //region: "us-east-1"
    // };

    // const input = {
    //     //botAliasId: process.env.REACT_APP_LEX_botAliasId,
    //     botAliasId: "TSTALIASID",
    //     botId: process.env.REACT_APP_LEX_botId,
    //     //localeId: process.env.REACT_APP_LEX_localeId,
    //     //sessionId: process.env.REACT_APP_LEX_sessionId,
    //     localeId: "en_US",
    //     sessionId: "test_session",
    //     requestContentType: 'text/plain; charset=utf-8',
    //     text: search
    // }

    //const client = new LexRuntimeV2Client(lexParams);
    //const command = new RecognizeTextCommand(input);
    //console.log(command);

    async function callAsync() {
      let training = `
#How many times did patient id_1 visit the ICU?
MATCH (p:Patient {patient_id: "id_1"})-[:HAS_STAY]->(v:PatientUnitStay) RETURN COUNT(v)

#When did patient id_1 visit the ICU?
MATCH (p:Patient {patient_id: "id_1"})-[:HAS_STAY]->(v:PatientUnitStay) RETURN v.hospitaldischargeyear

#Which drug treats COVID-19?
MATCH (d:Compound)-[:treats]->(c:Disease {name: "COVID-19"}) RETURN d.name


#Which pathogen causes Kyasanur Forest disease?
MATCH (o:Pathogen)-[:causes]->(d:Disease {name: "Kyasanur Forest disease"}) RETURN o.name


#Which pathogen causes COVID-19?
MATCH (o:Pathogen)-[:causes]->(d:Disease {name: "COVID-19"}) RETURN o.name

#Which gene causes Christianson syndrome?
MATCH (g:Gene)-[r1:associates]->(d:Disease {name: "Christianson syndrome"}) RETURN g.name

#Tell me something about the disease named "Christianson syndrome"
MATCH (d:Disease {name: "Christianson syndrome"}) RETURN d.description


#I have Dyspepsia, Hiccup and Edema. What can be the cause of this?
MATCH (s1:Symptom {name: "Dyspepsia"}) <-[:presents]- (d:Disease) MATCH (s2:Symptom {name: "Hiccup"}) <-[:presents]- (d:Disease) MATCH (s3:Symptom {name: "Edema"}) <-[:presents]- (d:Disease) RETURN d.name


#`;

      //let Your_question = "Tell me something about the disease called COVID-19?";

      let query = training + search + "\n"


      let cypher = ''
      let textToSpeak = ''
      try {
        console.log("query", query)
        if (search) {
          //console.log("command", command);
          //const response = await client.send(command);
          const response = await openai.createCompletion("davinci", {
            prompt: query,
            temperature: 0,
            max_tokens: 150,
            top_p: 1.0,
            frequency_penalty: 0.0,
            presence_penalty: 0.0,
            stop: ["#", ";"],
          });

          console.log('response:', response);
          cypher = response.data.choices[0].text;
          console.log('Doctor AI:' + cypher);

          try {
            const result = await session.run(cypher)

            //const singleRecord = result.records[0]

            const records = result.records

            records.forEach(element => {
              textToSpeak += element.get(0) + ", "
            });

            //textToSpeak = singleRecord.get(0)
            textToSpeak = textToSpeak.slice(0, -2)

            console.log("records", records)
          } finally {
            //await session.close()
          }

          // on application exit:
          //await driver.close()
        }
      }
      catch (error) {
        console.log(process.env);
        console.error(error)
        console.log('Doctor AI:' + textToSpeak);
        textToSpeak = "Sorry I can't answer that. Could you please try again?"
      }

      let isConfidential = false;
      if (textToSpeak.startsWith(CONFIDENTIAL)) {
        isConfidential = true;
        // textToSpeak = textToSpeak.substring(CONFIDENTIAL.length)
      }

      self.setState({ loading: false, result: textToSpeak });

      if (isConfidential || textToSpeak.length > 115) {
        speech.speak({ text: "Please find the information below" })
          .then(() => { console.log("Success !") })
          .catch(e => { console.error("An error occurred :", e) })
      } else {
        speech.speak({ text: textToSpeak })
          .then(() => { console.log("Success !") })
          .catch(e => { console.error("An error occurred :", e) })
      }

    }
    callAsync();
  }

  triggetNext() {
    this.setState({}, () => {
      this.props.triggerNextStep();
    });
  }

  componentDidMount() {
    this.callDoctorAI();
    this.triggetNext();
  }

  render() {
    const { loading, result } = this.state;
    const lines = result.split("\n");
    const elements = [];
    for (const [index, value] of lines.entries()) {
      elements.push(<span key={index}>{value}<br /></span>)
    }

    return (
      <div className="bot-response">
        {loading ? <Loading /> : elements}
      </div>
    );
  }
}

DoctorAI.propTypes = {
  steps: PropTypes.object,
  triggerNextStep: PropTypes.func,
};

DoctorAI.defaultProps = {
  steps: undefined,
  triggerNextStep: undefined,
};

export default DoctorAI;
