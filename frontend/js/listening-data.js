/* ======================================
   LISTENING MOCK 1 – FOUNDATION DATA
====================================== */

window.LISTENING_TESTS = {
  listening_mock1: {
    title: "IELTS Listening Mock Test 1",
    audio: "assets/audio/sample.mp3",

    parts: [
      /* =======================
         PART 1
      ======================== */
      {
        part: 1,
        instructions: {
          title: "Questions 1–10",
          task: "Complete the form below.",
          rule: "Write NO MORE THAN TWO WORDS AND/ORA NUMBER for each answer."
        },

        questions: [
          {
            type: "title",
            text: "Fearnley Sports Centre\nLifeguard Application Form "
          },
          {
            type: "heading",
            text: "Personal Details:"
          },
          {
            type: "textline",
            text: "Name: Peter Smith "
          },
          {
            id: 1,
            type: "gap",
            before: "Home address: 130 South Main Street, Lake ",
            after: " ",
            answer: "Elsinore"
          },
          {
            id: 2,
            type: "gap",
            before: "Contact number: ",
            after: "(cell phone)",
            answer: "077896245"
          },
          {
            type: "heading",
            text: "Present Occupation:"
          },
          {
            id: 3,
            type: "gap",
            before: "has temporary job as a part-time ",
            after: "",
            answer: "waiter"
          },
          {
            type: "textline",
            text: "is studying PE "
          },
          {
            id: 4,
            type: "gap",
            before: "wants to be a high school ",
            after: "coach",
            answer: "baseball"
          },
          {
            type: "heading",
            text: "Qualifications:"
          },
          {
            type: "textline",
            text: "Already holds: water safety certificate  "
          },
          {
            id: 5,
            type: "gap",
            before: "Certificate expires in: ",
            after: "",
            answer: "October"
          },
          {
            type: "heading",
            text: "Relevant Work Experience:"
          },
          {
            id: 6,
            type: "gap",
            before: "Lifeguard at: the ",
            after: "in Fearnley",
            answer: "beach"
          },
          {
            id: 7,
            type: "gap",
            before: "Additional relevant skills: ",
            after: "",
            answer: "diving"
          },
          {
            type: "heading",
            text: "Other Information:"
          },
          {
            type: "textline",
            text: "is happy to "
          },
          {
            id: 8,
            type: "gap",
            before: "work on ",
            after: "mornings",
            answer: "saturday"
          },
          {
            id: 9,
            type: "gap",
            before: "start at ",
            after: "o'clock",
            answer: "6"
          },
          {
            type: "heading",
            text: "How did the applicant find out about this job?"
          },
          {
            id: 10,
            type: "gap",
            before: "On the ",
            after: "",
            answer: "radio"
          }
        ]
        
      },

      /* =======================
         PART 2
      ======================== */
      {
        part: 2,
        instructions: {
          title: "Questions 11–20",
          task: "Choose the correct answer.",
        },

        questions: [
          {
            type: "title",
            text: "Becoming a Millionaire "
          },
          {
            id: 11,
            type: "mcq",
            text: "Arthur feels that when starting a business, mistakes should be",
            options: [
              "A seen as an opportunity to learn",
              "B predicted and minimised",
              "C avoided at all costs"
            ],
            answer: "A"
          },

          {
            id: 12,
            type: "mcq",
            text: "Recent American studies found that confidence will ",
            options: [
              "A sometimes reduces people's chances of success",
              "B be increased by reading self-help books",
              "C ensure good results on business courses"
            ],
            answer: "A"
          },

          {
            id: 13,
            type: "mcq",
            text: "The American studies recommended that new entrepreneurs ",
            options: [
              "A listen to their colleagues' advice",
              "B get professional help when things go wrong",
              "C remain concentrated on their aims"
            ],
            answer: "C"
          },
          {
            id: 14,
            type: "mcq",
            text: "What does Arthur say about his own experience of marketing? ",
            options: [
              "A He relied on what he already knew",
              "B He hired an expert to take care of it",
              "C He relaised its importance too late"
            ],
            answer: "B"
          },
          {
            id: 15,
            type: "mcq",
            text: "What does Arthur think is an important quality shared by good leaders? ",
            options: [
              "A They are ambitious for their company",
              "B They can deal with difficult people",
              "C They earn the respect of their workforce"
            ],
            answer: "C"
          },
          {
            id: 16,
            type: "mcq",
            text: "What does Arthur say about taking risks? ",
            options: [
              "A He advises being cautious",
              "B He favours a long-term view",
              "C He believes it is financially advantageous"
            ],
            answer: "A"
          },
          
          {
  type: "mcq-multi",

  qNumbers: [17, 18],   // ← two questions

  instruction: "Choose TWO letters, A–E.",

  text: "Which TWO things does Arthur say people should focus on when developing their business idea?",

  options: [
    "A making sure the idea is original",
    "B offering a better deal than competitors",
    "C being committed to it",
    "D paying attention to detail",
    "E fixing realistic prices"
  ],

  answer: ["B", "C"]  // ← correct answers (order doesn't matter)
},

{
  type: "mcq-multi",

  qNumbers: [19, 20],   // ← two questions

  instruction: "Choose TWO letters, A–E.",

  text: "Which TWO things does Arthur say helped him get his business started?",

  options: [
    "A family support",
    "B getting a loan from a bank",
    "C good business advice",
    "D a favourable economic climate",
    "E an effective approach to business"
  ],

  answer: ["A", "E"]  // ← correct answers (order doesn't matter)
}
        ]
      },

      /* =======================
         PART 3
      ======================== */
      {
        part: 3,
        instructions: {
          title: "Questions 21–30",
          task: "Answer the questions below."
        },

        questions: [
          {
            type: "title",
            text: "Feedback on Second Year of Performance Arts Course"
          },
          {
            id: 21,
            type: "mcq",
            text: "Gina chose to study performance arts at this university because the course  ",
            options: [
              "A has a very good reputation",
              "B has a link with various theatres",
              "C has an international flavour"
            ],
            answer: "B"
          },
          {
            id: 22,
            type: "mcq",
            text: "Which of the options they chose have Gina and Charlie both found useful?  ",
            options: [
              "A Movement Analysis",
              "B Dance and Drama",
              "C The Body in Dance"
            ],
            answer: "A"
          },
          {
            id: 23,
            type: "mcq",
            text: "What did Charlie do during his work experience?  ",
            options: [
              "A He worked in a costume department",
              "B He performed with a ballet company",
              "C He helped out at a dance school for children"
            ],
            answer: "A"
          },
          {
            id: 24,
            type: "mcq",
            text: "What does Gina say she learnt from her work experience?  ",
            options: [
              "A how to organise her time better",
              "B how to work better in a team",
              "C how to cope when under pressure"
            ],
            answer: "B"
          },
          {
            id: 25,
            type: "mcq",
            text: "What does Charlie say about his dissertation topic?  ",
            options: [
              "A He wanted it to be different from those of other students",
              "B He had already done assignment in this area",
              "C He was inspired to choose it by a performance he saw"
            ],
            answer: "C"
          },
          {
            id: 26,
            type: "mcq",
            text: "Which aspect of writing a dissertation is Gina worried about?  ",
            options: [
              "A finding enough to say",
              "B doing the background reading",
              "C presenting it in an appropriate way"
            ],
            answer: "B"
          },
          {
  type: "instruction",
  title: "Questions 27–30",
  task: "What do the students say about each of the following types of careers in performance arts?\n Choose FOUR correct answers A-F and write the correct letter next to questions 27-30.",
  options: [
    "A – The pay can be low",
    "B – There is a lot of competition",
    "C – An additional qualification is required",
    "D – Good communication skills are required",
    "E – People with experience feel very positive about it",
    "F – It is a relatively unpopular choice"
  ]
},
{
  id: 27,
  type: "drag",
  text: "Performance ",
  answer: "E"
},
{
  id: 28,
  type: "drag",
  text: "Education ",
  answer: "C"
},
{
  id: 29,
  type: "drag",
  text: "Theatre management  ",
  answer: "A"
},
{
  id: 30,
  type: "drag",
  text: "Marketing ",
  answer: "F"
}

        ],
      },

      /* =======================
         PART 4
      ======================== */
      {
        part: 4,
        instructions: {
          title: "Questions 31–40",
          task: "Complete the notes below.",
          rule: "Write ONE WORD ONLY for each answer. "
        },

        questions: [
          {
            type: "title",
            text: "Sea Lion Tracking Study (Western Australia) "
          },

          {
            type: "heading",
            text: "Reason for the study"
          },
          {
            type: "textline",
            text: "The Australian sea lion is an endangered species"
          },
          {
            type: "textline",
            text: "Until 1892, numbers were affected by hunting"
          },

          {
            id: 31,
            type: "gap",
            before: "Sea lions are now affected by nets used to control ",
            after: " ",
            answer: "sharks"
          },
          {
            type: "heading",
            text: "Animal tracking systems "
          },

          {
            id: 32,
            type: "gap",
            before: "Considerations when choosing a tracking method include ",
            after: "and ease of use",
            answer: "cost"
          },

          {
            id: 33,
            type: "gap",
            before: "Plastic tags: the animal must be easy to ",
            after: " ",
            answer: "catch"
          },
          {
            id: 34,
            type: "gap",
            before: "GPS tracking will not work in the ",
            after: " ",
            answer: "oceicopter"
          },
          {
            id: 35,
            type: "gap",
            before: "In isolated regions, some animals are tracked by ",
            after: " (e.g. the polar bear)",
            answer: "rocan"
          },
          {
            type: "textline",
            text: "Some animals are identified by markings ( e.g. dolphins are identified by scars)"
          },
          {
            type: "heading",
            text: "Challenges of tracking sea lions "
          },
          {
            id: 36,
            type: "gap",
            before: "Perth study: sea lions lost their tags. (They rubbed against ",
            after: " to remove them)",
            answer: "helks"
          },
          {
            id: 37,
            type: "gap",
            before: "Californian researchers used ",
            after: " to identify sea lions. (This was unreliable due to regular loss of fur)",
            answer: "paint"
          },
          {
            type: "heading",
            text: "Our study"
          },
          {
            type: "heading",
            text: "Aims"
          },
          {
            type: "textline",
            text: "i) to find out if sea lions' whiskers can be used to identify them"
          },
          {
            id: 38,
            type: "gap",
            before: "ii) to create a ",
            after: " to use as a guide",
            answer: "diagram"
          },
          {
            type: "heading",
            text: "Methods"
          },
          {
            id: 39,
            type: "gap",
            before: "contacting ",
            after: " in Australia for photographs",
            answer: "zoos"
          },
          {
            id: 40,
            type: "gap",
            before: "Asking the ",
            after: " to get involved",
            answer: "public"
          }
        ]
      }
    ]
  }
};
