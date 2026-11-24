import assert from "node:assert/strict";
import test from "node:test";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { createApp } from "../src/app.js";
import { config } from "../src/config.js";
import { connectDb } from "../src/db.js";
import { User } from "../src/models/User.js";

test(
  "Khám phá và yêu thích: lọc, lưu lặp, tách tài khoản và bỏ lưu",
  {
    skip: process.env.TEST_DEMO_CATALOG !== "1" && "Cần MongoDB demo đã seed.",
  },
  async (t) => {
    await connectDb();
    const server = createApp().listen(0, "127.0.0.1");
    await once(server, "listening");
    const accounts = [];
    t.after(async () => {
      await new Promise((resolve) => server.close(resolve));
      await User.deleteMany({ _id: { $in: accounts } });
      await mongoose.disconnect();
    });
    const url = "http://127.0.0.1:" + server.address().port + "/api";
    const call = (path, method = "GET", headers = {}) =>
      globalThis.fetch(url + path, { method, headers });
    const users = [];
    for (let n = 0; n < 2; n++) {
      const u = await User.create({
        name: "Test P3",
        email: randomUUID() + "@example.test",
        passwordHash: "test-only",
      });
      accounts.push(u._id);
      const csrf = randomUUID();
      const token = jwt.sign({ sub: u.id, csrf }, config.jwtSecret, {
        expiresIn: "1m",
      });
      users.push({ cookie: "session=" + token, "x-csrf-token": csrf });
    }
    const page = await (
      await call(
        "/recipes?q=trung&difficulty=" +
          encodeURIComponent("Dễ") +
          "&maxTime=20&ingredients=" +
          encodeURIComponent("trứng,cà chua"),
      )
    ).json();
    assert.ok(page.total >= 1);
    const egg = page.items.find((r) => r.title === "Trứng chiên cà chua");
    assert.equal(egg.matchedIngredients.length, 2);
    assert.ok(egg.missingIngredients.includes("hành lá"));
    assert.ok((await (await call("/recipes/" + egg.id)).json()).steps.length);
    assert.ok(
      (
        await (await call("/ingredients/suggestions?q=trung")).json()
      ).items.includes("trứng"),
    );
    assert.equal((await call("/me/favorites")).status, 401);
    const path = "/me/favorites/" + egg.id;
    assert.equal(
      (await call(path, "PUT", { cookie: users[0].cookie })).status,
      403,
    );
    for (const result of await Promise.all([
      call(path, "PUT", users[0]),
      call(path, "PUT", users[0]),
    ]))
      assert.equal(result.status, 204);
    const list = async (user) =>
      (await (await call("/me/favorites", "GET", user)).json()).items;
    assert.deepEqual(
      (await list(users[0])).map((r) => r.id),
      [egg.id],
    );
    assert.deepEqual(await list(users[1]), []);
    assert.equal(
      (
        await call(
          "/me/favorites/" + new mongoose.Types.ObjectId(),
          "PUT",
          users[0],
        )
      ).status,
      404,
    );
    assert.equal(
      (await call("/me/favorites/bad", "PUT", users[0])).status,
      400,
    );
    for (let i = 0; i < 2; i++)
      assert.equal((await call(path, "DELETE", users[0])).status, 204);
    assert.deepEqual(await list(users[0]), []);
  },
);
