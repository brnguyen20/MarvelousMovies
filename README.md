Marvelous Movies

Developement Procedure

1. Run "npm i" to install all node modules
2. Add an env.json file in the root directory (same level as package.json) that looks like this:

{
	"user": "",
	"host": "localhost",
	"database": "",
	"password": "",
	"port": 5432,
	"api_key": ""
}

3. Fill in the username, database, password, and api_key fields
4. Run "npm run start" to start the server


Database Procedure
1. Run "psql -U postgres -f setup.sql" to create the database and tables
2. Run "node app/dummy.js" to insert dummy data
3. Run "npm run start" to start the server

---------------------------------------------------------------------------------------------------------------------------
   
Fly Setup
1. Copy env.sample into a new file called .env
2. In .env, replace YOURPOSTGRESUSER with postgres (your postgres username if postgres is not by default)
3. In .env, replace YOURPOSTGRESPASSWORD with your postgres password
4. In .env, replace YOURFLYWEBAPPNAME with marvelous-movies

Fly Deployment
1. To re-deploy Fly after making code changes, run .\fly.exe deploy  

Link to Fly sample code: https://gitlab.cci.drexel.edu/nkl43/cs375_demos/-/tree/main/demo_fly_postgres?ref_type=heads
