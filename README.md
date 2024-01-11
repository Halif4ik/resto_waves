# Test_Tasks Back End 
## Description:
This project serves as the back end for a test task. It provides various API endpoints for managing sneakers, models, 
and brands. The application is built using NestJS, a powerful framework for building scalable and maintainable 
server-side applications.
I used for check on this endpoint- http://localhost:3010/.

## Installation:
Before running the application, create a .env file with the necessary environment variables, as specified in the sample 
file. Then, install the dependencies and start the application:
```
yarn install

nest start --watch
```
## Creating an Initial Migration:
To create an initial migration, execute the following command:
For create empty migration for handler contains execute next command:
```
typeorm migration:create ./src/migrations/init
```
This will generate a new migration file in the "migrations" directory named {TIMESTAMP}-sneakersDiment.ts. You can then
run this migration to create the necessary tables:
```
npm run migration:generate -- src/migrations/sneakersDiment
```
Applying Migrations:
To apply the migrations and create the tables in the database, run:
```
yarn run migration:run
```
Reverting Migrations:
If needed, you can revert the migrations and remove the tables by running:
```
yarn run migration:revert
```
## API Endpoints:
GET scheduled-task/refresh: Refresh the database with new data from the provided API.
GET /sneakers/all: Retrieve all sneakers from the database.
GET /sneakers/:id: Retrieve a specific sneaker by ID.
GET /sneakers/find?dimension=41: Find sneakers by name and dimension.
GET /sneakers/models?model=Adidas%20Yeezy%20700: Find sneakers by model name.
PATCH /sneakers/update: Update the name of a sneaker.
POST /sneakers/brand: Create a new brand.
GET /sneakers/brands?ids=8,9,10: Find sneakers by brand IDs.



## Additional Notes:
Feel free to explore the API and interact with the provided endpoints. This project is structured to maintain code readability, scalability, and ease of maintenance. If you have any questions or face issues, please don't hesitate to reach out.

Happy coding! 🚀