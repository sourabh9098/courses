# from utils import read_data , write_data
# from models import Course
# from fastapi import APIRouter , Query , HTTPException

# route = APIRouter()

# # #read whole dataset
# # @route.get('/data')
# # def data():
# #     data = read_data()
#     # return data

# # # Read Data by any pertuculer ID

# # @route.get('/data/{item_id}')   
# # def data_by_id(item_id:int):
# #     data = read_data()
# #     item=[i for i in data if i['id']==item_id]
# #     if not item:
# #         return HTTPException(status_code=404 , detail='Id not found')
# #     return item


# # # create new course 

# # # @route.post('/new_course')
# # # def new_course(product:Product , response_model=Product):
# # #     data=read_data()
# # #     new_id = max([ i[id] for i in data])+1 if data else 1
# # #     new_course=product.dict()
# # #     new_course['id'] = new_id
# # #     data.append(new_course)
# # #     write_data(data)
# # #     return {"message": "Course Added Successfully"}

# # @route.post('/new_course', response_model=Product)
# # def new_course(product: Product):
# #     data = read_data()
# #     new_id = max([i["id"] for i in data]) + 1 if data else 1
# #     new_course = product.dict()
# #     new_course['id'] = new_id
# #     data.append(new_course)
# #     write_data(data)
    
# #     # return {"message": "Course Added Successfully"}
# #     return Product(**new_course)



# # #Put method
# # @route.put('/update/{item_id}')
# # def update_item(item_id:int,product:Product):
# #     data=read_data()
# #     item_index=0
# #     for i,item in enumerate(data):
# #         if item['id']==item_id:
# #             item_index=i
# #     updated_product=product.dict()
# #     updated_product['id']=item_id
# #     data[item_index]=updated_product
# #     write_data(data)
# #     return {'Data updated successfully'}



# # #Delete method
# # @route.delete('/delete/{item_id}')
# # def delete_item(item_id:int):
# #     try:
# #         data=read_data()
# #         item_index=None
# #         for i,item in enumerate(data):
# #             if item['id']==item_id:
# #                 item_index=i
# #                 break
# #         data.pop(item_index)
# #         write_data(data)
# #         return {'Data deleted successfully'}
# #     except Exception as err:
# #         raise HTTPException(status_code=404,detail="id not found")
    


# # #QUERY
# # @route.get('/filter')
# # def filter(
# #         id:int=Query(None,description="filter data according to id")
# # ):
# #     data=read_data()
# #     if id:
# #         data=[i for i in data if i['id']==id]
# #     return {'Data':data}


# # #pagination
# # @route.get('/items')
# # def get_item(
# #         page:int=Query(1,ge=1),
# #         limit:int=Query(10,ge=1,le=100)
# # ):
# #     data=read_data()
# #     start=(page-1)*limit
# #     end=start+limit
# #     return {
# #         "Total items":len(data),
# #         "Current page no.":page,
# #         "records shown on this page":limit,
# #         "Data":data[start:end]
# #     }


# # # category wise filtering 

# # @route.get('/category')
# # def filter_according_category(
# #         cat:str=Query(None,description="filter data according to category")
# # ):
# #     data=read_data()
# #     if cat:
# #         data=[i for i in data if i['category']==cat]
# #     return {'Data':data}















# #  POSTGRE SQL ROUTES NEW



# from utils import read_data , write_data
# from db_model import Course
# from fastapi import APIRouter , Query , HTTPException , Depends
# from database import get_db
# from sqlalchemy.orm import Session 
# from sqlalchemy import text
# from db_model import Course

# route = APIRouter()

# @route.get('/data')
# def data(db:Session =Depends(get_db)):
#     # SQL Query for fetching whole data 
#     result = db.execute(text("SELECT * FROM courses"))
#     return result.mappings().all() # Converting all the records in dict format


# @route.get('/data/{id}')
# def fet_data_by_id(id:int , db:Session=Depends(get_db)):
#     #Write a sql query to fetch data by id
#     result = db.execute(text("SELECT * FROM courses WHERE id =:id"),{'id':id}) # {'id':id} it menas id me jo value aaygi bo asign kar deta hain value jab bhi ay asign kr dena
#     return result.mappings().first()



# # POST create new course

# @route.post('/create',tags=['Post'])
# def new_course(course:Course , db:Session=Depends(get_db)): # responsible for request body (Object:Class)
#     data=course.dict(exclude={"price_category"}) # converting pydantic objae t to dict and excluding id and price category

#     # Query for creating new record in the database
#     result = db.execute(text("""
#         INSERT INTO courses (title , instructor , category , price , duration_hours , is_published , discount_percent)
#         VALUES(:title , :instructor , :category , :price , :duration_hours , :is_published , :discount_percent)
#     """),data)
#     db.commit()
#     return {'message':'Course Created Successfully'}




# # PUT Update ezisting course

# @route.put('/update/{item_id}' ,  tags=['Put'])
# def update_item(item_id:int , course:Course , db:Session=Depends(get_db)):
#     # ~Get existing id from database
#     existing = db.execute(text("SELECT * FROM courses WHERE id =:id"),{'id':id}).first()

#     if not existing:
#         raise HTTPException(status_code=404 , detail="No Course Found for this id ")
    
#     data = course.dist()
#     data[id] = item_id

#     #Update Query
#     db.execute(text("""
#         UPDATE courses
#         SET title - :title , 
#             instructor = :instructor ,
#             category = :category , 
#             price = :price , 
#             duration_hours = :duration_hours , 
#             is_published = :is_published , 
#             discount_percent = :discount_percent
#         WHERE id=:id
#     """),data)
#     db.commit()



# # delete any course

# @route.delete("/delete/{item_id}" , tags=['Delete'])
# def delete_course(item_id:int , db:Session =Depends(get_db) ):
#     existing = db.execute(text("DELETE FROM courses WHERE id =:id"),{'id':item_id})

#     db.commit()

#     return {"Message":"Courses Deleted Successfully"}
















###-------------------------NEW REFRESH-----------------------###


from utils import read_data , write_data
from models import Course
from fastapi import APIRouter , Query , HTTPException , Depends , params
from database import get_db
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional

route = APIRouter()

@route.get('/data')
def data(db:Session=Depends(get_db)):
    #Write a sql query for fetching whole data
    result = db.execute(text("SELECT * FROM courses"))
    return result.mappings().all() # Converting all the records in dict format



# Creting routes for get data using id
@route.get('/data/{id}')
def get_data_by_id(id:int , db:Session=Depends(get_db)):
    #Write Sql Query to fetch data by id
    result=db.execute(text("SELECT * FROM courses WHERE id=:id") , {'id':id}) # Parameter binding / placeHolder = :id
    return result.mappings().first()




# Post Method -> For creating new courses 
@route.post('/new_course')
def new_course(course:Course , db:Session=Depends(get_db)):
    data=course.dict(exclude={"price_category"})

    # Query To create new course  DATABASE
    result = db.execute(text(
        """INSERT INTO courses (title,instructor,category,price,duration_hours,is_published,discount_percent) 
        VALUES (:title,:instructor,:category,:price,:duration_hours,:is_published,:discount_percent)"""),data)
    db.commit()
    return {"Message":"Course Create Succefully"}





# For Update Existing Courses (PUT METHOD)
@route.put('/update')
def update_course(id:int , course:Course , db:Session=Depends(get_db)):
    existing = db.execute(text("SELECT * FROM courses WHERE id=:id") , {'id':id})

    if not existing:
        raise HTTPException(status_code=404 , detail="No Course Found For This ID")
    
    data=course.dict()
    data['id']=id

    # Update Course In Databse Query

    db.execute(text(
        """UPDATE courses SET title = :title,
        instructor=:instructor ,
        category=:category,
        price=:price,
        duration_hours=:duration_hours,
        is_published=:is_published,
        discount_percent=:discount_percent
        WHERE id=:id"""),data)
    
    db.commit()
    return {"Message":"Course Updated Successfully"}



# Deleting any course by id (DELETE ROUTE)
@route.delete('/delete')
def delete_item(id:int  , db:Session=Depends(get_db)):
    existing=db.execute(text("SELECT * FROM Courses WHERE id=:id"),{'id':id})

    if not existing:
        raise HTTPException(status_code=404 , detail="No Course Found For This Id")
    
    # Deleting courses by id in database
    db.execute(text("DELETE FROM courses WHERE id=:id"),{'id':id}).fetchone()
    
    db.commit()
    return {"Message":"Course Deleted Successfully"}


# title,instructor,category,price,duration_hours,is_published,discount_percent


# Get courses  to filter
@route.get('/filter' , tags=['Filter'])
def filter_courses(
    category:       Optional[str] = Query(None , description="Filter According By Category") ,
    instructor: Optional[str] = Query(None , description="Filter by instructor") ,
    is_published : Optional[bool] = Query(None , description="Filter Acording to Is_published"),
    min_price : Optional[float] = Query(None , description="Filter according min price") ,
    max_price : Optional[float] = Query(None , description="Filter According to max price"),
    min_duration : Optional[int] = Query(None , description="Filter According TO min Duration Hours"),
    db:Session=Depends(get_db)
):
    
    query = "SELECT * FROM courses where 1=1" # No option condition
    params = {}
    if category:
        query+= " AND category =:category"
        params['category'] = category

    if instructor:
        query+= " AND instructor = :instructor"
        params['instructor'] = instructor

    if is_published is not None:
        query+= " AND is_published = :is_published"
        params['is_published'] = is_published

    if min_price is not None:
        query+= " AND price >= :min_price"
        params['min_price'] = min_price

    if max_price is not None:
        query+= " AND price <= :max_price"
        params['max_price'] = max_price

    if min_duration is not None:
        query+= " AND duration_hours >=:min_duration"
        params['min_duration'] = min_duration


    return db.execute(text(query) , params).mappings().all()


    # # params = {}
    # if instructor:
    #     query+= " AND instructor =:instructor"
    #     params['instructor'] = instructor

    #     return db.execute(text(query) , params).mappings().all()




# Get pegination courses

@route.get('/items' , tags=['Pagination'])
def get_courses(
    page:int=Query(1,ge=1),
    limit:int=Query(10 , ge=1),
    db:Session=Depends(get_db)
):

    offset = (page-1)*limit # (1-1)*10 =0
    data = db.execute(text("SELECT * FROM courses ORDER BY id ASC LIMIT :limit OFFSET :offset"),{'limit':limit ,'offset':offset}).mappings().all()

    return {"total":len(data),
            'page':page,
            "limit": limit,
            'offset':offset,
            'data':data}

   












# # @route.get('/items')
# # def get_item(
# #         page:int=Query(1,ge=1),
# #         limit:int=Query(10,ge=1,le=100)
# # ):
# #     data=read_data()
# #     start=(page-1)*limit
# #     end=start+limit
# #     return {
# #         "Total items":len(data),
# #         "Current page no.":page,
# #         "records shown on this page":limit,
# #         "Data":data[start:end]
# #     }









