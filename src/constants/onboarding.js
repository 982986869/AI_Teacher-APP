export const STEPS = [
  {
    type: 'chips', multi: false,
    bubble: "What class are you in? Pick your grade and I'll set the right level for you!",
    question: 'What class are you in?',
    options: ['K','1','2','3','4','5','6','7','8','9','10','11','12'],
    icons:   ['🌱','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','⭐','🎓'],
  },
  {
    type: 'cards', multi: true,
    bubble: 'Which subjects get you excited? Pick as many as you like!',
    question: 'Which subjects do you love?',
    options: ['Mathematics','Science','English','History','Coding','Art','Geography','Physics'],
    icons:   ['➗','🔬','📖','🏛️','💻','🎨','🌍','⚛️'],
  },
  {
    type: 'chips', multi: true,
    bubble: 'How do you like to learn best? This helps me pick the right content for you.',
    question: 'How do you prefer to learn?',
    options: ['Videos','Quizzes','Stories','Flashcards','Practice','Puzzles'],
    icons:   ['🎬','❓','📚','🃏','✏️','🧩'],
  },
  {
    type: 'chips', multi: false,
    bubble: 'Last one! How much time can you give me each day?',
    question: 'Daily study goal?',
    options: ['5 min','10 min','15 min','30 min','1 hour'],
    icons:   ['⚡','🕐','🕒','🕧','🔥'],
  },
];