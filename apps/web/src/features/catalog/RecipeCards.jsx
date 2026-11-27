import { useState } from "react";
import { Link } from "react-router-dom";
import { useCarousel } from "../../shared/useCarousel";

export function RecipeCards({ items }) {
  const groups = new Map();
  for (const recipe of items) {
    const name = recipe.category?.name || "Khác";
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(recipe);
  }
  const [selected, setSelected] = useState(null);
  const category = groups.has(selected) ? selected : groups.keys().next().value;
  const recipes = groups.get(category) || [];
  const { index, setIndex, playing, setPlaying } = useCarousel(recipes.length, category);
  const current = index % (recipes.length || 1);
  function step(direction) {
    setPlaying(false);
    setIndex((current + direction + recipes.length) % recipes.length);
  }
  return (
    <section className="wrap section" id="cong-thuc" aria-labelledby="recipe-heading">
      <h2 id="recipe-heading">Công thức nấu ăn</h2>
      <div className="tabs recipe-categories" role="group" aria-label="Chọn loại món">
        {Array.from(groups.keys(), name => (
          <button key={name} type="button" aria-pressed={name === category}
            onClick={() => { setSelected(name); setIndex(0); }}>{name}</button>
        ))}
      </div>
      <div className="recipe-stage">
        {items.map(recipe => (
          <article key={recipe.id} className="recipe-card" aria-hidden={recipe.id !== recipes[current]?.id}>
            {recipe.image && <img src={recipe.image} alt={recipe.title} />}
            <div className="recipe-body">
              <span>{recipe.category?.name}</span>
              <h3>{recipe.title}</h3>
              <p>{recipe.summary}</p>
              {recipe.prepMinutes != null && recipe.cookMinutes != null && <p className="recipe-meta">
                {recipe.prepMinutes + recipe.cookMinutes} phút · {recipe.difficulty} · {recipe.servings} phần
              </p>}
              <Link className="recipe-sample-link" to={"/kham-pha?q=" + encodeURIComponent(recipe.title)}>
                Tìm công thức này →
              </Link>
            </div>
          </article>
        ))}
      </div>
      {recipes.length > 1 && <div className="recipe-controls" role="group" aria-label="Chuyển món trong nhóm">
        <button type="button" aria-label="Món trước" onClick={() => step(-1)}>←</button>
        <span>{current + 1} / {recipes.length}</span>
        <button type="button" aria-label="Món tiếp theo" onClick={() => step(1)}>→</button>
        <button type="button" onClick={() => setPlaying(!playing)}>{playing ? "Tạm dừng" : "Tự chuyển"}</button>
      </div>}
      {!items.length && <p>Chưa có công thức để hiển thị.</p>}
    </section>
  );
}
