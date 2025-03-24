const PostCat = require("../models/post_cat");

const buildPostCatAncestors = async (id, parent_id) => {
  let ancest = [];
  try {
    let parent_category = await PostCat.findOne(
      { _id: parent_id },
      { name: 1, slug: 1, ancestors: 1 }
    ).exec();
    if (parent_category) {
      const { _id, name, slug } = parent_category;
      const ancest = [...parent_category.ancestors];
      ancest.unshift({ _id, name, slug });
      const category = await PostCat.findByIdAndUpdate(id, {
        $set: { ancestors: ancest },
      });
    }
  } catch (err) {
    console.log(err.message);
  }
};

const buildPostHierarchyAncestors = async (category_id, parent_id) => {
  if (category_id && parent_id) buildPostCatAncestors(category_id, parent_id);
  const result = await PostCat.find({ parent: category_id }).exec();
  if (result)
    result.forEach((doc) => {
        buildPostHierarchyAncestors(doc._id, category_id);
    });
};

module.exports = { buildPostCatAncestors, buildPostHierarchyAncestors };
