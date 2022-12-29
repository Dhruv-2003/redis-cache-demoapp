const express = require("express");
const axios = require("axios");
const cors = require("cors");
const Redis = require("redis");

const redisClient = Redis.createClient();
redisClient.connect().then(() => console.log("Redis Connected"));

const expiration = 3600;

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/photos", async (req, res) => {
  console.log("Getting photos");
  const albumId = req.query.albumId;
  const photos = await getOrSetCache(`photos`, async () => {
    const { data } = await axios.get(
      "https://jsonplaceholder.typicode.com/photos",
      { params: { albumId } }
    );
    return data;
  });

  res.json(photos);
  //   redisClient.GET("photos", async (error, photos) => {
  //     if (error) console.log(error);
  //     console.log("In the block");
  //     if (photos != null) {
  //       console.log("cache HIT");
  //       return res.json(JSON.parse(photos));
  //     } else {
  //       console.log("Cache Missss");

  //       redisClient.SETEX("photos", expiration, JSON.stringify(data));
  //       res.json(data);
  //     }
  //   });
});

app.get("/photos/:id", async (req, res) => {
  const { data } = await axios.get(
    `https://jsonplaceholder.typicode.com/photos/${req.params.id}`
  );

  res.json(data);
});

function getOrSetCache(key, cb) {
  return new Promise((resolve, reject) => {
    redisClient.get(key, async (error, data) => {
      if (error) return reject(error);
      if (data != null) return resolve(JSON.parse(data));

      const freshData = await cb();
      redisClient.setEx(key, expiration, JSON.stringify(freshData));
      resolve(freshData);
    });
  });
}

app.listen(8080, () => console.log("Server running on  Port 8080"));
