import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { createApp } from "../src/app.js";
import { connectDb } from "../src/db.js";
import { Recipe } from "../src/models/Recipe.js";
import { User } from "../src/models/User.js";
import { WeeklyMenu } from "../src/models/WeeklyMenu.js";
import { shopping } from "../../web/src/features/planner/weekStore.js";

test("Đi chợ gom đúng khẩu phần, tách đơn vị, vừa đủ và bỏ món ẩn", () => {
  const recipe = {
    available: true,
    servings: 3,
    snapshot: {
      servings: 2,
      ingredients: [
        { name: " Trứng ", unit: "quả", quantity: 2 },
        { name: "trứng", unit: "g", quantity: 20 },
        { name: "Muối", quantityType: "to-taste" },
      ],
    },
  };
  const list = shopping({
    meals: [{ items: [recipe, recipe, { ...recipe, available: false }] }],
  });
  assert.equal(list.skipped, 1);
  assert.deepEqual(
    list.rows.map(({ unit, quantity }) => [unit, quantity]).sort(),
    [
      [null, 0],
      ["g", 60],
      ["quả", 6],
    ].sort(),
  );
});

test(
  "Thực đơn theo tài khoản và tuần, giữ snapshot, chặn ghi đè",
  {
    skip: process.env.TEST_DEMO_CATALOG !== "1" && "Cần MongoDB đã seed.",
  },
  async (t) => {
    await connectDb();
    const server = createApp().listen(0, "127.0.0.1");
    await once(server, "listening");
    const root = "http://127.0.0.1:" + server.address().port + "/api";
    const ids = [],
      recipeIds = [];
    t.after(async () => {
      await WeeklyMenu.deleteMany({ user: { $in: ids } });
      await User.deleteMany({ _id: { $in: ids } });
      await Recipe.deleteMany({ _id: { $in: recipeIds } });
      await new Promise((resolve) => server.close(resolve));
      await mongoose.disconnect();
    });
    async function register() {
      const res = await globalThis.fetch(root + "/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test tuần",
          email: randomUUID() + "@example.test",
          password: randomUUID(),
        }),
      });
      assert.equal(res.status, 201);
      ids.push((await res.json()).user.id);
      const cookies = res.headers.getSetCookie().map((v) => v.split(";")[0]);
      return {
        cookie: cookies.join("; "),
        "X-CSRF-Token": cookies.find((v) => v.startsWith("csrf=")).slice(5),
        "Content-Type": "application/json",
      };
    }
    const a = await register(),
      b = await register();
    const seeded = await Recipe.findOne({
      seedKey: "trung-chien-ca-chua",
    }).lean();
    const copy = await Recipe.create({
      published: seeded.published,
      author: ids[0],
    });
    recipeIds.push(copy._id);
    const url = root + "/me/weekly-menu?weekStart=2026-11-23";
    const get = (headers, path = url) => globalThis.fetch(path, { headers });
    const put = (body) =>
      globalThis.fetch(url, {
        method: "PUT",
        headers: a,
        body: JSON.stringify(body),
      });
    const item = { recipeId: copy.id, servings: 3 };
    const meals = [{ day: 0, slot: "lunch", items: [item] }];
    assert.equal((await get({})).status, 401);
    assert.equal((await get(a, url.replace("-23", "-24"))).status, 400);
    assert.equal(
      (await put({ version: 0, meals: [{ ...meals[0], items: [item, item] }] }))
        .status,
      400,
    );
    const results = await Promise.all([
      put({ version: 0, meals }),
      put({ version: 0, meals }),
    ]);
    assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
    const first = await (await get(a)).json();
    assert.equal(first.version, 1);
    assert.equal(
      first.meals[0].items[0].snapshot.title,
      seeded.published.title,
    );
    assert.deepEqual((await (await get(b)).json()).meals, []);
    assert.deepEqual(
      (await (await get(a, url.replace("-23", "-30"))).json()).meals,
      [],
    );
    await Recipe.updateOne(
      { _id: copy.id },
      { $set: { "published.title": "Tên đã đổi", visibility: "hidden" } },
    );
    const hidden = await (await get(a)).json();
    assert.equal(hidden.meals[0].items[0].available, false);
    item.servings = 4;
    const changed = await (await put({ version: 1, meals })).json();
    assert.equal(
      changed.meals[0].items[0].snapshot.title,
      seeded.published.title,
    );
    assert.equal(changed.meals[0].items[0].servings, 4);
    assert.equal(
      (
        await put({
          version: 2,
          meals: [{ day: 1, slot: "lunch", items: [item] }],
        })
      ).status,
      404,
    );
    assert.equal((await put({ version: 1, meals: [] })).status, 409);
  },
);
