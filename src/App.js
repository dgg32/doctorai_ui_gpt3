import './App.css';
import ChatBot from 'react-simple-chatbot';
import { ThemeProvider } from 'styled-components';
//import DoctorAI from './component/DoctorAI';
import DoctorAI from './component/DoctorAI_gpt3';


const ENABLE_THEME = true

const theme_red = {
  background: '#f5f8fb',
  fontFamily: 'Tahoma',
  headerBgColor: '#DC143C',
  headerFontColor: '#fff',
  headerFontSize: '15px',
  botBubbleColor: '#DC143C',
  botFontColor: '#fff',
  userBubbleColor: '#fff',
  userFontColor: '#4a4a4a',
};

const theme = ENABLE_THEME ? theme_red : ''

const steps = [
  {
    id: 'bot-welcome',
    message: 'Welcome to Doctor AI, how can I help?',
    trigger: 'user'
  },
  {
    id: 'user',
    user: true,
    trigger: 'bot-response'
  },
  {
    id: 'bot-response',
    component: <DoctorAI />,
    waitAction: true,
    asMessage: true,
    trigger: 'user'
  },
  {
    id: 'not-bye',
    message: 'Thank you. Have a great day!',
    end: true
  },
];

function App() {
  let chatbot = <ChatBot
    steps={steps}
    headerTitle="Doctor.ai"
    botAvatar="doctor.ai_trans.png"
    userAvatar="user.png"
    recognitionEnable={true}
    width="450px"
    speechSynthesis={{ enable: false, lang: 'en' }}
  />

  return (
    <div className="App" style={{display: 'flex', justifyContent: 'center'}}>
      {
         (theme !== '') ? <ThemeProvider theme={theme}> {chatbot} </ThemeProvider> : chatbot
      }
    </div>
  );
}

export default App;
