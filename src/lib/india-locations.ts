// src/lib/india-locations.ts
// State → Cities mapping — no new fields, sirf UI improvement

export const INDIA_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
    'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
    'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
    'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli',
    'Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh',
    'Lakshadweep', 'Puducherry',
]

export const STATE_CITIES: Record<string, string[]> = {
    'Andhra Pradesh': [
        'Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool',
        'Tirupati', 'Kakinada', 'Rajahmundry', 'Kadapa', 'Anantapur',
    ],
    'Arunachal Pradesh': [
        'Itanagar', 'Naharlagun', 'Pasighat', 'Tezpur',
    ],
    'Assam': [
        'Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon',
        'Tinsukia', 'Tezpur', 'Bongaigaon',
    ],
    'Bihar': [
        'Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga',
        'Purnia', 'Arrah', 'Begusarai', 'Katihar', 'Munger',
        'Chapra', 'Hajipur', 'Sasaram', 'Jehanabad',
    ],
    'Chhattisgarh': [
        'Raipur', 'Bhilai', 'Korba', 'Bilaspur', 'Durg',
        'Rajnandgaon', 'Jagdalpur', 'Raigarh',
    ],
    'Goa': [
        'Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda',
    ],
    'Gujarat': [
        'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar',
        'Jamnagar', 'Junagadh', 'Gandhinagar', 'Anand', 'Navsari',
        'Morbi', 'Nadiad', 'Surendranagar',
    ],
    'Haryana': [
        'Faridabad', 'Gurgaon', 'Panipat', 'Ambala', 'Yamunanagar',
        'Rohtak', 'Hisar', 'Karnal', 'Sonipat', 'Panchkula',
        'Bhiwani', 'Sirsa', 'Bahadurgarh',
    ],
    'Himachal Pradesh': [
        'Shimla', 'Mandi', 'Solan', 'Dharamsala', 'Kullu',
        'Baddi', 'Nahan', 'Paonta Sahib',
    ],
    'Jharkhand': [
        'Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar',
        'Phusro', 'Hazaribagh', 'Giridih', 'Ramgarh',
    ],
    'Karnataka': [
        'Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi',
        'Kalaburagi', 'Ballari', 'Vijayapura', 'Shivamogga', 'Tumkur',
        'Davanagere', 'Udupi', 'Hassan',
    ],
    'Kerala': [
        'Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam',
        'Palakkad', 'Alappuzha', 'Malappuram', 'Kannur', 'Kasaragod',
    ],
    'Madhya Pradesh': [
        'Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain',
        'Sagar', 'Ratlam', 'Satna', 'Dewas', 'Murwara',
        'Chhindwara', 'Rewa', 'Singrauli',
    ],
    'Maharashtra': [
        'Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik',
        'Aurangabad', 'Solapur', 'Kolhapur', 'Amravati', 'Nanded',
        'Sangli', 'Malegaon', 'Jalgaon', 'Akola', 'Latur',
    ],
    'Manipur': [
        'Imphal', 'Thoubal', 'Kakching', 'Churachandpur',
    ],
    'Meghalaya': [
        'Shillong', 'Tura', 'Nongstoin',
    ],
    'Mizoram': [
        'Aizawl', 'Lunglei', 'Champhai',
    ],
    'Nagaland': [
        'Kohima', 'Dimapur', 'Mokokchung',
    ],
    'Odisha': [
        'Bhubaneswar', 'Cuttack', 'Rourkela', 'Brahmapur', 'Sambalpur',
        'Puri', 'Balasore', 'Bhadrak', 'Baripada',
    ],
    'Punjab': [
        'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda',
        'Mohali', 'Firozpur', 'Batala', 'Pathankot', 'Moga',
        'Sangrur', 'Hoshiarpur',
    ],
    'Rajasthan': [
        'Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer',
        'Udaipur', 'Bhilwara', 'Alwar', 'Bharatpur', 'Sikar',
        'Pali', 'Sri Ganganagar', 'Tonk',
    ],
    'Sikkim': [
        'Gangtok', 'Namchi', 'Gyalshing',
    ],
    'Tamil Nadu': [
        'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem',
        'Tirunelveli', 'Tiruppur', 'Vellore', 'Erode', 'Thoothukkudi',
        'Dindigul', 'Thanjavur', 'Ranipet',
    ],
    'Telangana': [
        'Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam',
        'Ramagundam', 'Mahbubnagar', 'Nalgonda', 'Adilabad',
    ],
    'Tripura': [
        'Agartala', 'Udaipur', 'Dharmanagar',
    ],
    'Uttar Pradesh': [
        'Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Meerut',
        'Allahabad', 'Bareilly', 'Aligarh', 'Moradabad', 'Gorakhpur',
        'Noida', 'Ghaziabad', 'Firozabad', 'Jhansi', 'Saharanpur',
        'Mathura', 'Muzaffarnagar', 'Rampur', 'Shahjahanpur',
        'Sitapur', 'Lakhimpur', 'Unnao', 'Rae Bareli',
    ],
    'Uttarakhand': [
        'Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur',
        'Kashipur', 'Rishikesh', 'Nainital',
    ],
    'West Bengal': [
        'Kolkata', 'Howrah', 'Asansol', 'Siliguri', 'Durgapur',
        'Bardhaman', 'Malda', 'Baharampur', 'Habra', 'Kharagpur',
        'Shantipur', 'Dankuni', 'Dhulian',
    ],
    'Delhi': [
        'New Delhi', 'Dwarka', 'Rohini', 'Pitampura', 'Janakpuri',
        'Saket', 'Lajpat Nagar', 'Karol Bagh', 'Connaught Place',
        'Shahdara', 'Preet Vihar', 'Mayur Vihar',
    ],
    'Jammu and Kashmir': [
        'Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Sopore',
        'Kathua', 'Udhampur',
    ],
    'Ladakh': [
        'Leh', 'Kargil',
    ],
    'Chandigarh': [
        'Chandigarh', 'Manimajra', 'Panchkula',
    ],
    'Puducherry': [
        'Puducherry', 'Karaikal', 'Mahe',
    ],
    'Andaman and Nicobar Islands': [
        'Port Blair',
    ],
    'Dadra and Nagar Haveli': [
        'Silvassa',
    ],
    'Daman and Diu': [
        'Daman', 'Diu',
    ],
    'Lakshadweep': [
        'Kavaratti',
    ],
}