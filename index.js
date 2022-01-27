const path = require("path");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;
const data = require("./data");
const { MongoClient, ObjectId } = require("mongodb");

const uri = `mongodb+srv://sagar:${process.env.DB_PASSWORD}@cluster0.szflq.mongodb.net/sagar-travel-blog?retryWrites=true&w=majority`;

app.use(express.static(path.join(__dirname, "public")));
app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect(() => console.log("Your database is connected"));
    const database = client.db("sagar-travel-blog");
    const Blogs = database.collection("blogs");
    const Users = database.collection("users");

    // create blogs
    app.post("/api/v1/blogs", async (req, res) => {
      try {
        if (req.body) {
          const blogs = await Blogs.insertOne(req.body);

          res.status(201).json({
            status: "success",
            blogs,
          });
        }
      } catch (err) {
        console.log(err);
        res.status(500).json({
          status: "fail",
        });
      }
    });

    // get blogs
    app.get("/api/v1/blogs", async (req, res) => {
      try {
        const blogs = await Blogs.find().toArray();
        res.status(200).json({
          status: "success",
          blogs,
        });
      } catch (err) {
        console.log(err);
        res.status(500).json({
          status: "fail",
        });
      }
    });

    // get single blog
    app.get("/api/v1/blogs/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const objId = new ObjectId(id);
        const blog = await Blogs.findOne({ _id: objId });
        res.status(200).json({
          status: "success",
          blog,
        });
      } catch (err) {
        console.log(err);
        res.status(500).json({
          status: "fail",
        });
      }
    });

    // get top rated blogs
    app.get("/api/v1/top-rated-blogs", async (req, res) => {
      try {
        const blogs = await Blogs.find({ ratings: { $gte: 4.5 } })
          .limit(5)
          .toArray();
        res.status(200).json({
          status: "success",
          total: blogs.length,
          blogs,
        });
      } catch (err) {
        console.log(err);
        res.status(500).json({
          status: "fail",
        });
      }
    });

    // create user
    app.post("/api/v1/user", async (req, res) => {
      try {
        const user = await Users.insertOne({ ...req.body, role: "user" });
        res.status(201).json({
          status: "success",
          user,
        });
      } catch (err) {
        console.log(err);
        res.status(500).json({
          status: "fail",
        });
      }
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello from backend");
});

app.listen(port, () => {
  console.log("Your app listening on port", port);
});
