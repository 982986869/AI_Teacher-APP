// src/screens/admin/learning/levels.js
// The CMS tree is one generic table discriminated by `level`. This is the single place
// that knows the level order, human labels, the icon per level, and how a node's status
// maps to a badge tone — so every Learning screen reads the tree consistently.
import { Landmark, GraduationCap, BookOpen, Layers, FileText, Presentation } from 'lucide-react-native';

export const LEVELS = ['board', 'class', 'subject', 'chapter', 'topic', 'lesson'];

export const LEVEL_LABEL = { board: 'Board', class: 'Class', subject: 'Subject', chapter: 'Chapter', topic: 'Topic', lesson: 'Lesson' };
export const LEVEL_PLURAL = { board: 'Boards', class: 'Classes', subject: 'Subjects', chapter: 'Chapters', topic: 'Topics', lesson: 'Lessons' };
export const LEVEL_ICON = { board: Landmark, class: GraduationCap, subject: BookOpen, chapter: Layers, topic: FileText, lesson: Presentation };
export const LEVEL_TONE = { board: 'purple', class: 'indigo', subject: 'blue', chapter: 'cyan', topic: 'emerald', lesson: 'orange' };

// The level created UNDER a node of `level` (null parent → 'board'; a lesson has no child).
export const childLevelOf = (level) => {
  if (!level) return 'board';
  const i = LEVELS.indexOf(level);
  return i >= 0 && i < LEVELS.length - 1 ? LEVELS[i + 1] : null;
};

export const STATUS_TONE = {
  draft: 'gold', review: 'blue', published: 'emerald', archived: 'purple', rejected: 'red',
};
export const STATUS_LABEL = {
  draft: 'Draft', review: 'In review', published: 'Published', archived: 'Archived', rejected: 'Rejected',
};

export const DIFFICULTY_TONE = { easy: 'emerald', medium: 'gold', hard: 'red' };
