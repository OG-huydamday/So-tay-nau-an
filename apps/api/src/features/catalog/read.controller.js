import mongoose from 'mongoose';
import Recipe from '../../models/Recipe.js';
import Category from '../../models/Category.js';

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parsePositiveInt = (value, fallback, max = 100) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.min(parsed, max);
};

export async function listApprovedRecipes(req, res, next) {
  try {
    const {
      q = '',
      category = '',
      difficulty = '',
      maxTime = '',
      ingredients = '',
      page = '1',
      limit = '12',
    } = req.query;

    const pageNum = parsePositiveInt(page, 1, 10000);
    const limitNum = parsePositiveInt(limit, 12, 50);
    const skip = (pageNum - 1) * limitNum;

    const matchStage = {
      status: 'approved',
    };

    if (String(q).trim()) {
      matchStage.title = {
        $regex: escapeRegex(String(q).trim()),
        $options: 'i',
      };
    }

    if (String(difficulty).trim()) {
      matchStage.difficulty = String(difficulty).trim();
    }

    if (String(maxTime).trim() !== '' && !Number.isNaN(Number(maxTime))) {
      matchStage.cookTime = { $lte: Number(maxTime) };
    }

    if (String(category).trim()) {
      const catValue = String(category).trim();
      if (mongoose.Types.ObjectId.isValid(catValue)) {
        matchStage.$or = [
          { categoryId: new mongoose.Types.ObjectId(catValue) },
          { categorySlug: catValue },
        ];
      } else {
        matchStage.categorySlug = catValue;
      }
    }

    const ingredientList = String(ingredients)
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    if (ingredientList.length > 0) {
      matchStage['ingredients.name'] = {
        $in: ingredientList.map((name) => new RegExp(`^${escapeRegex(name)}$`, 'i')),
      };

      const pipeline = [
        { $match: matchStage },
        {
          $addFields: {
            matchedIngredientsCount: {
              $size: {
                $setIntersection: [
                  {
                    $map: {
                      input: { $ifNull: ['$ingredients', []] },
                      as: 'ing',
                      in: {
                        $toLower: {
                          $trim: {
                            input: {
                              $cond: [
                                { $eq: [{ $type: '$$ing' }, 'object'] },
                                { $ifNull: ['$$ing.name', ''] },
                                { $ifNull: ['$$ing', ''] },
                              ],
                            },
                          },
                        },
                      },
                    },
                  },
                  ingredientList,
                ],
              },
            },
          },
        },
        { $sort: { matchedIngredientsCount: -1, createdAt: -1 } },
        {
          $facet: {
            items: [{ $skip: skip }, { $limit: limitNum }],
            totalCount: [{ $count: 'count' }],
          },
        },
      ];

      const [result] = await Recipe.aggregate(pipeline);
      const items = result?.items ?? [];
      const total = result?.totalCount?.[0]?.count ?? 0;

      return res.status(200).json({
        items,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      });
    }

    const [items, total] = await Promise.all([
      Recipe.find(matchStage).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Recipe.countDocuments(matchStage),
    ]);

    return res.status(200).json({
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function getApprovedRecipeById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID công thức không hợp lệ' });
    }

    const recipe = await Recipe.findOne({
      _id: id,
      status: 'approved',
    }).lean();

    if (!recipe) {
      return res.status(404).json({ message: 'Không tìm thấy công thức' });
    }

    return res.status(200).json({ data: recipe });
  } catch (err) {
    return next(err);
  }
}

export async function listCategories(req, res, next) {
  try {
    const categories = await Category.find({}).sort({ name: 1 }).lean();
    return res.status(200).json({ items: categories });
  } catch (err) {
    return next(err);
  }
}
