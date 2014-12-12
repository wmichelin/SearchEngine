Walter Michelin
Search Engine
Contained in this Zip file is a crawler, server, necessary HTML,
DB backup. etc

To run,
need to have node.js installed
need to have node package manager installed.
All necessary packages should be in the file, 
otherwise if you need to install them,
simply type "npm install (packageName)".
if that doesn't work, "sudo npm install (package name)"...
Node will throw errors if modules aren't found.


need to have mongoDB installed


Need an instance of mongo running..
using mongod command
need to use mongo restore at level of folder which contains
'dump' folder. this will copy all the tables over to Database.
Database should be at localhost/test

may need to run mongo using
mongod --smallfiles
... not quite sure

Now we need to run server
using 

node --debug server.js (not sure why we need debug flag but hardly works otherwise)

once it says "app listening",
navigate to localhost:3000 in browser.
make some queries.

Not every query returns something.
This worked perfectly fine upon submission in an Ubuntu environment.

Please let me know if you need any help
wmichelin@gmail.com
