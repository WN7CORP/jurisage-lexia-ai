
import axios from 'axios';

// Google Sheets API credentials
const API_KEY = 'AIzaSyDvJ23IolKwjdxAnTv7l8DwLuwGRZ_tIR8';
const SPREADSHEET_ID = '1rctu_xg4P0KkMWKbzu7-mgJp-HjCu-cT8DZqNAzln-s';

// Types for the data structures
export interface Article {
  id: string;        // Unique identifier (lawId + number)
  lawId: string;     // ID of the law this article belongs to
  number: string;    // Article number (as shown in column A)
  content: string;   // Article content (as shown in column B)
}

export interface LawData {
  id: string;        // Unique identifier (sheet ID)
  title: string;     // Law title (sheet name)
  articles: Article[]; // Articles in this law
}

// Function to fetch data from Google Sheets
export async function fetchLawData(): Promise<LawData[]> {
  try {
    // First, get the sheet names (law titles)
    const sheetsResponse = await axios.get(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?key=${API_KEY}`
    );

    const sheets = sheetsResponse.data.sheets;
    const lawDataPromises = sheets.map(async (sheet: any) => {
      const sheetId = sheet.properties.sheetId;
      const sheetTitle = sheet.properties.title;
      
      // Get the data for this sheet
      const dataResponse = await axios.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(sheetTitle)}!A:B?key=${API_KEY}`
      );
      
      const rows = dataResponse.data.values || [];
      
      // Map rows to articles
      const articles: Article[] = rows.map((row: string[], index: number) => {
        // Skip header row if present
        if (index === 0 && (row[0] === 'Artigo' || row[0] === 'Número')) {
          return null;
        }
        
        const articleNumber = row[0] || '';
        const articleContent = row[1] || '';
        
        return {
          id: `${sheetId}-${articleNumber}`,
          lawId: sheetId.toString(),
          number: articleNumber,
          content: articleContent
        };
      }).filter(Boolean); // Remove null entries (header row)
      
      return {
        id: sheetId.toString(),
        title: sheetTitle,
        articles
      };
    });
    
    // Wait for all promises to resolve
    return await Promise.all(lawDataPromises);
  } catch (error) {
    console.error('Error fetching data from Google Sheets:', error);
    throw new Error('Failed to fetch law data from Google Sheets');
  }
}

// Function to search for a specific article
export async function searchArticle(lawId: string, articleNumber: string): Promise<Article | null> {
  try {
    const allLaws = await fetchLawData();
    const law = allLaws.find(l => l.id === lawId);
    
    if (!law) return null;
    
    const article = law.articles.find(a => a.number === articleNumber);
    return article || null;
  } catch (error) {
    console.error('Error searching for article:', error);
    throw new Error('Failed to search for article');
  }
}
