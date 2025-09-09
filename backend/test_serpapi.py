# test_serpapi.py
"""
Test SerpAPI to get REAL Google search results
This will show you actual article URLs from Google
"""
import os
import requests

# REPLACE THIS WITH YOUR API KEY
SERPAPI_KEY = '34b78a691c2c26eef35be0d9fc25200b343ae43e4081017520b2947cf8ce2f1d'

def test_serpapi():
    """
    Test SerpAPI with a real search
    """
    query = "Light Reflection and Refraction class 10 CBSE physics tutorial"
    
    print("=" * 70)
    print("TESTING SERPAPI - REAL GOOGLE RESULTS")
    print("=" * 70)
    print(f"\nSearching for: {query}\n")
    
    # SerpAPI endpoint
    url = "https://serpapi.com/search"

    params = {
        'q': query,
        'api_key': SERPAPI_KEY,
        'engine': 'google',
        'num': 10,
        'hl': 'en',
        'gl': 'in',  # India-specific results
    }
    
    try:
        response = requests.get(url, params=params)
        
        if response.status_code != 200:
            print(f"❌ Error: Status {response.status_code}")
            print(response.text)
            return
        
        data = response.json()
        
        # Check for API error
        if 'error' in data:
            print(f"❌ API Error: {data['error']}")
            print("\nMake sure you:")
            print("1. Have a valid SerpAPI key")
            print("2. Replace 'YOUR_API_KEY_HERE' with your actual key")
            print("3. Sign up at https://serpapi.com (free)")
            return
        
        # Get organic results (real search results)
        results = data.get('organic_results', [])
        
        if results:
            print(f"✅ FOUND {len(results)} REAL ARTICLES FROM GOOGLE:\n")
            print("-" * 70)
            
            for i, result in enumerate(results, 1):
                title = result.get('title', 'No title')
                url = result.get('link', '')
                snippet = result.get('snippet', '')
                source = result.get('displayed_link', '')
                
                print(f"\n{i}. {title}")
                print(f"   URL: {url}")
                print(f"   Source: {source}")
                print(f"   Preview: {snippet[:100]}...")
                
                # Verify it's a real URL
                if url.startswith('http'):
                    print(f"   ✅ REAL URL")
                else:
                    print(f"   ❌ NOT A REAL URL")
        else:
            print("❌ No results found")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n" + "=" * 70)
    print("EXPECTED RESULTS:")
    print("You should see REAL URLs like:")
    print("  • https://byjus.com/physics/reflection-of-light/")
    print("  • https://www.toppr.com/guides/physics/light/")
    print("  • https://www.vedantu.com/physics/light-reflection")
    print("=" * 70)

if __name__ == "__main__":
    if SERPAPI_KEY == "YOUR_API_KEY_HERE":
        print("\n⚠️ IMPORTANT: You need to get a SerpAPI key first!\n")
        print("Steps:")
        print("1. Go to https://serpapi.com")
        print("2. Sign up for FREE account")
        print("3. Get your API key")
        print("4. Replace 'YOUR_API_KEY_HERE' in this script")
        print("5. Run this script again\n")
    else:
        test_serpapi()