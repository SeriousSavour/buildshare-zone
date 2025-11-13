/**
 * Get a random quote from a multi-line string of quotes
 * @param quotesString - String containing multiple quotes separated by newlines
 * @param defaultQuote - Default quote to return if no quotes are provided
 * @returns A random quote from the list
 */
export const getRandomQuote = (
  quotesString: string | undefined, 
  defaultQuote: string = "The only way to do great work is to love what you do. - Steve Jobs"
): string => {
  if (!quotesString) return defaultQuote;
  
  // Split by newlines and filter out empty lines
  const quotes = quotesString
    .split('\n')
    .map(q => q.trim())
    .filter(q => q.length > 0);
  
  if (quotes.length === 0) return defaultQuote;
  
  // Return random quote
  const randomIndex = Math.floor(Math.random() * quotes.length);
  return quotes[randomIndex];
};
