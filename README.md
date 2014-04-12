To run:

Get a Socrata auth token http://dev.socrata.com/

Set up your config vars for the Socrata token and Mongo urls.  Either:

- Create a creds.js file (copy SAMPLEcreds.js as a starting point), or
- Set environment variables:

dburiprod=mongodb://user:password@mongoid.mongolab.com:port/dbname
dburidev=localhost/foodtrucks
socratatoken=sometoken