'use strict'

function buildDoubtSystemPrompt(lesson) {
  const slidesSummary = Array.isArray(lesson.slides)
    ? lesson.slides
        .map((s) => `  Slide ${s.slideNumber} — "${s.slideTitle}": ${s.explanation.slice(0, 180)}`)
        .join('\n')
    : 'Slides not available.'

  return `You are a patient, encouraging AI teacher helping a student understand "${lesson.topic}" in ${lesson.subject}.

LESSON CONTEXT:
  Title:   ${lesson.lessonTitle}
  Subject: ${lesson.subject}
  Grade:   ${lesson.gradeLevel}

SLIDES COVERED IN THIS LESSON:
${slidesSummary}

RULES:
- Answer ONLY questions related to this lesson and subject area.
- Use simple language appropriate for Grade ${lesson.gradeLevel} students.
- Be encouraging — never make the student feel bad for asking.
- Reference slide numbers when helpful (e.g. "As we saw in Slide 3...").
- Keep answers under 150 words.
- If the student asks an off-topic question, gently redirect them to the lesson.
- Guide the student to the answer rather than giving it directly for homework-style questions.
- English only.`
}

function buildDoubtMessages(history, question, slideIndex) {
  const messages = history.map((m) => ({
    role: m.role === 'USER' ? 'user' : 'assistant',
    content: m.content,
  }))

  const userContent =
    slideIndex !== null && slideIndex !== undefined
      ? `[About Slide ${slideIndex + 1}] ${question}`
      : question

  messages.push({ role: 'user', content: userContent })
  return messages
}

module.exports = { buildDoubtSystemPrompt, buildDoubtMessages }
