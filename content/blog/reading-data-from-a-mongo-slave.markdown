+++
title         = "Reading data from a Mongo slave"
date          = "2013-08-05T16:51:00"
comments      = true
thumbnail     = "/images/mongo_db.png"
image         = "mongo.png"
image_creator = "https://www.flickr.com/photos/garrettheath/"
+++
Quick tip - if you are running Mongo DB and have configured slave servers, you can't access the data from the slaves by default.

<!--more-->

{{< highlight bash >}}
  ~$ mongo
  testRs0:SECONDARY> use test_db;
  testRs0:SECONDARY> db.test.getIndexes()
  Mon Aug  5 21:09:36 uncaught exception: error: { "$err" : "not master and slaveOk=false", "code" : 13435 }
{{< /highlight >}}

Gah :P

Fortunately you can tell Mongo to allow operations on the slave:

{{< highlight bash >}}
  tests0:SECONDARY> db.getMongo().setSlaveOk();
{{< /highlight >}}

After that, you can use the Mongo slave the same way you would the master. Note however, that you'll need to run this command every time you log into a Mongo terminal session to read data.
