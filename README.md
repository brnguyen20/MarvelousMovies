Marvelous Movies

Development Procedure

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
4. Change line 35 in server.js let pool = new Pool(databaseConfig); to let pool = new Pool(env); for it to read env.json for local testing
5. Run "psql -U postgres -f setup.sql" to create the database and tables
6. Run "npm run start" to start the server
7. Create an account with your own username and password in the website to log in


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

Fly Database Setup
1. Run npm run start setup_fly to set up the database before deploying it

Fly Deployment
1. To re-deploy Fly after making code changes, run .\fly.exe deploy  

Link to Fly sample code: https://gitlab.cci.drexel.edu/nkl43/cs375_demos/-/tree/main/demo_fly_postgres?ref_type=heads
