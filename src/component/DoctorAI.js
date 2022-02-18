import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Loading } from 'react-simple-chatbot';

import { LexRuntimeV2Client, RecognizeTextCommand } from "@aws-sdk/client-lex-runtime-v2";
import Speech from 'speak-tts'

require('dotenv').config()

const CONFIDENTIAL = "[CONFIDENTIAL]";
const speech = new Speech()

speech.init({
    'volume': 1,
     'lang': 'en-GB',
     'rate': 1,
     'pitch': 1,
     'voice':'Google UK English Male',
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

    const lexParams = {
      credentials: {accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY, secretAccessKey: process.env.REACT_APP_AWS_SECRET},
      userId: process.env.REACT_APP_AWS_USERID, 
      region: process.env.REACT_APP_AWS_REGION
      //region: "us-east-1"
    };

    const input = {
        //botAliasId: process.env.REACT_APP_LEX_botAliasId,
        botAliasId: "TSTALIASID",
        botId: process.env.REACT_APP_LEX_botId,
        //localeId: process.env.REACT_APP_LEX_localeId,
        //sessionId: process.env.REACT_APP_LEX_sessionId,
        localeId: "en_US",
        sessionId: "test_session",
        requestContentType: 'text/plain; charset=utf-8',
        text: search
    }

    const client = new LexRuntimeV2Client(lexParams);
    const command = new RecognizeTextCommand(input);
    console.log(command);

    async function callAsync() {
      let textToSpeak = ''
      try {
        console.log(search)
        if (search) {
          console.log("command", command);
          const response = await client.send(command);
          textToSpeak = response.messages[0].content;
          console.log('Doctor AI:' + textToSpeak);
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
      elements.push(<span key={index}>{value}<br/></span>)
    }

    return (
      <div className="bot-response">
        { loading ? <Loading /> : elements }
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
