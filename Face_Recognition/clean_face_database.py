#!/usr/bin/env python3
import json
import re
import os

def normalize_name(name):
    """Normalize name by removing IDs and cleaning up formatting"""
    if not name:
        return name
    
    # Replace underscores and hyphens with spaces
    cleaned = name.replace('_', ' ').replace('-', ' ')
    
    # Remove LinkedIn/social media IDs (mixed alphanumeric like "1a889a2b8")
    # Only remove if it contains BOTH letters and numbers
    cleaned = re.sub(r'\s+[a-z0-9]*\d+[a-z0-9]*$', '', cleaned, flags=re.IGNORECASE)
    
    # Clean up multiple spaces
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    
    # Remove parentheses content at the end (like "Bhise (Pagar)")
    # cleaned = re.sub(r'\s*\([^)]*\)$', '', cleaned)
    
    return cleaned

def clean_face_database():
    db_path = "/media/ubuntu/Olive Green/Point514/Face_Recognition/face_database.json"
    backup_path = "/media/ubuntu/Olive Green/Point514/Face_Recognition/face_database.json.backup"
    
    print("=" * 60)
    print("Face Database Name Cleanup")
    print("=" * 60)
    print()
    
    # Load the database
    try:
        with open(db_path, 'r') as f:
            face_db = json.load(f)
    except Exception as e:
        print(f"❌ Error loading database: {e}")
        return
    
    print(f"Found {len(face_db)} entries in database")
    print()
    
    # Show what will be changed
    changes = []
    for old_name in face_db.keys():
        new_name = normalize_name(old_name)
        if old_name != new_name:
            changes.append((old_name, new_name))
    
    if not changes:
        print("✅ No names need cleaning!")
        return
    
    print(f"📋 Names to be cleaned ({len(changes)} changes):")
    print("-" * 60)
    for old, new in changes:
        print(f"  {old:40s} → {new}")
    print()
    
    # Ask for confirmation
    response = input("Apply these changes? (yes/no): ").strip().lower()
    
    if response != 'yes':
        print("❌ Cancelled")
        return
    
    # Create backup
    print("\n📦 Creating backup...")
    try:
        with open(backup_path, 'w') as f:
            json.dump(face_db, f, indent=2)
        print(f"✅ Backup saved to: {backup_path}")
    except Exception as e:
        print(f"❌ Failed to create backup: {e}")
        return
    
    # Apply changes
    print("\n🔧 Applying changes...")
    new_db = {}
    for old_name, embedding in face_db.items():
        new_name = normalize_name(old_name)
        new_db[new_name] = embedding
        if old_name != new_name:
            print(f"  ✓ Renamed: {old_name} → {new_name}")
    
    # Save updated database
    try:
        with open(db_path, 'w') as f:
            json.dump(new_db, f, indent=2)
        print("\n✅ Database updated successfully!")
        print(f"\nOld database backed up to: {backup_path}")
    except Exception as e:
        print(f"\n❌ Failed to save updated database: {e}")
        print("Restoring from backup...")
        try:
            with open(backup_path, 'r') as f:
                backup_db = json.load(f)
            with open(db_path, 'w') as f:
                json.dump(backup_db, f, indent=2)
            print("✅ Restored from backup")
        except:
            print("❌ Failed to restore backup!")
    
    print("\n" + "=" * 60)
    print("Summary:")
    print(f"  - Original entries: {len(face_db)}")
    print(f"  - Updated entries: {len(new_db)}")
    print(f"  - Names changed: {len(changes)}")
    print("=" * 60)

if __name__ == "__main__":
    clean_face_database()
