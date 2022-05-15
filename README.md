# :stethoscope: Medinfo Backend

This is the backend of the MEDINFO application.
It's designed for doctors to create and manage their patients data. 
It handles API requests and performs CRUD operations 
In the patients database.

## Install
### First install all dependencies (Make sure you're in the medinfo-backend folder) 
    npm i

## Run the app
### To run the app write:
    npm run start
#### :warning:For the app to fully function, create .env file and create the env variables as listed in the .env.example file 

# CRUD operations of this API:

## Add patient

### Request example

`POST http://examplelink/patient/add`
#### Request body:
     {
      "first_name": "Peter",
      "last_name": "Ackles",
      "birth_date": "1998-10-15",
      "gender": "male",
      "phone_number": "+3706589451",
      "email": "deosan@gmail.com",
      "photo": "gimage.com",
      "identity_code": "4078"
      }

### Response  example

    {
    "msg": "Patient added"
    }



