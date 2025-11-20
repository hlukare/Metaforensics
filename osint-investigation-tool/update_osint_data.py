#!/usr/bin/env python3
import json

# Data to add
aadhar_data = [
    {
        "ref_id": "70472",
        "status": "VALID",
        "message": "Aadhaar Card Exists",
        "care_of": "S/O: Lukare",
        "address": "Amrutdham, Ayodhya Nagari, Nashik 422207",
        "dob": "06-03-2004",
        "email": "lukareharish@gmail.com",
        "gender": "M",
        "name": "harish lukare",
        "year_of_birth": 2004
    },
    {
        "ref_id": "70473",
        "name": "Ishan Jawale",
        "dob": "16-03-2004",
        "email": "icjawale370122@kkwagh.edu.in",
        "gender": "M",
        "address": "Flat 91, Prakash Apartments,Nashik Road, India",
        "year_of_birth": 2004
    },
    {
        "ref_id": "70474",
        "name": "Priya Rakibe",
        "dob": "31-10-1991",
        "email": "priyarakibe@gmail.com",
        "gender": "F",
        "address": "Hirabai Haridas Vidyanagari, Mumbai Agra Road Amrutdham, Panchavati, Nashik, Maharashtra 422003",
        "year_of_birth": 1991
    },
    {
        "ref_id": "70475",
        "name": "Ms. J. R. Mankar",
        "dob": "06-06-1991",
        "email": "jrmankar@kkwagh.edu.in",
        "gender": "F",
        "address": "Hirabai Haridas Vidyanagari, Mumbai Agra Road Amrutdham, Panchavati, Nashik, Maharashtra 422003",
        "year_of_birth": 1991
    },
    {
        "ref_id": "70476",
        "name": "Kishan Dinesh Mali",
        "dob": "12-06-2005",
        "email": "kishanmali2003@gmail.com",
        "gender": "M",
        "address": "727/14, Indira Nagar , Sector 25, Nashik-Maharashtra, India",
        "year_of_birth": 2005
    },
    {
        "ref_id": "70477",
        "name": "Shrikrushna Sanjay Jadhav",
        "dob": "05-06-2005",
        "email": "ssjadhav@gmail.com",
        "gender": "M",
        "address": "11, Mahatma Gandhi Road, Kalwan, Maharashtra",
        "year_of_birth": 2005
    },
    {
        "ref_id": "70478",
        "name": "Mr. N. M. Shahane",
        "dob": "1984",
        "email": "nmshahane@kkwagh.edu.in",
        "gender": "M",
        "address": "Hirabai Haridas Vidyanagari, Mumbai Agra Road Amrutdham, Panchavati, Nashik, Maharashtra 422003",
        "year_of_birth": 1984
    },
    {
        "ref_id": "70479",
        "name": "Prof. I. Priyadarshini",
        "dob": "1982",
        "email": "ipriyadarshini@kkwagh.edu.in",
        "gender": "F",
        "address": "Hirabai Haridas Vidyanagari, Mumbai Agra Road Amrutdham, Panchavati, Nashik, Maharashtra 422003",
        "year_of_birth": 1982
    }
]

# PAN records to add
pan_records = [
    {
        "pan_number": "HLMKR0603D",
        "name": "harish lukare",
        "dob": "06-03-2004",
        "father_name": "Lukare",
        "date_of_issue": "15-06-2022",
        "photo_link": "<pan_photo_base64_encoded>"
    },
    {
        "pan_number": "IJCJW1603E",
        "name": "Ishan Jawale",
        "dob": "16-03-2004",
        "father_name": "C Jawale",
        "date_of_issue": "22-09-2022",
        "photo_link": "<pan_photo_base64_encoded>"
    },
    {
        "pan_number": "PRRAK3110F",
        "name": "Priya Rakibe",
        "dob": "31-10-1991",
        "father_name": "",
        "date_of_issue": "18-03-2015",
        "photo_link": "<pan_photo_base64_encoded>"
    },
    {
        "pan_number": "JRMAN0606G",
        "name": "Ms. J. R. Mankar",
        "dob": "06-06-1991",
        "father_name": "",
        "date_of_issue": "25-08-2014",
        "photo_link": "<pan_photo_base64_encoded>"
    },
    {
        "pan_number": "KDMAL1206H",
        "name": "Kishan Dinesh Mali",
        "dob": "12-06-2005",
        "father_name": "Dinesh Mali",
        "date_of_issue": "10-01-2024",
        "photo_link": "<pan_photo_base64_encoded>"
    },
    {
        "pan_number": "SSJAD0506I",
        "name": "Shrikrushna Sanjay Jadhav",
        "dob": "05-06-2005",
        "father_name": "S Jadhav",
        "date_of_issue": "15-02-2024",
        "photo_link": "<pan_photo_base64_encoded>"
    },
    {
        "pan_number": "NMSHA1984J",
        "name": "Mr. N. M. Shahane",
        "dob": "1984",
        "father_name": "",
        "date_of_issue": "12-05-2008",
        "photo_link": "<pan_photo_base64_encoded>"
    },
    {
        "pan_number": "IPRID1982K",
        "name": "Prof. I. Priyadarshini",
        "dob": "1982",
        "father_name": "",
        "date_of_issue": "08-07-2006",
        "photo_link": "<pan_photo_base64_encoded>"
    }
]

# Voter records to add  
voter_records = [
    {
        "reference_id": 70472,
        "verification_id": "testverificationid70472",
        "status": "VALID",
        "epic_number": "HLK0603200",
        "name": "HARISH LUKARE",
        "name_in_regional_lang": "<हरीश लुकारे>",
        "age": "21",
        "relation_type": "FTHR",
        "relation_name": "LUKARE",
        "father_name": "LUKARE",
        "dob": "2004-03-06",
        "gender": "Male",
        "address": "Amrutdham, Ayodhya Nagari, Nashik 422207",
        "photo": "PHOTO_LINK.jpeg",
        "split_address": {
            "district": ["NASHIK"],
            "state": [["Maharashtra"]],
            "city": ["NASHIK"],
            "pincode": "422207",
            "country": ["IN", "IND", "INDIA"],
            "address_line": "Amrutdham, Ayodhya Nagari"
        },
        "state": "Maharashtra",
        "assembly_constituency_number": "25",
        "assembly_constituency": "NASHIK EAST",
        "parliamentary_constituency_number": "21",
        "parliamentary_constituency": "NASHIK",
        "part_number": "118",
        "part_name": "AYODHYA NAGARI",
        "serial_number": "472",
        "polling_station": "AMRUTDHAM PRIMARY SCHOOL"
    },
    {
        "reference_id": 70473,
        "verification_id": "testverificationid70473",
        "status": "VALID",
        "epic_number": "IJW1603200",
        "name": "ISHAN JAWALE",
        "age": "21",
        "relation_type": "FTHR",
        "relation_name": "C JAWALE",
        "father_name": "C JAWALE",
        "dob": "2004-03-16",
        "gender": "Male",
        "address": "Flat 91, Prakash Apartments, Nashik Road",
        "photo": "PHOTO_LINK.jpeg",
        "split_address": {
            "district": ["NASHIK"],
            "state": [["Maharashtra"]],
            "city": ["NASHIK"],
            "pincode": "422101",
            "country": ["IN", "IND", "INDIA"],
            "address_line": "Flat 91, Prakash Apartments"
        },
        "state": "Maharashtra"
    },
    {
        "reference_id": 70474,
        "verification_id": "testverificationid70474",
        "status": "VALID",
        "epic_number": "PRR3110199",
        "name": "PRIYA RAKIBE",
        "age": "34",
        "relation_type": "FTHR",
        "relation_name": "",
        "father_name": "",
        "dob": "1991-10-31",
        "gender": "Female",
        "address": "Hirabai Haridas Vidyanagari, Panchavati, Nashik",
        "photo": "PHOTO_LINK.jpeg",
        "split_address": {
            "district": ["NASHIK"],
            "state": [["Maharashtra"]],
            "city": ["NASHIK"],
            "pincode": "422003",
            "country": ["IN", "IND", "INDIA"],
            "address_line": "Mumbai Agra Road Amrutdham"
        },
        "state": "Maharashtra"
    },
    {
        "reference_id": 70475,
        "verification_id": "testverificationid70475",
        "status": "VALID",
        "epic_number": "JRM0606199",
        "name": "MS. J. R. MANKAR",
        "age": "34",
        "relation_type": "FTHR",
        "relation_name": "",
        "father_name": "",
        "dob": "1991-06-06",
        "gender": "Female",
        "address": "Hirabai Haridas Vidyanagari, Panchavati, Nashik",
        "photo": "PHOTO_LINK.jpeg",
        "split_address": {
            "district": ["NASHIK"],
            "state": [["Maharashtra"]],
            "city": ["NASHIK"],
            "pincode": "422003",
            "country": ["IN", "IND", "INDIA"],
            "address_line": "Mumbai Agra Road Amrutdham"
        },
        "state": "Maharashtra"
    },
    {
        "reference_id": 70476,
        "verification_id": "testverificationid70476",
        "status": "VALID",
        "epic_number": "KDM1206200",
        "name": "KISHAN DINESH MALI",
        "age": "20",
        "relation_type": "FTHR",
        "relation_name": "DINESH MALI",
        "father_name": "DINESH MALI",
        "dob": "2005-06-12",
        "gender": "Male",
        "address": "727/14, Indira Nagar, Sector 25, Nashik",
        "photo": "PHOTO_LINK.jpeg",
        "split_address": {
            "district": ["NASHIK"],
            "state": [["Maharashtra"]],
            "city": ["NASHIK"],
            "pincode": "422009",
            "country": ["IN", "IND", "INDIA"],
            "address_line": "Indira Nagar, Sector 25"
        },
        "state": "Maharashtra"
    },
    {
        "reference_id": 70477,
        "verification_id": "testverificationid70477",
        "status": "VALID",
        "epic_number": "SSJ0506200",
        "name": "SHRIKRUSHNA SANJAY JADHAV",
        "age": "20",
        "relation_type": "FTHR",
        "relation_name": "S JADHAV",
        "father_name": "SANJAY JADHAV",
        "dob": "2005-06-05",
        "gender": "Male",
        "address": "11, Mahatma Gandhi Road, Kalwan",
        "photo": "PHOTO_LINK.jpeg",
        "split_address": {
            "district": ["NASHIK"],
            "state": [["Maharashtra"]],
            "city": ["KALWAN"],
            "pincode": "423501",
            "country": ["IN", "IND", "INDIA"],
            "address_line": "Mahatma Gandhi Road"
        },
        "state": "Maharashtra"
    },
    {
        "reference_id": 70478,
        "verification_id": "testverificationid70478",
        "status": "VALID",
        "epic_number": "NMS1984000",
        "name": "MR. N. M. SHAHANE",
        "age": "41",
        "relation_type": "FTHR",
        "relation_name": "",
        "father_name": "",
        "dob": "1984",
        "gender": "Male",
        "address": "Hirabai Haridas Vidyanagari, Panchavati, Nashik",
        "photo": "PHOTO_LINK.jpeg",
        "split_address": {
            "district": ["NASHIK"],
            "state": [["Maharashtra"]],
            "city": ["NASHIK"],
            "pincode": "422003",
            "country": ["IN", "IND", "INDIA"],
            "address_line": "Mumbai Agra Road Amrutdham"
        },
        "state": "Maharashtra"
    },
    {
        "reference_id": 70479,
        "verification_id": "testverificationid70479",
        "status": "VALID",
        "epic_number": "IPR1982000",
        "name": "PROF. I. PRIYADARSHINI",
        "age": "43",
        "relation_type": "FTHR",
        "relation_name": "",
        "father_name": "",
        "dob": "1982",
        "gender": "Female",
        "address": "Hirabai Haridas Vidyanagari, Panchavati, Nashik",
        "photo": "PHOTO_LINK.jpeg",
        "split_address": {
            "district": ["NASHIK"],
            "state": [["Maharashtra"]],
            "city": ["NASHIK"],
            "pincode": "422003",
            "country": ["IN", "IND", "INDIA"],
            "address_line": "Mumbai Agra Road Amrutdham"
        },
        "state": "Maharashtra"
    }
]

# Function to prepend records
def prepend_records(file_path, new_records):
    print(f"Processing {file_path}...")
    try:
        # Read existing data
        with open(file_path, 'r') as f:
            existing_data = json.load(f)
        
        # Prepend new records
        updated_data = new_records + existing_data
        
        # Write back
        with open(file_path, 'w') as f:
            json.dump(updated_data, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Successfully updated {file_path} - Added {len(new_records)} records")
        print(f"   Total records now: {len(updated_data)}")
    except Exception as e:
        print(f"❌ Error updating {file_path}: {e}")

# Update files
base_path = "/media/ubuntu/Olive Green/Point514/osint-investigation-tool/data"

print("=" * 60)
print("Updating OSINT Data Files")
print("=" * 60)
print()

# Only update pan.json and voters.json (not criminal.json as requested)
prepend_records(f"{base_path}/pan.json", pan_records)
print()
prepend_records(f"{base_path}/voters.json", voter_records)
print()

print("=" * 60)
print("✅ Update Complete!")
print("=" * 60)
print()
print("Note: aadhar.json already contains the data")
print("Note: criminal.json was not updated (as requested)")
