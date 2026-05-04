# import json 
# from database import Session
# from db_model import Course

# # DB Session
# db = Session()

# # JSON READ
# with open ("course.json" , 'r') as fs:
#     data = json.load(fs)

# # print(data)

# # INSERT data into postgre table 

# for i in data:
#     course = Course(
#         title=i['title'],
#         instructor=i['instructor'],
#         category=i['category'] ,
#         price=i['price'] , 
#         duration_hours=i['duration_hours'] ,
#         is_published=i['is_published'] ,
#         discount_percent=i['discount_percent']
#     )
#     db.add(course)

# #commit changes 

# db.commit()
# db.close()

# print("Data successfully added")
