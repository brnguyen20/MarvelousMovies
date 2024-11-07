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

1. Make sure postgres/psql is installed locally
2. Run this command: "psql -U postgres -f setup.sql"
	postgres should be replaced with your username.
3. It will promt you to enter your passwerd.
4. After that it will automatically create the database, create the tables, and insert dummy data.
