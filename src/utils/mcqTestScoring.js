// Mock-test scoring, kept free of React so it can be tested with plain node.
//
// answers: { qIndex: optionIndex }   status: { qIndex: 'answered' | 'skipped' }
// A picked option counts unless the question was explicitly skipped — the student
// does not have to press "Save & Next" for the last pick before Finish or time-up.

export const counts = (answers, status, i) => answers[i] != null && status[i] !== 'skipped';

export function scoreMcqTest(qs, answers, status, { pointsPerCorrect, negative }) {
  const total = qs.length;
  let correct = 0, wrong = 0;
  qs.forEach((q, i) => {
    if (!counts(answers, status, i)) return;
    if (answers[i] === q.correct) correct++;
    else wrong++;
  });
  const skipped = total - correct - wrong;
  const score = correct * pointsPerCorrect - wrong * negative;
  const totalMarks = total * pointsPerCorrect;
  const accuracy = (correct + wrong) ? Math.round((correct / (correct + wrong)) * 100) : 0;
  const completion = total ? Math.round(((correct + wrong) / total) * 100) : 0;
  const scorePct = totalMarks ? Math.round((Math.max(0, score) / totalMarks) * 100) : 0;
  return { correct, wrong, skipped, score, accuracy, completion, scorePct };
}

// { questionId: optionIndex } for every counted answer — the server payload.
export function answersById(qs, answers, status) {
  const out = {};
  qs.forEach((q, i) => {
    if (counts(answers, status, i) && q && q.id != null) out[q.id] = answers[i];
  });
  return out;
}
