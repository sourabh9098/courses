import json

# Read Json dat

def read_data():
    with open('course.json' , 'r') as fs:
        data = json.load(fs)
        return data


# write data 

def write_data(data):
    with open('course.json' , 'w') as fs:
        json.dump(data , fs)


