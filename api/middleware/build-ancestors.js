const User = require("../models/user");

const buildAncestors = async (id, parent_id) => {
  let ancest = [];
  try {
    let parent_user = await User.findOne(
      { _id: parent_id },
      { ancestors: 1 }
    ).exec();
    if (parent_user) {
      const { _id } = parent_user;
      const ancest = [...parent_user.ancestors];
      ancest.unshift({ _id });
      const user= await User.findByIdAndUpdate(id, {
        $set: { ancestors: ancest },
      });
    }
  } catch (err) {
    console.log(err.message);
  }
};


module.exports = buildAncestors;