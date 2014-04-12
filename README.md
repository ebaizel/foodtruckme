[![Build Status](https://travis-ci.org/ebaizel/foodtruckme.svg?branch=master)](https://travis-ci.org/ebaizel/foodtruckme)

*Setup and config*

Get a Socrata auth token http://dev.socrata.com/

Set up your config vars for the Socrata token and Mongo urls.  Either:

(Recommended) Set environment variables:

* dburiprod=mongodb://user:password@mongoid.mongolab.com:port/dbname
* dburidev=localhost/foodtrucks
* socratatoken=sometoken

or, update creds.js with those variables

*To run the tests*

    make test

*To run the app*

    node app.js