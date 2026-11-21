export function RecipeCards({ items }) {
  return (
    <section className="wrap section" id="cong-thuc" aria-labelledby="recipe-heading">
      <h2 id="recipe-heading">Công thức nấu ăn</h2>
      <div className="recipe-grid">
        {items.map(recipe => (
          <article key={recipe.id} className="recipe-card">
            {recipe.image && <img src={recipe.image} alt={recipe.title} />}
            <div className="recipe-body">
              <span>{recipe.category?.name}</span>
              <h3>{recipe.title}</h3>
              <p>{recipe.summary}</p>
              <p className="recipe-meta">
                {recipe.prepMinutes + recipe.cookMinutes} phút · {recipe.difficulty} · {recipe.servings} phần
              </p>
            </div>
          </article>
        ))}
      </div>
      {!items.length && <p>Chưa có công thức để hiển thị.</p>}
    </section>
  );
}
