import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ALL_QUESTIONS = JSON.parse(
  readFileSync(path.join(__dirname, 'questions_config.json'), 'utf-8')
);

export function questionsForStage(stage) {
  return ALL_QUESTIONS.filter((q) => q.stage === stage);
}

export function questionAt(stage, index) {
  const list = questionsForStage(stage);
  return list[index] ?? null;
}

export function stageAnswersKey(stage) {
  return `stage${stage}_answers`;
}

export function isStageComplete(stage, questionIndex) {
  return questionIndex >= questionsForStage(stage).length;
}
