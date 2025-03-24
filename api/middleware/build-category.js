const Category = require("../models/categories");

const buildCategory = async (tag, category) => {
  try {
    const tagId = tag._id;
    const findCategory = await Category.findById({ _id: category} )
    if(findCategory){
        findCategory.tag.push(
            {'_id' : tagId}
        ) 
    }
    await findCategory.save()

  } catch (err) {
    console.log(err.message);
  }
};


module.exports = buildCategory;