# backend/app/services/article_service.py
"""
WORKING SOLUTION - Uses SerpAPI to get REAL Google search results
This will definitely work and get you real article URLs
"""

import os
import aiohttp
from typing import List, Dict
from datetime import datetime
import hashlib
from urllib.parse import urlparse
import asyncio
from app.config import settings

# You need to set this in your .env file or here
SERPAPI_KEY = settings.SERPAPI_KEY

class ArticleService:
    def __init__(self):
        self.session = None
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def fetch_articles(
        self,
        topic_name: str,
        subject_name: str,
        class_level: int,
        board: str = "CBSE",
        max_articles: int = 10
    ) -> List[Dict]:
        """
        Get REAL articles using SerpAPI (100% reliable)
        """
        if not self.session:
            self.session = aiohttp.ClientSession()
        
        # Build search query
        query = f"{topic_name} class {class_level} {board} {subject_name} tutorial notes explanation"
        
        print(f"\n🔍 Searching for: {query}")
        
        # Use SerpAPI to get real results
        articles = await self._search_with_serpapi(query,class_level,  max_articles)
        
        if not articles:
            print("⚠️ No results found, check your API key")
            return []
        
        print(f"✅ Found {len(articles)} real articles")
        return articles
    
    async def _search_with_serpapi(self, query: str, class_level: int, max_results: int) -> List[Dict]:
        """
        Use SerpAPI to get real Google search results
        Free tier: 100 searches per month
        """
        try:
            # SerpAPI endpoint
            url = "https://serpapi.com/search"
            
            params = {
                'q': query,
                'api_key': SERPAPI_KEY,
                'engine': 'google',
                'num': max_results + 5,  # Get extra to filter
                'hl': 'en',
                'gl': 'in',  # India results
            }
            
            print("📡 Fetching from SerpAPI...")
            
            async with self.session.get(url, params=params) as response:
                if response.status != 200:
                    print(f"❌ SerpAPI error: {response.status}")
                    text = await response.text()
                    print(f"Response: {text}")
                    return []
                
                data = await response.json()
                
                # Check for error
                if 'error' in data:
                    print(f"❌ API Error: {data['error']}")
                    return []
                
                articles = []
                
                # Extract organic results (these are the real search results)
                organic_results = data.get('organic_results', [])
                print(f"📊 Got {len(organic_results)} search results")
                
                for idx, result in enumerate(organic_results[:max_results]):
                    # Get the REAL URL
                    url = result.get('link', '')
                    
                    # Skip if not a valid URL
                    if not url or not url.startswith('http'):
                        continue
                    
                    # Skip video/social sites
                    skip_domains = ['youtube.com', 'facebook.com', 'instagram.com', 'twitter.com', 'pinterest.com']
                    if any(domain in url.lower() for domain in skip_domains):
                        continue
                    
                    # Get other details
                    title = result.get('title', 'Article')
                    snippet = result.get('snippet', 'Click to read')
                    source = result.get('displayed_link', urlparse(url).netloc)
                    
                    print(f"✅ Found: {title[:50]}... from {source}")
                    print(f"   URL: {url}")
                    
                    articles.append({
                        'id': hashlib.md5(url.encode()).hexdigest(),
                        'title': title,
                        'url': url,  # THIS IS THE REAL URL FROM GOOGLE
                        'excerpt': snippet[:200] if snippet else "Click to read",
                        'source': urlparse(url).netloc,
                        'difficulty': self._estimate_difficulty(class_level),
                        'relevance_score': 100 - (idx * 5),
                        'order': idx + 1
                    })
                
                return articles
                
        except Exception as e:
            print(f"❌ Error: {e}")
            return []
    
    def _estimate_difficulty(self, class_level: int) -> str:
        """Estimate difficulty based on class level"""
        if class_level <= 8:
            return "Easy"
        elif class_level <= 10:
            return "Medium"
        else:
            return "Advanced"
    
    async def fetch_article_content(self, article_url: str) -> Dict:
        """
        Fetch content from the real article URL (including PDFs)
        """
        if not self.session:
            self.session = aiohttp.ClientSession()
        
        try:
            print(f"📄 Fetching content from: {article_url}")
            
            # Check if it's a PDF
            is_pdf = article_url.lower().endswith('.pdf')
            
            if is_pdf:
                return await self._fetch_pdf_content(article_url)
            
            # Regular HTML content extraction
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            async with self.session.get(
                article_url,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=15),
                ssl=False
            ) as response:
                # Check if response is PDF even if URL doesn't end with .pdf
                content_type = response.headers.get('content-type', '').lower()
                if 'application/pdf' in content_type:
                    return await self._fetch_pdf_content(article_url)
                
                if response.status == 200:
                    html = await response.text()
                    
                    # Simple content extraction
                    from bs4 import BeautifulSoup
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    # Remove unwanted elements
                    for tag in soup(['script', 'style', 'nav', 'footer', 'header']):
                        tag.decompose()
                    
                    # Get title
                    title = soup.find('h1')
                    title = title.text.strip() if title else "Article"
                    
                    # Get main content
                    content = None
                    for selector in ['article', 'main', '.content', '#content']:
                        content = soup.select_one(selector)
                        if content:
                            break
                    
                    if not content:
                        content = soup.find('body')
                    
                    blocks = []
                    if content:
                        # Extract paragraphs and headings
                        for elem in content.find_all(['p', 'h2', 'h3'])[:50]:
                            text = elem.get_text(strip=True)
                            if len(text) > 20:
                                if elem.name == 'p':
                                    blocks.append({
                                        'type': 'paragraph',
                                        'text': text
                                    })
                                elif elem.name in ['h2', 'h3']:
                                    blocks.append({
                                        'type': 'heading',
                                        'level': int(elem.name[1]),
                                        'text': text
                                    })
                    
                    print(f"✅ Extracted {len(blocks)} content blocks")
                    
                    return {
                        'title': title,
                        'url': article_url,
                        'content_blocks': blocks,
                        'reading_time': max(1, len(blocks) // 3),
                        'success': len(blocks) > 0,
                        'is_pdf': False
                    }
                else:
                    print(f"❌ Failed to fetch content: {response.status}")
                    return self._error_content(article_url)
                    
        except Exception as e:
            print(f"❌ Error fetching content: {e}")
            return self._error_content(article_url)
    
    async def _fetch_pdf_content(self, pdf_url: str) -> Dict:
        """
        Handle PDF content - return URL for iframe display
        """
        print(f"📑 Detected PDF: {pdf_url}")
        
        # Extract title from URL
        title = pdf_url.split('/')[-1].replace('.pdf', '').replace('-', ' ').replace('_', ' ')
        
        return {
            'title': title.title(),
            'url': pdf_url,
            'content_blocks': [],  # No text blocks for PDF
            'reading_time': 0,
            'success': True,
            'is_pdf': True,  # Flag to indicate it's a PDF
            'pdf_url': pdf_url  # Direct PDF URL for iframe
        }
    
    def _error_content(self, url: str) -> Dict:
        """Return error content when extraction fails"""
        return {
            'title': "Content Not Available",
            'url': url,
            'content_blocks': [
                {
                    'type': 'paragraph',
                    'text': "Unable to load article content. Please click below to read on the original website."
                }
            ],
            'reading_time': 0,
            'success': False
        }

# Create singleton instance
article_service = ArticleService()