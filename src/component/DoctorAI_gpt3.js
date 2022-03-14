
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Loading } from 'react-simple-chatbot';

import Speech from 'speak-tts'


const CONFIDENTIAL = "[CONFIDENTIAL]";
const speech = new Speech()
require('dotenv').config()


const { Configuration, OpenAIApi } = require("openai");
const neo4j = require('neo4j-driver')

const driver = neo4j.driver(process.env.REACT_APP_NEO4JURI, neo4j.auth.basic(process.env.REACT_APP_NEO4JUSER, process.env.REACT_APP_NEO4JPASSWORD))


const session = driver.session()

const configuration = new Configuration({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY
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

    const self = this;
    const { steps } = this.props;
    const search = steps.user.value;

    async function callAsync() {
      let training = `
#How many times did patient id_1 visit the ICU?
MATCH (p:Patient)-[:HAS_STAY]->(v:PatientUnitStay) WHERE p.patient_id =~ '(?i)id_1' RETURN COUNT(v)

#When did patient id_1 visit the ICU?
MATCH (p:Patient)-[:HAS_STAY]->(v:PatientUnitStay) WHERE p.patient_id =~ '(?i)id_1' RETURN v.hospitaldischargeyear

#Which drug treats COVID-19?
MATCH (d:Compound)-[:treats]->(c:Disease) WHERE c.name =~ '(?i)COVID-19' RETURN d.name

#Which kind of compound treats COVID-19?
MATCH (d:Compound)-[:treats]->(c:Disease) WHERE c.name =~ '(?i)COVID-19' RETURN d.name

#Which pathogen causes Kyasanur Forest disease?
MATCH (o:Pathogen)-[:causes]->(d:Disease) WHERE d.name =~ '(?i)Kyasanur Forest disease' RETURN o.name

#Which pathogen causes COVID-19?
MATCH (o:Pathogen)-[:causes]->(d:Disease) WHERE d.name =~ '(?i)COVID-19' RETURN o.name

#What is the disease agent for COVID-19?
MATCH (o:Pathogen)-[:causes]->(d:Disease) WHERE d.name =~ '(?i)COVID-19' RETURN o.name

#Which organism causes Cowpox?
MATCH (o:Pathogen)-[:causes]->(d:Disease) WHERE d.name =~ '(?i)Cowpox' RETURN o.name


#Which gene causes Christianson syndrome?
MATCH (g:Gene)-[r1:associates]->(d:Disease) WHERE d.name =~ '(?i)Christianson syndrome' RETURN g.name

#Tell me something about the disease named "Christianson syndrome"
MATCH (d:Disease) WHERE d.name =~ '(?i)Christianson syndrome' RETURN d.description


#I have Dyspepsia, Hiccup and Edema. What can be the cause of this?
MATCH (s1:Symptom) <-[:presents]- (d:Disease) WHERE s1.name =~ '(?i)Dyspepsia'  MATCH (s2:Symptom) <-[:presents]- (d:Disease) WHERE s2.name =~ '(?i)Hiccup'  MATCH (s3:Symptom) <-[:presents]- (d:Disease) WHERE s3.name =~ '(?i)Edema' RETURN d.name

#what kinds of side effects do Doxepin have?
MATCH (d:Compound)-[:causes]->(s:\`Side Effect\`) WHERE d.name =~ '(?i)Doxepin' RETURN s.name

#what functions does the gene PCBD1 have?
MATCH (g:Gene)-[:participates]->(f:\`Molecular Function\`) WHERE g.name =~ '(?i)PCBD1' RETURN f.name

#which kinds of cancers can be found in frontal sinus?
MATCH (d:Disease)-[:localizes]->(a:Anatomy) WHERE a.name =~ '(?i)frontal sinus' AND (d.name CONTAINS "cancer" OR d.disease_category = "Cancer") RETURN DISTINCT(d.name)

#Which tumors can you find in frontal sinus?
MATCH (d:Disease)-[:localizes]->(a:Anatomy) WHERE a.name =~ '(?i)frontal sinus' AND (d.name CONTAINS "cancer" OR d.disease_category = "Cancer") RETURN DISTINCT(d.name)

#`;

      //let search = "Tell me something about the disease called COVID-19?";

      let query = training + search + "\n"

      let textToSpeak = ''
      try {
        console.log("query", query)
        if (search) {

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
          let cypher = response.data.choices[0].text;
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
        //console.log(process.env);
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
