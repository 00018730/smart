window.WRITING_TESTS = {
  writing_mock1: {
    id: "writing_mock1",
    timeLimit: 60, // 60 minutes

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
The graph below shows the percentage of households with access
to the internet between 2000 and 2020.

Summarise the information by selecting and reporting the main features,
and make comparisons where relevant.
        `,
        image: "assets/mock1line.jpg"
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
Some people believe that technology has made life easier,
while others argue that it has made life more complicated.

Discuss both views and give your own opinion.
        `
      }
    ]
  }
};
