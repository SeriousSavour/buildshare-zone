/**
 * Collection of philosophical quotes from ancient Greek philosophers
 */

export interface PhilosopherQuote {
  quote: string;
  author: string;
  greek?: string;
}

export const greekPhilosopherQuotes: PhilosopherQuote[] = [
  {
    quote: "The only true wisdom is in knowing you know nothing.",
    author: "Socrates",
    greek: "Ἓν οἶδα ὅτι οὐδὲν οἶδα"
  },
  {
    quote: "I cannot teach anybody anything. I can only make them think.",
    author: "Socrates"
  },
  {
    quote: "The unexamined life is not worth living.",
    author: "Socrates",
    greek: "ὁ δὲ ἀνεξέταστος βίος οὐ βιωτὸς ἀνθρώπῳ"
  },
  {
    quote: "Wise men speak because they have something to say; fools because they have to say something.",
    author: "Plato"
  },
  {
    quote: "The beginning is the most important part of the work.",
    author: "Plato"
  },
  {
    quote: "We can easily forgive a child who is afraid of the dark; the real tragedy of life is when men are afraid of the light.",
    author: "Plato"
  },
  {
    quote: "At the touch of love everyone becomes a poet.",
    author: "Plato"
  },
  {
    quote: "One of the penalties of refusing to participate in politics is that you end up being governed by your inferiors.",
    author: "Plato"
  },
  {
    quote: "Knowing yourself is the beginning of all wisdom.",
    author: "Aristotle",
    greek: "Γνῶθι σεαυτόν"
  },
  {
    quote: "It is the mark of an educated mind to be able to entertain a thought without accepting it.",
    author: "Aristotle"
  },
  {
    quote: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    author: "Aristotle"
  },
  {
    quote: "The whole is greater than the sum of its parts.",
    author: "Aristotle"
  },
  {
    quote: "Patience is bitter, but its fruit is sweet.",
    author: "Aristotle"
  },
  {
    quote: "The roots of education are bitter, but the fruit is sweet.",
    author: "Aristotle"
  },
  {
    quote: "In all things of nature there is something of the marvelous.",
    author: "Aristotle"
  },
  {
    quote: "Happiness depends upon ourselves.",
    author: "Aristotle"
  },
  {
    quote: "No great mind has ever existed without a touch of madness.",
    author: "Aristotle"
  },
  {
    quote: "The energy of the mind is the essence of life.",
    author: "Aristotle"
  }
];

/**
 * Get a random philosopher quote
 */
export const getRandomPhilosopherQuote = (): PhilosopherQuote => {
  const randomIndex = Math.floor(Math.random() * greekPhilosopherQuotes.length);
  return greekPhilosopherQuotes[randomIndex];
};
