'use strict'

/**
 * Abstract base class that every AI provider must implement.
 * Swap providers by creating a new class that extends this and
 * updating AI_PROVIDER in the environment.
 */
class AIProvider {
  /**
   * Generate a structured lesson from a topic.
   * @param {string} topic
   * @param {string} subject
   * @param {string} gradeLevel
   * @returns {Promise<import('../../types').LessonPayload>}
   */
  async generateLesson(topic, subject, gradeLevel) {
    throw new Error(`${this.constructor.name} must implement generateLesson()`)
  }

  /**
   * Answer a student's doubt in the context of a lesson.
   * @param {string} question
   * @param {Object} lessonContext  – full lesson object (with slides) from DB
   * @param {Array}  history        – prior { role, content } messages, oldest first
   * @param {number} [slideIndex]   – 0-based slide the question is about, if any
   * @returns {Promise<string>}
   */
  async answerDoubt(question, lessonContext, history, slideIndex) {
    throw new Error(`${this.constructor.name} must implement answerDoubt()`)
  }

  /**
   * Answer a question STRICTLY from retrieved knowledge chunks (RAG).
   * @param {string} question
   * @param {Array}  contexts  – [{ sourceTitle, chunkIndex, content, similarity }]
   * @param {Array}  [history] – prior { role, content } messages, oldest first
   * @returns {Promise<string>}
   */
  async answerFromKnowledge(question, contexts, history) {
    throw new Error(`${this.constructor.name} must implement answerFromKnowledge()`)
  }
}

module.exports = AIProvider
