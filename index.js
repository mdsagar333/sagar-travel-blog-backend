const path = require("path");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;
const data = require("./data");
const { MongoClient, ObjectId } = require("mongodb");
const blogs = require("./data");

const uri = `mongodb+srv://sagar:${process.env.DB_PASSWORD}@cluster0.szflq.mongodb.net/sagar-travel-blog?retryWrites=true&w=majority`;

app.use(express.static(path.join(__dirname, "public")));
app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/images");
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];
    const imageName = `${Date.now()}${Math.round(Math.random() * 2000)}.${ext}`;

    cb(null, imageName);
  },
});

const upload = multer({ storage: storage });

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
    app.post(
      "/api/v1/blogs",
      upload.fields([
        { name: "blogImage", maxCount: 1 },
        { name: "authorImg", maxCount: 1 },
      ]),
      async (req, res) => {
        try {
          // console.log(req.body);
          // console.log(req.files.blogImage[0]);
          const imagePathBlog = `${req.protocol}://${req.headers.host}/images/${req.files.blogImage[0].filename}`;
          const imagePathAuthor = `${req.protocol}://${req.headers.host}/images/${req.files.authorImg[0].filename}`;
          const blog = {
            ...req.body,
            blogImage: imagePathBlog,
            authorImg: imagePathAuthor,
            ratings: parseFloat(req.body.ratings),
          };
          console.log(blog);
          const insertedBlog = await Blogs.insertOne({
            ...blog,
            isApproved: false,
          });
          res.status(201).json({
            status: "success",
            insertedBlog,
          });
        } catch (err) {
          console.log(err);
          res.status(500).json({
            status: "fail",
          });
        }
      }
    );

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

    // get pending blogs
    app.get("/api/v1/blogs/pending", async (req, res) => {
      try {
        const blogs = await Blogs.find({ isApproved: false }).toArray();

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

    // get posts using uid
    app.get("/api/v1/posts/:uid", async (req, res) => {
      try {
        const { uid } = req.params;
        const blogs = await Blogs.find({ uid }).toArray();
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

    // create user from google sign in
    app.put("/api/v1/user", async (req, res) => {
      try {
        const user = { ...req.body, role: "user" };
        console.log(user);
        let filterQuery;
        if (user.email) {
          filterQuery = { email: user.email };
        } else {
          filterQuery = { uid: user.uid };
        }

        const addedUser = await Users.updateOne(
          filterQuery,
          { $set: user },
          { upsert: true }
        );

        console.log(addedUser);
        res.status(201).json({
          status: "success",
        });
      } catch (err) {
        console.log(err);
        res.status(500).json({
          status: "fail",
        });
      }
    });

    // get admin
    app.get("/api/v1/admin/:id", async (req, res) => {
      try {
        const { id } = req.params;
        console.log(id);
        const user = await Users.findOne({ uid: id });
        console.log(user);
        let isAdmin;
        if (user.role === "user") {
          isAdmin = false;
        } else {
          isAdmin = true;
        }
        res.status(200).json({
          status: "success",
          isAdmin,
        });
      } catch (err) {
        console.log(err);
        res.status(500).json({
          status: "fail",
        });
      }
    });

    app.get("/api/v1/all-users", async (req, res) => {
      try {
        const users = await Users.find({}).toArray();
        console.log(users);
        res.status(200).json({
          status: "success",
          users,
        });
      } catch (err) {
        console.log(err);
        res.status(500).json({
          status: "fail",
        });
      }
    });

    // create
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
