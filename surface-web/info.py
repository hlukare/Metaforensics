import requests
from bs4 import BeautifulSoup
import pandas as pd
import time
import json
import re
from datetime import datetime
from fake_useragent import UserAgent
import urllib.parse
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import os

class SmartInfoExtractor:
    def __init__(self):
        self.ua = UserAgent()
        self.results = []
        self.social_platforms = {
            'linkedin': {
                'patterns': [r'linkedin\.com/in/([^/?]+)', r'linkedin\.com/pub/([^/?]+)'],
                'base_url': 'https://www.linkedin.com/in/{}'
            },
            'github': {
                'patterns': [r'github\.com/([^/?]+)'],
                'base_url': 'https://github.com/{}'
            },
            'twitter': {
                'patterns': [r'twitter\.com/([^/?]+)', r'x\.com/([^/?]+)'],
                'base_url': 'https://twitter.com/{}'
            },
            'instagram': {
                'patterns': [r'instagram\.com/([^/?]+)'],
                'base_url': 'https://instagram.com/{}'
            },
            'facebook': {
                'patterns': [r'facebook\.com/([^/?]+)', r'fb\.com/([^/?]+)'],
                'base_url': 'https://facebook.com/{}'
            },
            'youtube': {
                'patterns': [r'youtube\.com/([^/?]+)', r'youtube\.com/c/([^/?]+)', r'youtube\.com/user/([^/?]+)'],
                'base_url': 'https://youtube.com/{}'
            },
            'medium': {
                'patterns': [r'medium\.com/([^/?]+)', r'medium\.com/@([^/?]+)'],
                'base_url': 'https://medium.com/@{}'
            },
            'stackoverflow': {
                'patterns': [r'stackoverflow\.com/users/([^/?]+)'],
                'base_url': 'https://stackoverflow.com/users/{}'
            },
            'hackerrank': {
                'patterns': [r'hackerrank\.com/([^/?]+)'],
                'base_url': 'https://hackerrank.com/{}'
            },
            'leetcode': {
                'patterns': [r'leetcode\.com/([^/?]+)'],
                'base_url': 'https://leetcode.com/{}'
            },
            'codechef': {
                'patterns': [r'codechef\.com/users/([^/?]+)'],
                'base_url': 'https://codechef.com/users/{}'
            },
            'behance': {
                'patterns': [r'behance\.net/([^/?]+)'],
                'base_url': 'https://behance.net/{}'
            },
            'dribbble': {
                'patterns': [r'dribbble\.com/([^/?]+)'],
                'base_url': 'https://dribbble.com/{}'
            }
        }
    
    def get_headers(self):
        return {
            'User-Agent': self.ua.random,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
        }
    
    def extract_from_website(self, website_url):
        """Extract all social media links from personal website"""
        print(f"🌐 Scraping social links from: {website_url}")
        
        try:
            response = requests.get(website_url, headers=self.get_headers(), timeout=10)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            found_usernames = {}
            
            # Extract from <a> tags
            for link in soup.find_all('a', href=True):
                href = link['href']
                username = self.extract_username_from_url(href)
                if username:
                    found_usernames[username['platform']] = username['username']
            
            # Extract from text content (for handles mentioned in text)
            text_content = soup.get_text()
            found_usernames.update(self.extract_usernames_from_text(text_content))
            
            # Extract from meta tags
            for meta in soup.find_all('meta'):
                content = meta.get('content', '')
                if content:
                    found_usernames.update(self.extract_usernames_from_text(content))
            
            print(f"✅ Found {len(found_usernames)} social platforms from website")
            return found_usernames
            
        except Exception as e:
            print(f"❌ Error scraping website: {e}")
            return {}
    
    def extract_username_from_url(self, url):
        """Extract username from social media URL"""
        for platform, data in self.social_platforms.items():
            for pattern in data['patterns']:
                match = re.search(pattern, url, re.IGNORECASE)
                if match:
                    username = match.group(1)
                    # Clean username
                    username = re.sub(r'^@', '', username)  # Remove @ prefix
                    username = username.split('/')[0]  # Take first part if multiple segments
                    return {'platform': platform, 'username': username}
        return None
    
    def extract_usernames_from_text(self, text):
        """Extract potential usernames from text content"""
        found = {}
        
        # Common username patterns
        patterns = {
            'instagram': [r'instagram\.com/([a-zA-Z0-9._]+)', r'@([a-zA-Z0-9._]+)\s*\(?Instagram\)?'],
            'twitter': [r'twitter\.com/([a-zA-Z0-9_]+)', r'@([a-zA-Z0-9_]+)\s*\(?Twitter\)?'],
            'github': [r'github\.com/([a-zA-Z0-9_-]+)', r'GitHub[: ]+@?([a-zA-Z0-9_-]+)'],
            'linkedin': [r'linkedin\.com/in/([a-zA-Z0-9-]+)'],
        }
        
        for platform, platform_patterns in patterns.items():
            for pattern in platform_patterns:
                matches = re.findall(pattern, text, re.IGNORECASE)
                for match in matches:
                    if match and len(match) > 2:  # Minimum username length
                        found[platform] = match
                        break
        
        return found
    
    def verify_social_profiles(self, usernames_dict):
        """Verify and get details for each social profile"""
        verified_profiles = []
        
        for platform, username in usernames_dict.items():
            if platform in self.social_platforms:
                profile_url = self.social_platforms[platform]['base_url'].format(username)
                
                print(f"🔍 Checking {platform}: {profile_url}")
                
                profile_info = self.check_profile_exists(platform, profile_url, username)
                if profile_info:
                    verified_profiles.append(profile_info)
                
                time.sleep(1)  # Be respectful
        
        return verified_profiles
    
    def check_profile_exists(self, platform, profile_url, username):
        """Check if profile exists and extract basic info"""
        try:
            response = requests.get(profile_url, headers=self.get_headers(), timeout=10, allow_redirects=True)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                title = soup.find('title')
                title_text = title.text.strip() if title else f"{username} on {platform}"
                
                return {
                    'platform': platform.capitalize(),
                    'username': username,
                    'profile_url': profile_url,
                    'title': title_text,
                    'exists': True,
                    'verified_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                }
            else:
                return {
                    'platform': platform.capitalize(),
                    'username': username,
                    'profile_url': profile_url,
                    'title': f"Profile not found or private",
                    'exists': False,
                    'verified_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                }
                
        except Exception as e:
            print(f"❌ Error checking {platform}: {e}")
            return None
    
    def find_additional_profiles(self, known_usernames):
        """Try to find profiles on other platforms using known usernames"""
        additional_found = []
        
        common_platforms_to_check = ['github', 'twitter', 'instagram', 'medium', 'hackerrank', 'leetcode']
        
        for username in set(known_usernames.values()):
            for platform in common_platforms_to_check:
                if platform not in known_usernames:  # Don't re-check already known platforms
                    profile_url = self.social_platforms[platform]['base_url'].format(username)
                    
                    print(f"🔍 Trying {username} on {platform}: {profile_url}")
                    
                    profile_info = self.check_profile_exists(platform, profile_url, username)
                    if profile_info and profile_info['exists']:
                        additional_found.append(profile_info)
                    
                    time.sleep(1)
        
        return additional_found
    
    def comprehensive_search(self, website_url, name=None):
        """Comprehensive search starting from personal website"""
        print("🚀 STARTING COMPREHENSIVE SOCIAL MEDIA DISCOVERY")
        print("="*60)
        
        all_results = []
        
        # Step 1: Extract from personal website
        website_usernames = self.extract_from_website(website_url)
        
        if website_usernames:
            print(f"\n📋 Found usernames: {website_usernames}")
            
            # Step 2: Verify these profiles
            verified_profiles = self.verify_social_profiles(website_usernames)
            all_results.extend(verified_profiles)
            
            # Step 3: Find additional profiles using same usernames
            additional_profiles = self.find_additional_profiles(website_usernames)
            all_results.extend(additional_profiles)
        
        # Step 4: Also try name-based patterns as fallback
        if name:
            print(f"\n🔍 Trying name-based patterns for: {name}")
            name_patterns = self.generate_name_patterns(name)
            name_based_profiles = self.verify_social_profiles(name_patterns)
            all_results.extend([p for p in name_based_profiles if p not in all_results])
        
        # Generate report
        self.generate_comprehensive_report(all_results, website_url)
        
        # Save results
        self.save_results(all_results, website_url)
        
        return all_results
    
    def generate_name_patterns(self, name):
        """Generate common username patterns from name"""
        patterns = {}
        name_lower = name.lower()
        
        # Common username variations
        username_variations = [
            name_lower.replace(' ', ''),
            name_lower.replace(' ', '.'),
            name_lower.replace(' ', '_'),
            name_lower.replace(' ', '-'),
            ''.join(word[0] for word in name_lower.split()),  # initials
        ]
        
        # Try each variation on common platforms
        common_platforms = ['github', 'twitter', 'instagram']
        
        for platform in common_platforms:
            for username in username_variations:
                patterns[platform] = username
                break  # Just use first variation for each platform
        
        return patterns
    
    def generate_comprehensive_report(self, results, website_url):
        """Generate detailed report"""
        print("\n" + "="*70)
        print("📊 COMPREHENSIVE SOCIAL MEDIA REPORT")
        print("="*70)
        print(f"🌐 Source Website: {website_url}")
        
        if results:
            existing_profiles = [r for r in results if r['exists']]
            non_existing = [r for r in results if not r['exists']]
            
            print(f"\n✅ FOUND {len(existing_profiles)} ACTIVE PROFILES:")
            print("-" * 50)
            
            for profile in existing_profiles:
                print(f"📍 {profile['platform']}:")
                print(f"   👤 Username: {profile['username']}")
                print(f"   🔗 URL: {profile['profile_url']}")
                print(f"   📝 Title: {profile['title']}")
                print()
            
            if non_existing:
                print(f"\n❌ {len(non_existing)} PROFILES NOT FOUND/PRIVATE:")
                for profile in non_existing[:5]:  # Show first 5
                    print(f"   • {profile['platform']}: {profile['profile_url']}")
        
        else:
            print("\n❌ No social media profiles found!")
            print("\n💡 Tips:")
            print("   • Make sure social links are in your website's HTML")
            print("   • Check if your website is accessible")
            print("   • Try manual search with specific usernames")
        
        print("="*70)
    
    def save_results(self, results, source):
        """Save results to files"""
        if results:
            # Clean source for filename
            source_clean = re.sub(r'https?://', '', source).replace('/', '_').replace('.', '_')
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            
            # Save as CSV
            df = pd.DataFrame(results)
            csv_filename = f"social_profiles_{source_clean}_{timestamp}.csv"
            df.to_csv(csv_filename, index=False)
            print(f"\n💾 CSV saved: {csv_filename}")
            
            # Save as JSON
            json_filename = f"social_profiles_{source_clean}_{timestamp}.json"
            with open(json_filename, 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2, ensure_ascii=False)
            print(f"💾 JSON saved: {json_filename}")

def main():
    extractor = SmartInfoExtractor()
    
    print("🌐 SMART SOCIAL MEDIA EXTRACTOR")
    print("="*50)
    print("This tool extracts social media links from personal websites")
    print("and verifies them across multiple platforms.")
    print("="*50)
    
    # Use your website directly
    website_url = "https://hlukare.vercel.app/"
    name = "Harish Lukare"
    
    print(f"\n🎯 Target: {name}")
    print(f"🌐 Website: {website_url}")
    
    input("\nPress Enter to start extraction...")
    
    # Start comprehensive search
    results = extractor.comprehensive_search(website_url, name)
    
    if not results:
        print("\n🤔 No profiles found automatically.")
        manual_search = input("Would you like to try manual username search? (y/n): ")
        if manual_search.lower() == 'y':
            manual_usernames = input("Enter known usernames (comma separated): ").strip()
            if manual_usernames:
                usernames_list = [u.strip() for u in manual_usernames.split(',')]
                manual_results = []
                for username in usernames_list:
                    # Try this username on common platforms
                    for platform in ['github', 'twitter', 'instagram', 'linkedin']:
                        profile_info = extractor.check_profile_exists(
                            platform, 
                            extractor.social_platforms[platform]['base_url'].format(username),
                            username
                        )
                        if profile_info and profile_info['exists']:
                            manual_results.append(profile_info)
                
                if manual_results:
                    extractor.generate_comprehensive_report(manual_results, "Manual Search")
                    extractor.save_results(manual_results, "manual_search")

if __name__ == "__main__":
    main()