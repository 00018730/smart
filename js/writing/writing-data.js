window.WRITING_TESTS = {
  writing_mock1: {
    id: "writing_mock1",
    timeLimit: 360, // 60 minutes

    tasks: [
      {
        id: 1,
        type: "task1",
        title: "Writing Task 1",

        instruction: `
You should spend about 20 minutes on this task.
Write at least 150 words.
        `, // 📊 graph image path

        question: `
The graph below shows the average number of people attending top-level football matches in three European countries from 1980 to 2004.

Summarise the information by selecting and reporting main features and give comparisons where relevant
        `,
        image: "../assets/mock1writingtask1.jpg"
      },

      {
        id: 2,
        type: "task2",
        title: "Writing Task 2",

        instruction: `
You should spend about 40 minutes on this task.
Write at least 250 words.
        `,

        question: `
In many urban areas, planners tend to arrange shops, schools, offices, and homes in specific areas and separate them from one another. 

Do the advantages of this trend outweigh its disadvantages?
        `
      }
    ]
  }
};
