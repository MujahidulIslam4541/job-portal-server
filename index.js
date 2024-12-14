require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// middleware
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASSWORD}@cluster0.oo75q.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const jobCollection = client.db("job-portal").collection("jobs");
    const jobApplicationCollection = client
      .db("job-portal")
      .collection("jobApplication");

    app.get("/jobs", async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) {
        query = { hr_email: email };
      }
      const cursor = jobCollection.find(query).sort({ createdAt: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/HomeJobs", async (req, res) => {
      const cursor = jobCollection.find().sort({ createdAt: -1 }).limit(8);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const quarry = { _id: new ObjectId(id) };
      const result = await jobCollection.findOne(quarry);
      res.send(result);
    });

    app.post("/jobs", async (req, res) => {
      const newJob = req.body;
      newJob.createdAt = new Date();
      const result = await jobCollection.insertOne(newJob);
      res.send(result);
    });

    // job Application

    app.get("/job-application", async (req, res) => {
      const email = req.query.email;
      const query = { user_email: email };
      const result = await jobApplicationCollection.find(query).toArray();
      for (const application of result) {
        const query1 = { _id: new ObjectId(application.user_id) };
        const job = await jobCollection.findOne(query1);

        if (job) {
          (application.title = job.title), (application.company = job.company);
          application.company_logo = job.company_logo;
          application.location = job.location;
          application.jobType = job.jobType;
          application.applicationDeadline = job.applicationDeadline;
        }
      }
      res.send(result);
    });

    app.get("/jobApplications/jobs/:user_id", async (req, res) => {
      const jobId = req.params.user_id;
      const query = { user_id: jobId };
      const result = await jobApplicationCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/job-application", async (req, res) => {
      const application = req.body;
      const result = await jobApplicationCollection.insertOne(application);

      const id = application.user_id;
      const query = { _id: new ObjectId(id) };
      const job = await jobCollection.findOne(query);
      let newCount = 0;
      if (job.applicationCount) {
        newCount = job.applicationCount + 1;
      } else {
        newCount = 1;
      }

      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          applicationCount: newCount,
        },
      };
      const updatedResult = await jobCollection.updateOne(filter, updatedDoc);

      res.send(result);
    });

    app.get("/job-application/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobApplicationCollection.findOne(query);
      res.send(result);
    });

    app.patch("/job-application/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const query = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: data.status,
        },
      };
      const result = await jobApplicationCollection.updateOne(
        query,
        updatedDoc
      );
      res.send(result);
    });

    app.delete("/job-application/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobApplicationCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Job portal web application is running");
});

app.listen(port, () => {
  console.log("my server is running", port);
});
