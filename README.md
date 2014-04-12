To run:

Get a Socrata auth token http://dev.socrata.com/

Set up your config vars for the Socrata token and Mongo urls.  Either:

- Update creds.js, or
- Set environment variables:

	dburiprod=mongodb://user:password@mongoid.mongolab.com:port/dbname
	dburidev=localhost/foodtrucks
	socratatoken=sometoken

To run the tests:

make test