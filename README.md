# Test_Tasks Back End 
## Description:
First of all we created Get route with simple general-response.
You can check on this endpoint- http://localhost:3010/.
Tou need create .env file and add into it contein with vars as in sample file.
Start the application.
```
yarn install

nest start --watch
```
For create migration i added dotenv packedje to  typeorm.config.ts
For create empty migration for handler contains execute next command:
```
typeorm migration:create ./src/migrations/init
```
Run this command you can see a new file generated in the "migrations" directory named {TIMESTAMP}-sneakersDiment.ts and
we can run it, and it will create a new table in our database.
```
npm run migration:generate -- src/migrations/sneakersDiment
```
This command aplly migrations and  will create a new table in our database.
```
yarn run migration:run
```
This command revert migrations and  will remove a new table in our database.
```
yarn run migration:revert
```