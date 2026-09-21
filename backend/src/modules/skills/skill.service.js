import Skill from './skill.model.js';
import User from '../users/user.model.js';
import { AppError } from '../../utils/errors.js';

export function listSkills() {
  return Skill.find({}).select('name category').sort({ name: 1 }).lean();
}

export async function getQuestions(id) {
  const skill = await Skill.findById(id).lean();
  if (!skill) throw new AppError('Skill not found', 404);
  return {
    id: skill._id,
    name: skill.name,
    category: skill.category,
    questions: skill.questions.map((q) => ({ id: q._id, text: q.text, options: q.options })),
  };
}

export async function assessSkill(userId, skillId, answers) {
  const skill = await Skill.findById(skillId);
  if (!skill) throw new AppError('Skill not found', 404);
  if (!skill.questions.length) throw new AppError('This skill has no assessment questions yet', 400);
  if (!Array.isArray(answers) || answers.length !== skill.questions.length) {
    throw new AppError(`Please answer all ${skill.questions.length} questions`, 400);
  }

  let correct = 0;
  skill.questions.forEach((question, index) => {
    if (Number(answers[index]) === question.correctIndex) correct += 1;
  });
  const score = Math.round((correct / skill.questions.length) * 100);
  const verified = score >= 60;

  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  const existing = user.skills.find((item) => String(item.skillId) === String(skillId));
  if (existing) {
    existing.score = score;
    existing.verified = verified;
  } else {
    user.skills.push({ skillId, score, verified });
  }
  await user.save();
  return { score, verified, correct, total: skill.questions.length };
}
