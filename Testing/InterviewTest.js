import readline from 'readline';
import MedicalInterview from '..//../Agents/Interview/interview.js';

async function getUserInput(promptText) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(promptText, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function getRandomContext() {
  const contexts = [
    'fever and body ache in a rural village setting',
    'persistent cough in a child',
    'maternal health during early pregnancy',
    'management of diarrhoea in children',
    'malaria symptoms in monsoon season',
    'nutrition advice for underweight mothers',
    'wound care with limited resources',
    'high blood pressure in elderly rural patient',
    'basic antenatal care visit',
    'follow-up for tuberculosis treatment',
    'postpartum bleeding management',
    'skin infections during humid weather',
    'supporting patients with suspected dengue'
  ];

  const index = Math.floor(Math.random() * contexts.length);
  return contexts[index];
}

async function runTest() {
  const interview = new MedicalInterview();

  for (let i = 1; i <= 3; i++) {
    console.log(`\nQuestion ${i} of 3:`);

    const context = getRandomContext();
    const question = await interview.generateQuestion(context);
    console.log('\nGenerated Question:\n', question);

    const userAnswer = await getUserInput('\nEnter your answer:\n> ');
    await interview.evaluateAnswer(userAnswer);
  }

  const report = interview.generateReport();
  console.log('\nFinal Report:\n', report);

  const summary = interview.summary;
  console.log('\nSummary:\n', summary);
}

runTest().catch(console.error);
