import * as cheerio from 'cheerio';

export async function scrapeUrl(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CentercodeAlchemy/1.0)',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      throw new Error(`Unsupported content type: ${contentType}`);
    }

    const html = await response.text();
    return extractMainContent(html);
  } catch (error) {
    clearTimeout(timeout);
    if ((error as Error).name === 'AbortError') {
      throw new Error('Request timeout after 10 seconds');
    }
    throw error;
  }
}

function extractMainContent(html: string): string {
  const $ = cheerio.load(html);

  // Remove unwanted elements
  $('script, style, nav, footer, header, aside, iframe, noscript').remove();
  $('.advertisement, .ad, .sidebar, .comments').remove();

  // Extract main content - try multiple selectors in order of preference
  let main = $('main, article, .content, .post, .article');

  // If no specific content area found, fall back to body
  if (main.length === 0) {
    main = $('body');
  }

  // Get text from headings and paragraphs
  const content: string[] = [];

  main.find('h1, h2, h3, h4, h5, h6, p, li').each((_, element) => {
    const text = $(element).text().trim();
    if (text) content.push(text);
  });

  return content.join('\n\n');
}
