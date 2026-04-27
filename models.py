from pydantic import BaseModel , Field, field_validator , model_validator , computed_field
from typing import Optional

class Product(BaseModel):
    id:Optional[int] = None
    title:str=Field(min_length=2 , max_length=50 , description='Title Of Courses')
    instructor:str=Field(min_length=2 , max_length=30 , description='Name Of Instructor For This Course')
    category:str=Field(min_length=1 , max_length=20 , description='Category of course')
    price:int=Field(ge=1 , le=10000 , description='Price of course')
    duration_hours:int=Field(ge=1 ,le=500 , description='Duration Of Course Completion')
    is_published:bool=Field(default=True)
    discount_percent:Optional[float]=Field(ge=0.0 , le=50 , description="Discount Percentage" , default=None)


    # creating Field Validator
    @field_validator('instructor')
    @classmethod
    def instructor_check(cls , value:str)->str:
        return value.title()
    
    @field_validator('category')
    @classmethod
    def category_check(cls, value:str)->str:
        return value.lower()
    
    @model_validator(mode='after')
    def public_discount_check(product):
        if not product.is_published and product.discount_percent>0.0:
            raise ValueError("Not Possible When Course is not publish how can you give discount")
        return product
    
    # create computed field for price category
    @computed_field
    @property
    def price_category(product)->str:
        if product.price <= 500:
            return 'In Budget'
        elif product.price <= 1000:
            return 'Mid Range'
        else:
            return "Premium Range"

