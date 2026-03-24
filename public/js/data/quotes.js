// Antica Bracanov's real quotes from interviews - used as loading screens, room intros, achievements
const QUOTES = [
  {
    text: "I love exploring architecture, shapes and layouts.",
    source: "On her design starting point",
    era: "general"
  },
  {
    text: "I wanted to do a corner building with a shop downstairs and a small, cozy personal space upstairs.",
    source: "On Emma's Fashion Shop",
    era: "friends"
  },
  {
    text: "Mixing roundness with classic shapes to get a more dynamic structure.",
    source: "On Friends design philosophy",
    era: "friends"
  },
  {
    text: "I really like the shape of the building and those lovely stickers on the window.",
    source: "On Emma's Fashion Shop",
    era: "friends"
  },
  {
    text: "We decided upon the bathroom because that is where Kevin's famous scream takes place.",
    source: "On Home Alone",
    era: "ideas"
  },
  {
    text: "The opening front walls mean that the other walls must be completely solid.",
    source: "On Home Alone structural design",
    era: "ideas"
  },
  {
    text: "There are some compromises where we would love to show more, but we cannot always do so.",
    source: "On design limitations",
    era: "general"
  },
  {
    text: "It harnesses the spirit of sport.",
    source: "On Table Football",
    era: "ideas"
  },
  {
    text: "I am someone who loves the movies so much that I watch them every few months!",
    source: "On Lord of the Rings",
    era: "icons"
  },
  {
    text: "There was no reference.",
    source: "On designing Barad-dur's interior",
    era: "icons"
  },
  {
    text: "We thought Sauron has been around for thousands of years, so he has books containing all his knowledge and magic.",
    source: "On Sauron's library in Barad-dur",
    era: "icons"
  },
  {
    text: "The most important character was Sauron. He is exclusive for this model and we also made a new helmet that looks absolutely amazing.",
    source: "On the Sauron minifigure",
    era: "icons"
  },
  {
    text: "At the top, we have the Eye of Sauron, which can be moved up and down and left and right.",
    source: "On Barad-dur mechanics",
    era: "icons"
  },
  {
    text: "It doesn't look like it, but it was a really challenging model, and also really fun to work on, because the whole model is basically one big function.",
    source: "On Da Vinci's Flying Machine",
    era: "icons"
  },
  {
    text: "We really wanted to follow what Leonardo had in mind.",
    source: "On the Flying Machine concept",
    era: "icons"
  },
  {
    text: "My favourite challenge was to calculate where the string had to be; you know, tight but not too tight?",
    source: "On the Flying Machine mechanics",
    era: "icons"
  },
  {
    text: "Everything was picked deliberately with the idea that we were staying close to the original colour scheme.",
    source: "On Flying Machine colors",
    era: "icons"
  }
];

function getRandomQuote(era) {
  const pool = era ? QUOTES.filter(q => q.era === era || q.era === 'general') : QUOTES;
  return pool[Math.floor(Math.random() * pool.length)];
}
